import React, { useState, useEffect, useRef } from 'react';

interface LocationData {
  name: string;
  address: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  placeId?: string;
}

interface LocationPickerProps {
  value: string;
  onChange: (location: LocationData) => void;
  placeholder?: string;
  required?: boolean;
}

// Google Places API configuration
const GOOGLE_PLACES_API_KEY = import.meta.env.VITE_GOOGLE_PLACES_API_KEY || '';

declare global {
  interface Window {
    google: any;
    initGooglePlaces: () => void;
  }
}

const LocationPicker: React.FC<LocationPickerProps> = ({
  value,
  onChange,
  placeholder = "Search for a location...",
  required = false
}) => {
  // Handle both string and object values properly
  const getInitialValue = () => {
    if (typeof value === 'string') {
      return value;
    } else if (value && typeof value === 'object') {
      // Handle different object structures
      if (value.name) {
        return value.name;
      } else if (value.address) {
        return value.address;
      } else if (value.formatted_address) {
        return value.formatted_address;
      }
      // If it's an object but no readable properties, return empty string
      return '';
    }
    return '';
  };

  const [inputValue, setInputValue] = useState(getInitialValue());
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);

  // Update input value when value prop changes (for editing existing events)
  useEffect(() => {
    setInputValue(getInitialValue());
  }, [value]);

  // Initialize Google Places API
  useEffect(() => {
    if (!GOOGLE_PLACES_API_KEY) {
      console.warn('Google Places API key not found. Please set REACT_APP_GOOGLE_PLACES_API_KEY in your environment variables.');
      return;
    }

    // Load Google Places API script
    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_PLACES_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        initializeAutocomplete();
      };
      document.head.appendChild(script);
    } else {
      initializeAutocomplete();
    }

    return () => {
      if (autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, []);

  const initializeAutocomplete = () => {
    if (!window.google || !inputRef.current) return;

    autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
      types: ['establishment', 'geocode'],
      fields: ['place_id', 'name', 'formatted_address', 'geometry']
    });

    autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current.getPlace();
      
      if (place.place_id) {
        const locationData: LocationData = {
          name: place.name || place.formatted_address,
          address: place.formatted_address,
          coordinates: place.geometry?.location ? {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng()
          } : undefined,
          placeId: place.place_id
        };

        setInputValue(locationData.name);
        onChange(locationData);
        setShowSuggestions(false);
      }
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    // If user clears the input, clear the location data
    if (!newValue.trim()) {
      onChange({
        name: '',
        address: '',
        coordinates: undefined,
        placeId: undefined
      });
    }
  };

  const handleInputFocus = () => {
    setShowSuggestions(true);
  };

  const handleInputBlur = () => {
    // Delay hiding suggestions to allow for clicks
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  const handleSuggestionClick = (suggestion: any) => {
    const locationData: LocationData = {
      name: suggestion.name || suggestion.formatted_address,
      address: suggestion.formatted_address,
      coordinates: suggestion.geometry?.location ? {
        lat: suggestion.geometry.location.lat(),
        lng: suggestion.geometry.location.lng()
      } : undefined,
      placeId: suggestion.place_id
    };

    setInputValue(locationData.name);
    onChange(locationData);
    setShowSuggestions(false);
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
        placeholder={placeholder}
        required={required}
        style={{
          width: '100%',
          padding: '8px 12px',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          fontSize: '14px',
          outline: 'none',
          transition: 'border-color 0.2s ease'
        }}
        onFocus={(e) => {
          e.target.style.borderColor = '#3B82F6';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = '#d1d5db';
        }}
      />
      
      {isLoading && (
        <div style={{
          position: 'absolute',
          right: '12px',
          top: '50%',
          transform: 'translateY(-50%)',
          color: '#6B7280'
        }}>
          Loading...
        </div>
      )}

      {!GOOGLE_PLACES_API_KEY && (
        <div style={{
          marginTop: '4px',
          fontSize: '12px',
          color: '#EF4444'
        }}>
          ⚠️ Google Places API key not configured. Location autocomplete will not work.
        </div>
      )}
    </div>
  );
};

export default LocationPicker;
