import React, { useState, useEffect } from 'react';

interface TimePickerProps {
  value: string;
  onChange: (time: string) => void;
  placeholder?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
}

const TimePicker: React.FC<TimePickerProps> = ({ 
  value, 
  onChange, 
  placeholder = "Select time",
  disabled = false,
  style = {}
}) => {
  // Generate time options in 30-minute intervals
  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const displayTime = formatTimeForDisplay(hour, minute);
        options.push({
          value: timeString,
          label: displayTime
        });
      }
    }
    return options;
  };

  const formatTimeForDisplay = (hour: number, minute: number): string => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    const displayMinute = minute === 0 ? '00' : minute.toString();
    return `${displayHour}:${displayMinute} ${period}`;
  };

  const timeOptions = generateTimeOptions();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Find the current selected option
  const selectedOption = timeOptions.find(option => option.value === value);

  // Filter options based on search term
  const filteredOptions = timeOptions.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    option.value.includes(searchTerm)
  );

  const handleOptionClick = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleInputClick = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setSearchTerm(inputValue);
    
    // If user types a valid time format (HH:MM), try to find matching option
    if (inputValue.match(/^\d{1,2}:\d{2}$/)) {
      const [hours, minutes] = inputValue.split(':').map(Number);
      if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
        // Find closest 30-minute interval
        const roundedMinutes = Math.round(minutes / 30) * 30;
        const adjustedMinutes = roundedMinutes >= 60 ? 0 : roundedMinutes;
        const adjustedHours = roundedMinutes >= 60 ? (hours + 1) % 24 : hours;
        
        const timeString = `${adjustedHours.toString().padStart(2, '0')}:${adjustedMinutes.toString().padStart(2, '0')}`;
        const matchingOption = timeOptions.find(option => option.value === timeString);
        if (matchingOption) {
          onChange(timeString);
          setIsOpen(false);
          setSearchTerm('');
          return;
        }
      }
    }
    
    // If no exact match, keep the dropdown open for selection
    setIsOpen(true);
  };

  const handleBlur = () => {
    // Delay closing to allow option clicks
    setTimeout(() => {
      setIsOpen(false);
      setSearchTerm('');
    }, 150);
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <input
        type="text"
        value={isOpen ? searchTerm : (selectedOption?.label || value || '')}
        onChange={handleInputChange}
        onClick={handleInputClick}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        style={{
          width: '100%',
          padding: '8px 12px',
          border: '1px solid #D1D5DB',
          borderRadius: '6px',
          fontSize: '14px',
          backgroundColor: disabled ? '#F9FAFB' : 'white',
          cursor: disabled ? 'not-allowed' : 'pointer',
          ...style
        }}
        readOnly={!isOpen} // Only allow typing when dropdown is open
      />
      
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            backgroundColor: 'white',
            border: '1px solid #D1D5DB',
            borderRadius: '6px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            zIndex: 1000,
            maxHeight: '200px',
            overflowY: 'auto',
            marginTop: '2px'
          }}
        >
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <div
                key={option.value}
                onClick={() => handleOptionClick(option.value)}
                style={{
                  padding: '8px 12px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  backgroundColor: option.value === value ? '#EFF6FF' : 'transparent',
                  color: option.value === value ? '#1D4ED8' : '#374151',
                  borderBottom: '1px solid #F3F4F6'
                }}
                onMouseEnter={(e) => {
                  if (option.value !== value) {
                    e.currentTarget.style.backgroundColor = '#F9FAFB';
                  }
                }}
                onMouseLeave={(e) => {
                  if (option.value !== value) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                {option.label}
              </div>
            ))
          ) : (
            <div
              style={{
                padding: '8px 12px',
                fontSize: '14px',
                color: '#9CA3AF',
                textAlign: 'center'
              }}
            >
              No times found
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TimePicker;
