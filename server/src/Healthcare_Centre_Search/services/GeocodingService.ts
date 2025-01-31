import axios, { AxiosInstance } from 'axios';
import { RateLimiter } from 'limiter';
import { redis } from './redisClient';

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

  constructor() {
    this.googleMapsClient = axios.create({
      baseURL: 'https://maps.googleapis.com/maps/api',
      params: {
        key: process.env.GOOGLE_MAPS_API_KEY
      }
    });

    // Limit to 50 requests per second as per Google Maps API limits
    this.rateLimiter = new RateLimiter({
      tokensPerInterval: 50,
      interval: 'second'
    });
  }

  private async waitForRateLimit(): Promise<void> {
    const hasToken = await this.rateLimiter.tryRemoveTokens(1);
    if (!hasToken) {
      throw new Error('Rate limit exceeded');
    }
  }

  private generateCacheKey(prefix: string, query: string): string {
    return `geocode:${prefix}:${query.toLowerCase().replace(/\s+/g, '')}`;
  }

  async geocodeAddress(address: string): Promise<GeocodingResponse> {
    if (!address.trim()) {
      throw new Error('Address cannot be empty');
    }

    const cacheKey = this.generateCacheKey('address', address);
    const cachedResult = await redis.get(cacheKey);

    if (cachedResult) {
      return JSON.parse(cachedResult);
    }

    try {
      await this.waitForRateLimit();

      const response = await this.googleMapsClient.get('/geocode/json', {
        params: {
          address: address
        }
      });

      if (!response.data.results || response.data.results.length === 0) {
        throw new Error('No results found for the given address');
      }

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

      return formattedResponse;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Geocoding failed: ${error.response?.data?.error_message || error.message}`);
      }
      throw error;
    }
  }

  async reverseGeocode(
    latitude: number,
    longitude: number
  ): Promise<ReverseGeocodingResponse> {
    this.validateCoordinates(latitude, longitude);

    const cacheKey = this.generateCacheKey('reverse', `${latitude},${longitude}`);
    const cachedResult = await redis.get(cacheKey);

    if (cachedResult) {
      return JSON.parse(cachedResult);
    }

    try {
      await this.waitForRateLimit();

      const response = await this.googleMapsClient.get('/geocode/json', {
        params: {
          latlng: `${latitude},${longitude}`
        }
      });

      if (!response.data.results || response.data.results.length === 0) {
        throw new Error('No results found for the given coordinates');
      }

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

      return formattedResponse;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Reverse geocoding failed: ${error.response?.data?.error_message || error.message}`);
      }
      throw error;
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