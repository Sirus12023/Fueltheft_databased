import React from 'react';
import DatePicker from 'react-datepicker';
import { SensorSummary } from '../types';
import { getSensorName } from '../utils/parseData';
import 'react-datepicker/dist/react-datepicker.css';
import './FilterPanel.css';

interface FilterPanelProps {
  summary: SensorSummary | null;
  selectedSensorIds: string[];
  onSensorChange: (ids: string[]) => void;
  startDate: Date | null;
  endDate: Date | null;
  onStartDateChange: (date: Date | null) => void;
  onEndDateChange: (date: Date | null) => void;
  showPath: boolean;
  onShowPathChange: (value: boolean) => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  summary,
  selectedSensorIds,
  onSensorChange,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  showPath,
  onShowPathChange,
}) => {
  const handleSensorToggle = (sensorId: string) => {
    if (selectedSensorIds.includes(sensorId)) {
      onSensorChange(selectedSensorIds.filter(id => id !== sensorId));
    } else {
      onSensorChange([...selectedSensorIds, sensorId]);
    }
  };

  const handleSelectAll = () => {
    if (summary) {
      onSensorChange(summary.uniqueSensorIds);
    }
  };

  const handleDeselectAll = () => {
    onSensorChange([]);
  };

  const handleShowAllData = () => {
    if (summary) {
      const minDate = new Date(summary.dateRange.min);
      const maxDate = new Date(summary.dateRange.max);
      onStartDateChange(minDate);
      onEndDateChange(maxDate);
    }
  };

  if (!summary) return null;

  // Get min and max dates from summary
  const minAvailableDate = new Date(summary.dateRange.min);
  const maxAvailableDate = new Date(summary.dateRange.max);

  return (
    <div className="filter-panel">
      <div className="filter-section">
        <h3>Filters</h3>
        
        <div className="filter-group">
          <label>Buses / Sensors</label>
          <div className="sensor-checkboxes">
            {summary.uniqueSensorIds.map(sensorId => (
              <label key={sensorId} className="sensor-checkbox">
                <input
                  type="checkbox"
                  checked={selectedSensorIds.includes(sensorId)}
                  onChange={() => handleSensorToggle(sensorId)}
                />
                <span>{getSensorName(sensorId)}</span>
                <span className="sensor-count">
                  ({summary.readingsBySensor[sensorId] || 0})
                </span>
              </label>
            ))}
          </div>
          <div className="sensor-actions">
            <button onClick={handleSelectAll} className="btn-link">Select All</button>
            <button onClick={handleDeselectAll} className="btn-link">Deselect All</button>
          </div>
        </div>

        <div className="filter-group">
          <label>Start Date</label>
          <DatePicker
            selected={startDate}
            onChange={onStartDateChange}
            selectsStart
            startDate={startDate}
            endDate={endDate}
            minDate={minAvailableDate}
            maxDate={endDate || maxAvailableDate}
            dateFormat="yyyy-MM-dd"
            className="date-picker"
            placeholderText="Select start date"
            isClearable
          />
        </div>

        <div className="filter-group">
          <label>End Date</label>
          <DatePicker
            selected={endDate}
            onChange={onEndDateChange}
            selectsEnd
            startDate={startDate}
            endDate={endDate}
            minDate={startDate || minAvailableDate}
            maxDate={maxAvailableDate}
            dateFormat="yyyy-MM-dd"
            className="date-picker"
            placeholderText="Select end date"
            isClearable
          />
        </div>

        <div className="filter-group">
          <label className="toggle-label">
            <input type="checkbox" checked={showPath} onChange={e => onShowPathChange(e.target.checked)} />
            <span>Show path (connect nearest points)</span>
          </label>
        </div>

        <div className="filter-group">
          <button onClick={handleShowAllData} className="btn-show-all">
            Show All Data
          </button>
        </div>

        <div className="filter-info">
          <p><strong>Available Date Range:</strong></p>
          <p>{new Date(summary.dateRange.min).toLocaleDateString()} - {new Date(summary.dateRange.max).toLocaleDateString()}</p>
          <p><strong>Total Readings:</strong> {summary.totalReadings.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
};

export default FilterPanel;

