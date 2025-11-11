import React, { useState, useEffect, useMemo } from 'react';
import { SensorReading, SensorSummary, ParsedReading } from './types';
import { parseReading } from './utils/parseData';
import { authenticate, isAuthenticated, setAuthenticated, logout } from './utils/auth';
import MapView from './components/MapView';
import FilterPanel from './components/FilterPanel';
import DetailsPanel from './components/DetailsPanel';
import Login from './components/Login';
import './App.css';

function App() {
  const [authenticated, setAuthState] = useState(false);
  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [summary, setSummary] = useState<SensorSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSensorIds, setSelectedSensorIds] = useState<string[]>([]);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [selectedReading, setSelectedReading] = useState<ParsedReading | null>(null);
  const [showPath, setShowPath] = useState(false);

  // Check authentication on mount
  useEffect(() => {
    setAuthState(isAuthenticated());
  }, []);

  const handleLogin = (username: string, password: string): boolean => {
    const success = authenticate(username, password);
    if (success) {
      setAuthenticated(true);
      setAuthState(true);
    }
    return success;
  };

  useEffect(() => {
    // Only load data if authenticated
    if (!authenticated) {
      setLoading(false);
      return;
    }

    // Load data from Vercel Blob Storage
    const sensorReadingsUrl = process.env.REACT_APP_SENSOR_READINGS_URL || 'https://65c5ztl9veaifav1.public.blob.vercel-storage.com/sensor-readings.json';
    const summaryUrl = process.env.REACT_APP_SUMMARY_URL || 'https://65c5ztl9veaifav1.public.blob.vercel-storage.com/summary.json';
    
    Promise.all([
      fetch(sensorReadingsUrl).then(res => res.json()),
      fetch(summaryUrl).then(res => res.json()),
    ]).then(([readingsData, summaryData]) => {
      setReadings(readingsData);
      setSummary(summaryData);
      
      // Set default date range to show ALL available data
      const minDate = new Date(summaryData.dateRange.min);
      const maxDate = new Date(summaryData.dateRange.max);
      setStartDate(minDate);
      setEndDate(maxDate);
      
      // Select all sensors by default
      setSelectedSensorIds(summaryData.uniqueSensorIds);
      
      setLoading(false);
    }).catch(err => {
      console.error('Error loading data:', err);
      setLoading(false);
    });
  }, [authenticated]);

  // Filter and parse readings
  const filteredReadings = useMemo(() => {
    return readings
      .filter(reading => {
        // Filter by sensor
        if (selectedSensorIds.length > 0 && !selectedSensorIds.includes(reading.sensorId)) {
          return false;
        }
        
        // Filter by date - compare only date part, not time
        if (startDate || endDate) {
          const readingDate = new Date(reading.timestamp);
          const readingDateOnly = new Date(readingDate.getFullYear(), readingDate.getMonth(), readingDate.getDate());
          
          if (startDate) {
            const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
            if (readingDateOnly < startDateOnly) return false;
          }
          
          if (endDate) {
            const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
            if (readingDateOnly > endDateOnly) return false;
          }
        }
        
        // Only include readings with valid coordinates
        const parsed = parseReading(reading);
        return parsed.parsed.latitude !== null && parsed.parsed.longitude !== null;
      })
      .map(parseReading)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [readings, selectedSensorIds, startDate, endDate]);

  // Show login if not authenticated
  if (!authenticated) {
    return <Login onLogin={handleLogin} />;
  }

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner">Loading sensor data...</div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div>
            <h1>Fuel Sensor Data Visualization</h1>
            <p>Total Readings: {filteredReadings.length}</p>
          </div>
          <button onClick={logout} className="logout-button">
            Logout
          </button>
        </div>
      </header>
      
      <div className="app-content">
        <FilterPanel
          summary={summary}
          selectedSensorIds={selectedSensorIds}
          onSensorChange={setSelectedSensorIds}
          startDate={startDate}
          endDate={endDate}
          onStartDateChange={setStartDate}
          onEndDateChange={setEndDate}
          showPath={showPath}
          onShowPathChange={setShowPath}
        />
        
        <div className="map-container">
          <MapView
            readings={filteredReadings}
            onMarkerClick={setSelectedReading}
            showPath={showPath}
          />
        </div>
        
        {selectedReading && (
          <DetailsPanel
            reading={selectedReading}
            onClose={() => setSelectedReading(null)}
          />
        )}
      </div>
    </div>
  );
}

export default App;
