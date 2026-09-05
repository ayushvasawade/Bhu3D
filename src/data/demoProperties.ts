import { PropertyRecord } from '../types/property';

export const DEMO_PROPERTIES: PropertyRecord[] = [
  {
    id: 'prop-pune-01',
    ownerName: 'Saharsh',
    propertyType: 'Apartment (Flat)',
    city: 'Pune',
    state: 'Maharashtra',
    country: 'India',
    locality: 'Kothrud / Shivaji Nagar',
    buildingName: 'Emerald Heights Tower B',
    floor: '3rd Floor',
    floorNumber: 3,
    unitNumber: 'Unit 301',
    totalFloors: 14,
    builtUpArea: 95.2,
    carpetArea: 78.5,
    undividedLandShare: 24.3,
    propertyId3D: '3D-PUN-APT-0301-0001',
    ulpinStandard14: 'IN-MH-PUN-004281',
    ulpin3D: 'IN-MH-PUN-0428-BLD04-FL03-U301',
    status: 'Verified (Demo)',
    verifiedDate: '14 Jan 2026',
    coordinates: {
      latitude: 18.5204,
      longitude: 73.8567,
      altitudeAMSL: 582,
      heightAGL: 12.0
    },
    cadastreDetails: {
      surveyNumber: '42/1A',
      subDivision: 'B-04',
      wardNumber: 'Ward 12 (Kothrud)',
      municipalZone: 'PMC Zone 3',
      titleDeedNumber: 'DOC-MH-PUN-2023-9871',
      registrationYear: 2023,
      landUseZone: 'R2 - High Density Residential'
    },
    rooms: [
      {
        id: 'living',
        name: 'Living Room',
        dimensions: '4.8m × 5.2m',
        areaSqM: 25.0,
        features: ['Italian Marble Flooring', 'Floor-to-Ceiling Glazing', 'Smart HVAC Ducts'],
        position3D: [0.9, 0.25, 0.8]
      },
      {
        id: 'bedroom',
        name: 'Bedroom',
        dimensions: '4.0m × 4.2m',
        areaSqM: 16.8,
        features: ['Engineered Oak Wood Floor', 'Built-in Acoustic Insulation', 'Attached En-suite'],
        position3D: [-1.2, 0.25, -0.6]
      },
      {
        id: 'kitchen',
        name: 'Kitchen',
        dimensions: '3.2m × 3.6m',
        areaSqM: 11.5,
        features: ['Modular Quartz Counter', 'Gas Pipeline Sensor', 'Exhaust Shaft Access'],
        position3D: [1.3, 0.25, -0.7]
      },
      {
        id: 'balcony',
        name: 'Balcony',
        dimensions: '1.8m × 4.2m',
        areaSqM: 7.6,
        features: ['Toughened Glass Railing', 'City Skyline Panoramas', 'Rainwater Drain Scuppers'],
        position3D: [-1.8, 0.25, 1.1]
      },
      {
        id: 'bathroom',
        name: 'Bathroom',
        dimensions: '2.2m × 2.4m',
        areaSqM: 5.3,
        features: ['Anti-skid Vitrified Tiles', 'Concealed Cistern', 'Solar Heated Water Pipe'],
        position3D: [-0.3, 0.25, -1.0]
      }
    ],
    buildingProfile: {
      footprintAreaSqM: 620,
      heightMeters: 46.5,
      floorsCount: 14,
      unitsPerFloor: 4,
      yearBuilt: 2022,
      structureType: 'RCC Shear Wall (Seismic Zone III)'
    }
  },
  {
    id: 'prop-mumbai-02',
    ownerName: 'Priya Sharma',
    propertyType: 'Apartment (Flat)',
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    locality: 'Bandra West, Pali Hill',
    buildingName: 'Sea Breeze Residency',
    floor: '8th Floor',
    floorNumber: 8,
    unitNumber: 'Unit 802',
    totalFloors: 22,
    builtUpArea: 118.4,
    carpetArea: 96.2,
    undividedLandShare: 28.6,
    propertyId3D: '3D-BOM-APT-0802-0045',
    ulpinStandard14: 'IN-MH-BOM-009122',
    ulpin3D: 'IN-MH-BOM-0912-BLD01-FL08-U802',
    status: 'Verified (Demo)',
    verifiedDate: '09 Nov 2025',
    coordinates: {
      latitude: 19.0596,
      longitude: 72.8295,
      altitudeAMSL: 34,
      heightAGL: 28.5
    },
    cadastreDetails: {
      surveyNumber: '112/3',
      subDivision: 'A-02',
      wardNumber: 'H-West Ward',
      municipalZone: 'MCGM Zone 4',
      titleDeedNumber: 'DOC-MH-BOM-2022-4412',
      registrationYear: 2022,
      landUseZone: 'R1 - Pure Residential Coastal'
    },
    rooms: [
      {
        id: 'living',
        name: 'Living Room',
        dimensions: '5.2m × 5.8m',
        areaSqM: 30.2,
        features: ['Arabescato Marble', 'Sea-Facing French Windows'],
        position3D: [0.9, 0.25, 0.8]
      },
      {
        id: 'bedroom',
        name: 'Master Bedroom',
        dimensions: '4.4m × 4.6m',
        areaSqM: 20.2,
        features: ['Hardwood Teak', 'Walk-in Wardrobe'],
        position3D: [-1.2, 0.25, -0.6]
      },
      {
        id: 'kitchen',
        name: 'Gourmet Kitchen',
        dimensions: '3.4m × 3.8m',
        areaSqM: 12.9,
        features: ['Granite Island', 'Direct Utility Balcony'],
        position3D: [1.3, 0.25, -0.7]
      },
      {
        id: 'balcony',
        name: 'Sea-View Balcony',
        dimensions: '2.2m × 4.5m',
        areaSqM: 9.9,
        features: ['Acoustic Safety Glass', 'Arabian Sea Vista'],
        position3D: [-1.8, 0.25, 1.1]
      }
    ],
    buildingProfile: {
      footprintAreaSqM: 850,
      heightMeters: 74.0,
      floorsCount: 22,
      unitsPerFloor: 2,
      yearBuilt: 2021,
      structureType: 'Composite Steel-Concrete (Wind Damped)'
    }
  },
  {
    id: 'prop-blr-03',
    ownerName: 'Rohan Verma',
    propertyType: 'Apartment (Flat)',
    city: 'Bengaluru',
    state: 'Karnataka',
    country: 'India',
    locality: 'Koramangala 4th Block',
    buildingName: 'Tech Ridge Heights',
    floor: '5th Floor',
    floorNumber: 5,
    unitNumber: 'Unit 504',
    totalFloors: 16,
    builtUpArea: 142.0,
    carpetArea: 115.0,
    undividedLandShare: 35.1,
    propertyId3D: '3D-BLR-APT-0504-0112',
    ulpinStandard14: 'IN-KA-BLR-007831',
    ulpin3D: 'IN-KA-BLR-0783-BLD02-FL05-U504',
    status: 'Verified (Demo)',
    verifiedDate: '22 Aug 2025',
    coordinates: {
      latitude: 12.9352,
      longitude: 77.6245,
      altitudeAMSL: 920,
      heightAGL: 19.5
    },
    cadastreDetails: {
      surveyNumber: '88/4',
      subDivision: 'C-11',
      wardNumber: 'Ward 151 (Koramangala)',
      municipalZone: 'BBMP South',
      titleDeedNumber: 'DOC-KA-BLR-2024-3019',
      registrationYear: 2024,
      landUseZone: 'IT Corridor Mixed Residential'
    },
    rooms: [
      {
        id: 'living',
        name: 'Living Room',
        dimensions: '5.5m × 6.0m',
        areaSqM: 33.0,
        features: ['Smart Home Automation', 'Vitrified Glazed Tiles'],
        position3D: [0.9, 0.25, 0.8]
      },
      {
        id: 'bedroom',
        name: 'Master Suite',
        dimensions: '4.6m × 4.8m',
        areaSqM: 22.1,
        features: ['Laminated Wooden Flooring', 'Workstation Nook'],
        position3D: [-1.2, 0.25, -0.6]
      },
      {
        id: 'kitchen',
        name: 'Kitchen',
        dimensions: '3.6m × 4.0m',
        areaSqM: 14.4,
        features: ['Granite Platform', 'Piped Gas'],
        position3D: [1.3, 0.25, -0.7]
      },
      {
        id: 'balcony',
        name: 'Terrace Garden',
        dimensions: '2.5m × 4.2m',
        areaSqM: 10.5,
        features: ['Planter Troughs', 'Drip Irrigation Outlets'],
        position3D: [-1.8, 0.25, 1.1]
      }
    ],
    buildingProfile: {
      footprintAreaSqM: 740,
      heightMeters: 55.0,
      floorsCount: 16,
      unitsPerFloor: 4,
      yearBuilt: 2023,
      structureType: 'RCC Framed Post-Tensioned Slabs'
    }
  },
  {
    id: 'prop-del-04',
    ownerName: 'Vikram Malhotra',
    propertyType: 'Penthouse',
    city: 'New Delhi',
    state: 'Delhi',
    country: 'India',
    locality: 'Vasant Kunj Sector C',
    buildingName: 'Grand Imperial Suites',
    floor: '12th Floor (Penthouse)',
    floorNumber: 12,
    unitNumber: 'PH 1201',
    totalFloors: 12,
    builtUpArea: 210.5,
    carpetArea: 172.0,
    undividedLandShare: 52.8,
    propertyId3D: '3D-DEL-PNT-1201-0003',
    ulpinStandard14: 'IN-DL-SWD-001552',
    ulpin3D: 'IN-DL-SWD-0155-BLD07-FL12-P1201',
    status: 'Verified (Demo)',
    verifiedDate: '03 Feb 2026',
    coordinates: {
      latitude: 28.5244,
      longitude: 77.1578,
      altitudeAMSL: 265,
      heightAGL: 42.0
    },
    cadastreDetails: {
      surveyNumber: '204/1',
      subDivision: 'PH-A',
      wardNumber: 'Ward 48 (Mehrauli)',
      municipalZone: 'MCD South Zone',
      titleDeedNumber: 'DOC-DL-DEL-2023-8821',
      registrationYear: 2023,
      landUseZone: 'DDA Special Residential Low Density'
    },
    rooms: [
      {
        id: 'living',
        name: 'Grand Salon',
        dimensions: '7.0m × 7.5m',
        areaSqM: 52.5,
        features: ['Double Height Ceiling', 'Panoramic Ridge Views'],
        position3D: [0.9, 0.25, 0.8]
      },
      {
        id: 'bedroom',
        name: 'Presidential Suite',
        dimensions: '5.2m × 5.5m',
        areaSqM: 28.6,
        features: ['Private Jacuzzi Access', 'Walk-in Dressing Room'],
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
        features: ['Glass Floor Section', 'Rooftop Lounge Integration'],
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
    id: 'prop-hyd-05',
    ownerName: 'Ananya Iyer',
    propertyType: 'Apartment (Flat)',
    city: 'Hyderabad',
    state: 'Telangana',
    country: 'India',
    locality: 'Hitec City / Madhapur',
    buildingName: 'Cyber Towers Enclave',
    floor: '4th Floor',
    floorNumber: 4,
    unitNumber: 'Unit 403',
    totalFloors: 18,
    builtUpArea: 104.8,
    carpetArea: 86.4,
    undividedLandShare: 26.5,
    propertyId3D: '3D-HYD-APT-0403-0078',
    ulpinStandard14: 'IN-TG-HYD-005128',
    ulpin3D: 'IN-TG-HYD-0512-BLD03-FL04-U403',
    status: 'Verified (Demo)',
    verifiedDate: '18 Dec 2025',
    coordinates: {
      latitude: 17.4435,
      longitude: 78.3772,
      altitudeAMSL: 542,
      heightAGL: 16.0
    },
    cadastreDetails: {
      surveyNumber: '64/2',
      subDivision: 'B-09',
      wardNumber: 'Ward 108 (Gachibowli)',
      municipalZone: 'GHMC West Zone',
      titleDeedNumber: 'DOC-TG-HYD-2024-1104',
      registrationYear: 2024,
      landUseZone: 'GHMC Commercial & High-Rise Zone'
    },
    rooms: [
      {
        id: 'living',
        name: 'Living Room',
        dimensions: '5.0m × 5.2m',
        areaSqM: 26.0,
        features: ['Granite Border Tiles', 'Dual-Aspect Natural Daylight'],
        position3D: [0.9, 0.25, 0.8]
      },
      {
        id: 'bedroom',
        name: 'Master Bedroom',
        dimensions: '4.2m × 4.4m',
        areaSqM: 18.5,
        features: ['Sound-Proof Acoustic Glazing', 'Wardrobe Wall'],
        position3D: [-1.2, 0.25, -0.6]
      },
      {
        id: 'kitchen',
        name: 'Kitchen',
        dimensions: '3.0m × 3.5m',
        areaSqM: 10.5,
        features: ['Utility Wash Area', 'Chimney Ducting'],
        position3D: [1.3, 0.25, -0.7]
      },
      {
        id: 'balcony',
        name: 'Balcony',
        dimensions: '1.8m × 3.8m',
        areaSqM: 6.8,
        features: ['SS 304 Railing', 'City Boulevard View'],
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
