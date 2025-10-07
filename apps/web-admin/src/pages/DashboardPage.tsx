import React, { useState, useEffect } from 'react';
import { Speaker, CreateSpeakerData, UpdateSpeakerData, SpeakersService } from '../services/speakersService';
import { Organization, CreateOrganizationData, UpdateOrganizationData, OrganizationsService } from '../services/organizationsService';
import SpeakerCard from '../components/SpeakerCard';
import SpeakerListCard from '../components/SpeakerListCard';
import SpeakerForm from '../components/SpeakerForm';
import OrganizationCard from '../components/OrganizationCard';
import OrganizationListCard from '../components/OrganizationListCard';
import OrganizationForm from '../components/OrganizationForm';

interface DashboardPageProps {
  onNavigate: (page: 'dashboard' | 'events' | 'speakers' | 'organizations') => void;
  onLogout: () => void;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate, onLogout }) => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'events' | 'speakers' | 'organizations'>('dashboard');
  
  // Speakers state
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [speakersLoading, setSpeakersLoading] = useState(false);
  const [speakersError, setSpeakersError] = useState<string | null>(null);
  const [showSpeakerForm, setShowSpeakerForm] = useState(false);
  const [editingSpeaker, setEditingSpeaker] = useState<Speaker | null>(null);
  const [speakerFormLoading, setSpeakerFormLoading] = useState(false);
  const [speakerSearchTerm, setSpeakerSearchTerm] = useState('');
  const [speakerViewMode, setSpeakerViewMode] = useState<'grid' | 'list'>('grid');

  // Organizations state
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [organizationsLoading, setOrganizationsLoading] = useState(false);
  const [organizationsError, setOrganizationsError] = useState<string | null>(null);
  const [showOrganizationForm, setShowOrganizationForm] = useState(false);
  const [editingOrganization, setEditingOrganization] = useState<Organization | null>(null);
  const [organizationFormLoading, setOrganizationFormLoading] = useState(false);
  const [organizationSearchTerm, setOrganizationSearchTerm] = useState('');
  const [organizationViewMode, setOrganizationViewMode] = useState<'grid' | 'list'>('grid');

  // Load speakers when speakers view is selected
  useEffect(() => {
    if (currentView === 'speakers') {
      loadSpeakers();
    }
  }, [currentView]);

  // Load organizations when organizations view is selected
  useEffect(() => {
    if (currentView === 'organizations') {
      loadOrganizations();
    }
  }, [currentView]);

  const loadSpeakers = async () => {
    try {
      setSpeakersLoading(true);
      setSpeakersError(null);
      const speakersData = await SpeakersService.getAllSpeakers();
      setSpeakers(speakersData);
    } catch (err) {
      console.error('Error loading speakers:', err);
      setSpeakersError('Failed to load speakers. Please try again.');
    } finally {
      setSpeakersLoading(false);
    }
  };

  const handleCreateSpeaker = async (data: CreateSpeakerData) => {
    try {
      setSpeakerFormLoading(true);
      await SpeakersService.createSpeaker(data);
      await loadSpeakers();
      setShowSpeakerForm(false);
    } catch (err) {
      console.error('Error creating speaker:', err);
      throw err;
    } finally {
      setSpeakerFormLoading(false);
    }
  };

  const handleUpdateSpeaker = async (data: UpdateSpeakerData) => {
    try {
      setSpeakerFormLoading(true);
      await SpeakersService.updateSpeaker(data);
      await loadSpeakers();
      setEditingSpeaker(null);
      setShowSpeakerForm(false);
    } catch (err) {
      console.error('Error updating speaker:', err);
      throw err;
    } finally {
      setSpeakerFormLoading(false);
    }
  };

  const handleDeleteSpeaker = async (speakerId: string) => {
    try {
      await SpeakersService.deleteSpeaker(speakerId);
      await loadSpeakers();
    } catch (err) {
      console.error('Error deleting speaker:', err);
      setSpeakersError('Failed to delete speaker. Please try again.');
    }
  };

  const handleEditSpeaker = (speaker: Speaker) => {
    setEditingSpeaker(speaker);
    setShowSpeakerForm(true);
  };

  const handleCancelSpeakerForm = () => {
    setShowSpeakerForm(false);
    setEditingSpeaker(null);
  };

  // Filter speakers based on search term
  const filteredSpeakers = speakers.filter(speaker => {
    const searchLower = speakerSearchTerm.toLowerCase();
    return (
      speaker.firstName.toLowerCase().includes(searchLower) ||
      speaker.lastName.toLowerCase().includes(searchLower) ||
      speaker.email.toLowerCase().includes(searchLower) ||
      (speaker.title && speaker.title.toLowerCase().includes(searchLower)) ||
      (speaker.company && speaker.company.toLowerCase().includes(searchLower)) ||
      (speaker.bio && speaker.bio.toLowerCase().includes(searchLower)) ||
      speaker.expertise.some(skill => skill.toLowerCase().includes(searchLower))
    );
  });

  // Organizations functions
  const loadOrganizations = async () => {
    try {
      setOrganizationsLoading(true);
      setOrganizationsError(null);
      const data = await OrganizationsService.getAllOrganizations();
      setOrganizations(data);
    } catch (error) {
      console.error('Error loading organizations:', error);
      setOrganizationsError('Failed to load organizations');
    } finally {
      setOrganizationsLoading(false);
    }
  };

  const handleCreateOrganization = async (data: CreateOrganizationData) => {
    try {
      setOrganizationFormLoading(true);
      const newOrganization = await OrganizationsService.createOrganization(data);
      setOrganizations(prev => [...prev, newOrganization]);
      setShowOrganizationForm(false);
    } catch (error) {
      console.error('Error creating organization:', error);
      throw error;
    } finally {
      setOrganizationFormLoading(false);
    }
  };

  const handleUpdateOrganization = async (data: UpdateOrganizationData) => {
    try {
      setOrganizationFormLoading(true);
      const updatedOrganization = await OrganizationsService.updateOrganization(data);
      setOrganizations(prev => prev.map(org => org.id === data.id ? updatedOrganization : org));
      setShowOrganizationForm(false);
    } catch (error) {
      console.error('Error updating organization:', error);
      throw error;
    } finally {
      setOrganizationFormLoading(false);
    }
  };

  const handleDeleteOrganization = async (organizationId: string) => {
    try {
      await OrganizationsService.deleteOrganization(organizationId);
      setOrganizations(prev => prev.filter(org => org.id !== organizationId));
    } catch (error) {
      console.error('Error deleting organization:', error);
      alert('Failed to delete organization');
    }
  };

  const handleEditOrganization = (organization: Organization) => {
    setEditingOrganization(organization);
    setShowOrganizationForm(true);
  };

  const handleCancelOrganizationForm = () => {
    setShowOrganizationForm(false);
    setEditingOrganization(null);
  };

  // Filter organizations based on search term
  const filteredOrganizations = organizations.filter(organization => {
    const searchLower = organizationSearchTerm.toLowerCase();
    return (
      organization.name.toLowerCase().includes(searchLower) ||
      (organization.description && organization.description.toLowerCase().includes(searchLower)) ||
      (organization.email && organization.email.toLowerCase().includes(searchLower)) ||
      (organization.industry && organization.industry.toLowerCase().includes(searchLower)) ||
      (organization.website && organization.website.toLowerCase().includes(searchLower)) ||
      organization.tags.some(tag => tag.toLowerCase().includes(searchLower))
    );
  });

  const handleNavigation = (page: 'dashboard' | 'events' | 'speakers' | 'organizations') => {
    setCurrentView(page);
    onNavigate(page);
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f9fafb' }}>
      {/* Left Sidebar */}
      <div style={{ 
        width: '256px', 
        backgroundColor: 'white', 
        borderRight: '1px solid #e5e7eb',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Logo Section */}
        <div style={{ padding: '24px', borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ 
              width: '32px', 
              height: '32px', 
              backgroundColor: 'black', 
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{ color: 'white', fontWeight: 'bold', fontSize: '14px' }}>P</span>
            </div>
            <span style={{ fontSize: '18px', fontWeight: '600', color: '#111827' }}>PBR Admin</span>
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              onClick={() => handleNavigation('dashboard')}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px', 
                padding: '8px 12px', 
                fontSize: '14px', 
                fontWeight: '500', 
                color: currentView === 'dashboard' ? '#111827' : '#6b7280', 
                backgroundColor: currentView === 'dashboard' ? '#f3f4f6' : 'transparent', 
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                width: '100%',
                textAlign: 'left'
              }}
            >
              <span>🏠</span>
              <span>Home</span>
            </button>
            <button
              onClick={() => handleNavigation('events')}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '12px', 
                padding: '8px 12px', 
                fontSize: '14px', 
                fontWeight: '500', 
                color: currentView === 'events' ? '#111827' : '#6b7280', 
                backgroundColor: currentView === 'events' ? '#f3f4f6' : 'transparent',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                width: '100%',
                textAlign: 'left'
              }}
            >
              <span>📅</span>
              <span>Events</span>
            </button>
            <button
              onClick={() => handleNavigation('speakers')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '8px 12px',
                fontSize: '14px',
                fontWeight: '500', 
                color: currentView === 'speakers' ? '#111827' : '#6b7280', 
                backgroundColor: currentView === 'speakers' ? '#f3f4f6' : 'transparent',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                width: '100%',
                textAlign: 'left'
              }}
            >
              <span>🎤</span>
              <span>Speakers</span>
            </button>
            <button
              onClick={() => handleNavigation('organizations')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '8px 12px',
                fontSize: '14px',
                fontWeight: '500', 
                color: currentView === 'organizations' ? '#111827' : '#6b7280', 
                backgroundColor: currentView === 'organizations' ? '#f3f4f6' : 'transparent',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                width: '100%',
                textAlign: 'left'
              }}
            >
              <span>🏢</span>
              <span>Organizations</span>
            </button>
            <a href="#" style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px', 
              padding: '8px 12px', 
              fontSize: '14px', 
              fontWeight: '500', 
              color: '#6b7280', 
              textDecoration: 'none'
            }}>
              <span>👥</span>
              <span>Orders</span>
            </a>
            <a href="#" style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px', 
              padding: '8px 12px', 
              fontSize: '14px', 
              fontWeight: '500', 
              color: '#6b7280', 
              textDecoration: 'none'
            }}>
              <span>⚙️</span>
              <span>Settings</span>
            </a>
          </div>
        </nav>

        {/* Upcoming Events Section */}
        <div style={{ padding: '16px', borderTop: '1px solid #e5e7eb' }}>
          <h3 style={{ 
            fontSize: '12px', 
            fontWeight: '600', 
            color: '#6b7280', 
            textTransform: 'uppercase', 
            letterSpacing: '0.05em',
            marginBottom: '12px'
          }}>
            Upcoming Events
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>Bear Hug: Live in Concert</div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>Six Fingers — DJ Set</div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>We All Look The Same</div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>Viking People</div>
          </div>
        </div>

        {/* Support Section */}
        <div style={{ padding: '16px', borderTop: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <a href="#" style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px', 
              padding: '8px 12px', 
              fontSize: '14px', 
              fontWeight: '500', 
              color: '#6b7280', 
              textDecoration: 'none'
            }}>
              <span>❓</span>
              <span>Support</span>
            </a>
            <a href="#" style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px', 
              padding: '8px 12px', 
              fontSize: '14px', 
              fontWeight: '500', 
              color: '#6b7280', 
              textDecoration: 'none'
            }}>
              <span>⭐</span>
              <span>Changelog</span>
            </a>
          </div>
        </div>

        {/* User Profile */}
        <div style={{ padding: '16px', borderTop: '1px solid #e5e7eb' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <img
              style={{ width: '32px', height: '32px', borderRadius: '50%' }}
              src="https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
              alt="Erica"
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '14px', fontWeight: '500', color: '#111827', margin: 0 }}>Erica</p>
              <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>erica@example.com</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            style={{
              width: '100%',
              backgroundColor: '#F3F4F6',
              color: '#374151',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 12px',
              fontSize: '12px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <main style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
            {/* Conditional Content Based on Current View */}
            {currentView === 'dashboard' && (
              <>
                {/* Greeting */}
                <h1 style={{ fontSize: '30px', fontWeight: 'bold', color: '#111827', marginBottom: '32px' }}>
                  Good afternoon, Erica
                </h1>

            {/* Overview Section */}
            <div style={{ marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#111827' }}>Overview</h2>
                <select style={{ 
                  fontSize: '14px', 
                  border: '1px solid #d1d5db', 
                  borderRadius: '6px', 
                  padding: '4px 12px',
                  backgroundColor: 'white'
                }}>
                  <option>Last week</option>
                  <option>Last month</option>
                  <option>Last quarter</option>
                </select>
              </div>

              {/* Metrics Cards */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                gap: '24px', 
                marginBottom: '32px' 
              }}>
                {/* Total Revenue */}
                <div style={{ 
                  backgroundColor: 'white', 
                  padding: '24px', 
                  borderRadius: '8px', 
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', marginBottom: '8px' }}>
                    Total revenue
                  </h3>
                  <p style={{ fontSize: '30px', fontWeight: 'bold', color: '#111827', marginBottom: '4px' }}>
                    $2.6M
                  </p>
                  <p style={{ fontSize: '14px', color: '#16a34a' }}>+4.5% from last week</p>
                </div>

                {/* Average Order Value */}
                <div style={{ 
                  backgroundColor: 'white', 
                  padding: '24px', 
                  borderRadius: '8px', 
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', marginBottom: '8px' }}>
                    Average order value
                  </h3>
                  <p style={{ fontSize: '30px', fontWeight: 'bold', color: '#111827', marginBottom: '4px' }}>
                    $455
                  </p>
                  <p style={{ fontSize: '14px', color: '#dc2626' }}>-0.5% from last week</p>
                </div>

                {/* Tickets Sold */}
                <div style={{ 
                  backgroundColor: 'white', 
                  padding: '24px', 
                  borderRadius: '8px', 
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', marginBottom: '8px' }}>
                    Tickets sold
                  </h3>
                  <p style={{ fontSize: '30px', fontWeight: 'bold', color: '#111827', marginBottom: '4px' }}>
                    5,888
                  </p>
                  <p style={{ fontSize: '14px', color: '#16a34a' }}>+4.5% from last week</p>
                </div>

                {/* Pageviews */}
                <div style={{ 
                  backgroundColor: 'white', 
                  padding: '24px', 
                  borderRadius: '8px', 
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                }}>
                  <h3 style={{ fontSize: '14px', fontWeight: '500', color: '#6b7280', marginBottom: '8px' }}>
                    Pageviews
                  </h3>
                  <p style={{ fontSize: '30px', fontWeight: 'bold', color: '#111827', marginBottom: '4px' }}>
                    823,067
                  </p>
                  <p style={{ fontSize: '14px', color: '#16a34a' }}>+21.2% from last week</p>
                </div>
              </div>
            </div>

            {/* Recent Orders Section */}
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', marginBottom: '24px' }}>
                Recent orders
              </h2>
              <div style={{ 
                backgroundColor: 'white', 
                borderRadius: '8px', 
                border: '1px solid #e5e7eb',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                overflow: 'hidden'
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ backgroundColor: '#f9fafb' }}>
                    <tr>
                      <th style={{ 
                        padding: '12px 24px', 
                        textAlign: 'left', 
                        fontSize: '12px', 
                        fontWeight: '500', 
                        color: '#6b7280', 
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        borderBottom: '1px solid #e5e7eb'
                      }}>
                        Order number
                      </th>
                      <th style={{ 
                        padding: '12px 24px', 
                        textAlign: 'left', 
                        fontSize: '12px', 
                        fontWeight: '500', 
                        color: '#6b7280', 
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        borderBottom: '1px solid #e5e7eb'
                      }}>
                        Purchase date
                      </th>
                      <th style={{ 
                        padding: '12px 24px', 
                        textAlign: 'left', 
                        fontSize: '12px', 
                        fontWeight: '500', 
                        color: '#6b7280', 
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        borderBottom: '1px solid #e5e7eb'
                      }}>
                        Customer
                      </th>
                      <th style={{ 
                        padding: '12px 24px', 
                        textAlign: 'left', 
                        fontSize: '12px', 
                        fontWeight: '500', 
                        color: '#6b7280', 
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        borderBottom: '1px solid #e5e7eb'
                      }}>
                        Event
                      </th>
                      <th style={{ 
                        padding: '12px 24px', 
                        textAlign: 'left', 
                        fontSize: '12px', 
                        fontWeight: '500', 
                        color: '#6b7280', 
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        borderBottom: '1px solid #e5e7eb'
                      }}>
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ 
                        padding: '16px 24px', 
                        fontSize: '14px', 
                        fontWeight: '500', 
                        color: '#111827',
                        borderBottom: '1px solid #e5e7eb'
                      }}>
                        3000
                      </td>
                      <td style={{ 
                        padding: '16px 24px', 
                        fontSize: '14px', 
                        color: '#6b7280',
                        borderBottom: '1px solid #e5e7eb'
                      }}>
                        May 9, 2024
                      </td>
                      <td style={{ 
                        padding: '16px 24px', 
                        fontSize: '14px', 
                        color: '#111827',
                        borderBottom: '1px solid #e5e7eb'
                      }}>
                        Leslie Alexander
                      </td>
                      <td style={{ 
                        padding: '16px 24px',
                        borderBottom: '1px solid #e5e7eb'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <img
                            style={{ width: '24px', height: '24px', borderRadius: '50%', marginRight: '8px' }}
                            src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                            alt="Bear Hug"
                          />
                          <span style={{ fontSize: '14px', color: '#111827' }}>Bear Hug: Live in Concert</span>
                        </div>
                      </td>
                      <td style={{ 
                        padding: '16px 24px', 
                        fontSize: '14px', 
                        color: '#111827',
                        borderBottom: '1px solid #e5e7eb'
                      }}>
                        US$80.00
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
              </>
            )}

            {/* Speakers View */}
            {currentView === 'speakers' && (
              <>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
                  <h1 style={{ fontSize: '30px', fontWeight: 'bold', color: '#111827' }}>
                    Speakers Management
                  </h1>
                  <button
                    onClick={() => setShowSpeakerForm(true)}
                    style={{
                      backgroundColor: '#3B82F6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '12px 24px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <span>+</span>
                    Add Speaker
                  </button>
                </div>

                {/* Error Message */}
                {speakersError && (
                  <div style={{
                    backgroundColor: '#FEF2F2',
                    border: '1px solid #FECACA',
                    borderRadius: '8px',
                    padding: '16px',
                    marginBottom: '24px',
                    color: '#DC2626'
                  }}>
                    {speakersError}
                  </div>
                )}

                {/* Search and View Toggle */}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  marginBottom: '24px',
                  gap: '16px'
                }}>
                  <div style={{ flex: 1, maxWidth: '400px' }}>
                    <input
                      type="text"
                      placeholder="Search speakers..."
                      value={speakerSearchTerm}
                      onChange={(e) => setSpeakerSearchTerm(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '14px',
                        backgroundColor: 'white'
                      }}
                    />
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ fontSize: '14px', color: '#6b7280' }}>
                      {filteredSpeakers.length} of {speakers.length} speakers
                    </div>
                    
                    {/* View Toggle */}
                    <div style={{ 
                      display: 'flex', 
                      backgroundColor: '#f3f4f6', 
                      borderRadius: '6px', 
                      padding: '2px'
                    }}>
                      <button
                        onClick={() => setSpeakerViewMode('grid')}
                        style={{
                          padding: '6px 12px',
                          fontSize: '14px',
                          fontWeight: '500',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          backgroundColor: speakerViewMode === 'grid' ? 'white' : 'transparent',
                          color: speakerViewMode === 'grid' ? '#111827' : '#6b7280',
                          boxShadow: speakerViewMode === 'grid' ? '0 1px 2px 0 rgba(0, 0, 0, 0.05)' : 'none'
                        }}
                      >
                        Grid
                      </button>
                      <button
                        onClick={() => setSpeakerViewMode('list')}
                        style={{
                          padding: '6px 12px',
                          fontSize: '14px',
                          fontWeight: '500',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          backgroundColor: speakerViewMode === 'list' ? 'white' : 'transparent',
                          color: speakerViewMode === 'list' ? '#111827' : '#6b7280',
                          boxShadow: speakerViewMode === 'list' ? '0 1px 2px 0 rgba(0, 0, 0, 0.05)' : 'none'
                        }}
                      >
                        List
                      </button>
                    </div>
                  </div>
                </div>

                {/* Form Modal */}
                {showSpeakerForm && (
                  <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 50
                  }}>
                    <div style={{
                      backgroundColor: 'white',
                      borderRadius: '8px',
                      padding: '24px',
                      maxWidth: '800px',
                      width: '90%',
                      maxHeight: '90vh',
                      overflowY: 'auto',
                      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                    }}>
                      <SpeakerForm
                        speaker={editingSpeaker || undefined}
                        onSubmit={editingSpeaker ? handleUpdateSpeaker : handleCreateSpeaker}
                        onCancel={handleCancelSpeakerForm}
                        isLoading={speakerFormLoading}
                      />
                    </div>
                  </div>
                )}

                {/* Loading State */}
                {speakersLoading && (
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    padding: '48px' 
                  }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      border: '3px solid #e5e7eb',
                      borderTop: '3px solid #3B82F6',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                  </div>
                )}

                {/* Empty State */}
                {!speakersLoading && filteredSpeakers.length === 0 && (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '48px',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb'
                  }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎤</div>
                    <h3 style={{ 
                      fontSize: '18px', 
                      fontWeight: '600', 
                      color: '#111827', 
                      marginBottom: '8px' 
                    }}>
                      {speakerSearchTerm ? 'No speakers found' : 'No speakers yet'}
                    </h3>
                    <p style={{ 
                      fontSize: '14px', 
                      color: '#6b7280', 
                      marginBottom: '24px' 
                    }}>
                      {speakerSearchTerm 
                        ? 'Try adjusting your search terms.' 
                        : 'Get started by creating your first speaker profile.'
                      }
                    </p>
                    {!speakerSearchTerm && (
                      <button
                        onClick={() => setShowSpeakerForm(true)}
                        style={{
                          backgroundColor: '#3B82F6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '12px 24px',
                          fontSize: '14px',
                          fontWeight: '500',
                          cursor: 'pointer'
                        }}
                      >
                        + Add Speaker
                      </button>
                    )}
                  </div>
                )}

                {/* Speakers Content */}
                {!speakersLoading && filteredSpeakers.length > 0 && (
                  <div style={{ 
                    backgroundColor: 'white', 
                    borderRadius: '8px', 
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                    padding: '24px'
                  }}>
                    {speakerViewMode === 'grid' ? (
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
                        gap: '24px' 
                      }}>
                        {filteredSpeakers.map((speaker) => (
                          <SpeakerCard
                            key={speaker.id}
                            speaker={speaker}
                            onEdit={handleEditSpeaker}
                            onDelete={handleDeleteSpeaker}
                          />
                        ))}
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {filteredSpeakers.map((speaker) => (
                          <SpeakerListCard
                            key={speaker.id}
                            speaker={speaker}
                            onEdit={handleEditSpeaker}
                            onDelete={handleDeleteSpeaker}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Organizations View */}
            {currentView === 'organizations' && (
              <>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
                  <h1 style={{ fontSize: '30px', fontWeight: 'bold', color: '#111827' }}>
                    Organizations Management
                  </h1>
                  <button
                    onClick={() => setShowOrganizationForm(true)}
                    style={{
                      backgroundColor: '#3B82F6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '12px 24px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <span>+</span>
                    <span>Add Organization</span>
                  </button>
                </div>

                {/* Error Message */}
                {organizationsError && (
                  <div style={{
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '8px',
                    padding: '16px',
                    marginBottom: '24px'
                  }}>
                    <p style={{ color: '#dc2626', fontSize: '14px', margin: '0' }}>
                      {organizationsError}
                    </p>
                  </div>
                )}

                {/* Search and Stats */}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  marginBottom: '24px',
                  gap: '16px'
                }}>
                  <div style={{ flex: 1, maxWidth: '400px' }}>
                    <input
                      type="text"
                      placeholder="Search organizations..."
                      value={organizationSearchTerm}
                      onChange={(e) => setOrganizationSearchTerm(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '14px',
                        backgroundColor: 'white',
                        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                      }}
                    />
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ fontSize: '14px', color: '#6b7280' }}>
                      {filteredOrganizations.length} of {organizations.length} organizations
                    </div>
                    
                    {/* View Toggle */}
                    <div style={{ 
                      display: 'flex', 
                      backgroundColor: '#f3f4f6', 
                      borderRadius: '6px', 
                      padding: '2px'
                    }}>
                      <button
                        onClick={() => setOrganizationViewMode('grid')}
                        style={{
                          padding: '6px 12px',
                          fontSize: '12px',
                          fontWeight: '500',
                          color: organizationViewMode === 'grid' ? '#111827' : '#6b7280',
                          backgroundColor: organizationViewMode === 'grid' ? 'white' : 'transparent',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          boxShadow: organizationViewMode === 'grid' ? '0 1px 2px 0 rgba(0, 0, 0, 0.05)' : 'none'
                        }}
                      >
                        Grid
                      </button>
                      <button
                        onClick={() => setOrganizationViewMode('list')}
                        style={{
                          padding: '6px 12px',
                          fontSize: '12px',
                          fontWeight: '500',
                          color: organizationViewMode === 'list' ? '#111827' : '#6b7280',
                          backgroundColor: organizationViewMode === 'list' ? 'white' : 'transparent',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          boxShadow: organizationViewMode === 'list' ? '0 1px 2px 0 rgba(0, 0, 0, 0.05)' : 'none'
                        }}
                      >
                        List
                      </button>
                    </div>
                  </div>
                </div>

                {/* Loading State */}
                {organizationsLoading && (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '48px',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb'
                  }}>
                    <div style={{ 
                      width: '32px', 
                      height: '32px', 
                      border: '3px solid #f3f4f6', 
                      borderTop: '3px solid #3b82f6', 
                      borderRadius: '50%', 
                      animation: 'spin 1s linear infinite',
                      margin: '0 auto 16px'
                    }}></div>
                    <p style={{ color: '#6b7280', fontSize: '14px' }}>Loading organizations...</p>
                  </div>
                )}

                {/* Empty State */}
                {!organizationsLoading && filteredOrganizations.length === 0 && (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '48px',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb'
                  }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏢</div>
                    <h3 style={{ 
                      fontSize: '18px', 
                      fontWeight: '600', 
                      color: '#111827', 
                      marginBottom: '8px' 
                    }}>
                      {organizationSearchTerm ? 'No organizations found' : 'No organizations yet'}
                    </h3>
                    <p style={{ 
                      fontSize: '14px',
                      color: '#6b7280',
                      marginBottom: '24px'
                    }}>
                      {organizationSearchTerm 
                        ? 'Try adjusting your search terms to find organizations.'
                        : 'Get started by creating your first organization profile.'
                      }
                    </p>
                    {!organizationSearchTerm && (
                      <button
                        onClick={() => setShowOrganizationForm(true)}
                        style={{
                          backgroundColor: '#3B82F6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '12px 24px',
                          fontSize: '14px',
                          fontWeight: '500',
                          cursor: 'pointer'
                        }}
                      >
                        Create Organization
                      </button>
                    )}
                  </div>
                )}

                {/* Organizations Content */}
                {!organizationsLoading && filteredOrganizations.length > 0 && (
                  <div style={{ 
                    backgroundColor: 'white', 
                    borderRadius: '8px', 
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                    padding: '24px'
                  }}>
                    {organizationViewMode === 'grid' ? (
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
                        gap: '24px' 
                      }}>
                        {filteredOrganizations.map((organization) => (
                          <OrganizationCard
                            key={organization.id}
                            organization={organization}
                            onEdit={handleEditOrganization}
                            onDelete={handleDeleteOrganization}
                          />
                        ))}
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {filteredOrganizations.map((organization) => (
                          <OrganizationListCard
                            key={organization.id}
                            organization={organization}
                            onEdit={handleEditOrganization}
                            onDelete={handleDeleteOrganization}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Form Modal */}
                {showOrganizationForm && (
                  <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                  }}>
                    <div style={{
                      backgroundColor: 'white',
                      borderRadius: '12px',
                      width: '90%',
                      maxHeight: '90vh',
                      overflowY: 'auto',
                      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                    }}>
                      <OrganizationForm
                        organization={editingOrganization || undefined}
                        onSubmit={editingOrganization ? handleUpdateOrganization : handleCreateOrganization}
                        onCancel={handleCancelOrganizationForm}
                        isLoading={organizationFormLoading}
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Events View - Placeholder */}
            {currentView === 'events' && (
              <div style={{ textAlign: 'center', padding: '48px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', marginBottom: '16px' }}>Events</h1>
                <p style={{ color: '#6b7280' }}>Events management will be integrated here.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardPage;