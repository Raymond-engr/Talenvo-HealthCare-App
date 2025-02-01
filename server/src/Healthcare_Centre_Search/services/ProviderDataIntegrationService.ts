import axios from 'axios';
import { HealthcareProvider, InstitutionType, OwnershipType } from '../models/healthcareProvider.model';
import validateEnv from '../../utils/validateEnv';

validateEnv();
class ProviderDataIntegrationService {
  // OpenStreetMap API Integration
  static async fetchOpenStreetMapProviders(bbox: [number, number, number, number]) {
    try {
      const response = await axios.get('https://overpass-api.de/api/interpreter', {
        params: {
          data: `
            [out:json];
            (
              node["healthcare"](${bbox.join(',')});
              way["healthcare"](${bbox.join(',')});
              relation["healthcare"](${bbox.join(',')});
            );
            out center;
          `
        }
      });

      return response.data.elements.map(this.normalizeOpenStreetMapProvider);
    } catch (error) {
      console.error('OpenStreetMap API Error:', error);
      return [];
    }
  }

  // WHO Global Health Observatory API Integration
  static async fetchWHOProviderData(country: string) {
    try {
      const response = await axios.get(`https://who-api-endpoint.org/healthcare-facilities/${country}`);
      return response.data.map(this.normalizeWHOProvider);
    } catch (error) {
      console.error('WHO API Error:', error);
      return [];
    }
  }

  // Foursquare/Google Places API Integration
  static async fetchPlacesApiProviders(location: [number, number], radius: number) {
    try {
      const response = await axios.get('https://api.foursquare.com/v3/places/search', {
        params: {
          ll: location.join(','),
          radius: radius,
          categories: 'hospital,medical,clinic'
        },
        headers: {
          'Authorization': process.env.FOURSQUARE_API_KEY
        }
      });

      return response.data.results.map(this.normalizeFoursquareProvider);
    } catch (error) {
      console.error('Foursquare API Error:', error);
      return [];
    }
  }

  // Normalization Methods
  private static normalizeOpenStreetMapProvider(provider: any) {
    return {
      uniqueId: `OSM_${provider.id}`,
      name: provider.tags?.name || 'Unnamed Provider',
      institutionType: this.mapInstitutionType(provider.tags?.['healthcare']),
      location: {
        coordinates: {
          type: 'Point',
          coordinates: [
            provider.lon || provider.center?.lon, 
            provider.lat || provider.center?.lat
          ]
        },
        address: {
          streetAddress: provider.tags?.['addr:street'] || '',
          city: provider.tags?.['addr:city'] || '',
          country: provider.tags?.['addr:country'] || ''
        }
      },
      sourceApis: ['OpenStreetMap']
    };
  }

  private static normalizeWHOProvider(provider: any) {
    return {
      uniqueId: `WHO_${provider.id}`,
      name: provider.name,
      institutionType: this.mapInstitutionType(provider.type),
      ownershipType: this.mapOwnershipType(provider.ownership),
      location: {
        coordinates: {
          type: 'Point',
          coordinates: [provider.longitude, provider.latitude]
        },
        address: {
          streetAddress: provider.address,
          city: provider.city,
          country: provider.country
        }
      },
      sourceApis: ['WHO']
    };
  }

  private static normalizeFoursquareProvider(provider: any) {
    return {
      uniqueId: `FS_${provider.fsq_id}`,
      name: provider.name,
      institutionType: this.mapInstitutionType(provider.categories[0]?.name),
      location: {
        coordinates: {
          type: 'Point',
          coordinates: [
            provider.geocodes.main.longitude, 
            provider.geocodes.main.latitude
          ]
        },
        address: {
          streetAddress: provider.location.address,
          city: provider.location.city,
          country: provider.location.country
        }
      },
      sourceApis: ['Foursquare']
    };
  }

  // Utility Methods for Mapping
  private static mapInstitutionType(type: string): InstitutionType {
    const typeMap: { [key: string]: InstitutionType } = {
      'hospital': InstitutionType.HOSPITAL,
      'clinic': InstitutionType.CLINIC,
      'medical': InstitutionType.MEDICAL_CENTER,
      'emergency': InstitutionType.EMERGENCY_CARE
    };

    return typeMap[type.toLowerCase()] || InstitutionType.MEDICAL_CENTER;
  }

  private static mapOwnershipType(ownership: string): OwnershipType {
    const ownershipMap: { [key: string]: OwnershipType } = {
      'public': OwnershipType.PUBLIC,
      'private': OwnershipType.PRIVATE,
      'government': OwnershipType.GOVERNMENT
    };

    return ownershipMap[ownership.toLowerCase()] || OwnershipType.PRIVATE;
  }

  // Deduplication Method
  static async deduplicateProviders(providers: any[]) {
    const uniqueProviders = new Map();

    for (const provider of providers) {
      const key = this.generateDeduplicationKey(provider);
      
      if (!uniqueProviders.has(key)) {
        uniqueProviders.set(key, provider);
      }
    }

    return Array.from(uniqueProviders.values());
  }

  private static generateDeduplicationKey(provider: any) {
    return `${provider.location.coordinates.coordinates.join(',')}_${provider.name.toLowerCase()}`;
  }

  // Main Integration Method
  static async integrateProviderData(location: [number, number], radius: number) {
    const [longitude, latitude] = location;
    const bbox: [number, number, number, number] = [
      latitude - (radius / 111), 
      longitude - (radius / 111), 
      latitude + (radius / 111), 
      longitude + (radius / 111)
    ];

    const providers = [
      ...await this.fetchOpenStreetMapProviders(bbox),
      ...await this.fetchWHOProviderData('US'), // Example country
      ...await this.fetchPlacesApiProviders(location, radius * 1000)
    ];

    const deduplicatedProviders = await this.deduplicateProviders(providers);

    // Bulk insert or update providers
    return HealthcareProvider.bulkWrite(
      deduplicatedProviders.map(provider => ({
        updateOne: {
          filter: { uniqueId: provider.uniqueId },
          update: { $set: provider },
          upsert: true
        }
      }))
    );
  }
}

export default ProviderDataIntegrationService;