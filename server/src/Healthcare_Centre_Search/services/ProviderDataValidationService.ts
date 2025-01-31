import { HealthcareProvider } from './healthcareProviderSchema';
import axios from 'axios';
import Redis from 'ioredis';

interface ProviderSource {
  source: string;
  data: any;
  confidence: number;
}

class ProviderDataValidationService {
  private redis: Redis;

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379')
    });
  }

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
    // Compute confidence score based on source reliability
    const sourceReliability = this.getSourceReliability(providerSource.source);
    let confidenceScore = providerSource.confidence * sourceReliability;

    // Cross-reference with other sources
    const crossReferencedData = await this.crossReferenceProvider(providerSource);
    
    // Adjust confidence based on cross-referencing
    if (crossReferencedData) {
      confidenceScore *= 1.2; // Boost confidence for verified data
    }

    // Validate key information
    const validationResults = this.validateProviderInformation(providerSource.data);
    
    // Further adjust confidence based on validation
    confidenceScore *= this.computeValidationMultiplier(validationResults);

    // Create final validated provider object
    return {
      ...providerSource.data,
      metadata: {
        sourceConfidence: confidenceScore,
        crossReferenced: !!crossReferencedData,
        validationResults
      }
    };
  }

  // Source reliability scoring
  private getSourceReliability(source: string): number {
    const reliabilityScores = {
      'WHO': 0.9,
      'OpenStreetMap': 0.7,
      'GooglePlaces': 0.8,
      'Foursquare': 0.6
    };
    return reliabilityScores[source] || 0.5;
  }

  // Cross-reference provider data across multiple sources
  private async crossReferenceProvider(providerSource: ProviderSource) {
    try {
      // Use Google Places API for cross-referencing
      const googlePlacesResult = await this.fetchGooglePlacesData(
        providerSource.data.name, 
        providerSource.data.location.coordinates.coordinates
      );

      // Compare key attributes
      return this.compareProviderData(providerSource.data, googlePlacesResult);
    } catch (error) {
      console.warn('Cross-reference failed:', error);
      return null;
    }
  }

  // Fetch additional data from Google Places
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

  // Compare provider data attributes
  private compareProviderData(sourceData: any, crossReferenceData: any) {
    if (!crossReferenceData) return null;

    const matchScore = this.computeDataMatchScore(sourceData, crossReferenceData);
    return matchScore > 0.7 ? crossReferenceData : null;
  }

  // Compute match score between data sources
  private computeDataMatchScore(sourceData: any, referenceData: any): number {
    let matchAttributes = 0;
    let totalAttributes = 0;

    // Compare location
    if (this.compareLocations(sourceData.location, referenceData.geometry.location)) {
      matchAttributes++;
    }
    totalAttributes++;

    // Compare name similarity
    if (this.compareNames(sourceData.name, referenceData.name)) {
      matchAttributes++;
    }
    totalAttributes++;

    return matchAttributes / totalAttributes;
  }

  // Location comparison with tolerance
  private compareLocations(sourceLocation: any, referenceLocation: any, toleranceKm = 0.5): boolean {
    const [sourceLon, sourceLat] = sourceLocation.coordinates.coordinates;
    const { lat: refLat, lng: refLon } = referenceLocation;

    const distance = this.calculateHaversineDistance(
      { latitude: sourceLat, longitude: sourceLon },
      { latitude: refLat, longitude: refLon }
    );

    return distance <= toleranceKm;
  }

  // Name similarity comparison
  private compareNames(sourceName: string, referenceName: string): boolean {
    const normalizedSourceName = this.normalizeName(sourceName);
    const normalizedReferenceName = this.normalizeName(referenceName);

    return normalizedSourceName.includes(normalizedReferenceName) || 
           normalizedReferenceName.includes(normalizedSourceName);
  }

  // Normalize name for comparison
  private normalizeName(name: string): string {
    return name.toLowerCase()
      .replace(/\s+/g, '')
      .replace(/[^\w\s]/gi, '');
  }

  // Validate provider information
  private validateProviderInformation(providerData: any) {
    const validations = {
      hasValidCoordinates: this.validateCoordinates(providerData.location.coordinates),
      hasCompleteName: !!providerData.name && providerData.name.length > 2,
      hasValidAddress: this.validateAddress(providerData.location.address)
    };

    return validations;
  }

  // Coordinates validation
  private validateCoordinates(coordinates: [number, number]): boolean {
    const [lon, lat] = coordinates;
    return (
      lon >= -180 && lon <= 180 &&
      lat >= -90 && lat <= 90
    );
  }

  // Address validation
  private validateAddress(address: any): boolean {
    return !!(
      address.streetAddress && 
      address.city && 
      address.country
    );
  }

  // Compute validation confidence multiplier
  private computeValidationMultiplier(validationResults: any): number {
    const passedValidations = Object.values(validationResults).filter(Boolean).length;
    const totalValidations = Object.keys(validationResults).length;
    return passedValidations / totalValidations;
  }

  // Haversine distance calculation (shared utility method)
  private calculateHaversineDistance(point1: {latitude: number, longitude: number}, point2: {latitude: number, longitude: number}): number {
    const R = 6371; // Earth's radius in kilometers
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

  // Caching mechanism for validated providers
  async cacheValidatedProvider(provider: any) {
    const cacheKey = `provider:${provider.uniqueId}`;
    
    // Cache for 24 hours
    await this.redis.set(
      cacheKey, 
      JSON.stringify(provider), 
      'EX', 
      24 * 60 * 60
    );
  }

  // Retrieve cached provider
  async getCachedProvider(uniqueId: string) {
    const cacheKey = `provider:${uniqueId}`;
    const cachedProvider = await this.redis.get(cacheKey);
    
    return cachedProvider ? JSON.parse(cachedProvider) : null;
  }
}

export default ProviderDataValidationService;