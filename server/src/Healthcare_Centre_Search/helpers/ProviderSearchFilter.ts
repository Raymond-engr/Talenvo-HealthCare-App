import { HealthcareProvider } from '../models/healthcareProvider.model';
import GeoUtils from '../services/Geoutils';

interface SearchFilters {
  keyword?: string;
  maxDistance?: number;
  userLocation?: [number, number];
}

class ProviderSearchFilter {
  static async searchProviders(filters: SearchFilters) {
    const {
      keyword,
      maxDistance,
      userLocation,
    } = filters;

    // Construct base query
    const query: any = {};

    if (keyword) {
      query.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { 'location.address.city': { $regex: keyword, $options: 'i' } },
        { 'serviceCapabilities.specialties': { $regex: keyword, $options: 'i' } }
      ];
    }

    let providers = await HealthcareProvider.find(query);

    if (maxDistance !== undefined && (maxDistance <= 0 || maxDistance > 10)) {
      throw new Error('Input a distance between 1 to 10 kilometers');
    }
    
    if (userLocation && maxDistance) {
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

      // Sort by proximity if location is provided
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

    return providers;
  }
}

export default ProviderSearchFilter;