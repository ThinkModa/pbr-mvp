import React, { useState, useEffect, useRef } from 'react';
import { googleMapsLoader } from '../utils/googleMapsLoader';

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
  value: string | LocationData;
  onChange: (location: LocationData) => void;
  placeholder?: string;
  required?: boolean;
}

// Google Places API configuration
const GOOGLE_PLACES_API_KEY = (import.meta as any).env.VITE_GOOGLE_PLACES_API_KEY || '';

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
      // Check if it's JSON string
      if (value.startsWith('{') || value.startsWith('[')) {
        try {
          const parsed = JSON.parse(value);
          return parsed.address || parsed.name || parsed.formatted_address || '';
        } catch (e) {
          return value;
        }
      }
      return value;
    } else if (value && typeof value === 'object') {
      // Extract string from object - handle both LocationData and empty object
      if (value.address && value.address.trim() !== '') {
        return value.address;
      } else if (value.name && value.name.trim() !== '') {
        return value.name;
      } else if ((value as any).formatted_address && (value as any).formatted_address.trim() !== '') {
        return (value as any).formatted_address;
      }
      // If it's an empty object (like initial state), return empty string
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
  const previousValueRef = useRef(value);

  // Update input value when value prop changes (for editing existing events)
  useEffect(() => {
    // Only update if the value prop actually changed
    if (previousValueRef.current !== value) {
      const newValue = getInitialValue();
      setInputValue(newValue);
      previousValueRef.current = value;
    }
  }, [value]);

  // Initialize Google Places API using global loader
  useEffect(() => {
    const initializeGoogleMaps = async () => {
      try {
        await googleMapsLoader.loadGoogleMaps();
        initializeAutocomplete();
      } catch (error) {
        console.error('Failed to load Google Maps API:', error);
      }
    };

    initializeGoogleMaps();

    return () => {
      if (autocompleteRef.current) {
        // Clean up event listeners
        window.google?.maps?.event?.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, []);

  const initializeAutocomplete = () => {
    if (!window.google || !window.google.maps || !window.google.maps.places || !inputRef.current) {
      console.warn('Google Maps API not fully loaded yet, skipping autocomplete initialization');
      return;
    }

    try {
      console.log('🚀 Initializing Google Places Autocomplete');
      
      // Use the stable legacy Autocomplete API
      autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
        types: ['establishment', 'geocode'],
        fields: ['place_id', 'name', 'formatted_address', 'geometry']
      });

      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current.getPlace();
        
        console.log('🗺️ Google Places result:', {
          name: place.name,
          formatted_address: place.formatted_address,
          geometry: place.geometry,
          hasCoordinates: !!place.geometry?.location
        });
        
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
          
          console.log('📍 Location data being sent:', locationData);
          setInputValue(locationData.address || locationData.name);
          onChange(locationData);
          setShowSuggestions(false);
        }
      });
    } catch (error) {
      console.error('Error initializing Google Places Autocomplete:', error);
    }
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
    // Note: We don't call onChange for every keystroke to avoid creating objects
    // onChange is only called when a place is selected from Google Places autocomplete
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
        onFocus={(e) => {
          e.target.style.borderColor = '#3B82F6';
          handleInputFocus();
        }}
        onBlur={(e) => {
          e.target.style.borderColor = '#d1d5db';
          handleInputBlur();
        }}
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
