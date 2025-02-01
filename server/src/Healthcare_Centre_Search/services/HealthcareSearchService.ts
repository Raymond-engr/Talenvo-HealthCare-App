import { HealthcareProvider } from '../models/healthcareProvider.model';
import ProviderDataIntegrationService from './ProviderDataIntegrationService';
import GeocodingService from './GeocodingService';
import mongoose from 'mongoose';

interface LocationSearch {
  latitude: number;
  longitude: number;
}

interface AddressSearch {
  address: string;
}

interface NameSearch {
  name: string;
}

type SearchRequest = LocationSearch | AddressSearch | NameSearch;

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
  private readonly providerIntegrationService: ProviderDataIntegrationService;
  private readonly geocodingService: typeof GeocodingService;
  private readonly defaultRadius: number = 10; // 10km

  constructor() {
    this.providerIntegrationService = new ProviderDataIntegrationService();
    this.geocodingService = GeocodingService;
  }

  async search(searchParams: SearchRequest): Promise<SearchResponse> {
    try {
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
        throw new Error('Invalid search parameters');
      }

      return result;
    } catch (error) {
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
    }
  }

  private async clearExistingProviders(): Promise<void> {
    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      await HealthcareProvider.deleteMany({}, { session });
      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw new Error(`Failed to clear existing providers: ${error.message}`);
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
      throw new Error('Exactly one search type must be provided');
    }

    if ('latitude' in request && 'longitude' in request) {
      this.validateCoordinates(request.latitude, request.longitude);
    }
  }

  private validateCoordinates(latitude: number, longitude: number): void {
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      throw new Error('Invalid coordinates');
    }
  }

  private async searchByLocation(params: LocationSearch): Promise<SearchResponse> {
    const { latitude, longitude } = params;
    
    const { country } = await this.geocodingService.reverseGeocode(latitude, longitude);
    const providers = await this.providerIntegrationService.integrateProviderData({
      location: [longitude, latitude],
      radius: this.defaultRadius,
      country
    });

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
    const geocodingResult = await this.geocodingService.geocodeAddress(params.address);
    
    const providers = await this.providerIntegrationService.integrateProviderData({
      location: [geocodingResult.longitude, geocodingResult.latitude],
      radius: this.defaultRadius,
      country: geocodingResult.country!
    });

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
    const providers = await this.providerIntegrationService.integrateProviderByName({
      name: params.name,
      country: 'global'
    });

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