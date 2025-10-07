import React from 'react';
import { Organization } from '../services/organizationsService';

interface OrganizationCardProps {
  organization: Organization;
  onEdit: (organization: Organization) => void;
  onDelete: (organizationId: string) => void;
}

const OrganizationCard: React.FC<OrganizationCardProps> = ({ organization, onEdit, onDelete }) => {
  const handleEdit = () => {
    onEdit(organization);
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${organization.name}?`)) {
      onDelete(organization.id);
    }
  };

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '8px',
      border: '1px solid #e5e7eb',
      padding: '20px',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      transition: 'all 0.2s ease-in-out',
      cursor: 'pointer',
      position: 'relative'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
      e.currentTarget.style.borderColor = '#d1d5db';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)';
      e.currentTarget.style.borderColor = '#e5e7eb';
    }}
    >
      {/* Header with logo and actions */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
          {/* Logo */}
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '8px',
            backgroundColor: '#f3f4f6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            flexShrink: 0
          }}>
            {organization.logoUrl ? (
              <img
                src={organization.logoUrl}
                alt={`${organization.name} logo`}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
            ) : (
              <span style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#6b7280'
              }}>
                {organization.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          {/* Organization Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#111827',
              margin: '0 0 4px 0',
              lineHeight: '1.4'
            }}>
              {organization.name}
            </h3>
            {organization.industry && (
              <p style={{
                fontSize: '14px',
                color: '#6b7280',
                margin: '0 0 4px 0'
              }}>
                {organization.industry}
              </p>
            )}
            {organization.size && (
              <p style={{
                fontSize: '12px',
                color: '#9ca3af',
                margin: '0'
              }}>
                {organization.size}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
          <button
            onClick={handleEdit}
            style={{
              backgroundColor: '#f3f4f6',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '12px',
              color: '#374151',
              cursor: 'pointer',
              transition: 'all 0.2s ease-in-out'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#e5e7eb';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f3f4f6';
            }}
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '12px',
              color: '#dc2626',
              cursor: 'pointer',
              transition: 'all 0.2s ease-in-out'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#fee2e2';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#fef2f2';
            }}
          >
            Delete
          </button>
        </div>
      </div>

      {/* Description */}
      {organization.description && (
        <p style={{
          fontSize: '14px',
          color: '#4b5563',
          lineHeight: '1.5',
          margin: '0 0 16px 0',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}>
          {organization.description}
        </p>
      )}


      {/* Footer */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: '16px',
        borderTop: '1px solid #f3f4f6'
      }}>
        <div style={{ display: 'flex', gap: '16px' }}>
          {organization.email && (
            <span style={{
              fontSize: '12px',
              color: '#6b7280',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              📧 {organization.email}
            </span>
          )}
          {organization.website && (
            <span style={{
              fontSize: '12px',
              color: '#6b7280',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              🌐 Website
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {organization.isSponsor && (
            <span style={{
              backgroundColor: '#fef3c7',
              color: '#d97706',
              fontSize: '11px',
              padding: '2px 6px',
              borderRadius: '4px',
              border: '1px solid #fde68a'
            }}>
              Sponsor
            </span>
          )}
          <span style={{
            backgroundColor: organization.isPublic ? '#f0fdf4' : '#fef2f2',
            color: organization.isPublic ? '#166534' : '#dc2626',
            fontSize: '11px',
            padding: '2px 6px',
            borderRadius: '4px',
            border: organization.isPublic ? '1px solid #dcfce7' : '1px solid #fecaca'
          }}>
            {organization.isPublic ? 'Public' : 'Private'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default OrganizationCard;
