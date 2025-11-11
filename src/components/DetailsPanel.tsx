import React from 'react';
import { ParsedReading } from '../types';
import { getSensorName } from '../utils/parseData';
import './DetailsPanel.css';

interface DetailsPanelProps {
  reading: ParsedReading;
  onClose: () => void;
}

const DetailsPanel: React.FC<DetailsPanelProps> = ({ reading, onClose }) => {
  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'number') {
      return value.toFixed(2);
    }
    return String(value);
  };

  const rawData = reading.raw?.state?.reported || {};

  return (
    <div className="details-panel">
      <div className="details-header">
        <h2>Reading Details</h2>
        <button onClick={onClose} className="close-btn">×</button>
      </div>

      <div className="details-content">
        <div className="details-section">
          <h3>Basic Information</h3>
          <div className="details-grid">
            <div className="detail-item">
              <label>Sensor/Bus:</label>
              <span>{getSensorName(reading.sensorId)}</span>
            </div>
            <div className="detail-item">
              <label>Timestamp:</label>
              <span>{new Date(reading.timestamp).toLocaleString()}</span>
            </div>
            <div className="detail-item">
              <label>Created At:</label>
              <span>{new Date(reading.createdAt).toLocaleString()}</span>
            </div>
            <div className="detail-item">
              <label>Topic:</label>
              <span>{reading.topic || 'N/A'}</span>
            </div>
          </div>
        </div>

        <div className="details-section">
          <h3>Location Data</h3>
          <div className="details-grid">
            <div className="detail-item">
              <label>Latitude:</label>
              <span>{formatValue(reading.parsed.latitude)}</span>
            </div>
            <div className="detail-item">
              <label>Longitude:</label>
              <span>{formatValue(reading.parsed.longitude)}</span>
            </div>
            <div className="detail-item">
              <label>Altitude:</label>
              <span>{formatValue(reading.parsed.altitude)} m</span>
            </div>
            <div className="detail-item">
              <label>Angle/Bearing:</label>
              <span>{formatValue(reading.parsed.angle)}°</span>
            </div>
            <div className="detail-item">
              <label>Satellites:</label>
              <span>{formatValue(reading.parsed.satellites)}</span>
            </div>
          </div>
        </div>

        <div className="details-section">
          <h3>Vehicle Data</h3>
          <div className="details-grid">
            <div className="detail-item">
              <label>Speed:</label>
              <span>{formatValue(reading.parsed.speedFromRaw)} km/h</span>
            </div>
            <div className="detail-item">
              <label>Odometer:</label>
              <span>{formatValue(reading.parsed.odometer)} km</span>
            </div>
            <div className="detail-item">
              <label>Ignition:</label>
              <span>{reading.parsed.ignition ? 'ON' : 'OFF'}</span>
            </div>
            <div className="detail-item">
              <label>Fuel Level:</label>
              <span>{formatValue(reading.fuelLevel)}</span>
            </div>
            <div className="detail-item">
              <label>Over Speed:</label>
              <span>{reading.isOverSpeed ? 'Yes' : 'No'}</span>
            </div>
          </div>
        </div>

        <div className="details-section">
          <h3>Device Data</h3>
          <div className="details-grid">
            <div className="detail-item">
              <label>Device Voltage:</label>
              <span>{formatValue(reading.parsed.deviceVoltageRaw)} V</span>
            </div>
            <div className="detail-item">
              <label>Event Code:</label>
              <span>{formatValue(reading.parsed.eventCode)}</span>
            </div>
            <div className="detail-item">
              <label>Processed:</label>
              <span>{reading.processed ? 'Yes' : 'No'}</span>
            </div>
          </div>
        </div>

        {reading.raw && (
          <div className="details-section">
            <h3>Raw Data Fields</h3>
            <div className="raw-data">
              <pre>{JSON.stringify(rawData, null, 2)}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DetailsPanel;

