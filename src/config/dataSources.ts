import { DataSourceMetadata } from '../types/geospatial';

export const DATA_SOURCE_REGISTRY: DataSourceMetadata[] = [
  {
    id: 'osm',
    name: 'OpenStreetMap',
    provider: 'OpenStreetMap Foundation (ODbL)',
    purpose: '2D Building Footprints & Vector Extrusions',
    dataType: 'GeoJSON Polygon Vector Data',
    status: 'CONNECTED',
    attribution: '© OpenStreetMap contributors',
    description: 'Active client-side GeoJSON ingestion of verified urban building polygons for Pune cadastre zones.',
    isOfficialGovt: false
  },
  {
    id: 'copernicus',
    name: 'Copernicus Sentinel-2',
    provider: 'European Space Agency (ESA) / Copernicus Data Space',
    purpose: 'Live Satellite Scene Telemetry & Area Coverage',
    dataType: 'OData REST / Multispectral Level-1C & 2A',
    status: 'CONNECTED',
    attribution: 'Copernicus Data Space Ecosystem (ESA)',
    description: 'Direct OData catalogue API integration retrieving live Sentinel-2 satellite acquisition dates and tile IDs over Pune.',
    isOfficialGovt: false
  },
  {
    id: 'bhuvan',
    name: 'Bhuvan / ISRO',
    provider: 'National Remote Sensing Centre (NRSC / ISRO)',
    purpose: 'Indian Geo-Platform Satellite WMS & Thematic Maps',
    dataType: 'OGC WMS / WMTS (bhuvan-vec2.nrsc.gov.in/bhuvan/wms)',
    status: 'NOT_INTEGRATED',
    attribution: 'ISRO Geo-Platform / NRSC, Government of India',
    description: 'Official WMS layer endpoint configured. NRSC servers currently require whitelisted network access or institutional API keys.',
    isOfficialGovt: true
  },
  {
    id: 'soi',
    name: 'Survey of India (SoI)',
    provider: 'Department of Science & Technology, GoI',
    purpose: 'National Cadastral & 3D City Mapping Guidelines',
    dataType: 'LADM ISO 19152 Spatial Schema (Reference)',
    status: 'REFERENCE',
    attribution: 'Survey of India, National Mapping Agency',
    description: 'Reference specifications for CORS GNSS network positioning, Large Scale Mapping, and drone surveys.',
    isOfficialGovt: true
  },
  {
    id: 'dem',
    name: 'SRTM / AW3D30 DEM',
    provider: 'NASA / JAXA Open Elevation',
    purpose: 'Ground Terrain Base Elevation Model (AMSL)',
    dataType: '30m Raster Grid Elevation (Demo/Estimated)',
    status: 'NOT_INTEGRATED',
    attribution: 'NASA / USGS / JAXA Earth Observation',
    description: 'Base terrain elevation estimated from local survey datum (~582m AMSL) until automated raster DEM pipeline is integrated.',
    isOfficialGovt: false
  },
  {
    id: 'lidar',
    name: 'Drone LiDAR Point Cloud',
    provider: 'Municipal Survey / Drone Survey Teams (Planned)',
    purpose: 'Centimeter-Accurate LOD3 Rooflines & Overhangs',
    dataType: 'LAS / LAZ Point Cloud / OGC 3D Tiles',
    status: 'PLANNED',
    attribution: 'Survey of India / PMC Urban Survey Drone Fleet',
    description: 'Planned LiDAR point cloud ingestion for centimeter-accurate architectural rooflines and eaves heights.',
    isOfficialGovt: true
  },
  {
    id: 'naksha',
    name: 'NAKSHA / Urban Cadastral GIS',
    provider: 'State Land Records & Municipal Corporation (PMC)',
    purpose: 'Cadastral Parcel Boundaries & Revenue Survey Lots',
    dataType: 'Cadastral Vector Polygons (Demo)',
    status: 'DEMO',
    attribution: 'Simulated Cadastral Layer (Prototype Research)',
    description: 'Cadastral parcel lots linking revenue land parcels (Survey No 42/1A) to 3D architectural plots.',
    isOfficialGovt: true
  },
  {
    id: 'floorplan',
    name: 'Architectural Floor Plan (BIM)',
    provider: 'Architectural CAD / Building Sanction Plan',
    purpose: 'Unit-level Room Geometries & Vertical Slices',
    dataType: 'BIM IFC / CAD Vector Geometry (Demo)',
    status: 'DEMO',
    attribution: 'Emerald Heights Architectural Sanction Drawing (Demo)',
    description: 'Provides interior carpet area, unit bounding volume, and vertical floor slab dimensions.',
    isOfficialGovt: false
  },
  {
    id: 'ownership',
    name: 'Cadastral Ownership Database',
    provider: 'Land Revenue Title Records (Bhoomi / Mahabhulekh)',
    purpose: 'Legal Title Registration & Citizen Ownership Linkage',
    dataType: 'Title Registry Records (Simulated)',
    status: 'SIMULATED',
    attribution: 'Simulated Cadastre Ownership Records (Prototype Research)',
    description: 'Simulated ownership records linking verified citizen identities to 3D ULPIN identifiers for hackathon testing.',
    isOfficialGovt: true
  }
];
