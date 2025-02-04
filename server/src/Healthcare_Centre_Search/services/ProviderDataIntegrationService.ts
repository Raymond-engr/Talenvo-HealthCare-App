import axios from 'axios';
import { HealthcareProvider, InstitutionType, OwnershipType } from '../models/healthcareProvider.model';
import { IOperatingHours, IContactInfo, IServiceCapabilities, ITip } from '../../types/types';
import validateEnv from '../../utils/validateEnv';
import logger from '../../utils/logger';
import { mergeProviders } from '../helpers/mergeProviders';
import { 
  ExternalServiceAPIError, 
  AppError 
} from '../../utils/customErrors';
import { 
  handleExternalServiceError, 
  validateApiKey 
} from '../helpers/handleExternalServiceErrors';

validateEnv();

export interface IMergeableProvider {
    uniqueId: string;
    name: string;
    photo?: string;
    alternateNames?: string[];
    institutionType?: InstitutionType;
    ownershipType?: OwnershipType;
    location?: {
      address?: {
        streetAddress?: string;
        city?: string;
        state?: string;
        country?: string;
        postalCode?: string;
      };
      coordinates?: {
        type: 'Point';
        coordinates: [number, number];
      };
      landmark?: string;
      neighborhood?: string;
    };
    contactInfo?: IContactInfo;
    operatingHours?: IOperatingHours[];
    serviceCapabilities?: IServiceCapabilities;
    tips?: ITip[];
    verifiedDate?: Date;
    lastUpdated?: Date;
    sourceApis: string[];
}

class ProviderDataIntegrationService {
  static async fetchOpenStreetMapProviders(bbox: [number, number, number, number]): Promise<IMergeableProvider[]> {
    try {
      logger.info('Fetching providers from OpenStreetMap', { bbox });
      
      const response = await axios.get('https://overpass-api.de/api/interpreter', {
        params: {
          data: `
            [out:json];
            (
              node["healthcare"]["name"](${bbox.join(',')});
              way["healthcare"]["name"](${bbox.join(',')});
              relation["healthcare"]["name"](${bbox.join(',')});
            );
            out body;
            >;
            out skel qt;
          `
        }
      });

      const providers = response.data.elements.map(this.normalizeOpenStreetMapProvider);
      logger.info('OpenStreetMap providers fetched', { 
        providersCount: providers.length 
      });
      
      return providers;
    } catch (error) {
      logger.error('OpenStreetMap API Error', { error });
      handleExternalServiceError('OpenStreetMap', error);
    }
  }

  static async fetchPlacesApiProviders(location: [number, number], radius: number): Promise<IMergeableProvider[]> {
    try {
      const foursquareApiKey = process.env.FOURSQUARE_API_KEY;
      validateApiKey(foursquareApiKey, 'Foursquare');

      logger.info('Fetching providers from Foursquare', { 
        location, 
        radius 
      });

      const response = await axios.get('https://api.foursquare.com/v3/places/search', {
        params: {
          ll: location.join(','),
          radius,
          categories: 'hospital,medical,clinic',
          fields: 'name,geocodes,location,hours,tel,email,website,photos,categories,features'
        },
        headers: {
          'Authorization': foursquareApiKey
        }
      });

      const providers = await Promise.all(
        response.data.results.map(async (provider: any) => {
          const details = await this.fetchFoursquareProviderDetails(provider.fsq_id);
          return this.normalizeFoursquareProvider({ ...provider, ...details });
        })
      );

      logger.info('Foursquare providers fetched', { 
        providersCount: providers.length 
      });

      return providers;
    } catch (error) {
      logger.error('Foursquare API Error', { error });
      handleExternalServiceError('Foursquare', error);
    }
  }

  static async fetchFoursquareProviderDetails(fsq_id: string) {
    try {
      const foursquareApiKey = process.env.FOURSQUARE_API_KEY;
      validateApiKey(foursquareApiKey, 'Foursquare');

      logger.info('Fetching Foursquare provider details', { fsq_id });

      const [photosResponse, tipsResponse] = await Promise.all([
        axios.get(`https://api.foursquare.com/v3/places/${fsq_id}/photos`, {
          headers: { 'Authorization': foursquareApiKey }
        }),
        axios.get(`https://api.foursquare.com/v3/places/${fsq_id}/tips`, {
          headers: { 'Authorization': foursquareApiKey }
        })
      ]);

      logger.info('Foursquare provider details fetched', { 
        photosCount: photosResponse.data.length,
        tipsCount: tipsResponse.data.length 
      });

      return {
        photos: photosResponse.data,
        tips: tipsResponse.data
      };
    } catch (error) {
      logger.error('Foursquare Details API Error', { error, fsq_id });
      handleExternalServiceError('Foursquare', error);
    }
  }

  private static normalizeOpenStreetMapProvider(provider: any): IMergeableProvider {
    const operatingHours = this.parseOpenStreetMapHours(provider.tags?.['opening_hours']);
    const services = this.parseOpenStreetMapServices(provider.tags);
 
    return {
      uniqueId: `OSM_${provider.id}`,
      name: provider.tags?.name || 'Unnamed Provider',
      alternateNames: provider.tags?.['alt_name']?.split(';'),
      institutionType: this.mapInstitutionType(provider.tags?.['healthcare']),
      ownershipType: this.mapOwnershipType(provider.tags?.['operator:type']),
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
          state: provider.tags?.['addr:state'] || '',
          country: provider.tags?.['addr:country'] || '',
          postalCode: provider.tags?.['addr:postcode'] || ''
        },
        landmark: provider.tags?.['landmark'] || '',
        neighborhood: provider.tags?.['addr:suburb'] || ''
      },
      contactInfo: {
        phone: provider.tags?.['phone'] || provider.tags?.['contact:phone'],
        email: provider.tags?.['email'] || provider.tags?.['contact:email'],
        website: provider.tags?.['website'] || provider.tags?.['contact:website'],
        socialMedia: {
          facebook: provider.tags?.['contact:facebook'],
          twitter: provider.tags?.['contact:twitter'],
          instagram: provider.tags?.['contact:instagram']
        }
      },
      operatingHours,
      serviceCapabilities: services,
      verifiedDate: new Date(),
      lastUpdated: new Date(),
      sourceApis: ['OpenStreetMap']
    };
  }
 
 
  private static async normalizeFoursquareProvider(provider: any): Promise<IMergeableProvider> {
    const photo = provider.photos?.[0] ? `${provider.photos[0].prefix}original${provider.photos[0].suffix}` : '';
 
    return {
      uniqueId: `FS_${provider.fsq_id}`,
      name: provider.name,
      photo,
      alternateNames: provider.aka,
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
          state: provider.location.state,
          country: provider.location.country,
          postalCode: provider.location.postcode
        },
        neighborhood: provider.location.neighborhood
      },
      contactInfo: {
        phone: provider.tel,
        email: provider.email,
        website: provider.website,
        socialMedia: {
          facebook: provider.social_media?.facebook,
          twitter: provider.social_media?.twitter,
          instagram: provider.social_media?.instagram
        }
      },
      operatingHours: this.parseFoursquareHours(provider.hours?.regular),
      serviceCapabilities: {
        specialties: provider.features?.map((f: any) => f.name),
        facilities: provider.amenities,
        emergencyServices: provider.features?.some((f: any) => 
          f.name.toLowerCase().includes('emergency')),
        accessibility: provider.features
          ?.filter((f: any) => f.category === 'accessibility')
          ?.map((f: any) => f.name)
      },
      tips: provider.tips?.map((tip: any) => ({
        text: tip.text,
        author: tip.user?.name || 'Anonymous',
        likes: tip.likes || 0,
        date: tip.created_at
      })) || [],
      verifiedDate: new Date(),
      lastUpdated: new Date(),
      sourceApis: ['Foursquare']
    };
  }
 
  private static parseOpenStreetMapHours(hoursString?: string): IOperatingHours[] {
    if (!hoursString) return [];
 
    const days = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
    const hours: IOperatingHours[] = [];
 
    try {
      const segments = hoursString.split(';');
       
      segments.forEach(segment => {
        const [daysStr, timeStr] = segment.trim().split(' ');
         
        if (daysStr === '24/7') {
          days.forEach(day => {
            hours.push({
              day,
              open: '00:00',
              close: '24:00',
              is24Hours: true
            });
          });
          return;
        }
 
        const daysRange = daysStr.split(',');
        daysRange.forEach(dayRange => {
          const [start, end] = dayRange.split('-');
          const startIdx = days.indexOf(start);
          const endIdx = end ? days.indexOf(end) : startIdx;
 
          for (let i = startIdx; i <= endIdx; i++) {
            const [openTime, closeTime] = timeStr.split('-');
            hours.push({
              day: days[i],
              open: openTime,
              close: closeTime,
              is24Hours: false
            });
          }
        });
      });
    } catch (error) {
      console.error('Error parsing OpenStreetMap hours:', error);
    }
 
    return hours;
  }
 
  private static parseFoursquareHours(hours: any[]): IOperatingHours[] {
    if (!hours) return [];
 
    const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    return hours.map(hour => ({
      day: days[hour.day],
      open: this.formatFoursquareTime(hour.open),
      close: this.formatFoursquareTime(hour.close),
      is24Hours: hour.open === 0 && hour.close === 2359
    }));
  }
 
  private static formatFoursquareTime(time: number): string {
    const str = time.toString().padStart(4, '0');
    return `${str.slice(0, 2)}:${str.slice(2)}`;
  }
 
  private static parseOpenStreetMapServices(tags: any): IServiceCapabilities {
    const services: IServiceCapabilities = {
      specialties: [],
      facilities: [],
      equipment: [],
      emergencyServices: false,
      languages: [],
      accessibility: []
    };
 
    if (tags['healthcare:speciality']) {
      services.specialties = tags['healthcare:speciality'].split(';');
    }
 
    const facilityTags = [
      'healthcare:facilities',
      'amenity',
      'healthcare:equipment'
    ];
     
    facilityTags.forEach(tag => {
      if (tags[tag]) {
         services.facilities!.push(...tags[tag].split(';'));
      }
    });
 
    services.emergencyServices = tags['emergency'] === 'yes' || 
       tags['healthcare'] === 'emergency' ||
       tags['emergency_service'] === 'yes';
 
    const accessibilityTags = [
      'wheelchair',
      'wheelchair:description',
      'hearing_impaired:access'
    ];
 
    accessibilityTags.forEach(tag => {
      if (tags[tag]) {
         services.accessibility!.push(tags[tag]);
      }
    });
 
    return services;
  }
 
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
 
  static async deduplicateAndMergeProviders(providers: IMergeableProvider[]): Promise<IMergeableProvider[]> {
    const providerGroups = new Map<string, IMergeableProvider[]>();
     
    // Group providers by location proximity and similar names
    providers.forEach(provider => {
      const key = this.generateDeduplicationKey(provider);
      if (!providerGroups.has(key)) {
        providerGroups.set(key, []);
      }
       providerGroups.get(key)!.push(provider);
    });
 
    const mergedProviders = Array.from(providerGroups.values()).map(group => {
      return mergeProviders(group);
    });
 
    return mergedProviders;
  }
   
 
  private static generateDeduplicationKey(provider: IMergeableProvider): string {
    const coords = provider.location?.coordinates?.coordinates;
    const name = provider.name.toLowerCase();
    return `${coords?.[0].toFixed(4)},${coords?.[1].toFixed(4)}_${name}`;
  }

  static async integrateProviderData(location: [number, number], radius: number) {
    try {
      logger.info('Starting provider data integration', { 
        location, 
        radius 
      });

      const [longitude, latitude] = location;
      const bbox: [number, number, number, number] = [
        latitude - (radius / 111),
        longitude - (radius / 111),
        latitude + (radius / 111),
        longitude + (radius / 111)
      ];

      const providers = [
        ...await this.fetchOpenStreetMapProviders(bbox),
        ...await this.fetchPlacesApiProviders(location, radius * 1000)
      ];
      logger.info('Total providers fetched', { 
        providersCount: providers.length 
      });

      const mergedProviders = await this.deduplicateAndMergeProviders(providers);

      logger.info('Providers deduplicated and merged', { 
        mergedProvidersCount: mergedProviders.length 
      });

      const result = await HealthcareProvider.bulkWrite(
        mergedProviders.map(provider => ({
          updateOne: {
            filter: { uniqueId: provider.uniqueId },
            update: { $set: provider },
            upsert: true
          }
        }))
      );

      logger.info('Provider data integration completed', { 
        insertedCount: Object.keys(result.insertedIds).length 
      });

      return Object.values(result.insertedIds).map(id => ({ _id: id }));
    } catch (error) {
      logger.error('Provider data integration failed', { error });
      
      if (error instanceof ExternalServiceAPIError) {
        throw error;
      }
      
      throw new AppError('Failed to integrate provider data', 500);
    }
  }
}

export default ProviderDataIntegrationService;