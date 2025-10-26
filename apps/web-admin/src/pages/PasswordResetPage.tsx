import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const PasswordResetPage: React.FC = () => {
  const [status, setStatus] = useState<'loading' | 'form' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const handlePasswordReset = async () => {
      try {
        // Get URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const tokenParam = urlParams.get('token');
        const type = urlParams.get('type');

        if (!tokenParam || type !== 'recovery') {
          setStatus('error');
          setMessage('Invalid password reset link. Please request a new password reset.');
          return;
        }

        setToken(tokenParam);
        setStatus('form');

      } catch (error) {
        console.error('Password reset error:', error);
        setStatus('error');
        setMessage('An unexpected error occurred. Please try again.');
      }
    };

    handlePasswordReset();
  }, []);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match. Please try again.');
      return;
    }

    if (newPassword.length < 6) {
      setMessage('Password must be at least 6 characters long.');
      return;
    }

    setIsSubmitting(true);
    setMessage('');

    try {
      // Update password using the token
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        console.error('Password update error:', error);
        setMessage('Failed to update password. The link may have expired or already been used.');
        return;
      }

      setStatus('success');
      setMessage('Password updated successfully! You can now return to the app.');

      // Auto-redirect to app after 3 seconds
      setTimeout(() => {
        window.location.href = 'com.thinkmodalabs.pbr-mvp://reset-password';
      }, 3000);

    } catch (error) {
      console.error('Password update error:', error);
      setMessage('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReturnToApp = () => {
    window.location.href = 'com.thinkmodalabs.pbr-mvp://reset-password';
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

        {/* Loading State */}
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
              Verifying reset link...
            </h2>
            <p style={{
              color: '#6b7280',
              fontSize: '16px',
              margin: '0'
            }}>
              Please wait while we verify your password reset link.
            </p>
          </div>
        )}

        {/* Password Reset Form */}
        {status === 'form' && (
          <div>
            <div style={{
              width: '64px',
              height: '64px',
              backgroundColor: '#F59E0B',
              borderRadius: '50%',
              margin: '0 auto 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              color: 'white'
            }}>
              🔒
            </div>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#111827',
              marginBottom: '8px'
            }}>
              Reset Your Password
            </h2>
            <p style={{
              color: '#6b7280',
              fontSize: '16px',
              marginBottom: '32px'
            }}>
              Enter your new password below.
            </p>

            <form onSubmit={handlePasswordSubmit}>
              <div style={{ marginBottom: '20px', textAlign: 'left' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '16px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ marginBottom: '24px', textAlign: 'left' }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '8px'
                }}>
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '16px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {message && (
                <div style={{
                  backgroundColor: '#FEF2F2',
                  border: '1px solid #FECACA',
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: '20px',
                  color: '#DC2626',
                  fontSize: '14px'
                }}>
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  backgroundColor: isSubmitting ? '#9ca3af' : '#3B82F6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 24px',
                  fontSize: '16px',
                  fontWeight: '500',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  width: '100%',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => {
                  if (!isSubmitting) {
                    e.currentTarget.style.backgroundColor = '#2563EB';
                  }
                }}
                onMouseOut={(e) => {
                  if (!isSubmitting) {
                    e.currentTarget.style.backgroundColor = '#3B82F6';
                  }
                }}
              >
                {isSubmitting ? 'Updating Password...' : 'Update Password'}
              </button>
            </form>
          </div>
        )}

        {/* Success State */}
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
              Password Updated!
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

        {/* Error State */}
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
              Reset Failed
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

export default PasswordResetPage;

