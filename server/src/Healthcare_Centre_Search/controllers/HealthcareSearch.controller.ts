import { Request, Response } from 'express';
import { ValidatedRequest } from '../../middleware/validateRequest';
import { FilterValidatedRequest } from '../../middleware/validateFilter';
import { SearchRequest } from '../../types/types';
import HealthcareCenterSearchService from '../services/HealthcareSearchService';
import ProviderDataValidationService from '../services/ProviderDataValidationService';
import ProviderSearchFilter from '../helpers/ProviderSearchFilter';
import asyncHandler from '../../utils/asyncHandler';
import logger from '../../utils/logger';
import { 
  BadRequestError, 
  NotFoundError, 
  ValidationError 
} from '../../utils/customErrors';

class HealthcareController {
  private readonly searchService: HealthcareCenterSearchService;
  private readonly validationService: ProviderDataValidationService;

  constructor() {
    this.searchService = new HealthcareCenterSearchService();
    this.validationService = new ProviderDataValidationService();
  }

  search = asyncHandler(async (req: Request, res: Response) => {
    const { LocationSearch, AddressSearch, NameSearch }: ValidatedRequest = 
      (req as Request & { validatedQuery: ValidatedRequest }).validatedQuery;
    const inputs = [LocationSearch, AddressSearch, NameSearch].filter(Boolean);

    // Use custom BadRequestError for validation
    if (inputs.length !== 1) {
      logger.warn('Invalid search parameters provided', { 
        inputs, 
        context: 'healthcare-search' 
      });
      throw new BadRequestError('Only one search parameter should be provided at a time.');
    }

    const searchInput = (LocationSearch ?? AddressSearch ?? NameSearch) as SearchRequest;
    
    logger.info('Performing healthcare center search', { 
      searchType: Object.keys(searchInput)[0],
      searchValue: Object.values(searchInput)[0] 
    });

    const searchResult = await this.searchService.search(searchInput);
    
    if (!searchResult || searchResult.data.providers.length === 0) {
      logger.warn('No results found for search', { searchInput });
      throw new NotFoundError('No healthcare centers found matching your search criteria.');
    }

    logger.info('Search completed successfully', { 
      resultsCount: searchResult.data.providers.length 
    });

    res.json({
      success: true,
      data: searchResult
    });
  });

  getProvidersByFilters = asyncHandler(async (req: Request, res: Response) => {
    const { keyword, maxDistance, userLocation }: FilterValidatedRequest = 
      (req as Request & { validatedQuery: FilterValidatedRequest }).validatedQuery;

    const filters = {
      ...(keyword && { keyword }),
      ...(maxDistance && { maxDistance }),
      ...(userLocation && { userLocation })
    };

    logger.info('Searching providers with filters', { filters });

    const providers = await ProviderSearchFilter.searchProviders(filters);

    if (!providers || providers.length === 0) {
      logger.warn('No providers found matching filters', { filters });
      throw new NotFoundError('No providers found matching the specified filters.');
    }

    logger.info('Provider search completed', { 
      totalProviders: providers.length 
    });

    res.json({
      success: true,
      data: {
        providers,
        totalResults: providers.length
      }
    });
  });

  validateProvider = asyncHandler(async (req: Request, res: Response) => {
    const providerData = req.body;

    // Validate input
    if (!providerData || Object.keys(providerData).length === 0) {
      logger.warn('Empty provider data submitted for validation');
      throw new BadRequestError('Provider data is required for validation.');
    }

    logger.info('Validating provider data', { 
      dataKeys: Object.keys(providerData) 
    });

    const validatedData = await this.validationService.validateProviderData([{
      source: 'manual',
      data: providerData,
      confidence: 1
    }]);

    // Check if validation returned any errors
    if (validatedData.some(item => item.errors && item.errors.length > 0)) {
      logger.warn('Provider data validation failed', { 
        validationResults: validatedData 
      });
      throw new ValidationError('Provider data validation failed', validatedData);
    }

    logger.info('Provider data validated successfully');

    res.json({
      success: true,
      data: validatedData
    });
  });
}

export const healthcareController = new HealthcareController();