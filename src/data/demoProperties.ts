import { PropertyRecord } from '../types/property';

/**
 * Bhu3D Demonstration / Lab Models
 * 
 * IMPORTANT DATA HONESTY NOTE:
 * These records represent synthetic architectural models used exclusively in the 
 * "Bhu3D Demonstration / Lab" workflow to showcase vertical unit subdivision, 
 * interior room volumes, and 3D cadastre extrusion.
 * 
 * - NO real citizen names are fabricated.
 * - NO official DoLR ULPINs are fabricated.
 * - Legal ownership is marked UNAVAILABLE.
 */
export const DEMO_PROPERTIES: PropertyRecord[] = [
  {
    id: 'demo-lab-pune-01',
    ownerName: 'UNAVAILABLE (Conceptual Demo Model)',
    propertyType: 'Apartment (Flat)',
    city: 'Pune',
    state: 'Maharashtra',
    country: 'India',
    locality: 'Kothrud (Demo Sandbox Area)',
    buildingName: 'Bhu3D Concept Lab - Tower B',
    floor: '3rd Floor (Demo Slice)',
    floorNumber: 3,
    unitNumber: 'Demo Unit 301',
    totalFloors: 14,
    builtUpArea: 95.2,
    carpetArea: 78.5,
    undividedLandShare: 24.3,
    propertyId3D: 'PROP-3D-PUN-LAB-01',
    ulpinStandard14: 'UNAVAILABLE (Not connected to DoLR)',
    ulpin3D: 'PROPOSED-BHU3D-PUN-LAB-01',
    status: 'Provisional (Demo)',
    verifiedDate: '14 Jan 2026',
    coordinates: {
      latitude: 18.5204,
      longitude: 73.8567,
      altitudeAMSL: 582,
      heightAGL: 12.0
    },
    cadastreDetails: {
      surveyNumber: 'Demo Parcel 42/1A (Synthetic)',
      subDivision: 'B-04',
      wardNumber: 'Ward 12 (Kothrud Sandbox)',
      municipalZone: 'PMC Zone 3',
      titleDeedNumber: 'UNAVAILABLE (Simulation Model)',
      registrationYear: 2023,
      landUseZone: 'R2 - High Density Residential'
    },
    rooms: [
      {
        id: 'living',
        name: 'Living Room',
        dimensions: '4.8m × 5.2m',
        areaSqM: 25.0,
        features: ['Vitrified Flooring', 'Floor-to-Ceiling Glazing', 'HVAC Volume'],
        position3D: [0.9, 0.25, 0.8]
      },
      {
        id: 'bedroom',
        name: 'Bedroom',
        dimensions: '4.0m × 4.2m',
        areaSqM: 16.8,
        features: ['Wooden Floor', 'Acoustic Partition Wall', 'En-suite'],
        position3D: [-1.2, 0.25, -0.6]
      },
      {
        id: 'kitchen',
        name: 'Kitchen',
        dimensions: '3.2m × 3.6m',
        areaSqM: 11.5,
        features: ['Modular Counter', 'Gas Pipeline Entry', 'Exhaust Shaft'],
        position3D: [1.3, 0.25, -0.7]
      },
      {
        id: 'balcony',
        name: 'Balcony',
        dimensions: '1.8m × 4.2m',
        areaSqM: 7.6,
        features: ['Safety Railing', 'Exterior Projection Boundary', 'Drain Outlets'],
        position3D: [-1.8, 0.25, 1.1]
      },
      {
        id: 'bathroom',
        name: 'Bathroom',
        dimensions: '2.2m × 2.4m',
        areaSqM: 5.3,
        features: ['Vitrified Anti-skid', 'Internal Plumbing Stack', 'Ventilation Duct'],
        position3D: [-0.3, 0.25, -1.0]
      }
    ],
    buildingProfile: {
      footprintAreaSqM: 620,
      heightMeters: 46.5,
      floorsCount: 14,
      unitsPerFloor: 4,
      yearBuilt: 2022,
      structureType: 'RCC Shear Wall'
    }
  },
  {
    id: 'demo-lab-mumbai-02',
    ownerName: 'UNAVAILABLE (Conceptual Demo Model)',
    propertyType: 'Apartment (Flat)',
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    locality: 'Bandra West (Demo Sandbox Area)',
    buildingName: 'Bhu3D Concept Lab - Coastal Tower',
    floor: '8th Floor (Demo Slice)',
    floorNumber: 8,
    unitNumber: 'Demo Unit 802',
    totalFloors: 22,
    builtUpArea: 118.4,
    carpetArea: 96.2,
    undividedLandShare: 28.6,
    propertyId3D: 'PROP-3D-BOM-LAB-02',
    ulpinStandard14: 'UNAVAILABLE (Not connected to DoLR)',
    ulpin3D: 'PROPOSED-BHU3D-BOM-LAB-02',
    status: 'Provisional (Demo)',
    verifiedDate: '09 Nov 2025',
    coordinates: {
      latitude: 19.0596,
      longitude: 72.8295,
      altitudeAMSL: 34,
      heightAGL: 28.5
    },
    cadastreDetails: {
      surveyNumber: 'Demo Parcel 112/3 (Synthetic)',
      subDivision: 'A-02',
      wardNumber: 'H-West Ward Sandbox',
      municipalZone: 'MCGM Zone 4',
      titleDeedNumber: 'UNAVAILABLE (Simulation Model)',
      registrationYear: 2022,
      landUseZone: 'R1 - Pure Residential Coastal'
    },
    rooms: [
      {
        id: 'living',
        name: 'Living Room',
        dimensions: '5.2m × 5.8m',
        areaSqM: 30.2,
        features: ['Marble Flooring', 'French Windows'],
        position3D: [0.9, 0.25, 0.8]
      },
      {
        id: 'bedroom',
        name: 'Master Bedroom',
        dimensions: '4.4m × 4.6m',
        areaSqM: 20.2,
        features: ['Hardwood Floor', 'Wardrobe Nook'],
        position3D: [-1.2, 0.25, -0.6]
      },
      {
        id: 'kitchen',
        name: 'Gourmet Kitchen',
        dimensions: '3.4m × 3.8m',
        areaSqM: 12.9,
        features: ['Granite Island', 'Utility Balcony Access'],
        position3D: [1.3, 0.25, -0.7]
      },
      {
        id: 'balcony',
        name: 'Balcony',
        dimensions: '2.2m × 4.5m',
        areaSqM: 9.9,
        features: ['Acoustic Safety Glass', 'Exterior Boundary'],
        position3D: [-1.8, 0.25, 1.1]
      }
    ],
    buildingProfile: {
      footprintAreaSqM: 850,
      heightMeters: 74.0,
      floorsCount: 22,
      unitsPerFloor: 2,
      yearBuilt: 2021,
      structureType: 'Composite Steel-Concrete'
    }
  },
  {
    id: 'demo-lab-blr-03',
    ownerName: 'UNAVAILABLE (Conceptual Demo Model)',
    propertyType: 'Apartment (Flat)',
    city: 'Bengaluru',
    state: 'Karnataka',
    country: 'India',
    locality: 'Koramangala (Demo Sandbox Area)',
    buildingName: 'Bhu3D Concept Lab - Tech Ridge',
    floor: '5th Floor (Demo Slice)',
    floorNumber: 5,
    unitNumber: 'Demo Unit 504',
    totalFloors: 16,
    builtUpArea: 142.0,
    carpetArea: 115.0,
    undividedLandShare: 35.1,
    propertyId3D: 'PROP-3D-BLR-LAB-03',
    ulpinStandard14: 'UNAVAILABLE (Not connected to DoLR)',
    ulpin3D: 'PROPOSED-BHU3D-BLR-LAB-03',
    status: 'Provisional (Demo)',
    verifiedDate: '22 Aug 2025',
    coordinates: {
      latitude: 12.9352,
      longitude: 77.6245,
      altitudeAMSL: 920,
      heightAGL: 19.5
    },
    cadastreDetails: {
      surveyNumber: 'Demo Parcel 88/4 (Synthetic)',
      subDivision: 'C-11',
      wardNumber: 'Ward 151 Sandbox',
      municipalZone: 'BBMP South',
      titleDeedNumber: 'UNAVAILABLE (Simulation Model)',
      registrationYear: 2024,
      landUseZone: 'IT Corridor Mixed Residential'
    },
    rooms: [
      {
        id: 'living',
        name: 'Living Room',
        dimensions: '5.5m × 6.0m',
        areaSqM: 33.0,
        features: ['Automation Ducting', 'Vitrified Tiles'],
        position3D: [0.9, 0.25, 0.8]
      },
      {
        id: 'bedroom',
        name: 'Master Suite',
        dimensions: '4.6m × 4.8m',
        areaSqM: 22.1,
        features: ['Wooden Flooring', 'Workstation Nook'],
        position3D: [-1.2, 0.25, -0.6]
      },
      {
        id: 'kitchen',
        name: 'Kitchen',
        dimensions: '3.6m × 4.0m',
        areaSqM: 14.4,
        features: ['Granite Platform', 'Gas Utility'],
        position3D: [1.3, 0.25, -0.7]
      },
      {
        id: 'balcony',
        name: 'Terrace Garden',
        dimensions: '2.5m × 4.2m',
        areaSqM: 10.5,
        features: ['Planter Troughs', 'Irrigation Outlets'],
        position3D: [-1.8, 0.25, 1.1]
      }
    ],
    buildingProfile: {
      footprintAreaSqM: 740,
      heightMeters: 55.0,
      floorsCount: 16,
      unitsPerFloor: 4,
      yearBuilt: 2023,
      structureType: 'RCC Framed'
    }
  },
  {
    id: 'demo-lab-del-04',
    ownerName: 'UNAVAILABLE (Conceptual Demo Model)',
    propertyType: 'Penthouse',
    city: 'New Delhi',
    state: 'Delhi',
    country: 'India',
    locality: 'Vasant Kunj (Demo Sandbox Area)',
    buildingName: 'Bhu3D Concept Lab - Penthouse Tower',
    floor: '12th Floor (Penthouse)',
    floorNumber: 12,
    unitNumber: 'Demo Penthouse 1201',
    totalFloors: 12,
    builtUpArea: 210.5,
    carpetArea: 172.0,
    undividedLandShare: 52.8,
    propertyId3D: 'PROP-3D-DEL-LAB-04',
    ulpinStandard14: 'UNAVAILABLE (Not connected to DoLR)',
    ulpin3D: 'PROPOSED-BHU3D-DEL-LAB-04',
    status: 'Provisional (Demo)',
    verifiedDate: '03 Feb 2026',
    coordinates: {
      latitude: 28.5244,
      longitude: 77.1578,
      altitudeAMSL: 265,
      heightAGL: 42.0
    },
    cadastreDetails: {
      surveyNumber: 'Demo Parcel 204/1 (Synthetic)',
      subDivision: 'PH-A',
      wardNumber: 'Ward 48 Sandbox',
      municipalZone: 'MCD South Zone',
      titleDeedNumber: 'UNAVAILABLE (Simulation Model)',
      registrationYear: 2023,
      landUseZone: 'DDA Special Residential Low Density'
    },
    rooms: [
      {
        id: 'living',
        name: 'Grand Salon',
        dimensions: '7.0m × 7.5m',
        areaSqM: 52.5,
        features: ['Double Height Ceiling', 'Panoramic Glazing'],
        position3D: [0.9, 0.25, 0.8]
      },
      {
        id: 'bedroom',
        name: 'Presidential Suite',
        dimensions: '5.2m × 5.5m',
        areaSqM: 28.6,
        features: ['Private En-suite', 'Dressing Room'],
        position3D: [-1.2, 0.25, -0.6]
      },
      {
        id: 'kitchen',
        name: 'Chef Kitchen',
        dimensions: '4.0m × 4.5m',
        areaSqM: 18.0,
        features: ['Pantry Storage', 'Service Entrance'],
        position3D: [1.3, 0.25, -0.7]
      },
      {
        id: 'balcony',
        name: 'Sky Deck',
        dimensions: '3.0m × 6.0m',
        areaSqM: 18.0,
        features: ['Glass Railing', 'Rooftop Integration'],
        position3D: [-1.8, 0.25, 1.1]
      }
    ],
    buildingProfile: {
      footprintAreaSqM: 920,
      heightMeters: 45.0,
      floorsCount: 12,
      unitsPerFloor: 2,
      yearBuilt: 2020,
      structureType: 'RCC High Performance Concrete'
    }
  },
  {
    id: 'demo-lab-hyd-05',
    ownerName: 'UNAVAILABLE (Conceptual Demo Model)',
    propertyType: 'Apartment (Flat)',
    city: 'Hyderabad',
    state: 'Telangana',
    country: 'India',
    locality: 'Hitec City (Demo Sandbox Area)',
    buildingName: 'Bhu3D Concept Lab - Cyber Enclave',
    floor: '4th Floor (Demo Slice)',
    floorNumber: 4,
    unitNumber: 'Demo Unit 403',
    totalFloors: 18,
    builtUpArea: 104.8,
    carpetArea: 86.4,
    undividedLandShare: 26.5,
    propertyId3D: 'PROP-3D-HYD-LAB-05',
    ulpinStandard14: 'UNAVAILABLE (Not connected to DoLR)',
    ulpin3D: 'PROPOSED-BHU3D-HYD-LAB-05',
    status: 'Provisional (Demo)',
    verifiedDate: '18 Dec 2025',
    coordinates: {
      latitude: 17.4435,
      longitude: 78.3772,
      altitudeAMSL: 542,
      heightAGL: 16.0
    },
    cadastreDetails: {
      surveyNumber: 'Demo Parcel 64/2 (Synthetic)',
      subDivision: 'B-09',
      wardNumber: 'Ward 108 Sandbox',
      municipalZone: 'GHMC West Zone',
      titleDeedNumber: 'UNAVAILABLE (Simulation Model)',
      registrationYear: 2024,
      landUseZone: 'GHMC Commercial & High-Rise Zone'
    },
    rooms: [
      {
        id: 'living',
        name: 'Living Room',
        dimensions: '5.0m × 5.2m',
        areaSqM: 26.0,
        features: ['Tile Bordering', 'Dual-Aspect Daylight'],
        position3D: [0.9, 0.25, 0.8]
      },
      {
        id: 'bedroom',
        name: 'Master Bedroom',
        dimensions: '4.2m × 4.4m',
        areaSqM: 18.5,
        features: ['Acoustic Glazing', 'Wardrobe Wall'],
        position3D: [-1.2, 0.25, -0.6]
      },
      {
        id: 'kitchen',
        name: 'Kitchen',
        dimensions: '3.0m × 3.5m',
        areaSqM: 10.5,
        features: ['Utility Area', 'Chimney Ducting'],
        position3D: [1.3, 0.25, -0.7]
      },
      {
        id: 'balcony',
        name: 'Balcony',
        dimensions: '1.8m × 3.8m',
        areaSqM: 6.8,
        features: ['Railing', 'Boulevard View'],
        position3D: [-1.8, 0.25, 1.1]
      }
    ],
    buildingProfile: {
      footprintAreaSqM: 780,
      heightMeters: 62.0,
      floorsCount: 18,
      unitsPerFloor: 4,
      yearBuilt: 2023,
      structureType: 'RCC Shear Wall'
    }
  }
];
