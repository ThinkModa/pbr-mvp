import React, { useState, useEffect } from 'react';
import { EventsService, EventWithActivities } from '../services/eventsService';

interface Activity {
  id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
}

interface ActivityAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (activityIds: string[]) => Promise<void>;
  assignedEventIds: string[];
  currentActivityIds: string[];
  title: string; // e.g., "Assign John Smith to Activities"
}

const ActivityAssignmentModal: React.FC<ActivityAssignmentModalProps> = ({
  isOpen,
  onClose,
  onAssign,
  assignedEventIds,
  currentActivityIds,
  title,
}) => {
  const [events, setEvents] = useState<EventWithActivities[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [selectedActivityIds, setSelectedActivityIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load events on modal open
  useEffect(() => {
    if (isOpen) {
      loadEvents();
    }
  }, [isOpen]);

  // Initialize selected activities when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedActivityIds([...currentActivityIds]);
      setSelectedEventId('');
      setError(null);
    }
  }, [isOpen, currentActivityIds]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const eventsData = await EventsService.getEvents();
      
      // Filter to only show events that the speaker/org is assigned to
      const assignedEvents = eventsData.filter(event => 
        assignedEventIds.includes(event.id)
      );
      
      setEvents(assignedEvents);
      
      // Auto-select first event if only one assigned event
      if (assignedEvents.length === 1) {
        setSelectedEventId(assignedEvents[0].id);
      }
    } catch (err) {
      console.error('Error loading events:', err);
      setError('Failed to load events. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEventChange = (eventId: string) => {
    setSelectedEventId(eventId);
    // Clear activity selections when event changes
    setSelectedActivityIds([]);
  };

  const handleActivityToggle = (activityId: string) => {
    setSelectedActivityIds(prev => {
      if (prev.includes(activityId)) {
        return prev.filter(id => id !== activityId);
      } else {
        return [...prev, activityId];
      }
    });
  };

  const handleSelectAll = () => {
    const currentEvent = events.find(e => e.id === selectedEventId);
    if (currentEvent) {
      const allActivityIds = currentEvent.activities.map(a => a.id);
      setSelectedActivityIds(allActivityIds);
    }
  };

  const handleDeselectAll = () => {
    setSelectedActivityIds([]);
  };

  const handleAssign = async () => {
    if (selectedActivityIds.length === 0) {
      setError('Please select at least one activity.');
      return;
    }

    try {
      setAssigning(true);
      setError(null);
      await onAssign(selectedActivityIds);
      onClose();
    } catch (err) {
      console.error('Error assigning to activities:', err);
      setError('Failed to assign to activities. Please try again.');
    } finally {
      setAssigning(false);
    }
  };

  const getCurrentEvent = () => {
    return events.find(e => e.id === selectedEventId);
  };

  const getCurrentActivities = () => {
    const currentEvent = getCurrentEvent();
    return currentEvent ? currentEvent.activities : [];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-600 mt-1">
            Select activities to assign. You can only assign to activities within events you're already assigned to.
          </p>
        </div>

        {/* Content */}
        <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading events...</span>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-800">{error}</p>
            </div>
          ) : (
            <>
              {/* Event Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Event:
                </label>
                <select
                  value={selectedEventId}
                  onChange={(e) => handleEventChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Choose an event...</option>
                  {events.map(event => (
                    <option key={event.id} value={event.id}>
                      {event.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Activities Selection */}
              {selectedEventId && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Activities in {getCurrentEvent()?.name}:
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleSelectAll}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        Select All
                      </button>
                      <span className="text-gray-300">|</span>
                      <button
                        type="button"
                        onClick={handleDeselectAll}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        Deselect All
                      </button>
                    </div>
                  </div>


                  <div className="space-y-3">
                    {getCurrentActivities().map(activity => (
                      <div
                        key={activity.id}
                        className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        <input
                          type="checkbox"
                          id={`activity-${activity.id}`}
                          checked={selectedActivityIds.includes(activity.id)}
                          onChange={() => handleActivityToggle(activity.id)}
                          className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <label
                            htmlFor={`activity-${activity.id}`}
                            className="block text-sm font-medium text-gray-900 cursor-pointer"
                          >
                            {activity.title}
                          </label>
                          {activity.description && (
                            <p className="text-sm text-gray-600 mt-1">
                              {activity.description}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(activity.start_time).toLocaleDateString()} •{' '}
                            {new Date(activity.start_time).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })} - {new Date(activity.end_time).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {getCurrentActivities().length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <p>No activities found for this event.</p>
                      <p className="text-xs mt-2">Check the debug info above to see what's happening.</p>
                    </div>
                  )}
                </div>
              )}

              {!selectedEventId && events.length > 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>Please select an event to view its activities.</p>
                </div>
              )}

              {events.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>No events found. Please assign to an event first.</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleAssign}
            disabled={assigning || selectedActivityIds.length === 0}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {assigning ? 'Assigning...' : `Assign to ${selectedActivityIds.length} Selected`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActivityAssignmentModal;
