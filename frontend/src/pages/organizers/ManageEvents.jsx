import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button";
import { Plus, Edit2, Trash2, Eye, CheckCircle, AlertCircle } from "lucide-react";
import { useAuth } from "../../features/auth/useAuth";
import { getOrganizerEvents, publishEvent, cancelEvent, deleteEvent } from "../../features/events/eventApi";
import toast from "react-hot-toast";

export default function ManageEvents() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [publishingId, setPublishingId] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  // Redirect if not organizer
  if (isAuthenticated && user?.role !== "organizer") {
    return (
      <div className="min-h-screen pt-20 flex items-center justify-center bg-black">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-gray-400 mb-8">Only organizers can manage events.</p>
          <Button onClick={() => navigate("/")} variant="primary">
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const data = await getOrganizerEvents();
      setEvents(data.events || []);
    } catch (error) {
      console.error('Failed to fetch events:', error);
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (eventId) => {
    setPublishingId(eventId);
    try {
      await publishEvent(eventId);
      toast.success('Event published successfully');
      fetchEvents();
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to publish event';
      toast.error(errorMsg);
    } finally {
      setPublishingId(null);
    }
  };

  const handleCancel = async (eventId) => {
    if (window.confirm('Are you sure you want to cancel this event?')) {
      setCancellingId(eventId);
      try {
        await cancelEvent(eventId);
        toast.success('Event cancelled successfully');
        fetchEvents();
      } catch (error) {
        const errorMsg = error.response?.data?.message || 'Failed to cancel event';
        toast.error(errorMsg);
      } finally {
        setCancellingId(null);
      }
    }
  };

  const handleDelete = async (eventId) => {
    if (window.confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      setDeletingId(eventId);
      try {
        await deleteEvent(eventId);
        toast.success('Event deleted successfully');
        fetchEvents();
      } catch (error) {
        const errorMsg = error.response?.data?.message || 'Failed to delete event';
        toast.error(errorMsg);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { bg: 'bg-gray-700', text: 'text-gray-100', icon: AlertCircle, label: 'Draft' },
      published: { bg: 'bg-green-700', text: 'text-green-100', icon: CheckCircle, label: 'Published' },
      cancelled: { bg: 'bg-red-700', text: 'text-red-100', icon: AlertCircle, label: 'Cancelled' }
    };
    const config = statusConfig[status] || statusConfig.draft;
    const Icon = config.icon;
    return (
      <span className={`flex items-center space-x-1 px-3 py-1 rounded-full ${config.bg} ${config.text} text-sm font-medium`}>
        <Icon size={14} />
        <span>{config.label}</span>
      </span>
    );
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen pt-20 pb-12 bg-black">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Manage Events</h1>
            <p className="text-gray-400">Create, edit, and manage your events</p>
          </div>
          <Button
            onClick={() => navigate('/create-event')}
            variant="primary"
            className="flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Create Event</span>
          </Button>
        </div>

        {/* Events List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-400">Loading events...</div>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-12 bg-gray-900/50 border border-gray-800 rounded-xl">
            <h2 className="text-xl font-semibold text-white mb-2">No events yet</h2>
            <p className="text-gray-400 mb-6">Create your first event to get started</p>
            <Button
              onClick={() => navigate('/create-event')}
              variant="primary"
            >
              Create Event
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map(event => (
              <div
                key={event._id}
                className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 hover:border-gray-700 transition-colors"
              >
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-bold text-white">{event.title}</h3>
                      {getStatusBadge(event.status)}
                    </div>
                    <p className="text-gray-400 mb-3 line-clamp-2">{event.description}</p>
                    <div className="space-y-2 text-sm text-gray-400">
                      <p>
                        <span className="font-medium text-gray-300">Venue:</span> {event.venue.name}, {event.venue.city}
                      </p>
                      <p>
                        <span className="font-medium text-gray-300">Starts:</span> {formatDate(event.startAt)}
                      </p>
                      <p>
                        <span className="font-medium text-gray-300">Ends:</span> {formatDate(event.endAt)}
                      </p>
                      <p>
                        <span className="font-medium text-gray-300">Capacity:</span> {event.capacity} attendees
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 md:flex-col md:items-end">
                    {event.status === 'draft' && (
                      <>
                        <Button
                          onClick={() => navigate(`/edit-event/${event._id}`)}
                          variant="ghost"
                          size="sm"
                          className="flex items-center space-x-2"
                        >
                          <Edit2 size={16} />
                          <span>Edit</span>
                        </Button>
                        <Button
                          onClick={() => navigate(`/event/${event._id}/manage-tickets`)}
                          variant="ghost"
                          size="sm"
                          className="flex items-center space-x-2"
                        >
                          <span>Tickets</span>
                        </Button>
                        <Button
                          onClick={() => handlePublish(event._id)}
                          variant="primary"
                          size="sm"
                          disabled={publishingId === event._id}
                        >
                          {publishingId === event._id ? 'Publishing...' : 'Publish'}
                        </Button>
                        <Button
                          onClick={() => handleDelete(event._id)}
                          variant="danger"
                          size="sm"
                          disabled={deletingId === event._id}
                        >
                          {deletingId === event._id ? 'Deleting...' : 'Delete'}
                        </Button>
                      </>
                    )}

                    {event.status === 'published' && (
                      <>
                        <Button
                          onClick={() => navigate(`/event/${event._id}`)}
                          variant="ghost"
                          size="sm"
                          className="flex items-center space-x-2"
                        >
                          <Eye size={16} />
                          <span>View</span>
                        </Button>
                        <Button
                          onClick={() => navigate(`/event/${event._id}/manage-tickets`)}
                          variant="ghost"
                          size="sm"
                          className="flex items-center space-x-2"
                        >
                          <span>Tickets</span>
                        </Button>
                        <Button
                          onClick={() => handleCancel(event._id)}
                          variant="danger"
                          size="sm"
                          disabled={cancellingId === event._id}
                        >
                          {cancellingId === event._id ? 'Cancelling...' : 'Cancel'}
                        </Button>
                      </>
                    )}

                    {event.status === 'cancelled' && (
                      <Button
                        onClick={() => handleDelete(event._id)}
                        variant="danger"
                        size="sm"
                        disabled={deletingId === event._id}
                      >
                        {deletingId === event._id ? 'Deleting...' : 'Delete'}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
