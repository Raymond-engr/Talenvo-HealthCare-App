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

export interface IOperatingHours {
  day: string;
  open: string;
  close: string;
  is24Hours: boolean;
}

export interface IContactInfo {
  phone?: string;
  email?: string;
  website?: string;
  socialMedia?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
  };
}

export interface IServiceCapabilities {
  specialties?: string[];
  facilities?: string[];
  equipment?: string[];
  emergencyServices?: boolean;
  insuranceAccepted?: string[];
  languages?: string[];
  accessibility?: string[];
}

export interface IAddress {
  streetAddress?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

export interface ITip {
  text: string;
  author: string;
  likes: number;
  date: Date;
}