import { IMergeableProvider } from '../services/ProviderDataIntegrationService'; // Adjust import path as needed
import { IAddress } from '../../types/types'; // Adjust import path as needed

export function mergeProviders(providers: IMergeableProvider[]): IMergeableProvider {
  const alternateNamesSet = new Set<string>();
 
  const merged: IMergeableProvider = {
    uniqueId: providers[0].uniqueId,
    name: providers[0].name,
    sourceApis: [],
    alternateNames: [],
    location: {
      coordinates: providers[0].location?.coordinates,
      address: {} as Partial<IAddress>,
    },
  };
 
  providers.forEach(provider => {
    merged.sourceApis = [...new Set([...merged.sourceApis, ...provider.sourceApis])];
 
    if (provider.alternateNames) {
      provider.alternateNames.forEach(name => alternateNamesSet.add(name));
    }
 
    // Take the most complete address
    if (provider.location?.address) {
      Object.entries(provider.location.address).forEach(([key, value]) => {
        if (value && !merged.location?.address?.[key as keyof typeof merged.location.address]) {
          if (merged.location?.address) {
            (merged.location.address as IAddress)[key as keyof IAddress] = value;
          }
        }
      });
    }
     
    // Take the first available value for single-value fields
    if (!merged.photo && provider.photo) merged.photo = provider.photo;
    if (!merged.institutionType && provider.institutionType) merged.institutionType = provider.institutionType;
    if (!merged.ownershipType && provider.ownershipType) merged.ownershipType = provider.ownershipType;
    if (!merged.location!.landmark && provider.location?.landmark) merged.location!.landmark = provider.location.landmark;
    if (!merged.location!.neighborhood && provider.location?.neighborhood) {
       merged.location!.neighborhood = provider.location.neighborhood;
    }
 
    if (provider.contactInfo) {
      merged.contactInfo = { ...merged.contactInfo, ...provider.contactInfo };
    }
 
    if (provider.operatingHours && (!merged.operatingHours || 
         provider.operatingHours.length > merged.operatingHours.length)) {
      merged.operatingHours = provider.operatingHours;
    }
 
    if (provider.serviceCapabilities) {
      merged.serviceCapabilities = {
        ...merged.serviceCapabilities,
        ...provider.serviceCapabilities
      };
    }
  });
 
  // Assign the converted array to match the interface
  merged.alternateNames = Array.from(alternateNamesSet);
 
  merged.verifiedDate = new Date();
  merged.lastUpdated = new Date();
 
  return merged;
}