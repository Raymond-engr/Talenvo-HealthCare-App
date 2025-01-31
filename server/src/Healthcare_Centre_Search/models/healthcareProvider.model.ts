import mongoose, { Schema, Document } from 'mongoose';

// Enum for institution types
enum InstitutionType {
  HOSPITAL = 'hospital',
  CLINIC = 'clinic',
  MEDICAL_CENTER = 'medical_center',
  DIAGNOSTIC_CENTER = 'diagnostic_center',
  EMERGENCY_CARE = 'emergency_care',
  SPECIALIZED_CARE = 'specialized_care'
}

// Enum for ownership types
enum OwnershipType {
  PUBLIC = 'public',
  PRIVATE = 'private',
  NON_PROFIT = 'non_profit',
  GOVERNMENT = 'government',
  CHARITABLE = 'charitable'
}

// Interface for operating hours
interface IOperatingHours {
  day: string;
  openTime: string;
  closeTime: string;
  isOpen24Hours?: boolean;
}

// Interface for contact information
interface IContactInfo {
  phoneNumbers: string[];
  email?: string;
  website?: string;
}

// Interface for service capabilities
interface IServiceCapabilities {
  specialties: string[];
  appointmentBooking: {
    available: boolean;
    methods: string[]; // e.g., 'online', 'phone', 'walk-in'
    advanceNoticeRequired?: number; // in hours
  };
  emergencyServices: boolean;
  languages: string[];
}

// Interface for healthcare provider
interface IHealthcareProvider extends Document {
  // Base Information
  uniqueId: string;
  name: string;
  alternateNames?: string[];
  institutionType: InstitutionType;
  ownershipType: OwnershipType;

  // Location Details
  location: {
    address: {
      streetAddress: string;
      city: string;
      state: string;
      country: string;
      postalCode: string;
    };
    coordinates: {
      type: 'Point';
      coordinates: [number, number]; // [longitude, latitude]
    };
    landmark?: string;
    neighborhood?: string;
  };

  // Contact Information
  contactInfo: IContactInfo;

  // Operating Details
  operatingHours: IOperatingHours[];

  // Service Capabilities
  serviceCapabilities: IServiceCapabilities;

  // Metadata
  verifiedDate: Date;
  lastUpdated: Date;
  sourceApis: string[]; // APIs used to source this data
}

// Create the Mongoose Schema
const HealthcareProviderSchema = new Schema<IHealthcareProvider>({
  uniqueId: { 
    type: String, 
    required: true, 
    unique: true,
    index: true 
  },
  name: { 
    type: String, 
    required: true,
    text: true // Enable text search
  },
  alternateNames: [String],
  institutionType: { 
    type: String, 
    enum: Object.values(InstitutionType),
    required: true 
  },
  ownershipType: { 
    type: String, 
    enum: Object.values(OwnershipType),
    required: true 
  },

  // Location Details
  location: {
    address: {
      streetAddress: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      country: { type: String, required: true },
      postalCode: { type: String }
    },
    coordinates: {
      type: { 
        type: String, 
        default: 'Point', 
        enum: ['Point'] 
      },
      coordinates: { 
        type: [Number], 
        required: true,
        index: '2dsphere' // Geospatial indexing
      }
    },
    landmark: String,
    neighborhood: String
  },

  // Contact Information
  contactInfo: {
    phoneNumbers: [String],
    email: { 
      type: String, 
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
    },
    website: { 
      type: String,
      validate: {
        validator: function(v: string) {
          return /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(v);
        },
        message: props => `${props.value} is not a valid website URL!`
      }
    }
  },

  // Operating Hours
  operatingHours: [{
    day: { 
      type: String, 
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] 
    },
    openTime: String,
    closeTime: String,
    isOpen24Hours: { type: Boolean, default: false }
  }],

  // Service Capabilities
  serviceCapabilities: {
    specialties: [String],
    appointmentBooking: {
      available: { type: Boolean, default: false },
      methods: [{ 
        type: String, 
        enum: ['online', 'phone', 'walk-in', 'email'] 
      }],
      advanceNoticeRequired: Number
    },
    emergencyServices: { type: Boolean, default: false },
    languages: [String]
  },

  // Metadata
  verifiedDate: { type: Date, default: Date.now },
  lastUpdated: { type: Date, default: Date.now },
  sourceApis: [String]
}, {
  timestamps: true, // Automatically manage createdAt and updatedAt
  collection: 'healthcare_providers'
});

// Compound Index for efficient searching
HealthcareProviderSchema.index({ 
  name: 'text', 
  'location.address.city': 'text',
  'location.address.country': 'text',
  'serviceCapabilities.specialties': 'text'
});

// Pre-save hook for updating last updated timestamp
HealthcareProviderSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

// Method to find nearby providers
HealthcareProviderSchema.methods.findNearby = function(maxDistance: number) {
  return this.model('HealthcareProvider').find({
    'location.coordinates': {
      $near: {
        $geometry: this.location.coordinates,
        $maxDistance: maxDistance * 1000 // Convert km to meters
      }
    }
  });
};

// Create the model
const HealthcareProvider = mongoose.model<IHealthcareProvider>('HealthcareProvider', HealthcareProviderSchema);

export { 
  HealthcareProvider, 
  InstitutionType, 
  OwnershipType,
  IHealthcareProvider 
};