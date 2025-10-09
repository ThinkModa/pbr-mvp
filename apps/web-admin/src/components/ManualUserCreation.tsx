import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

interface ManualUserCreationProps {
  onUserCreated: () => void;
  onClose: () => void;
}

const ManualUserCreation: React.FC<ManualUserCreationProps> = ({ onUserCreated, onClose }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Create a single user object
      const userData = {
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone_number: formData.phoneNumber || null,
        title_position: null,
        organization_affiliation: null,
        t_shirt_size: null,
        dietary_restrictions: null,
        accessibility_needs: null,
        bio: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('📝 Creating user manually:', userData);

      // Insert the user directly
      const { data: newUser, error } = await supabase
        .from('users')
        .insert(userData)
        .select()
        .single();

      if (error) {
        console.error('❌ Manual user creation failed:', error);
        
        if (error.code === '23505') {
          setError('A user with this email address already exists.');
        } else {
          setError(`Failed to create user: ${error.message}`);
        }
        return;
      }

      console.log('✅ User created successfully');
      setSuccess(true);
      onUserCreated();
      
      // Reset form after a short delay
      setTimeout(() => {
        setFormData({ firstName: '', lastName: '', email: '', phoneNumber: '' });
        setSuccess(false);
        onClose();
      }, 2000);

    } catch (err) {
      console.error('❌ Manual user creation error:', err);
      setError('An unexpected error occurred while creating the user.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '8px',
      border: '1px solid #e5e7eb',
      padding: '24px'
    }}>
      <h2 style={{
        fontSize: '20px',
        fontWeight: '600',
        color: '#111827',
        marginBottom: '24px'
      }}>
        Create New User
      </h2>

      {success && (
        <div style={{
          marginBottom: '16px',
          padding: '12px 16px',
          backgroundColor: '#dcfce7',
          border: '1px solid #16a34a',
          color: '#15803d',
          borderRadius: '6px',
          fontSize: '14px'
        }}>
          ✅ User created successfully!
        </div>
      )}

      {error && (
        <div style={{
          marginBottom: '16px',
          padding: '12px 16px',
          backgroundColor: '#fef2f2',
          border: '1px solid #dc2626',
          color: '#dc2626',
          borderRadius: '6px',
          fontSize: '14px'
        }}>
          ❌ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Basic Information */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
          <div>
            <label htmlFor="firstName" style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '8px'
            }}>
              First Name *
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              required
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: 'white',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
              }}
            />
          </div>

          <div>
            <label htmlFor="lastName" style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              marginBottom: '8px'
            }}>
              Last Name *
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              required
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: 'white',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
              }}
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '500',
            color: '#374151',
            marginBottom: '8px'
          }}>
            Email *
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            required
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              backgroundColor: 'white',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
            }}
          />
        </div>

        <div>
          <label htmlFor="phoneNumber" style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '500',
            color: '#374151',
            marginBottom: '8px'
          }}>
            Phone Number
          </label>
          <input
            type="tel"
            id="phoneNumber"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
            placeholder="Optional"
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              backgroundColor: 'white',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
            }}
          />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '24px', borderTop: '1px solid #e5e7eb' }}>
          <button
            type="button"
            onClick={onClose}
            style={{ padding: '8px 16px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', fontWeight: '500', color: '#374151', backgroundColor: 'white', cursor: 'pointer', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)' }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            style={{ padding: '8px 16px', border: '1px solid transparent', borderRadius: '6px', fontSize: '14px', fontWeight: '500', color: 'white', backgroundColor: '#3B82F6', cursor: 'pointer', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', opacity: loading ? 0.5 : 1 }}
          >
            {loading ? 'Creating...' : 'Create User'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ManualUserCreation;
