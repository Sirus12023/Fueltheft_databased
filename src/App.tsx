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
  const [loadingProgress, setLoadingProgress] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
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

    setError(null);
    setLoading(true);
    setLoadingProgress('Loading summary...');

    // Load data from Vercel Blob Storage
    const sensorReadingsUrl = process.env.REACT_APP_SENSOR_READINGS_URL || 'https://65c5ztl9veaifav1.public.blob.vercel-storage.com/sensor-readings.json';
    const summaryUrl = process.env.REACT_APP_SUMMARY_URL || 'https://65c5ztl9veaifav1.public.blob.vercel-storage.com/summary.json';
    
    console.log('Fetching data from:', { sensorReadingsUrl, summaryUrl });
    
    // First load summary (small file)
    fetch(summaryUrl)
      .then(res => {
        if (!res.ok) {
          throw new Error(`Failed to fetch summary: ${res.status} ${res.statusText}`);
        }
        return res.json();
      })
      .then(summaryData => {
        console.log('Summary loaded:', summaryData);
        setSummary(summaryData);
        
        // Set default date range to show ALL available data
        const minDate = new Date(summaryData.dateRange.min);
        const maxDate = new Date(summaryData.dateRange.max);
        setStartDate(minDate);
        setEndDate(maxDate);
        
        // Select all sensors by default
        setSelectedSensorIds(summaryData.uniqueSensorIds);
        
        // Now load sensor readings - use regular fetch (browser handles large files)
        setLoadingProgress('Loading sensor readings (this may take a moment for large datasets)...');
        
        // Add timeout to prevent hanging
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minute timeout
        
        return fetch(sensorReadingsUrl, { 
          signal: controller.signal,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          mode: 'cors', // Explicitly enable CORS
        })
          .then(async res => {
            clearTimeout(timeoutId);
            if (!res.ok) {
              throw new Error(`Failed to fetch sensor readings: ${res.status} ${res.statusText}`);
            }
            
            // Check content type
            const contentType = res.headers.get('content-type');
            if (contentType && !contentType.includes('application/json')) {
              console.warn('Unexpected content type:', contentType);
            }
            
            setLoadingProgress('Parsing JSON data...');
            
            // Get the text first to check for issues
            const text = await res.text();
            console.log('Response length:', text.length, 'First 500 chars:', text.substring(0, 500));
            
            // Check for common corruption patterns
            if (text.includes(',git')) {
              console.warn('Found ",git" in response, cleaning...');
              const cleaned = text.replace(/,git\s*\n/g, ',\n');
              return JSON.parse(cleaned);
            }
            
            // Try parsing the JSON
            try {
              return JSON.parse(text);
            } catch (parseError) {
              console.error('JSON parse error at position:', parseError instanceof SyntaxError ? (parseError as SyntaxError).message : parseError);
              // Log the problematic area
              const errorPos = parseError instanceof SyntaxError && (parseError as any).message?.match(/position (\d+)/);
              if (errorPos) {
                const pos = parseInt(errorPos[1]);
                const start = Math.max(0, pos - 50);
                const end = Math.min(text.length, pos + 50);
                console.error('Problematic area:', text.substring(start, end));
              }
              throw parseError;
            }
          })
          .then(readingsData => {
            if (!Array.isArray(readingsData)) {
              throw new Error('Sensor readings data is not in the expected format (expected array)');
            }
            
            console.log(`Successfully loaded ${readingsData.length} readings`);
            setReadings(readingsData);
            setLoading(false);
            setLoadingProgress('');
            setError(null);
          })
          .catch(err => {
            clearTimeout(timeoutId);
            console.error('Error loading sensor readings:', err);
            
            if (err.name === 'AbortError') {
              throw new Error('Request timed out. The file might be too large. Please try again or contact support.');
            }
            
            if (err instanceof SyntaxError) {
              throw new Error(`JSON parsing error: ${err.message}. The data file might be corrupted or invalid.`);
            }
            
            throw new Error(`Failed to load sensor readings: ${err.message || 'Unknown error'}`);
          });
      })
      .catch(err => {
        console.error('Error loading data:', err);
        setError(err.message || 'Failed to load data. Please check the console for details.');
        setLoading(false);
        setLoadingProgress('');
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
        <div className="loading-spinner">
          <div>Loading sensor data...</div>
          {loadingProgress && <div style={{ marginTop: '1rem', fontSize: '0.9rem', opacity: 0.8 }}>{loadingProgress}</div>}
        </div>
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
      
      {error && (
        <div className="error-banner">
          <strong>Error:</strong> {error}
          <button onClick={() => window.location.reload()} className="retry-button">
            Retry
          </button>
        </div>
      )}
      
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
