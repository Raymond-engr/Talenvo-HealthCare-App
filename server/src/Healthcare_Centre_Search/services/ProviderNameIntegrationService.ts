import { HealthcareProvider, InstitutionType, OwnershipType } from '../models/healthcareProvider.model';
import GeocodingService from './GeocodingService';
import { redis } from './redisClient';
import axios from 'axios';


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
      const providers = await Promise.all(
        placeDetails.map(place => this.convertGooglePlaceToProvider(place))
      );

      const result = await this.saveProviders(providers);

      // Cache the result
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
      return Promise.all(
        response.data.results.map(async (place: any) => {
          const detailsResponse = await axios.get('https://maps.googleapis.com/maps/api/place/details/json', {
            params: {
              place_id: place.place_id,
              fields: 'name,formatted_address,geometry,formatted_phone_number,website,opening_hours,types',
              key: this.googlePlacesApiKey
            }
          });
          return detailsResponse.data.result;
        })
      );
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
      ownershipType: OwnershipType.PRIVATE, // Default, as Google doesn't provide this info
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

  // ... (previous methods remain the same)
}

export default ProviderNameIntegrationService;