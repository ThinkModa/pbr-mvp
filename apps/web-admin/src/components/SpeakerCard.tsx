import React from 'react';
import { Speaker } from '../services/speakersService';

interface SpeakerCardProps {
  speaker: Speaker;
  onEdit: (speaker: Speaker) => void;
  onDelete: (speakerId: string) => void;
}

const SpeakerCard: React.FC<SpeakerCardProps> = ({ speaker, onEdit, onDelete }) => {
  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${speaker.firstName} ${speaker.lastName}?`)) {
      onDelete(speaker.id);
    }
  };

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '8px',
      border: '1px solid #e5e7eb',
      padding: '20px',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
    }}>
      {/* Header with profile image and actions */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
          {/* Profile Image */}
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: '#f3f4f6',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            flexShrink: 0
          }}>
            {speaker.profileImageUrl ? (
              <img
                src={speaker.profileImageUrl}
                alt={`${speaker.firstName} ${speaker.lastName}`}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
            ) : (
              <span style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#6b7280'
              }}>
                {speaker.firstName[0]}{speaker.lastName[0]}
              </span>
            )}
          </div>

          {/* Speaker Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#111827',
              margin: '0 0 4px 0',
              lineHeight: '1.4'
            }}>
              {speaker.firstName} {speaker.lastName}
            </h3>
            {speaker.title && (
              <p style={{
                fontSize: '14px',
                color: '#6b7280',
                margin: '0 0 4px 0'
              }}>
                {speaker.title}
              </p>
            )}
            {speaker.company && (
              <p style={{
                fontSize: '12px',
                color: '#9ca3af',
                margin: '0'
              }}>
                @{speaker.company}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
          <button
            onClick={() => onEdit(speaker)}
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

      {/* Bio */}
      {speaker.bio && (
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
          {speaker.bio}
        </p>
      )}

      {/* Expertise Tags */}
      {speaker.expertise && speaker.expertise.length > 0 && (
        <div style={{
          margin: '0 0 16px 0',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '4px'
        }}>
          {speaker.expertise.slice(0, 3).map((skill, index) => (
            <span
              key={index}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: '500',
                backgroundColor: '#dbeafe',
                color: '#1e40af'
              }}
            >
              {skill}
            </span>
          ))}
          {speaker.expertise.length > 3 && (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: '500',
              backgroundColor: '#f3f4f6',
              color: '#6b7280'
            }}>
              +{speaker.expertise.length - 3} more
            </span>
          )}
        </div>
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
          {speaker.email && (
            <span style={{
              fontSize: '12px',
              color: '#6b7280',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              📧 {speaker.email}
            </span>
          )}
          {speaker.phone && (
            <span style={{
              fontSize: '12px',
              color: '#6b7280',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              📞 {speaker.phone}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <span style={{
            backgroundColor: speaker.isPublic ? '#f0fdf4' : '#fef2f2',
            color: speaker.isPublic ? '#166534' : '#dc2626',
            fontSize: '11px',
            padding: '2px 6px',
            borderRadius: '4px',
            border: speaker.isPublic ? '1px solid #dcfce7' : '1px solid #fecaca'
          }}>
            {speaker.isPublic ? 'Public' : 'Private'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SpeakerCard;
