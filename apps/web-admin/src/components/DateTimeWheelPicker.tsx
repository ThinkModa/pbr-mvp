import React, { useState } from 'react';
import DateWheelPicker from './DateWheelPicker';
import TimeWheelPicker from './TimeWheelPicker';

interface DateTimeWheelPickerProps {
  dateValue: string; // YYYY-MM-DD format
  timeValue: string; // HH:MM format
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
  disabled?: boolean;
  showTime?: boolean;
  timeFormat?: '12h' | '24h';
}

const DateTimeWheelPicker: React.FC<DateTimeWheelPickerProps> = ({
  dateValue,
  timeValue,
  onDateChange,
  onTimeChange,
  disabled = false,
  showTime = true,
  timeFormat = '12h'
}) => {
  const [activeTab, setActiveTab] = useState<'date' | 'time'>('date');

  return (
    <div style={{
      border: '1px solid #D1D5DB',
      borderRadius: '8px',
      backgroundColor: 'white',
      overflow: 'hidden'
    }}>
      {/* Tab Headers */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #E5E7EB'
      }}>
        <button
          type="button"
          onClick={() => setActiveTab('date')}
          disabled={disabled}
          style={{
            flex: 1,
            padding: '8px 12px',
            border: 'none',
            backgroundColor: activeTab === 'date' ? '#F3F4F6' : 'transparent',
            color: activeTab === 'date' ? '#1F2937' : '#6B7280',
            fontWeight: activeTab === 'date' ? '600' : '400',
            cursor: disabled ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            fontSize: '13px'
          }}
        >
          Date
        </button>
        {showTime && (
          <button
            type="button"
            onClick={() => setActiveTab('time')}
            disabled={disabled}
            style={{
              flex: 1,
              padding: '8px 12px',
              border: 'none',
              backgroundColor: activeTab === 'time' ? '#F3F4F6' : 'transparent',
              color: activeTab === 'time' ? '#1F2937' : '#6B7280',
              fontWeight: activeTab === 'time' ? '600' : '400',
              cursor: disabled ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              fontSize: '13px'
            }}
          >
            Time
          </button>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '12px' }}>
        {activeTab === 'date' && (
          <DateWheelPicker
            value={dateValue}
            onChange={onDateChange}
            disabled={disabled}
          />
        )}
        {activeTab === 'time' && showTime && (
          <TimeWheelPicker
            value={timeValue}
            onChange={onTimeChange}
            format={timeFormat}
            disabled={disabled}
          />
        )}
      </div>
    </div>
  );
};

export default DateTimeWheelPicker;
