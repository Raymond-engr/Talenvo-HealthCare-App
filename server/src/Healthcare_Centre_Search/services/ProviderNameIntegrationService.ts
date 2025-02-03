import GeocodingService from './GeocodingService';
import axios from 'axios';
import pLimit from 'p-limit';
import validateEnv from '../../utils/validateEnv';
import { redis } from './redisClient';
import { HealthcareProvider, InstitutionType, OwnershipType } from '../models/healthcareProvider.model';
import { GooglePlace } from '../../types/types';

validateEnv();

interface ProviderSearchByNameParams {
  name: string;
  country: string;
}

class ProviderNameIntegrationService {
  private readonly googlePlacesApiKey: string;
  private readonly geocodingService: typeof GeocodingService;
  private readonly redis: typeof redis;

  constructor() {
    this.googlePlacesApiKey = process.env.GOOGLE_PLACES_API_KEY!;
    this.geocodingService = GeocodingService;
    this.redis = redis;
    

    if (!this.googlePlacesApiKey) {
      throw new Error('Google Places API key is required');
    }
  }

  async integrateProviderByName({ name, country }: ProviderSearchByNameParams) {
    try {
      const cacheKey = `provider:${name}:${country}`;
      const cachedResult = await this.redis.get(cacheKey);

      if (cachedResult) {
        return JSON.parse(cachedResult);
      }

      const placeDetails = await this.searchGooglePlacesByName(name, country);

      if (!placeDetails || placeDetails.length === 0) {
        throw new Error('No place details found.');
      }

      const limit = pLimit(5);
      const providers = await Promise.allSettled(
        placeDetails.map(place => limit(() => this.convertGooglePlaceToProvider(place)))
      );

      const successfulProviders = providers
        .filter(result => result.status === 'fulfilled')
        .map(result => (result as PromiseFulfilledResult<any>).value);

      const result = await this.saveProviders(successfulProviders);

      await this.redis.set(cacheKey, JSON.stringify(result), 'EX', 3600);

      return result;
    }  catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`Provider integration by name failed: ${error.message}`);
      } else {
        throw new Error('Provider integration by name failed: Unknown error');
      }
    }
  }

  private async searchGooglePlacesByName(name: string, country: string) {
    try {
      const response = await axios.get('https://maps.googleapis.com/maps/api/place/textsearch/json', {
        params: {
          query: `${name} healthcare ${country}`,
          type: 'health',
          key: this.googlePlacesApiKey
        }
      });

      if (!response.data.results) {
        return [];
      }

      // Fetch detailed information for each place
      const limit = pLimit(5);
      const placeDetails = await Promise.all(
        response.data.results.map((place: GooglePlace) => limit(async () => {
          const detailsResponse = await axios.get('https://maps.googleapis.com/maps/api/place/details/json', {
            params: {
              place_id: place.place_id,
              fields: 'name,formatted_address,geometry,formatted_phone_number,website,opening_hours,types',
              key: this.googlePlacesApiKey
            }
          });
          return detailsResponse.data.result;
        }))
      );
      return placeDetails.filter(result => result.status === 'fulfilled').map(result => result.value);
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`Google Places search failed: ${error.message}`);
      } else {
        throw new Error('Google Places search failed: Unknown error');
      }
    }
  }

  private async convertGooglePlaceToProvider(place: any) {
    const [longitude, latitude] = [
      place.geometry.location.lng,
      place.geometry.location.lat
    ];

    return {
      uniqueId: `GOOGLE_${place.place_id}`,
      name: place.name,
      institutionType: this.mapGooglePlaceTypeToInstitutionType(place.types),
      ownershipType: OwnershipType.PRIVATE,
      location: {
        address: {
          streetAddress: place.formatted_address,
          // Additional address components would need to be parsed from formatted_address
        },
        coordinates: {
          type: 'Point',
          coordinates: [longitude, latitude]
        }
      },
      contactInfo: {
        phoneNumbers: place.formatted_phone_number ? [place.formatted_phone_number] : [],
        website: place.website
      },
      operatingHours: this.convertGoogleOpeningHours(place.opening_hours),
      sourceApis: ['GooglePlaces']
    };
  }

  private mapGooglePlaceTypeToInstitutionType(types: string[]): InstitutionType {
    const typeMap: { [key: string]: InstitutionType } = {
      'hospital': InstitutionType.HOSPITAL,
      'doctor': InstitutionType.CLINIC,
      'health': InstitutionType.MEDICAL_CENTER
    };

    for (const type of types) {
      if (typeMap[type]) {
        return typeMap[type];
      }
    }

    return InstitutionType.MEDICAL_CENTER;
  }

  private convertGoogleOpeningHours(openingHours: any) {
    if (!openingHours || !openingHours.periods) {
      return [];
    }

    return openingHours.periods.map((period: any) => ({
      day: this.getDayName(period.open.day),
      openTime: period.open.time,
      closeTime: period.close ? period.close.time : null,
      isOpen24Hours: !period.close
    }));
  }

  private getDayName(day: number): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[day];
  }

  async saveProviders(providers: any[]) {
    
    return HealthcareProvider.bulkWrite(
      providers.map(provider => ({
        updateOne: {
          filter: { uniqueId: provider.uniqueId },
          update: { $set: provider },
          upsert: true
        }
      }))
    );
  }
}

export default ProviderNameIntegrationService;