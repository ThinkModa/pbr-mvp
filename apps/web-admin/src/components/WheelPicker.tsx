import React, { useState, useEffect, useRef } from 'react';
import './WheelPicker.css';

interface WheelPickerProps {
  items: string[];
  value: string;
  onChange: (value: string) => void;
  height?: number;
  itemHeight?: number;
  disabled?: boolean;
}

const WheelPicker: React.FC<WheelPickerProps> = ({
  items,
  value,
  onChange,
  height = 200,
  itemHeight = 40,
  disabled = false
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const [userInteracting, setUserInteracting] = useState(false);
  const userInteractingTimeoutRef = useRef<NodeJS.Timeout>();
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();

  // Find the index of the current value (only when value changes externally, not during user scrolling)
  useEffect(() => {
    const index = items.findIndex(item => item === value);
    if (index !== -1 && index !== selectedIndex && !isScrolling && !userInteracting) {
      console.log('🔄 WheelPicker value changed externally:', { value, index, selectedIndex, userInteracting });
      setSelectedIndex(index);
      // Smooth scroll to center the new selection
      if (containerRef.current) {
        const centerOffset = height / 2 - itemHeight / 2;
        const scrollTop = index * itemHeight - centerOffset;
        containerRef.current.scrollTo({
          top: Math.max(0, scrollTop),
          behavior: 'smooth'
        });
      }
    } else if (index !== -1 && index !== selectedIndex) {
      console.log('🚫 WheelPicker external change blocked:', { 
        value, 
        index, 
        selectedIndex, 
        isScrolling, 
        userInteracting,
        reason: isScrolling ? 'scrolling' : userInteracting ? 'user interacting' : 'unknown'
      });
    }
  }, [value, items, height, itemHeight, selectedIndex, isScrolling, userInteracting]);

  // Initialize selectedIndex when items are first loaded
  useEffect(() => {
    if (items.length > 0 && value && selectedIndex === 0) {
      const index = items.findIndex(item => item === value);
      if (index !== -1) {
        console.log('🎯 WheelPicker: Initializing selectedIndex:', { value, index, itemsLength: items.length });
        setSelectedIndex(index);
      }
    }
  }, [items, value, selectedIndex]);

  // Scroll to the selected item on mount and when value changes
  useEffect(() => {
    if (containerRef.current && !isScrolling) {
      // Center the selected item in the visible area
      const scrollTop = selectedIndex * itemHeight - (height / 2 - itemHeight / 2);
      containerRef.current.scrollTop = Math.max(0, scrollTop);
    }
  }, [selectedIndex, itemHeight, height, isScrolling]);

  const handleScroll = () => {
    if (!containerRef.current) return;

    console.log('👆 WheelPicker: User started scrolling, setting userInteracting=true');
    setIsScrolling(true);
    setUserInteracting(true);
    
    // Clear existing timeouts
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    if (userInteractingTimeoutRef.current) {
      clearTimeout(userInteractingTimeoutRef.current);
    }

    // Set new timeout to detect when scrolling stops
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
      
      if (containerRef.current) {
        const scrollTop = containerRef.current.scrollTop;
        // Calculate which item is in the center of the visible area
        const centerOffset = height / 2 - itemHeight / 2;
        const newIndex = Math.round((scrollTop + centerOffset) / itemHeight);
        const clampedIndex = Math.max(0, Math.min(newIndex, items.length - 1));
        
        if (clampedIndex !== selectedIndex) {
          console.log('🎯 WheelPicker scroll detected:', { 
            oldIndex: selectedIndex, 
            newIndex: clampedIndex, 
            oldValue: items[selectedIndex], 
            newValue: items[clampedIndex],
            userInteracting: true
          });
          setSelectedIndex(clampedIndex);
          onChange(items[clampedIndex]);
        }
        
        // Reset user interaction flag after a longer delay to prevent external overrides
        userInteractingTimeoutRef.current = setTimeout(() => {
          console.log('🔄 WheelPicker: Resetting userInteracting flag');
          setUserInteracting(false);
        }, 2000); // Increased from 1000ms to 2000ms
      }
    }, 150);
  };

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      if (userInteractingTimeoutRef.current) {
        clearTimeout(userInteractingTimeoutRef.current);
      }
    };
  }, []);

  // Debug log items
  useEffect(() => {
    console.log('🎯 WheelPicker: Received items:', { items, itemsLength: items.length, value });
  }, [items, value]);

  return (
    <div
      ref={containerRef}
      className="wheel-picker"
      style={{
        height: height,
        overflowY: 'auto', // Changed from 'hidden' to 'auto' for scrolling
        overflowX: 'hidden',
        position: 'relative',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        border: '1px solid #E5E7EB',
        borderRadius: '8px',
        backgroundColor: 'white'
      }}
      onScroll={handleScroll}
    >
      {/* Top fade overlay */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          left: 0,
          right: 0,
          height: itemHeight * 2,
          background: 'linear-gradient(to bottom, rgba(255,255,255,1) 0%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,0) 100%)',
          pointerEvents: 'none',
          zIndex: 2
        }}
      />
      
      {/* Bottom fade overlay */}
      <div
        style={{
          position: 'sticky',
          bottom: 0,
          left: 0,
          right: 0,
          height: itemHeight * 2,
          background: 'linear-gradient(to top, rgba(255,255,255,1) 0%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,0) 100%)',
          pointerEvents: 'none',
          zIndex: 2
        }}
      />

      {/* Selection indicator - fixed in center */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: 0,
          right: 0,
          height: itemHeight,
          transform: 'translateY(-50%)',
          border: '2px solid #3B82F6',
          borderRadius: '8px',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          pointerEvents: 'none',
          zIndex: 1
        }}
      />

      {/* Items container with proper padding */}
      <div
        style={{
          paddingTop: height / 2 - itemHeight / 2,
          paddingBottom: height / 2 - itemHeight / 2
        }}
      >
        {items.map((item, index) => (
          <div
            key={index}
            style={{
              height: itemHeight,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              fontWeight: index === selectedIndex ? '600' : '400',
              color: index === selectedIndex ? '#1F2937' : '#6B7280',
              backgroundColor: 'transparent',
              transition: 'all 0.2s ease',
              cursor: disabled ? 'not-allowed' : 'default',
              userSelect: 'none',
              padding: '0 8px'
            }}
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  );
};

export default WheelPicker;
