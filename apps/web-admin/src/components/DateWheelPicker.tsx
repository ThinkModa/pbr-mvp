import React, { useState, useEffect } from 'react';
import WheelPicker from './WheelPicker';

interface DateWheelPickerProps {
  value: string; // YYYY-MM-DD format
  onChange: (date: string) => void;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
}

const DateWheelPicker: React.FC<DateWheelPickerProps> = ({
  value,
  onChange,
  minDate,
  maxDate,
  disabled = false
}) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Initialize arrays immediately to prevent empty arrays being passed to WheelPicker
  const [months, setMonths] = useState<string[]>([
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]);
  const [days, setDays] = useState<string[]>(() => {
    const dayList: string[] = [];
    for (let i = 1; i <= 31; i++) {
      dayList.push(i.toString());
    }
    return dayList;
  });
  const [years, setYears] = useState<string[]>(() => {
    const yearList: string[] = [];
    const currentYear = new Date().getFullYear();
    for (let i = currentYear - 10; i <= currentYear + 20; i++) {
      yearList.push(i.toString());
    }
    return yearList;
  });

  // Initialize date from value
  useEffect(() => {
    if (value) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        setSelectedDate(date);
      }
    }
  }, [value]);

  // Arrays are now initialized immediately in useState, no need for useEffect

  const handleMonthChange = (month: string) => {
    const monthIndex = months.indexOf(month);
    const newDate = new Date(selectedDate);
    newDate.setMonth(monthIndex);
    setSelectedDate(newDate);
    updateParent(newDate);
  };

  const handleDayChange = (day: string) => {
    const dayNum = parseInt(day);
    const daysInMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).getDate();
    
    // If selected day is beyond days in month, use the last day of the month
    const validDay = dayNum > daysInMonth ? daysInMonth : dayNum;
    
    const newDate = new Date(selectedDate);
    newDate.setDate(validDay);
    setSelectedDate(newDate);
    updateParent(newDate);
  };

  const handleYearChange = (year: string) => {
    const newDate = new Date(selectedDate);
    newDate.setFullYear(parseInt(year));
    setSelectedDate(newDate);
    updateParent(newDate);
  };

  const updateParent = (date: Date) => {
    const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD format
    console.log('📅 DateWheelPicker updateParent called:', { date, dateString });
    onChange(dateString);
  };

  const getCurrentMonth = () => {
    return months[selectedDate.getMonth()] || months[0];
  };

  const getCurrentDay = () => {
    return selectedDate.getDate().toString();
  };

  const getCurrentYear = () => {
    return selectedDate.getFullYear().toString();
  };

  return (
    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
      {/* Month Picker */}
      <div style={{ flex: 1, minWidth: '80px' }}>
        <WheelPicker
          items={months}
          value={getCurrentMonth()}
          onChange={handleMonthChange}
          height={80}
          itemHeight={40}
          disabled={disabled}
        />
      </div>

      {/* Day Picker */}
      <div style={{ flex: 0.5, minWidth: '50px' }}>
        <WheelPicker
          items={days}
          value={getCurrentDay()}
          onChange={handleDayChange}
          height={80}
          itemHeight={40}
          disabled={disabled}
        />
      </div>

      {/* Year Picker */}
      <div style={{ flex: 0.6, minWidth: '60px' }}>
        <WheelPicker
          items={years}
          value={getCurrentYear()}
          onChange={handleYearChange}
          height={80}
          itemHeight={40}
          disabled={disabled}
        />
      </div>
    </div>
  );
};

export default DateWheelPicker;
