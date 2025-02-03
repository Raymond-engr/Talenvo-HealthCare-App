import GeocodingService from './GeocodingService';
import axios from 'axios';
import pLimit from 'p-limit';
import validateEnv from '../../utils/validateEnv';
import { redis } from './redisClient';
import { HealthcareProvider, InstitutionType, OwnershipType, IOperatingHours, IContactInfo, IServiceCapabilities, ITip } from '../models/healthcareProvider.model';

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
    } catch (error: unknown) {
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

      const limit = pLimit(5);
      const placeDetails = await Promise.all(
        response.data.results.map((place: any) => limit(async () => {
          const detailsResponse = await axios.get('https://maps.googleapis.com/maps/api/place/details/json', {
            params: {
              place_id: place.place_id,
              fields: 'name,formatted_address,geometry,formatted_phone_number,website,opening_hours,types,photos,reviews,address_components,international_phone_number,rating,user_ratings_total',
              key: this.googlePlacesApiKey
            }
          });
          
          const details = detailsResponse.data.result;
          
          // Fetch photo if available
          if (details.photos && details.photos.length > 0) {
            details.mainPhotoUrl = await this.fetchPlacePhoto(details.photos[0].photo_reference);
          }
          
          return details;
        }))
      );

      return placeDetails.filter(result => result);
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`Google Places search failed: ${error.message}`);
      } else {
        throw new Error('Google Places search failed: Unknown error');
      }
    }
  }

  private async fetchPlacePhoto(photoReference: string): Promise<string> {
    try {
      const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photoReference}&key=${this.googlePlacesApiKey}`;
      const response = await axios.get(photoUrl, { responseType: 'arraybuffer' });
      const base64 = Buffer.from(response.data, 'binary').toString('base64');
      return `data:${response.headers['content-type']};base64,${base64}`;
    } catch (error) {
      console.error('Error fetching place photo:', error);
      return '';
    }
  }

  private async convertGooglePlaceToProvider(place: any) {
    const addressComponents = this.parseAddressComponents(place.address_components);
    const [longitude, latitude] = [
      place.geometry.location.lng,
      place.geometry.location.lat
    ];

    const tips = place.reviews?.map((review: any) => ({
      text: review.text,
      author: review.author_name,
      likes: review.rating,
      date: new Date(review.time * 1000)
    })) || [];

    return {
      uniqueId: `GOOGLE_${place.place_id}`,
      name: place.name,
      photo: place.mainPhotoUrl,
      alternateNames: [],
      institutionType: this.mapGooglePlaceTypeToInstitutionType(place.types),
      ownershipType: OwnershipType.PRIVATE,

      location: {
        address: {
          streetAddress: addressComponents.street,
          city: addressComponents.city,
          state: addressComponents.state,
          country: addressComponents.country,
          postalCode: addressComponents.postalCode
        },
        coordinates: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        neighborhood: addressComponents.neighborhood
      },

      contactInfo: {
        phoneNumbers: [
          place.formatted_phone_number,
          place.international_phone_number
        ].filter(Boolean),
        website: place.website
      },

      operatingHours: this.convertGoogleOpeningHours(place.opening_hours),

      serviceCapabilities: {
        specialties: this.inferSpecialties(place.types),
        appointmentBooking: {
          available: Boolean(place.website),
          methods: ['phone'],
          advanceNoticeRequired: 24
        },
        emergencyServices: place.types.includes('emergency'),
        languages: ['English']
      },

      tips,
      verifiedDate: new Date(),
      lastUpdated: new Date(),
      sourceApis: ['GooglePlaces']
    };
  }

  private parseAddressComponents(components: any[]): any {
    const result: any = {
      street: '',
      city: '',
      state: '',
      country: '',
      postalCode: '',
      neighborhood: ''
    };

    if (!components) return result;

    components.forEach((component: any) => {
      const type = component.types[0];
      switch (type) {
        case 'street_number':
          result.street = `${component.long_name} `;
          break;
        case 'route':
          result.street += component.long_name;
          break;
        case 'locality':
          result.city = component.long_name;
          break;
        case 'administrative_area_level_1':
          result.state = component.long_name;
          break;
        case 'country':
          result.country = component.long_name;
          break;
        case 'postal_code':
          result.postalCode = component.long_name;
          break;
        case 'neighborhood':
          result.neighborhood = component.long_name;
          break;
      }
    });

    return result;
  }

  private mapGooglePlaceTypeToInstitutionType(types: string[]): InstitutionType {
    const typeMap: { [key: string]: InstitutionType } = {
      'hospital': InstitutionType.HOSPITAL,
      'doctor': InstitutionType.CLINIC,
      'health': InstitutionType.MEDICAL_CENTER,
      'medical_center': InstitutionType.MEDICAL_CENTER,
      'emergency_room': InstitutionType.EMERGENCY_CARE,
      'dentist': InstitutionType.SPECIALIZED_CARE,
      'physiotherapist': InstitutionType.SPECIALIZED_CARE
    };

    for (const type of types) {
      if (typeMap[type]) {
        return typeMap[type];
      }
    }

    return InstitutionType.MEDICAL_CENTER;
  }

  private inferSpecialties(types: string[]): string[] {
    const specialtiesMap: { [key: string]: string } = {
      'dentist': 'Dental Care',
      'physiotherapist': 'Physical Therapy',
      'doctor': 'General Practice',
      'hospital': 'General Medicine',
      'emergency_room': 'Emergency Medicine'
    };

    return types
      .map(type => specialtiesMap[type])
      .filter(Boolean);
  }

  private convertGoogleOpeningHours(openingHours: any): IOperatingHours[] {
    if (!openingHours || !openingHours.periods) {
      return [];
    }

    return openingHours.periods.map((period: any) => ({
      day: this.getDayName(period.open.day),
      openTime: period.open.time,
      closeTime: period.close ? period.close.time : '2359',
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