import { Request, Response } from 'express';
import HealthcareCenterSearchService from './healthcareCenterSearchService';
import { validateSearchParams } from './validators/searchParamsValidator';
import { HealthcareProvider } from './healthcareProviderSchema';
import GeocodingService from './geocodingService';
import ProviderDataIntegrationService from './providerDataIntegrationService';
import ProviderDataValidationService from './providerDataValidationService';

class HealthcareController {
  private readonly searchService: HealthcareCenterSearchService;
  private readonly geocodingService: GeocodingService;
  private readonly integrationService: ProviderDataIntegrationService;
  private readonly validationService: ProviderDataValidationService;

  constructor() {
    this.searchService = new HealthcareCenterSearchService();
    this.geocodingService = new GeocodingService();
    this.integrationService = new ProviderDataIntegrationService();
    this.validationService = new ProviderDataValidationService();
  }

  // Main search endpoint
  async search(req: Request, res: Response) {
    try {
      const validatedParams = validateSearchParams(req.body);
      const searchResult = await this.searchService.search(validatedParams);
      res.json(searchResult);
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  // Get provider details by ID
  async getProviderById(req: Request, res: Response) {
    try {
      const provider = await HealthcareProvider.findOne({ uniqueId: req.params.id });
      if (!provider) {
        return res.status(404).json({
          success: false,
          error: 'Provider not found'
        });
      }
      res.json({
        success: true,
        data: provider
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Get providers by filters
  async getProvidersByFilters(req: Request, res: Response) {
    try {
      const {
        institutionType,
        ownershipType,
        specialties,
        emergencyServices,
        languages
      } = req.query;

      const query: any = {};

      if (institutionType) query.institutionType = institutionType;
      if (ownershipType) query.ownershipType = ownershipType;
      if (specialties) query['serviceCapabilities.specialties'] = { $in: [specialties] };
      if (emergencyServices) query['serviceCapabilities.emergencyServices'] = emergencyServices;
      if (languages) query['serviceCapabilities.languages'] = { $in: [languages] };

      const providers = await HealthcareProvider.find(query);
      
      res.json({
        success: true,
        data: {
          providers,
          totalResults: providers.length
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  // Geocode address
  async geocodeAddress(req: Request, res: Response) {
    try {
      const { address } = req.body;
      const result = await this.geocodingService.geocodeAddress(address);
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  // Validate provider data
  async validateProvider(req: Request, res: Response) {
    try {
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
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  // Integrate new provider data
  async integrateProvider(req: Request, res: Response) {
    try {
      const { location, radius, country } = req.body;
      const result = await this.integrationService.integrateProviderData({
        location,
        radius,
        country
      });
      
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }
}

export default HealthcareController;