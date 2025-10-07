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
      padding: '24px',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
        {/* Profile Image */}
        <div style={{ flexShrink: 0 }}>
          {speaker.profileImageUrl ? (
            <img
              src={speaker.profileImageUrl}
              alt={`${speaker.firstName} ${speaker.lastName}`}
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                objectFit: 'cover'
              }}
            />
          ) : (
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: '#3B82F6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{
                color: 'white',
                fontWeight: '600',
                fontSize: '18px'
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
              {speaker.title && (
                <p style={{
                  fontSize: '14px',
                  color: '#6b7280',
                  margin: '4px 0 0 0'
                }}>{speaker.title}</p>
              )}
              {speaker.company && (
                <p style={{
                  fontSize: '14px',
                  color: '#9ca3af',
                  margin: '2px 0 0 0'
                }}>@{speaker.company}</p>
              )}
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
              margin: '12px 0 0 0',
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
              {speaker.expertise.length > 3 && (
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
                  +{speaker.expertise.length - 3} more
                </span>
              )}
            </div>
          )}

          {/* Contact Info */}
          <div style={{
            margin: '12px 0 0 0',
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

          {/* Social Links */}
          {Object.entries(speaker.socialLinks).some(([_, url]) => url) && (
            <div style={{
              margin: '12px 0 0 0',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              {speaker.socialLinks.linkedin && (
                <a
                  href={speaker.socialLinks.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#9ca3af' }}
                >
                  <svg style={{ width: '20px', height: '20px' }} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
              )}
              {speaker.socialLinks.twitter && (
                <a
                  href={speaker.socialLinks.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#9ca3af' }}
                >
                  <svg style={{ width: '20px', height: '20px' }} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </a>
              )}
              {speaker.socialLinks.github && (
                <a
                  href={speaker.socialLinks.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#9ca3af' }}
                >
                  <svg style={{ width: '20px', height: '20px' }} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                </a>
              )}
              {speaker.socialLinks.website && (
                <a
                  href={speaker.socialLinks.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#9ca3af' }}
                >
                  <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                  </svg>
                </a>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
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

export default SpeakerCard;
