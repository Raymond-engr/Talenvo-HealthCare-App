import axios, { AxiosInstance } from 'axios';
import { RateLimiter } from 'limiter';
import { redis } from './redisClient';
import logger from '../../utils/logger';
import { handleExternalServiceError, validateApiKey } from '../helpers/handleExternalServiceErrors';
import { ExternalServiceAPIError, AppError } from '../../utils/customErrors';

interface GeocodingResponse {
  latitude: number;
  longitude: number;
  formattedAddress: string;
  country: string;
  placeId?: string;
}

interface ReverseGeocodingResponse {
  country: string;
  formattedAddress: string;
  placeId?: string;
}

class GeocodingService {
  private readonly googleMapsClient: AxiosInstance;
  private readonly rateLimiter: RateLimiter;
  private readonly CACHE_DURATION = 60 * 60 * 24; // 24 hours
  private readonly apiKey: string;

  constructor() {
    // Validate API key
    this.apiKey = process.env.GOOGLE_MAPS_API_KEY || '';
    validateApiKey(this.apiKey, 'Google Maps');

    // Create axios client with API key
    this.googleMapsClient = axios.create({
      baseURL: 'https://maps.googleapis.com/maps/api',
      params: {
        key: this.apiKey
      }
    });

    // Limit to 50 requests per second as per Google Maps API limits
    this.rateLimiter = new RateLimiter({
      tokensPerInterval: 50,
      interval: 'second'
    });
  }

  private async waitForRateLimit(): Promise<void> {
    try {
      const hasToken = await this.rateLimiter.tryRemoveTokens(1);
      if (!hasToken) {
        logger.warn('Rate limit exceeded for Google Maps API');
        throw new ExternalServiceAPIError('Google Maps API rate limit exceeded', 429);
      }
    } catch (error) {
      logger.error('Error in rate limiting', { error });
      throw error;
    }
  }

  private generateCacheKey(prefix: string, query: string): string {
    return `geocode:${prefix}:${query.toLowerCase().replace(/\s+/g, '')}`;
  }

  async geocodeAddress(address: string): Promise<GeocodingResponse> {
    // Input validation
    if (!address || !address.trim()) {
      logger.error('Geocoding failed: Empty address provided');
      throw new AppError('Address cannot be empty', 400);
    }

    const cacheKey = this.generateCacheKey('address', address);
    
    try {
      // Check cache first
      const cachedResult = await redis.get(cacheKey);
      if (cachedResult) {
        logger.info(`Geocoding cache hit for address: ${address}`);
        return JSON.parse(cachedResult);
      }

      // Wait for rate limit
      await this.waitForRateLimit();

      // Make API call
      const response = await this.googleMapsClient.get('/geocode/json', {
        params: { address: address }
      });

      // Validate response
      if (!response.data.results || response.data.results.length === 0) {
        logger.warn(`No geocoding results for address: ${address}`);
        throw new AppError('No results found for the given address', 404);
      }

      // Process response
      const result = response.data.results[0];
      const formattedResponse: GeocodingResponse = {
        latitude: result.geometry.location.lat,
        longitude: result.geometry.location.lng,
        formattedAddress: result.formatted_address,
        country: this.extractCountry(result.address_components),
        placeId: result.place_id
      };

      // Cache the result
      await redis.set(
        cacheKey,
        JSON.stringify(formattedResponse),
        'EX',
        this.CACHE_DURATION
      );

      logger.info(`Successfully geocoded address: ${address}`);
      return formattedResponse;

    } catch (error: any) {
      // Use external service error handler
      logger.error(`Geocoding error for address: ${address}`, { error });
      return handleExternalServiceError('Google Maps', error);
    }
  }

  async reverseGeocode(
    latitude: number,
    longitude: number
  ): Promise<ReverseGeocodingResponse> {
    // Validate coordinates
    try {
      this.validateCoordinates(latitude, longitude);
    } catch (error: any) {
      logger.error('Invalid coordinates for reverse geocoding', { latitude, longitude, error });
      throw new AppError(error.message, 400);
    }

    const cacheKey = this.generateCacheKey('reverse', `${latitude},${longitude}`);
    
    try {
      // Check cache first
      const cachedResult = await redis.get(cacheKey);
      if (cachedResult) {
        logger.info(`Reverse geocoding cache hit for coordinates: ${latitude},${longitude}`);
        return JSON.parse(cachedResult);
      }

      // Wait for rate limit
      await this.waitForRateLimit();

      // Make API call
      const response = await this.googleMapsClient.get('/geocode/json', {
        params: { latlng: `${latitude},${longitude}` }
      });

      // Validate response
      if (!response.data.results || response.data.results.length === 0) {
        logger.warn(`No reverse geocoding results for coordinates: ${latitude},${longitude}`);
        throw new AppError('No results found for the given coordinates', 404);
      }

      // Process response
      const result = response.data.results[0];
      const formattedResponse: ReverseGeocodingResponse = {
        country: this.extractCountry(result.address_components),
        formattedAddress: result.formatted_address,
        placeId: result.place_id
      };

      // Cache the result
      await redis.set(
        cacheKey,
        JSON.stringify(formattedResponse),
        'EX',
        this.CACHE_DURATION
      );

      logger.info(`Successfully reverse geocoded coordinates: ${latitude},${longitude}`);
      return formattedResponse;

    } catch (error: any) {
      // Use external service error handler
      logger.error(`Reverse geocoding error for coordinates: ${latitude},${longitude}`, { error });
      return handleExternalServiceError('Google Maps', error);
    }
  }

  private validateCoordinates(latitude: number, longitude: number): void {
    if (
      typeof latitude !== 'number' ||
      typeof longitude !== 'number' ||
      isNaN(latitude) ||
      isNaN(longitude)
    ) {
      throw new Error('Invalid coordinates: latitude and longitude must be numbers');
    }

    if (latitude < -90 || latitude > 90) {
      throw new Error('Invalid latitude: must be between -90 and 90');
    }

    if (longitude < -180 || longitude > 180) {
      throw new Error('Invalid longitude: must be between -180 and 180');
    }
  }

  private extractCountry(addressComponents: any[]): string {
    const country = addressComponents.find(
      component => component.types.includes('country')
    );
    return country ? country.long_name : '';
  }
}

export default new GeocodingService();