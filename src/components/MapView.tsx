import React, { useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.markercluster';
import { ParsedReading } from '../types';
import { getSensorColor, getSensorName } from '../utils/parseData';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import './MapView.css';

// Fix for default marker icons in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapViewProps {
  readings: ParsedReading[];
  onMarkerClick: (reading: ParsedReading) => void;
  showPath: boolean;
}

// Component to auto-fit map bounds
function MapBounds({ readings }: { readings: ParsedReading[] }) {
  const map = useMap();

  useEffect(() => {
    if (readings.length > 0) {
      const validReadings = readings.filter(
        r => r.parsed.latitude !== null && r.parsed.longitude !== null
      );

      if (validReadings.length > 0) {
        const bounds = L.latLngBounds(
          validReadings.map(r => [r.parsed.latitude!, r.parsed.longitude!])
        );
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [readings, map]);

  return null;
}

// Component to handle marker clustering
function MarkerCluster({ readings, onMarkerClick }: { readings: ParsedReading[]; onMarkerClick: (reading: ParsedReading) => void }) {
  const map = useMap();
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);

  useEffect(() => {
    // Remove existing cluster group
    if (clusterGroupRef.current) {
      map.removeLayer(clusterGroupRef.current);
      clusterGroupRef.current = null;
    }

    // Create new marker cluster group
    const markerClusterGroup = L.markerClusterGroup({
      maxClusterRadius: 50,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      chunkedLoading: true,
      chunkInterval: 200,
    });

    // Sample markers to improve performance
    // Show every Nth marker based on total count
    const sampleRate = readings.length > 10000 ? 15 : readings.length > 5000 ? 8 : readings.length > 2000 ? 4 : 1;
    const sampledReadings = readings.filter((_, index) => index % sampleRate === 0);

    // Create a lookup map for quick access
    const readingMap = new Map<string, ParsedReading>();
    sampledReadings.forEach(reading => {
      readingMap.set(reading.id, reading);
    });

    sampledReadings.forEach(reading => {
      if (reading.parsed.latitude === null || reading.parsed.longitude === null) {
        return;
      }

      const customIcon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="font-size: 30px; line-height: 30px; filter: drop-shadow(0 2px 2px rgba(0,0,0,0.4)) drop-shadow(0 0 2px #fff);">📍</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 30],
      });

      const marker = L.marker([reading.parsed.latitude, reading.parsed.longitude], { icon: customIcon });
      
      const popupContent = `
        <div class="marker-popup">
          <h4>${getSensorName(reading.sensorId)}</h4>
          <p><strong>Time:</strong> ${new Date(reading.timestamp).toLocaleString()}</p>
          ${reading.parsed.speedFromRaw !== null ? `<p><strong>Speed:</strong> ${reading.parsed.speedFromRaw} km/h</p>` : ''}
          ${reading.parsed.odometer !== null ? `<p><strong>Odometer:</strong> ${reading.parsed.odometer.toFixed(2)} km</p>` : ''}
          <p><strong>Ignition:</strong> ${reading.parsed.ignition ? 'ON' : 'OFF'}</p>
          <button class="popup-details-btn" data-reading-id="${reading.id}" style="margin-top: 0.5rem; padding: 0.4rem 0.8rem; background: #667eea; color: white; border: none; border-radius: 4px; cursor: pointer; width: 100%;">View Details</button>
        </div>
      `;

      marker.bindPopup(popupContent);

      marker.on('click', () => {
        onMarkerClick(reading);
      });

      markerClusterGroup.addLayer(marker);
    });

    // Handle popup button clicks
    markerClusterGroup.on('popupopen', (e) => {
      const popup = e.popup;
      const button = popup.getElement()?.querySelector('.popup-details-btn');
      if (button) {
        button.addEventListener('click', () => {
          const readingId = button.getAttribute('data-reading-id');
          if (readingId) {
            const reading = readingMap.get(readingId);
            if (reading) {
              onMarkerClick(reading);
            }
          }
        });
      }
    });

    map.addLayer(markerClusterGroup);
    clusterGroupRef.current = markerClusterGroup;

    return () => {
      if (clusterGroupRef.current) {
        map.removeLayer(clusterGroupRef.current);
        clusterGroupRef.current = null;
      }
    };
  }, [readings, map, onMarkerClick]);

  return null;
}

const MapView: React.FC<MapViewProps> = ({ readings, onMarkerClick, showPath }) => {
  // Group readings by sensor ID for route paths
  const readingsBySensor = useMemo(() => {
    return readings.reduce((acc, reading) => {
      if (!acc[reading.sensorId]) {
        acc[reading.sensorId] = [];
      }
      acc[reading.sensorId].push(reading);
      return acc;
    }, {} as Record<string, ParsedReading[]>);
  }, [readings]);

  // Build chronological (timestamp-ordered) paths per sensor (sampled for performance)
  const chronoPaths = useMemo(() => {
    if (!showPath) return [] as Array<{ sensorId: string; positions: [number, number][]; color: string }>;
    return Object.entries(readingsBySensor).map(([sensorId, sensorReadings]) => {
      const validReadings = sensorReadings
        .filter(r => r.parsed.latitude !== null && r.parsed.longitude !== null)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      if (validReadings.length < 2) return null;
      // sample for performance but preserve order
      const sampleRate = validReadings.length > 3000 ? 20 : validReadings.length > 1000 ? 10 : 5;
      const sampled = validReadings.filter((_, idx) => idx % sampleRate === 0 || idx === validReadings.length - 1);
      const positions = sampled.map(r => [r.parsed.latitude!, r.parsed.longitude!] as [number, number]);
      return { sensorId, positions, color: getSensorColor(sensorId) };
    }).filter(Boolean) as Array<{ sensorId: string; positions: [number, number][]; color: string }>;
  }, [readingsBySensor, showPath]);

  // Default center (India - approximate center)
  const defaultCenter: [number, number] = [26.8600, 80.9300];
  const defaultZoom = 12;

  return (
    <MapContainer
      center={defaultCenter}
      zoom={defaultZoom}
      style={{ height: '100%', width: '100%' }}
      preferCanvas={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapBounds readings={readings} />

      {/* Draw chronological paths only if enabled */}
      {showPath && chronoPaths.map(({ sensorId, positions, color }) => (
        <Polyline
          key={`path-${sensorId}`}
          positions={positions}
          color={color}
          weight={3}
          opacity={0.6}
        />
      ))}

      {/* Use marker clustering for better performance */}
      <MarkerCluster readings={readings} onMarkerClick={onMarkerClick} />
    </MapContainer>
  );
};

export default MapView;
