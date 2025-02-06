import GeocodingService from './GeocodingService';
import axios from 'axios';
import pLimit from 'p-limit';
import validateEnv from '../../utils/validateEnv';
import { redis } from './redisClient';
import logger from '../../utils/logger';
import { AppError, BadRequestError } from '../../utils/customErrors';
import { handleExternalServiceError, validateApiKey } from '../helpers/handleExternalServiceErrors';
import { HealthcareProvider, InstitutionType, OwnershipType, IOperatingHours } from '../models/healthcareProvider.model';

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
    this.googlePlacesApiKey = process.env.GOOGLE_PLACES_API_KEY || '';
    this.geocodingService = GeocodingService;
    this.redis = redis;

    // Use API key validation
    validateApiKey(this.googlePlacesApiKey, 'Google Places');
  }

  async integrateProviderByName({ name, country }: ProviderSearchByNameParams) {
    try {
      logger.info('Starting provider integration by name', { name, country });

      const cacheKey = `provider:${name}:${country}`;
      const cachedResult = await this.redis.get(cacheKey);

      if (cachedResult) {
        logger.info('Retrieved provider data from cache', { name, country });
        return JSON.parse(cachedResult);
      }

      const placeDetails = await this.searchGooglePlacesByName(name, country);

      if (!placeDetails || placeDetails.length === 0) {
        logger.warn('No place details found', { name, country });
        throw new BadRequestError('No healthcare providers found matching the search criteria.');
      }

      const limit = pLimit(5);
      const providers = await Promise.allSettled(
        placeDetails.map(place => limit(() => this.convertGooglePlaceToProvider(place)))
      );

      const successfulProviders = providers
        .filter(result => result.status === 'fulfilled')
        .map(result => (result as PromiseFulfilledResult<any>).value);

      if (successfulProviders.length === 0) {
        logger.warn('No providers could be converted', { name, country });
        throw new AppError('Failed to convert any providers', 400);
      }

      await this.saveProviders(successfulProviders);
      const fullData = await HealthcareProvider.find({
        uniqueId: { $in: successfulProviders.map(p => p.uniqueId) }
      });

      // Cache the result for 5 hour
      await this.redis.set(cacheKey, JSON.stringify(fullData), 'EX', 18000);

      logger.info('Provider integration completed successfully', { 
        name, 
        country, 
        providersCount: successfulProviders.length 
      });

      return fullData;
    } catch (error: unknown) {
      logger.error('Provider integration failed', { 
        name, 
        country, 
        error: error instanceof Error ? error.message : error 
      });

      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError('Provider integration failed', 500);
    }
  }

  private async searchGooglePlacesByName(name: string, country: string) {
    try {
      logger.info('Searching Google Places', { name, country });

      const response = await axios.get('https://maps.googleapis.com/maps/api/place/textsearch/json', {
        params: {
          query: `${name} healthcare ${country}`,
          type: 'health',
          key: this.googlePlacesApiKey
        }
      });

      if (!response.data.results) {
        logger.warn('No results found in Google Places search', { name, country });
        return [];
      }

      const limit = pLimit(5);
      const placeDetails = await Promise.all(
        response.data.results.map((place: any) => limit(async () => {
          try {
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
          } catch (error) {
            logger.error('Error fetching place details', { 
              placeId: place.place_id, 
              error 
            });
            // Rethrow to be caught by Promise.all
            throw error;
          }
        }))
      );

      logger.info('Google Places search completed', { 
        name, 
        country, 
        placesFound: placeDetails.length 
      });

      return placeDetails.filter(result => result);
    } catch (error: unknown) {
      logger.error('Google Places search failed', { name, country, error });
      handleExternalServiceError('Google Places', error);
    }
  }

  private async fetchPlacePhoto(photoReference: string): Promise<string> {
    try {
      logger.info('Fetching place photo', { photoReference });

      const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photoReference}&key=${this.googlePlacesApiKey}`;
      const response = await axios.get(photoUrl, { responseType: 'arraybuffer' });
      
      const base64 = Buffer.from(response.data, 'binary').toString('base64');
      const photoData = `data:${response.headers['content-type']};base64,${base64}`;

      logger.info('Place photo fetched successfully', { 
        photoSize: photoData.length 
      });

      return photoData;
    } catch (error) {
      logger.error('Error fetching place photo', { 
        photoReference, 
        error 
      });
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
    try {
      logger.info('Saving providers', { providersCount: providers.length });

      const result = await HealthcareProvider.bulkWrite(
        providers.map(provider => ({
          updateOne: {
            filter: { uniqueId: provider.uniqueId },
            update: { $set: provider },
            upsert: true
          }
        }))
      );

      logger.info('Providers saved successfully', { 
        upsertedCount: Object.keys(result.upsertedIds).length 
      });

      return result;
    } catch (error) {
      logger.error('Error saving providers', { error });
      throw new AppError('Failed to save providers', 500);
    }
  }
}

export default ProviderNameIntegrationService;