import { Request, Response } from 'express';
import { ValidatedRequest } from '../../middleware/validateRequest';
import { FilterValidatedRequest } from '../../middleware/validateFilter';
import { SearchRequest } from '../../types/types';
import HealthcareCenterSearchService from '../services/HealthcareSearchService';
import ProviderDataValidationService from '../services/ProviderDataValidationService';
import ProviderSearchFilter from '../helpers/ProviderSearchFilter';
import asyncHandler from '../../utils/asyncHandler';

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

    if (inputs.length !== 1) {
      return res.status(400).json({
        success: false,
        error: 'Only one search parameter should be provided at a time.',
      });
    }

    const searchInput = (LocationSearch ?? AddressSearch ?? NameSearch) as SearchRequest;
    const searchResult = await this.searchService.search(searchInput);
    res.json(searchResult);
  });

  getProvidersByFilters = asyncHandler(async (req: Request, res: Response) => {
    const { keyword, maxDistance, userLocation }: FilterValidatedRequest = 
      (req as Request & { validatedQuery: FilterValidatedRequest }).validatedQuery;

    const filters = {
      ...(keyword && { keyword }),
      ...(maxDistance && { maxDistance }),
      ...(userLocation && { userLocation })
    };

    const providers = await ProviderSearchFilter.searchProviders(filters);

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
    const validatedData = await this.validationService.validateProviderData([{
      source: 'manual',
      data: providerData,
      confidence: 1
    }]);

    res.json({
      success: true,
      data: validatedData
    });
  });
}

export const healthcareController = new HealthcareController();
