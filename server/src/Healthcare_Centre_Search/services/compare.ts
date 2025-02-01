import { HealthcareProvider, InstitutionType, OwnershipType } from './healthcareProviderSchema';
import GeocodingService from './geocodingService';
import { Redis } from 'ioredis';
import axios from 'axios';

interface ProviderSearchParams {
  location: [number, number];
  radius: number;
  country: string;
}

interface ProviderSearchByNameParams {
  name: string;
  country: string;
}

class ProviderDataIntegrationService {
  private readonly googlePlacesApiKey: string;
  private readonly geocodingService: GeocodingService;
  private readonly redis: Redis;

  constructor() {
    this.googlePlacesApiKey = process.env.GOOGLE_PLACES_API_KEY!;
    this.geocodingService = new GeocodingService();
    this.redis = new Redis();

    if (!this.googlePlacesApiKey) {
      throw new Error('Google Places API key is required');
    }
  }

  async integrateProviderData({
    location,
    radius,
    country
  }: ProviderSearchParams) {
    try {
      const [longitude, latitude] = location;
      const bbox = this.calculateBoundingBox(latitude, longitude, radius);

      const providers = await Promise.all([
        this.fetchOpenStreetMapProviders(bbox, country),
        this.fetchWHOProviderData(country),
        this.fetchGooglePlacesProviders(location, radius, country)
      ]);

      const flattenedProviders = providers.flat();
      const deduplicatedProviders = await this.deduplicateProviders(flattenedProviders);

      return this.saveProviders(deduplicatedProviders);
    } catch (error) {
      throw new Error(`Provider integration failed: ${error.message}`);
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
    } catch (error) {
      throw new Error(`Provider integration by name failed: ${error.message}`);
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
    } catch (error) {
      throw new Error(`Google Places search failed: ${error.message}`);
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

  // ... (previous methods remain the same)
}

export default ProviderDataIntegrationService;