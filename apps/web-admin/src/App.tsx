import React, { useState, useEffect } from 'react';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';

type Page = 'dashboard' | 'events' | 'speakers' | 'organizations' | 'users' | 'settings';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on app load
  useEffect(() => {
    const checkSession = () => {
      const session = localStorage.getItem('pbr-admin-session');
      if (session) {
        try {
          const sessionData = JSON.parse(session);
          // Check if session is still valid (not expired)
          if (sessionData.expiresAt && new Date(sessionData.expiresAt) > new Date()) {
            setIsLoggedIn(true);
          } else {
            // Session expired, remove it
            localStorage.removeItem('pbr-admin-session');
          }
        } catch (error) {
          // Invalid session data, remove it
          localStorage.removeItem('pbr-admin-session');
        }
      }
      setIsLoading(false);
    };

    checkSession();
  }, []);

  const handleLoginSuccess = () => {
    // Create session data
    const sessionData = {
      isLoggedIn: true,
      loginTime: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
    };
    
    // Store in localStorage
    localStorage.setItem('pbr-admin-session', JSON.stringify(sessionData));
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('pbr-admin-session');
    setIsLoggedIn(false);
    setCurrentPage('dashboard');
  };

  // Show loading spinner while checking session
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#f9fafb'
      }}>
        <div style={{
          textAlign: 'center',
          padding: '32px'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid #e5e7eb',
            borderTop: '4px solid #3B82F6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p style={{ color: '#6b7280', fontSize: '14px' }}>Loading...</p>
        </div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  // All pages are handled by DashboardPage
  return <DashboardPage onNavigate={setCurrentPage} onLogout={handleLogout} />;
}

export default App;