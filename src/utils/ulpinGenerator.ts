/**
 * 3D ULPIN (Unique Land Parcel Identification Number) / 3D Bhu-Aadhaar
 * 
 * Standard 2D ULPIN:
 * - 14-digit alphanumeric string based on parcel centroid coordinates (ISO 19152 LADM standard adopted by DoLR).
 * 
 * 3D Extension for Vertical Cadastre:
 * - Solves the multi-owner / vertical property rights problem in high-rise buildings where multiple units
 *   share the same 2D footprint.
 * - Structure: [State]-[Dist]-[Centroid-Hash]-[BuildingID]-[FloorLevel]-[UnitID]
 *   Example: IN-MH-PUN-0428-BLD04-FL03-U301
 */

export interface UlpinComponents {
  countryCode: string; // "IN"
  stateCode: string;   // "MH"
  districtCode: string;// "PUN"
  geoCentroidHash: string; // "0428"
  buildingBlock: string;   // "BLD04"
  floorLevel: string;      // "FL03"
  unitId: string;          // "U301"
  altitudeRangeAMSL: string; // "582m-585m"
}

export function parseUlpin3D(ulpin: string): Partial<UlpinComponents> {
  const parts = ulpin.split('-');
  if (parts.length >= 6) {
    return {
      countryCode: parts[0],
      stateCode: parts[1],
      districtCode: parts[2],
      geoCentroidHash: parts[3],
      buildingBlock: parts[4],
      floorLevel: parts[5],
      unitId: parts[6]
    };
  }
  return {};
}

export function generateSample3DUlpin(
  stateCode: string,
  cityCode: string,
  lat: number,
  lon: number,
  floorNum: number,
  unitNum: string
): string {
  // Simple deterministic hash of coordinates for demo cadastre
  const latHash = Math.abs(Math.round(lat * 100)).toString().slice(-2);
  const lonHash = Math.abs(Math.round(lon * 100)).toString().slice(-2);
  const geoHash = `${latHash}${lonHash}`;
  const floorStr = `FL${floorNum.toString().padStart(2, '0')}`;
  const cleanUnit = unitNum.replace(/[^a-zA-Z0-9]/g, '');

  return `IN-${stateCode.toUpperCase()}-${cityCode.toUpperCase()}-${geoHash}-BLD01-${floorStr}-${cleanUnit}`;
}
