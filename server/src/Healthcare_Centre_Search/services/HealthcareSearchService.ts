import { HealthcareProvider } from '../models/healthcareProvider.model';
import { LocationSearch, AddressSearch, NameSearch, SearchRequest } from '../../types/types';
import ProviderDataIntegrationService from './ProviderDataIntegrationService';
import ProviderNameIntegrationService from './ProviderNameIntegrationService';
import GeocodingService from './GeocodingService';
import mongoose from 'mongoose';
import logger from '../../utils/logger';
import { 
  BadRequestError, 
  AppError 
} from '../../utils/customErrors';

interface SearchResponse {
  success: boolean;
  data: {
    providers: any[];
    searchType: string;
    metadata: {
      totalResults: number;
      searchLocation?: {
        latitude: number;
        longitude: number;
        country: string;
      };
    };
  };
  error?: string;
}

class HealthcareCenterSearchService {
  private readonly providerNameIntegrationService: ProviderNameIntegrationService;
  private readonly geocodingService: typeof GeocodingService;
  private readonly defaultRadius: number = 10; // 10km

  constructor() {
    this.providerNameIntegrationService = new ProviderNameIntegrationService();
    this.geocodingService = GeocodingService;
  }

  async search(searchParams: SearchRequest): Promise<SearchResponse> {
    try {
      logger.info('Starting healthcare provider search', { searchParams });

      // Validate search parameters
      this.validateSearchRequest(searchParams);

      // Clear existing providers
      await this.clearExistingProviders();

      let result: SearchResponse;

      if (this.isLocationSearch(searchParams)) {
        result = await this.searchByLocation(searchParams);
      } else if (this.isAddressSearch(searchParams)) {
        result = await this.searchByAddress(searchParams);
      } else if (this.isNameSearch(searchParams)) {
        result = await this.searchByName(searchParams);
      } else {
        throw new BadRequestError('Invalid search parameters');
      }

      logger.info('Search completed successfully', { 
        searchType: result.data.searchType, 
        totalResults: result.data.metadata.totalResults 
      });

      return result;
    } catch (error: unknown) {
      if (error instanceof AppError) {
        logger.error('Application error during search', { 
          errorMessage: error.message, 
          errorType: error.constructor.name 
        });
        
        return {
          success: false,
          data: {
            providers: [],
            searchType: 'error',
            metadata: {
              totalResults: 0
            }
          },
          error: error.message
        };
      } else if (error instanceof Error) {
        logger.error('Unexpected error during search', { 
          errorMessage: error.message, 
          stack: error.stack 
        });
        
        return {
          success: false,
          data: {
            providers: [],
            searchType: 'error',
            metadata: {
              totalResults: 0
            }
          },
          error: 'An unexpected error occurred.'
        };
      } else {
        logger.error('Unknown error during search', { error });
        
        return {
          success: false,
          data: {
            providers: [],
            searchType: 'error',
            metadata: {
              totalResults: 0
            }
          },
          error: 'An unknown error occurred.'
        };
      }
    }
  }

  private async clearExistingProviders(): Promise<void> {
    const session = await mongoose.startSession();
    try {
      logger.info('Clearing existing healthcare providers');
      
      session.startTransaction();
      await HealthcareProvider.deleteMany({}, { session });
      await session.commitTransaction();
      
      logger.info('Successfully cleared existing providers');
    } catch (error: unknown) {
      await session.abortTransaction();
      
      if (error instanceof Error) {
        logger.error('Failed to clear existing providers', { 
          errorMessage: error.message 
        });
        throw new AppError(`Failed to clear existing providers: ${error.message}`, 500);
      } else {
        logger.error('Unknown error while clearing providers', { error });
        throw error;
      }
    } finally {
      session.endSession();
    }
  }

  private validateSearchRequest(request: SearchRequest): void {
    const searchTypes = [
      'latitude' in request && 'longitude' in request,
      'address' in request,
      'name' in request
    ];

    if (searchTypes.filter(Boolean).length !== 1) {
      logger.warn('Invalid search request', { request });
      throw new BadRequestError('Exactly one search type must be provided');
    }

    if ('latitude' in request && 'longitude' in request) {
      this.validateCoordinates(request.latitude, request.longitude);
    }
  }

  private validateCoordinates(latitude: number, longitude: number): void {
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      logger.warn('Invalid coordinates provided', { latitude, longitude });
      throw new BadRequestError('Invalid coordinates');
    }
  }

  private async searchByLocation(params: LocationSearch): Promise<SearchResponse> {
    const { latitude, longitude } = params;
    
    logger.info('Performing location-based search', { latitude, longitude });
    
    const { country } = await this.geocodingService.reverseGeocode(latitude, longitude);
    const providers = await ProviderDataIntegrationService.integrateProviderData(
      [longitude, latitude],
      this.defaultRadius
    );

    if (providers.length === 0) {
      logger.warn('No providers found for location', { latitude, longitude });
    }

    return {
      success: true,
      data: {
        providers,
        searchType: 'location',
        metadata: {
          totalResults: providers.length,
          searchLocation: { latitude, longitude, country }
        }
      }
    };
  }

  private async searchByAddress(params: AddressSearch): Promise<SearchResponse> {
    logger.info('Performing address-based search', { address: params.address });
    
    const geocodingResult = await this.geocodingService.geocodeAddress(params.address);
    
    const providers = await ProviderDataIntegrationService.integrateProviderData(
      [geocodingResult.longitude, geocodingResult.latitude],
      this.defaultRadius
    );

    if (providers.length === 0) {
      logger.warn('No providers found for address', { address: params.address });
    }

    return {
      success: true,
      data: {
        providers,
        searchType: 'address',
        metadata: {
          totalResults: providers.length,
          searchLocation: {
            latitude: geocodingResult.latitude,
            longitude: geocodingResult.longitude,
            country: geocodingResult.country!
          }
        }
      }
    };
  }

  private async searchByName(params: NameSearch): Promise<SearchResponse> {
    logger.info('Performing name-based search', { name: params.name });
    
    const providers = await this.providerNameIntegrationService.integrateProviderByName({
      name: params.name,
      country: 'global'
    });

    if (providers.length === 0) {
      logger.warn('No providers found for name', { name: params.name });
    }

    return {
      success: true,
      data: {
        providers,
        searchType: 'name',
        metadata: {
          totalResults: providers.length
        }
      }
    };
  }

  private isLocationSearch(request: SearchRequest): request is LocationSearch {
    return 'latitude' in request && 'longitude' in request;
  }

  private isAddressSearch(request: SearchRequest): request is AddressSearch {
    return 'address' in request;
  }

  private isNameSearch(request: SearchRequest): request is NameSearch {
    return 'name' in request;
  }
}

export default HealthcareCenterSearchService;