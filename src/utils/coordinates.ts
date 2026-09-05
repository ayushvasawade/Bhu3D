export function formatCoordinates(lat: number, lon: number): string {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lonDir = lon >= 0 ? 'E' : 'W';
  return `Lat: ${Math.abs(lat).toFixed(4)}° ${latDir}  Lon: ${Math.abs(lon).toFixed(4)}° ${lonDir}`;
}

export function formatAltitude(altMeters: number): string {
  if (altMeters >= 1000) {
    return `${(altMeters / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })} km`;
  }
  return `${Math.round(altMeters).toLocaleString()} m`;
}
