export type ViewLevel = 'global' | 'city' | 'buildings' | 'layers' | 'ownership';

export interface RoomItem {
  id: string;
  name: string;
  dimensions: string;
  areaSqM: number;
  features: string[];
  position3D: [number, number, number]; // [x, y, z] normalized for Three.js scene
}

export interface PropertyRecord {
  id: string;
  ownerName: string;
  propertyType: 'Apartment (Flat)' | 'Commercial Suite' | 'Penthouse' | 'Duplex';
  city: string;
  state: string;
  country: string;
  locality: string;
  buildingName: string;
  floor: string;
  floorNumber: number;
  unitNumber: string;
  totalFloors: number;
  builtUpArea: number; // m²
  carpetArea: number;  // m²
  undividedLandShare: number; // m² (UDS)
  propertyId3D: string; // "3D-PUN-APT-0301-0001"
  ulpinStandard14: string; // Base 14-digit ULPIN
  ulpin3D: string; // Full 3D Bhu-Aadhaar extended identifier
  status: 'Verified (Demo)' | 'Provisional (Demo)';
  verifiedDate: string;
  coordinates: {
    latitude: number;
    longitude: number;
    altitudeAMSL: number; // Above Mean Sea Level (e.g. 582m)
    heightAGL: number;    // Above Ground Level (e.g. 12m)
  };
  cadastreDetails: {
    surveyNumber: string;
    subDivision: string;
    wardNumber: string;
    municipalZone: string;
    titleDeedNumber: string;
    registrationYear: number;
    landUseZone: string;
  };
  rooms: RoomItem[];
  buildingProfile: {
    footprintAreaSqM: number;
    heightMeters: number;
    floorsCount: number;
    unitsPerFloor: number;
    yearBuilt: number;
    structureType: string;
  };
}

export interface DataSourceItem {
  id: string;
  name: string;
  role: string;
  description: string;
  provider: string;
  badge: string;
  iconType: 'osm' | 'isro' | 'srtm' | 'soi' | 'cad' | 'bhoomi';
  isOfficialGovt: boolean;
}
