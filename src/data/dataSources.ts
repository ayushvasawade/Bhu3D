import { DataSourceItem } from '../types/property';

export const DATA_SOURCES: DataSourceItem[] = [
  {
    id: 'osm',
    name: 'OpenStreetMap',
    role: 'Building Footprints',
    description: 'Provides 2D vector polygonal building perimeters, tags, and spatial outlines for urban LOD1/LOD2 modeling.',
    provider: 'OpenStreetMap Foundation / ODbL',
    badge: 'Vector Footprints',
    iconType: 'osm',
    isOfficialGovt: false
  },
  {
    id: 'bhuvan',
    name: 'Bhuvan (ISRO)',
    role: 'Satellite Imagery',
    description: 'Indian Geo-Platform of ISRO providing multi-resolution optical ortho-rectified satellite imagery and base maps.',
    provider: 'National Remote Sensing Centre (NRSC / ISRO)',
    badge: 'Govt Satellite',
    iconType: 'isro',
    isOfficialGovt: true
  },
  {
    id: 'srtm',
    name: 'SRTM DEM',
    role: 'Elevation Data',
    description: 'Shuttle Radar Topography Mission digital elevation model used to derive true base ground elevation (AMSL) for 3D extrusion.',
    provider: 'NASA / USGS Open Geospatial',
    badge: 'Terrain Z-Axis',
    iconType: 'srtm',
    isOfficialGovt: false
  },
  {
    id: 'soi',
    name: 'Survey of India (Specc)',
    role: '3D Mapping Guidelines',
    description: 'National Mapping Agency technical specifications for drone LiDAR surveys, 3D city models, and CORS network positioning.',
    provider: 'Department of Science & Technology, GoI',
    badge: 'National Cadastre',
    iconType: 'soi',
    isOfficialGovt: true
  },
  {
    id: 'floorplan',
    name: 'Sample Floor Plan',
    role: 'Apartment Layout (Demo)',
    description: 'Architectural BIM/CAD floor plan cutaway providing unit-level room geometries, carpet vs built-up area, and vertical slice bounds.',
    provider: 'Open Architectural CAD Repository (Demo)',
    badge: '3D Unit BIM',
    iconType: 'cad',
    isOfficialGovt: false
  }
];
