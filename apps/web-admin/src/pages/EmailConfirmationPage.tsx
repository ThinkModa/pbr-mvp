import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const EmailConfirmationPage: React.FC = () => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        // Get URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        const type = urlParams.get('type');

        if (!token || type !== 'signup') {
          setStatus('error');
          setMessage('Invalid confirmation link. Please try again.');
          return;
        }

        // Confirm email with Supabase
        const { error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: 'email'
        });

        if (error) {
          console.error('Email confirmation error:', error);
          setStatus('error');
          setMessage('Failed to confirm email. The link may have expired or already been used.');
          return;
        }

        setStatus('success');
        setMessage('Email confirmed successfully! You can now return to the app.');

        // Auto-redirect to app after 3 seconds
        setTimeout(() => {
          window.location.href = 'com.thinkmodalabs.pbr-mvp://confirm-email';
        }, 3000);

      } catch (error) {
        console.error('Email confirmation error:', error);
        setStatus('error');
        setMessage('An unexpected error occurred. Please try again.');
      }
    };

    handleEmailConfirmation();
  }, []);

  const handleReturnToApp = () => {
    window.location.href = 'com.thinkmodalabs.pbr-mvp://confirm-email';
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f9fafb',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '48px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        maxWidth: '480px',
        width: '100%',
        textAlign: 'center'
      }}>
        {/* Logo/Brand */}
        <div style={{
          marginBottom: '32px'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            backgroundColor: '#3B82F6',
            borderRadius: '12px',
            margin: '0 auto 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            color: 'white',
            fontWeight: 'bold'
          }}>
            PBR
          </div>
          <h1 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#111827',
            margin: '0'
          }}>
            PBR MVP
          </h1>
        </div>

        {/* Status Content */}
        {status === 'loading' && (
          <div>
            <div style={{
              width: '48px',
              height: '48px',
              border: '4px solid #e5e7eb',
              borderTop: '4px solid #3B82F6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 24px'
            }}></div>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#111827',
              marginBottom: '8px'
            }}>
              Confirming your email...
            </h2>
            <p style={{
              color: '#6b7280',
              fontSize: '16px',
              margin: '0'
            }}>
              Please wait while we verify your email address.
            </p>
          </div>
        )}

        {status === 'success' && (
          <div>
            <div style={{
              width: '64px',
              height: '64px',
              backgroundColor: '#10B981',
              borderRadius: '50%',
              margin: '0 auto 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              color: 'white'
            }}>
              ✓
            </div>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#111827',
              marginBottom: '8px'
            }}>
              Email Confirmed!
            </h2>
            <p style={{
              color: '#6b7280',
              fontSize: '16px',
              marginBottom: '32px'
            }}>
              {message}
            </p>
            <button
              onClick={handleReturnToApp}
              style={{
                backgroundColor: '#3B82F6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: 'pointer',
                width: '100%',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2563EB'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3B82F6'}
            >
              Return to App
            </button>
            <p style={{
              color: '#9ca3af',
              fontSize: '14px',
              marginTop: '16px',
              margin: '0'
            }}>
              You will be automatically redirected in a few seconds...
            </p>
          </div>
        )}

        {status === 'error' && (
          <div>
            <div style={{
              width: '64px',
              height: '64px',
              backgroundColor: '#EF4444',
              borderRadius: '50%',
              margin: '0 auto 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              color: 'white'
            }}>
              ✕
            </div>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#111827',
              marginBottom: '8px'
            }}>
              Confirmation Failed
            </h2>
            <p style={{
              color: '#6b7280',
              fontSize: '16px',
              marginBottom: '32px'
            }}>
              {message}
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                backgroundColor: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 24px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: 'pointer',
                width: '100%',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#4b5563'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#6b7280'}
            >
              Try Again
            </button>
          </div>
        )}

        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
};

export default EmailConfirmationPage;
