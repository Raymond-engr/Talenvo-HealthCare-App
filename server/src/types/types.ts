export interface LocationSearch {
    latitude: number;
    longitude: number;
  }
  
export interface AddressSearch {
    address: string;
  }
  
export interface NameSearch {
    name: string;
  }
  
export type SearchRequest = LocationSearch | AddressSearch | NameSearch;
  
export interface GooglePlace {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  formatted_phone_number: string | null;
  website: string | null;
  opening_hours: {
    periods: {
      open: {
        day: number;
        time: string;
      };
      close?: {
        day: number;
        time: string;
      };
    }[];
  } | null;
  types: string[];
}
