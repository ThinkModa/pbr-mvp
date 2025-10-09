import React, { useState, useEffect } from 'react';
import AttendeesService, { EventAttendee, AttendeesFilter } from '../services/attendeesService';

interface AttendeesManagementProps {
  isOpen: boolean;
  onClose: () => void;
}

const AttendeesManagement: React.FC<AttendeesManagementProps> = ({ isOpen, onClose }) => {
  const [attendees, setAttendees] = useState<EventAttendee[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<AttendeesFilter>({});
  const [events, setEvents] = useState<{id: string, title: string}[]>([]);
  const [viewMode, setViewMode] = useState<'all' | 'unique'>('all');

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      loadAttendees();
    }
  }, [filters, viewMode, isOpen]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [attendeesData, eventsData] = await Promise.all([
        viewMode === 'unique' ? AttendeesService.getUniqueUsers() : AttendeesService.getAllEventUsers(),
        AttendeesService.getEventsForFilter()
      ]);
      setAttendees(attendeesData);
      setEvents(eventsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadAttendees = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let attendeesData: EventAttendee[];
      if (Object.keys(filters).length === 0) {
        attendeesData = viewMode === 'unique' 
          ? await AttendeesService.getUniqueUsers() 
          : await AttendeesService.getAllEventUsers();
      } else {
        attendeesData = await AttendeesService.getFilteredAttendees(filters);
      }
      
      setAttendees(attendeesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load attendees');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof AttendeesFilter, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined
    }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'attending':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'not_attending':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Event Attendees Management</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Filters */}
        <div className="p-6 border-b bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            {/* View Mode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                View Mode
              </label>
              <select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value as 'all' | 'unique')}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All RSVPs</option>
                <option value="unique">Unique Users</option>
              </select>
            </div>

            {/* Event Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Event
              </label>
              <select
                value={filters.eventId || ''}
                onChange={(e) => handleFilterChange('eventId', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Events</option>
                {events.map(event => (
                  <option key={event.id} value={event.id}>
                    {event.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filters.status || ''}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="attending">Attending</option>
                <option value="pending">Pending</option>
                <option value="not_attending">Not Attending</option>
              </select>
            </div>

            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <input
                type="text"
                placeholder="Name, email, title..."
                value={filters.searchTerm || ''}
                onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-between items-center">
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              Clear Filters
            </button>
            <div className="text-sm text-gray-600">
              {attendees.length} {viewMode === 'unique' ? 'unique users' : 'RSVPs'} found
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading attendees...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  onClick={loadAttendees}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full overflow-auto">
              {attendees.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <p className="text-gray-600 mb-4">No attendees found</p>
                    <button
                      onClick={clearFilters}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Contact
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Event
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Track
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          RSVP Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {attendees.map((attendee) => (
                        <tr key={`${attendee.id}-${attendee.event_id}`} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                {attendee.avatar_url ? (
                                  <img
                                    className="h-10 w-10 rounded-full"
                                    src={attendee.avatar_url}
                                    alt={`${attendee.first_name} ${attendee.last_name}`}
                                  />
                                ) : (
                                  <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                                    <span className="text-white font-medium text-sm">
                                      {attendee.first_name.charAt(0)}{attendee.last_name.charAt(0)}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {attendee.first_name} {attendee.last_name}
                                </div>
                                {attendee.title_position && (
                                  <div className="text-sm text-gray-500">
                                    {attendee.title_position}
                                  </div>
                                )}
                                {attendee.organization_affiliation && (
                                  <div className="text-sm text-gray-500">
                                    {attendee.organization_affiliation}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{attendee.email}</div>
                            {attendee.phone_number && (
                              <div className="text-sm text-gray-500">{attendee.phone_number}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{attendee.event_title}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(attendee.rsvp_status)}`}>
                              {attendee.rsvp_status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {attendee.track_name || 'No track'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(attendee.rsvp_created_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttendeesManagement;
