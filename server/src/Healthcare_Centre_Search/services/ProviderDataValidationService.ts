import axios from 'axios';
import { redis } from './redisClient';
import validateEnv from '../../utils/validateEnv';

validateEnv();

interface ProviderSource {
  source: string;
  data: any;
  confidence: number;
}

class ProviderDataValidationService {
  // Cross-reference data from multiple sources
  async validateProviderData(providers: ProviderSource[]) {
    const validatedProviders = [];

    for (const provider of providers) {
      const validatedProvider = await this.validateSingleProvider(provider);
      if (validatedProvider) {
        validatedProviders.push(validatedProvider);
      }
    }

    return validatedProviders;
  }

  private async validateSingleProvider(providerSource: ProviderSource) {
    const sourceReliability = this.getSourceReliability(providerSource.source);
    let confidenceScore = providerSource.confidence * sourceReliability;

    const crossReferencedData = await this.crossReferenceProvider(providerSource);

    if (crossReferencedData) {
      confidenceScore *= 1.2; // Boost confidence for verified data
    }

    const validationResults = this.validateProviderInformation(providerSource.data);

    confidenceScore *= this.computeValidationMultiplier(validationResults);

    return {
      ...providerSource.data,
      metadata: {
        sourceConfidence: confidenceScore,
        crossReferenced: !!crossReferencedData,
        validationResults
      }
    };
  }

  private getSourceReliability(source: string): number {
    const reliabilityScores = {
      'OpenStreetMap': 0.7,
      'GooglePlaces': 0.8,
      'Foursquare': 0.6
    };
    return reliabilityScores[source as keyof typeof reliabilityScores] || 0.5;
  }

  private async crossReferenceProvider(providerSource: ProviderSource) {
    try {
      const googlePlacesResult = await this.fetchGooglePlacesData(
        providerSource.data.name, 
        providerSource.data.location.coordinates.coordinates
      );

      return this.compareProviderData(providerSource.data, googlePlacesResult);
    } catch (error) {
      console.warn('Cross-reference failed:', error);
      return null;
    }
  }

  private async fetchGooglePlacesData(name: string, coordinates: [number, number]) {
    try {
      const response = await axios.get('https://maps.googleapis.com/maps/api/place/nearbysearch/json', {
        params: {
          location: coordinates.reverse().join(','),
          radius: 500,
          keyword: name,
          key: process.env.GOOGLE_PLACES_API_KEY
        }
      });

      return response.data.results[0];
    } catch (error) {
      console.error('Google Places API Error:', error);
      return null;
    }
  }

  private compareProviderData(sourceData: any, crossReferenceData: any) {
    if (!crossReferenceData) return null;

    const matchScore = this.computeDataMatchScore(sourceData, crossReferenceData);
    return matchScore > 0.7 ? crossReferenceData : null;
  }

  private computeDataMatchScore(sourceData: any, referenceData: any): number {
    let matchAttributes = 0;
    let totalAttributes = 0;

    if (this.compareLocations(sourceData.location, referenceData.geometry.location)) {
      matchAttributes++;
    }
    totalAttributes++;

    if (this.compareNames(sourceData.name, referenceData.name)) {
      matchAttributes++;
    }
    totalAttributes++;

    return matchAttributes / totalAttributes;
  }

  private compareLocations(sourceLocation: any, referenceLocation: any, toleranceKm = 0.5): boolean {
    const [sourceLon, sourceLat] = sourceLocation.coordinates.coordinates;
    const { lat: refLat, lng: refLon } = referenceLocation;

    const distance = this.calculateHaversineDistance(
      { latitude: sourceLat, longitude: sourceLon },
      { latitude: refLat, longitude: refLon }
    );

    return distance <= toleranceKm;
  }

  private compareNames(sourceName: string, referenceName: string): boolean {
    const normalizedSourceName = this.normalizeName(sourceName);
    const normalizedReferenceName = this.normalizeName(referenceName);

    return normalizedSourceName.includes(normalizedReferenceName) || 
           normalizedReferenceName.includes(normalizedSourceName);
  }

  private normalizeName(name: string): string {
    return name.toLowerCase()
      .replace(/\s+/g, '')
      .replace(/[^\w\s]/gi, '');
  }

  private validateProviderInformation(providerData: any) {
    const validations = {
      hasValidCoordinates: this.validateCoordinates(providerData.location.coordinates),
      hasCompleteName: !!providerData.name && providerData.name.length > 2,
      hasValidAddress: this.validateAddress(providerData.location.address)
    };

    return validations;
  }

  private validateCoordinates(coordinates: [number, number]): boolean {
    const [lon, lat] = coordinates;
    return (
      lon >= -180 && lon <= 180 &&
      lat >= -90 && lat <= 90
    );
  }

  private validateAddress(address: any): boolean {
    return !!(
      address.streetAddress && 
      address.city && 
      address.country
    );
  }

  private computeValidationMultiplier(validationResults: any): number {
    const passedValidations = Object.values(validationResults).filter(Boolean).length;
    const totalValidations = Object.keys(validationResults).length;
    return passedValidations / totalValidations;
  }

  private calculateHaversineDistance(point1: {latitude: number, longitude: number}, point2: {latitude: number, longitude: number}): number {
    const R = 6371;
    const dLat = this.degreesToRadians(point2.latitude - point1.latitude);
    const dLon = this.degreesToRadians(point2.longitude - point1.longitude);
    
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.degreesToRadians(point1.latitude)) * 
      Math.cos(this.degreesToRadians(point2.latitude)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private degreesToRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  async cacheValidatedProvider(provider: any) {
    const cacheKey = `provider:${provider.uniqueId}`;
    
    await redis.set(
      cacheKey, 
      JSON.stringify(provider), 
      'EX', 
      24 * 60 * 60
    );
  }

  async getCachedProvider(uniqueId: string) {
    const cacheKey = `provider:${uniqueId}`;
    const cachedProvider = await redis.get(cacheKey);
    
    return cachedProvider ? JSON.parse(cachedProvider) : null;
  }
}

export default ProviderDataValidationService;
