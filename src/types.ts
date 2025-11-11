export interface RawSensorData {
  state?: {
    reported?: {
      "1"?: number; // Ignition status (0=OFF, 1=ON)
      "16"?: number; // Odometer reading
      "21"?: number; // Speed (km/h)
      "25"?: number; // Fuel level raw
      "29"?: number;
      "66"?: number; // Device voltage (mV)
      "67"?: number; // Location data
      "68"?: number;
      "69"?: number; // Status code
      "86"?: number;
      "pr"?: number; // Park/run status
      "sp"?: number; // Speed
      "ts"?: number; // Timestamp (milliseconds)
      "181"?: number;
      "182"?: number;
      "200"?: number;
      "239"?: number;
      "240"?: number;
      "241"?: number; // Odometer
      "270"?: number;
      "465"?: number;
      "alt"?: number; // Altitude
      "ang"?: number; // Angle/bearing
      "evt"?: number; // Event code
      "sat"?: number; // Satellite count
      "latlng"?: string; // "lat,lng" format
    };
  };
}

export interface SensorReading {
  id: string;
  timestamp: string;
  fuelLevel: number | null;
  locationLat: number | null;
  locationLong: number | null;
  sensorId: string;
  deviceVoltage: number | null;
  ignitionStatus: string | null;
  speed: number | null;
  createdAt: string;
  raw: RawSensorData | null;
  topic: string | null;
  address: string | null;
  isOverSpeed: boolean | null;
  odometerKm: number | null;
  processed: boolean;
}

export interface ParsedReading extends SensorReading {
  parsed: {
    latitude: number | null;
    longitude: number | null;
    altitude: number | null;
    angle: number | null;
    satellites: number | null;
    odometer: number | null;
    speedFromRaw: number | null;
    ignition: boolean | null;
    eventCode: number | null;
    deviceVoltageRaw: number | null;
    timestampRaw: number | null;
  };
}

export interface SensorSummary {
  totalReadings: number;
  uniqueSensorIds: string[];
  dateRange: {
    min: string;
    max: string;
  };
  readingsBySensor: Record<string, number>;
}

