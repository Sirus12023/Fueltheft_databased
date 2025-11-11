import { SensorReading, ParsedReading } from '../types';

export function parseReading(reading: SensorReading): ParsedReading {
  const parsed: ParsedReading['parsed'] = {
    latitude: reading.locationLat,
    longitude: reading.locationLong,
    altitude: null,
    angle: null,
    satellites: null,
    odometer: reading.odometerKm,
    speedFromRaw: reading.speed,
    ignition: reading.ignitionStatus === 'ON',
    eventCode: null,
    deviceVoltageRaw: reading.deviceVoltage,
    timestampRaw: null,
  };

  // Extract data from raw JSON
  if (reading.raw?.state?.reported) {
    const reported = reading.raw.state.reported;

    // Parse latlng if available
    if (reported.latlng) {
      const [lat, lng] = reported.latlng.split(',').map(Number);
      if (!isNaN(lat) && !isNaN(lng)) {
        parsed.latitude = lat;
        parsed.longitude = lng;
      }
    }

    // Use locationLat/locationLong if latlng not available
    if (parsed.latitude === null) {
      parsed.latitude = reading.locationLat;
    }
    if (parsed.longitude === null) {
      parsed.longitude = reading.locationLong;
    }

    // Extract other fields
    parsed.altitude = reported.alt ?? null;
    parsed.angle = reported.ang ?? null;
    parsed.satellites = reported.sat ?? null;
    parsed.odometer = reported["16"] ? reported["16"] / 1000 : (reported["241"] ?? parsed.odometer);
    parsed.speedFromRaw = reported["21"] ?? reported.sp ?? parsed.speedFromRaw;
    parsed.ignition = reported["1"] === 1 ? true : (reported["1"] === 0 ? false : parsed.ignition);
    parsed.eventCode = reported.evt ?? null;
    parsed.deviceVoltageRaw = reported["66"] ? reported["66"] / 1000 : parsed.deviceVoltageRaw;
    parsed.timestampRaw = reported.ts ?? null;
  }

  return {
    ...reading,
    parsed,
  };
}

export function getSensorColor(sensorId: string): string {
  const colors: Record<string, string> = {
    '6e64a7d7-c85a-4aa9-8cbe-93dfa5884b7e': '#FF6B6B', // Red
    'e7fc8e4a-76e0-4f9a-8a39-b18449e0b0e4': '#4ECDC4', // Teal
    '7b04ce31-c08c-46a7-8438-4665d0435e54': '#95E1D3', // Green
  };
  return colors[sensorId] || '#95A5A6';
}

export function getSensorName(sensorId: string): string {
  const names: Record<string, string> = {
    '6e64a7d7-c85a-4aa9-8cbe-93dfa5884b7e': 'Bus 1 (353691842778101)',
    'e7fc8e4a-76e0-4f9a-8a39-b18449e0b0e4': 'Bus 2 (353691844371830)',
    '7b04ce31-c08c-46a7-8438-4665d0435e54': 'Bus 3 (353691844382142)',
  };
  return names[sensorId] || sensorId;
}

