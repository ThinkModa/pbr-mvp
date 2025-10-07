import React from 'react';
import { Speaker } from '../services/speakersService';

interface SpeakerListCardProps {
  speaker: Speaker;
  onEdit: (speaker: Speaker) => void;
  onDelete: (speakerId: string) => void;
}

const SpeakerListCard: React.FC<SpeakerListCardProps> = ({ speaker, onEdit, onDelete }) => {
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
      padding: '16px',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Profile Image */}
        <div style={{ flexShrink: 0 }}>
          {speaker.profileImageUrl ? (
            <img
              src={speaker.profileImageUrl}
              alt={`${speaker.firstName} ${speaker.lastName}`}
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                objectFit: 'cover'
              }}
            />
          ) : (
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              backgroundColor: '#3B82F6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{
                color: 'white',
                fontWeight: '600',
                fontSize: '14px'
              }}>
                {speaker.firstName[0]}{speaker.lastName[0]}
              </span>
            </div>
          )}
        </div>

        {/* Speaker Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#111827',
                margin: 0
              }}>
                {speaker.firstName} {speaker.lastName}
              </h3>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                color: '#6b7280',
                marginTop: '2px'
              }}>
                {speaker.title && <span>{speaker.title}</span>}
                {speaker.title && speaker.company && <span>•</span>}
                {speaker.company && <span>@{speaker.company}</span>}
              </div>
            </div>
            
            {/* Status Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {speaker.isPublic ? (
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '2px 10px',
                  borderRadius: '9999px',
                  fontSize: '12px',
                  fontWeight: '500',
                  backgroundColor: '#dcfce7',
                  color: '#166534'
                }}>
                  Public
                </span>
              ) : (
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '2px 10px',
                  borderRadius: '9999px',
                  fontSize: '12px',
                  fontWeight: '500',
                  backgroundColor: '#f3f4f6',
                  color: '#374151'
                }}>
                  Private
                </span>
              )}
            </div>
          </div>

          {/* Bio */}
          {speaker.bio && (
            <p style={{
              margin: '8px 0 0 0',
              fontSize: '14px',
              color: '#6b7280',
              lineHeight: '1.5',
              display: '-webkit-box',
              WebkitLineClamp: 1,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}>
              {speaker.bio}
            </p>
          )}

          {/* Expertise Tags */}
          {speaker.expertise && speaker.expertise.length > 0 && (
            <div style={{
              margin: '8px 0 0 0',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '4px'
            }}>
              {speaker.expertise.slice(0, 4).map((skill, index) => (
                <span
                  key={index}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '500',
                    backgroundColor: '#dbeafe',
                    color: '#1e40af'
                  }}
                >
                  {skill}
                </span>
              ))}
              {speaker.expertise.length > 4 && (
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '500',
                  backgroundColor: '#f3f4f6',
                  color: '#6b7280'
                }}>
                  +{speaker.expertise.length - 4} more
                </span>
              )}
            </div>
          )}

          {/* Contact Info */}
          <div style={{
            margin: '8px 0 0 0',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            fontSize: '14px',
            color: '#9ca3af'
          }}>
            {speaker.email && (
              <span style={{ display: 'flex', alignItems: 'center' }}>
                <svg style={{ width: '16px', height: '16px', marginRight: '4px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {speaker.email}
              </span>
            )}
            {speaker.phone && (
              <span style={{ display: 'flex', alignItems: 'center' }}>
                <svg style={{ width: '16px', height: '16px', marginRight: '4px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                {speaker.phone}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => onEdit(speaker)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '6px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151',
              backgroundColor: 'white',
              cursor: 'pointer',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
            }}
          >
            <svg style={{ width: '16px', height: '16px', marginRight: '4px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </button>
          <button
            onClick={handleDelete}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '6px 12px',
              border: '1px solid #fca5a5',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#b91c1c',
              backgroundColor: 'white',
              cursor: 'pointer',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
            }}
          >
            <svg style={{ width: '16px', height: '16px', marginRight: '4px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default SpeakerListCard;
