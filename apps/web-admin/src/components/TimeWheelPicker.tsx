import React, { useState, useEffect } from 'react';
import WheelPicker from './WheelPicker';

interface TimeWheelPickerProps {
  value: string; // HH:MM format (24-hour) or HH:MM AM/PM format (12-hour)
  onChange: (time: string) => void;
  format?: '12h' | '24h';
  disabled?: boolean;
}

const TimeWheelPicker: React.FC<TimeWheelPickerProps> = ({
  value,
  onChange,
  format = '12h',
  disabled = false
}) => {
  // Initialize arrays immediately to prevent empty arrays being passed to WheelPicker
  const [hours, setHours] = useState<string[]>(() => {
    const hourList: string[] = [];
    if (format === '12h') {
      for (let i = 1; i <= 12; i++) {
        hourList.push(i.toString().padStart(2, '0'));
      }
    } else {
      for (let i = 0; i <= 23; i++) {
        hourList.push(i.toString().padStart(2, '0'));
      }
    }
    return hourList;
  });
  const [minutes, setMinutes] = useState<string[]>(() => {
    const minuteList: string[] = [];
    for (let i = 0; i <= 59; i++) {
      minuteList.push(i.toString().padStart(2, '0'));
    }
    return minuteList;
  });
  const [amPmOptions] = useState(['AM', 'PM']);
  
  // Debug log AM/PM options
  useEffect(() => {
    console.log('⏰ TimeWheelPicker: AM/PM options:', amPmOptions);
  }, [amPmOptions]);
  const [selectedHour, setSelectedHour] = useState('12');
  const [selectedMinute, setSelectedMinute] = useState('00');
  const [selectedAmPm, setSelectedAmPm] = useState('AM');

  // Initialize time from value
  useEffect(() => {
    if (value) {
      parseTimeValue(value);
    }
  }, [value, format]);

  // Arrays are now initialized immediately in useState, no need for useEffect

  const parseTimeValue = (timeString: string) => {
    if (!timeString) return;

    // Handle different time formats
    let hour: number, minute: number, amPm: string = 'AM';

    if (format === '12h') {
      // Parse 12-hour format (e.g., "2:30 PM" or "14:30")
      const match = timeString.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
      if (match) {
        hour = parseInt(match[1]);
        minute = parseInt(match[2]);
        amPm = match[3]?.toUpperCase() || 'AM';
        
        // Convert 24-hour to 12-hour if needed
        if (hour > 12) {
          hour = hour - 12;
          amPm = 'PM';
        } else if (hour === 0) {
          hour = 12;
          amPm = 'AM';
        } else if (hour === 12) {
          amPm = 'PM';
        }
      }
    } else {
      // Parse 24-hour format (e.g., "14:30")
      const match = timeString.match(/(\d{1,2}):(\d{2})/);
      if (match) {
        hour = parseInt(match[1]);
        minute = parseInt(match[2]);
      }
    }

    if (hour !== undefined && minute !== undefined) {
      setSelectedHour(hour.toString());
      setSelectedMinute(minute.toString().padStart(2, '0'));
      if (format === '12h') {
        setSelectedAmPm(amPm);
      }
    }
  };

  const handleHourChange = (hour: string) => {
    setSelectedHour(hour);
    updateParent(hour, selectedMinute, selectedAmPm);
  };

  const handleMinuteChange = (minute: string) => {
    setSelectedMinute(minute);
    updateParent(selectedHour, minute, selectedAmPm);
  };

  const handleAmPmChange = (amPm: string) => {
    setSelectedAmPm(amPm);
    updateParent(selectedHour, selectedMinute, amPm);
  };

  const updateParent = (hour: string, minute: string, amPm: string) => {
    let timeString: string;

    if (format === '12h') {
      timeString = `${hour}:${minute} ${amPm}`;
    } else {
      // Convert 12-hour to 24-hour format
      let hour24 = parseInt(hour);
      if (amPm === 'PM' && hour24 !== 12) {
        hour24 += 12;
      } else if (amPm === 'AM' && hour24 === 12) {
        hour24 = 0;
      }
      timeString = `${hour24.toString().padStart(2, '0')}:${minute}`;
    }

    onChange(timeString);
  };

  return (
    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
      {/* Hour Picker */}
      <div style={{ flex: 0.5, minWidth: '50px' }}>
        <WheelPicker
          items={hours}
          value={selectedHour}
          onChange={handleHourChange}
          height={80}
          itemHeight={40}
          disabled={disabled}
        />
      </div>

      {/* Minute Picker */}
      <div style={{ flex: 0.5, minWidth: '50px' }}>
        <WheelPicker
          items={minutes}
          value={selectedMinute}
          onChange={handleMinuteChange}
          height={80}
          itemHeight={40}
          disabled={disabled}
        />
      </div>

      {/* AM/PM Picker (only for 12-hour format) */}
      {format === '12h' && (
        <div style={{ flex: 0.4, minWidth: '40px' }}>
          <WheelPicker
            items={amPmOptions}
            value={selectedAmPm}
            onChange={handleAmPmChange}
            height={80}
            itemHeight={40}
            disabled={disabled}
          />
        </div>
      )}
    </div>
  );
};

export default TimeWheelPicker;
