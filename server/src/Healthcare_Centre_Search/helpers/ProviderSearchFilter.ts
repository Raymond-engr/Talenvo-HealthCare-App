import { HealthcareProvider, InstitutionType } from '../models/healthcareProvider.model';
import GeoUtils from '../services/Geoutils';

interface SearchFilters {
  keyword?: string;
  institutionType?: InstitutionType;
  maxDistance?: number;
  userLocation?: [number, number];
  availableNow?: boolean;
  specialties?: string[];
  languages?: string[];
}

class ProviderSearchService {
  static async searchProviders(filters: SearchFilters) {
    const {
      keyword,
      institutionType,
      maxDistance,
      userLocation,
      availableNow,
      specialties,
      languages
    } = filters;

    // Construct base query
    const query: any = {};

    // Keyword search (across multiple fields)
    if (keyword) {
      query.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { 'location.address.city': { $regex: keyword, $options: 'i' } },
        { 'serviceCapabilities.specialties': { $regex: keyword, $options: 'i' } }
      ];
    }

    // Institution type filter
    if (institutionType) {
      query.institutionType = institutionType;
    }

    // Specialties filter
    if (specialties && specialties.length > 0) {
      query['serviceCapabilities.specialties'] = { $in: specialties };
    }

    // Languages filter
    if (languages && languages.length > 0) {
      query['serviceCapabilities.languages'] = { $in: languages };
    }

    // Available now filter
    if (availableNow) {
      const currentDay = new Date().toLocaleString('en-US', { weekday: 'long' });
      const currentTime = new Date().toTimeString().slice(0, 5);

      query.$and = [
        { 'operatingHours.day': currentDay },
        { 'operatingHours.openTime': { $lte: currentTime } },
        { 'operatingHours.closeTime': { $gte: currentTime } }
      ];
    }

    // Execute base query
    let providers = await HealthcareProvider.find(query);

    // Distance filtering
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

export default ProviderSearchService;