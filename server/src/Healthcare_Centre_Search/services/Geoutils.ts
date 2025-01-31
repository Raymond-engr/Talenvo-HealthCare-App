interface Coordinates {
    latitude: number;
    longitude: number;
  }
  
class GeoUtils {
  static calculateHaversineDistance(point1: Coordinates, point2: Coordinates): number {
    // Radius of the Earth in kilometers
    const EARTH_RADIUS = 6371;
  
    // Convert latitude and longitude to radians
    const lat1Rad = this.degreesToRadians(point1.latitude);
    const lon1Rad = this.degreesToRadians(point1.longitude);
    const lat2Rad = this.degreesToRadians(point2.latitude);
    const lon2Rad = this.degreesToRadians(point2.longitude);
  
    // Differences in coordinates
    const latDiff = lat2Rad - lat1Rad;
    const lonDiff = lon2Rad - lon1Rad;
  
    // Haversine formula
    const a = 
        Math.sin(latDiff / 2) * Math.sin(latDiff / 2) +
        Math.cos(lat1Rad) * Math.cos(lat2Rad) *
        Math.sin(lonDiff / 2) * Math.sin(lonDiff / 2);
  
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
    return EARTH_RADIUS * c;
  }
  private static degreesToRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
  
  static filterProvidersByDistance(
    userLocation: Coordinates, 
    providers: Array<Coordinates & { name: string }>, 
    maxDistance: number = 10
  ): Array<Coordinates & { name: string, distance: number }> {
    return providers
      .map(provider => {
        const distance = this.calculateHaversineDistance(userLocation, provider);
        return { ...provider, distance };
      })
      .filter(provider => provider.distance <= maxDistance)
      .sort((a, b) => a.distance - b.distance);
  }
}
  
export default GeoUtils;