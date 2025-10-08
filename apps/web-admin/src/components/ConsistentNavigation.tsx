import React from 'react';

interface ConsistentNavigationProps {
  currentPage: 'dashboard' | 'events' | 'speakers' | 'organizations' | 'users' | 'settings';
  onNavigate: (page: 'dashboard' | 'events' | 'speakers' | 'organizations' | 'users' | 'settings') => void;
}

const ConsistentNavigation: React.FC<ConsistentNavigationProps> = ({ currentPage, onNavigate }) => {
  const navigationItems = [
    { id: 'dashboard', label: 'Home', icon: '🏠' },
    { id: 'events', label: 'Events', icon: '📅' },
    { id: 'speakers', label: 'Speakers', icon: '🎤' },
    { id: 'organizations', label: 'Organizations', icon: '🏢' },
    { id: 'users', label: 'Users', icon: '👥' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ] as const;

  return (
    <nav style={{ flex: 1, padding: '16px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {navigationItems.map((item) => {
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px', 
                padding: '8px 12px', 
                fontSize: '14px', 
                fontWeight: '500', 
                color: isActive ? '#111827' : '#6b7280', 
                backgroundColor: isActive ? '#f3f4f6' : 'transparent', 
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                width: '100%',
                textAlign: 'left'
              }}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default ConsistentNavigation;
