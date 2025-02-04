import { HealthcareProvider } from '../models/healthcareProvider.model';
import GeoUtils from '../services/Geoutils';
import { BadRequestError } from '../../utils/customErrors';
import logger from '../../utils/logger';

interface SearchFilters {
  keyword?: string;
  maxDistance?: number;
  userLocation?: [number, number];
}

class ProviderSearchFilter {
  static async searchProviders(filters: SearchFilters) {
    try {
      logger.info('Starting provider search with filters:', filters);

      const { keyword, maxDistance, userLocation } = filters;

      // Validate distance constraints
      if (maxDistance !== undefined) {
        if (maxDistance <= 0 || maxDistance > 10) {
          logger.warn(`Invalid maxDistance value provided: ${maxDistance}`);
          throw new BadRequestError('Distance must be between 1 to 10 kilometers');
        }

        if (maxDistance && !userLocation) {
          logger.warn('maxDistance provided without userLocation');
          throw new BadRequestError('User location is required when specifying distance');
        }
      }

      // Construct base query
      const query: any = {};

      if (keyword) {
        logger.info(`Constructing keyword search query with: ${keyword}`);
        query.$or = [
          { name: { $regex: keyword, $options: 'i' } },
          { 'location.address.city': { $regex: keyword, $options: 'i' } },
          { 'serviceCapabilities.specialties': { $regex: keyword, $options: 'i' } }
        ];
      }

      let providers = await HealthcareProvider.find(query);
      logger.info(`Found ${providers.length} providers matching initial query`);

      if (userLocation && maxDistance) {
        logger.debug(`Filtering providers within ${maxDistance}km of user location`);
        providers = providers.filter(provider => {
          const distance = GeoUtils.calculateHaversineDistance(
            { 
              latitude: userLocation[1], 
              longitude: userLocation[0] 
            },
            { 
              latitude: provider.location.coordinates.coordinates[1],
              longitude: provider.location.coordinates.coordinates[0] 
            }
          );
          return distance <= maxDistance;
        });

        logger.info(`Sorting ${providers.length} providers by proximity`);
        providers.sort((a, b) => {
          const distanceA = GeoUtils.calculateHaversineDistance(
            { 
              latitude: userLocation[1], 
              longitude: userLocation[0] 
            },
            { 
              latitude: a.location.coordinates.coordinates[1],
              longitude: a.location.coordinates.coordinates[0] 
            }
          );
          
          const distanceB = GeoUtils.calculateHaversineDistance(
            { 
              latitude: userLocation[1], 
              longitude: userLocation[0] 
            },
            { 
              latitude: b.location.coordinates.coordinates[1],
              longitude: b.location.coordinates.coordinates[0] 
            }
          );
          return distanceA - distanceB;
        });
      }

      logger.info(`Returning ${providers.length} providers after all filters`);
      return providers;

    } catch (error: any) {
      logger.error('Error in provider search:', { 
        error: error.message,
        filters,
        stack: error.stack 
      });
      
      if (error instanceof BadRequestError) {
        throw error;
      }
      
      throw new Error('Failed to search providers');
    }
  }
}

export default ProviderSearchFilter;