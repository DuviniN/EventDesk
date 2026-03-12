import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import { Plus, Edit2, Trash2, Eye, CheckCircle, AlertCircle, Ticket, X, Loader2, PlusCircle, KeyRound, Copy } from "lucide-react";
import { useAuth } from "../../features/auth/useAuth";
import { getOrganizerEvents, publishEvent, cancelEvent, deleteEvent, setEventCheckInCode } from "../../features/events/eventApi";
import { getTicketTypes, createTicketType, updateTicketType } from "../../features/tickets/ticketsApi";
import toast from "react-hot-toast";
import Navbar from "../../components/common/Navbar";

export default function ManageEvents() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [publishingId, setPublishingId] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [savingCodeId, setSavingCodeId] = useState(null);
  const [codeEdits, setCodeEdits] = useState({});
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [modalEvent, setModalEvent] = useState(null);
  const [ticketRows, setTicketRows] = useState([]);
  const [savingTickets, setSavingTickets] = useState(false);
  const [loadingTickets, setLoadingTickets] = useState(false);

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
      const list = data.events || [];
      setEvents(list);
      const map = {};
      list.forEach((evt) => {
        map[evt._id] = evt.checkInCode || "";
      });
      setCodeEdits(map);
    } catch (error) {
      console.error('Failed to fetch events:', error);
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCode = async (eventId) => {
    const code = (codeEdits[eventId] || "").trim();
    if (code.length < 4) {
      toast.error('Code must be at least 4 characters');
      return;
    }
    setSavingCodeId(eventId);
    try {
      await setEventCheckInCode(eventId, code);
      toast.success('Check-in code updated');
      await fetchEvents();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update code');
    } finally {
      setSavingCodeId(null);
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

  const openTicketModal = async (event) => {
    setModalEvent(event);
    setTicketModalOpen(true);
    setLoadingTickets(true);
    try {
      const res = await getTicketTypes(event._id);
      const types = res.ticketTypes || [];
      const base = types.length ? types.map(t => ({
        id: t._id || t.id,
        label: t.name?.replace(/^\s+|\s+$/g, '') || 'Ticket',
        price: t.price ?? '',
        quantityTotal: t.quantityTotal ?? '',
        description: t.description || ''
      })) : [
        { id: null, label: 'VIP', price: '', quantityTotal: '', description: '' },
        { id: null, label: 'Regular', price: '', quantityTotal: '', description: '' }
      ];
      setTicketRows(base);
    } catch (err) {
      console.error(err);
      toast.error('Could not load ticket types');
      setTicketRows([
        { id: null, label: 'VIP', price: '', quantityTotal: '', description: '' },
        { id: null, label: 'Regular', price: '', quantityTotal: '', description: '' }
      ]);
    } finally {
      setLoadingTickets(false);
    }
  };

  const handleSaveTickets = async () => {
    if (!modalEvent) return;
    setSavingTickets(true);
    try {
      const jobs = [];
      ticketRows.forEach(row => {
        const hasInput = row.label && (row.price !== '' || row.quantityTotal !== '' || row.description);
        if (!hasInput) return;
        const payload = {
          name: `${modalEvent.title}${row.label ? ` - ${row.label}` : ''}`,
          tier: row.label,
          price: row.price === '' ? 0 : Number(row.price),
          quantityTotal: row.quantityTotal === '' ? 0 : Number(row.quantityTotal),
          description: row.description || ''
        };
        if (row.id) {
          jobs.push(updateTicketType(modalEvent._id, row.id, payload));
        } else {
          jobs.push(createTicketType(modalEvent._id, payload));
        }
      });
      await Promise.all(jobs);
      toast.success('Tickets saved');
      await fetchEvents();
      setTicketModalOpen(false);
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Failed to save tickets');
    } finally {
      setSavingTickets(false);
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

  const firstEmptyIndex = ticketRows.findIndex(r => !r.label);

  const stats = useMemo(() => {
    const total = events.length;
    const published = events.filter(e => e.status === 'published').length;
    const draft = events.filter(e => e.status === 'draft').length;
    return { total, published, draft };
  }, [events]);

  return (
    <>
      <Navbar />
      <div className="min-h-screen pt-20 pb-12 bg-black">
        <div className="max-w-6xl mx-auto px-6 space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900/50 via-gray-900 to-gray-900 border border-gray-800 rounded-2xl p-6 shadow-2xl shadow-black/40 flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.2em] text-purple-200">Organizer</p>
              <h1 className="text-4xl font-bold text-white">Manage Events</h1>
              <p className="text-gray-400">Create, edit, publish, and add tickets from one place.</p>
            </div>
            <Button
              onClick={() => navigate('/create-event')}
              variant="primary"
              className="flex items-center space-x-2">
              <Plus size={20} />
              <span>Create Event</span>
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl border border-gray-800 bg-black/30 p-3">
              <p className="text-xs text-gray-500">Total events</p>
              <p className="text-2xl font-semibold text-white">{stats.total}</p>
            </div>
            <div className="rounded-xl border border-gray-800 bg-black/30 p-3">
              <p className="text-xs text-gray-500">Published</p>
              <p className="text-2xl font-semibold text-green-400">{stats.published}</p>
            </div>
            <div className="rounded-xl border border-gray-800 bg-black/30 p-3">
              <p className="text-xs text-gray-500">Drafts</p>
              <p className="text-2xl font-semibold text-yellow-200">{stats.draft}</p>
            </div>
          </div>
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {events.map(event => (
              <div
                key={event._id}
                className="bg-gray-900/70 border border-gray-800 rounded-2xl p-6 hover:border-purple-700/50 transition-colors shadow-lg shadow-black/30"
              >
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2 flex-wrap">
                      <h3 className="text-xl font-bold text-white line-clamp-1">{event.title}</h3>
                      {getStatusBadge(event.status)}
                    </div>
                    <p className="text-gray-400 mb-3 line-clamp-3">{event.description}</p>
                    <div className="space-y-2 text-sm text-gray-300">
                      <p>
                        <span className="font-semibold text-white/80">Venue:</span> {event.venue.name}, {event.venue.city}
                      </p>
                      <p>
                        <span className="font-semibold text-white/80">Starts:</span> {formatDate(event.startAt)}
                      </p>
                      <p>
                        <span className="font-semibold text-white/80">Ends:</span> {formatDate(event.endAt)}
                      </p>
                      <p>
                        <span className="font-semibold text-white/80">Capacity:</span> {event.capacity} attendees
                      </p>
                      <div className="flex flex-col gap-2 rounded-lg border border-purple-800/60 bg-purple-900/30 px-3 py-2 text-xs text-purple-100">
                        <div className="flex items-center gap-2">
                          <KeyRound size={14} className="text-purple-300" />
                          <span className="font-semibold text-white">Check-in code</span>
                          {event.checkInCode ? (
                            <button
                              type="button"
                              onClick={() => navigator.clipboard.writeText(codeEdits[event._id] || event.checkInCode).then(() => toast.success('Code copied'))}
                              className="ml-auto inline-flex items-center gap-1 text-[11px] text-purple-100 hover:text-white"
                            >
                              <Copy size={12} /> Copy
                            </button>
                          ) : null}
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="text"
                            value={codeEdits[event._id] ?? event.checkInCode ?? ''}
                            onChange={(e) => setCodeEdits((prev) => ({ ...prev, [event._id]: e.target.value }))}
                            placeholder="Set a code"
                            className="flex-1 rounded-md border border-purple-800/50 bg-purple-950/40 px-3 py-2 text-white placeholder:text-purple-200/60 focus:border-purple-400 focus:outline-none"
                          />
                          <Button
                            type="button"
                            variant="primary"
                            size="sm"
                            disabled={savingCodeId === event._id}
                            onClick={() => handleSaveCode(event._id)}
                            className="whitespace-nowrap"
                          >
                            {savingCodeId === event._id ? 'Saving...' : 'Save code'}
                          </Button>
                        </div>
                      </div>
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
                          onClick={() => openTicketModal(event)}
                          variant="ghost"
                          size="sm"
                          className="flex items-center space-x-2"
                        >
                          <Ticket size={16} />
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
                          onClick={() => openTicketModal(event)}
                          variant="ghost"
                          size="sm"
                          className="flex items-center space-x-2"
                        >
                          <Ticket size={16} />
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
      {ticketModalOpen && modalEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl shadow-black/40 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-purple-300">Tickets for</p>
                <h3 className="text-xl font-bold text-white">{modalEvent.title}</h3>
                <p className="text-sm text-gray-500">Add ticket types with price, quantity, and rules.</p>
              </div>
              <button onClick={() => setTicketModalOpen(false)} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {loadingTickets ? (
                <div className="flex items-center justify-center py-10 text-gray-400">
                  <Loader2 size={20} className="animate-spin mr-2" /> Loading ticket types...
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {ticketRows.map((row, idx) => (
                    <div key={`${row.id || row.label || idx}-${idx}`} className="p-4 rounded-xl border border-gray-800 bg-gray-950/70 space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1">
                          <Input
                            label="Ticket type"
                            placeholder="e.g. VIP, Balcony, Regular"
                            value={row.label}
                            autoFocus={idx === firstEmptyIndex}
                            onChange={e => setTicketRows(prev => prev.map((r, i) => i === idx ? { ...r, label: e.target.value } : r))}
                          />
                        </div>
                        {row.id && <span className="text-[11px] text-green-400 whitespace-nowrap">Saved</span>}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <Input
                          label="Price"
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={row.price === 0 ? 0 : row.price || ''}
                          onChange={e => setTicketRows(prev => prev.map((r, i) => i === idx ? { ...r, price: e.target.value } : r))}
                        />
                        <Input
                          label="Quantity"
                          type="number"
                          min="0"
                          placeholder="100"
                          value={row.quantityTotal === 0 ? 0 : row.quantityTotal || ''}
                          onChange={e => setTicketRows(prev => prev.map((r, i) => i === idx ? { ...r, quantityTotal: e.target.value } : r))}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-white mb-2">Rules / notes</label>
                        <textarea
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-600"
                          rows={2}
                          value={row.description || ''}
                          onChange={e => setTicketRows(prev => prev.map((r, i) => i === idx ? { ...r, description: e.target.value } : r))}
                          placeholder="Refund policy, seat info, access rules"
                        />
                      </div>

                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <span>Ticket name: {modalEvent.title}{row.label ? ` - ${row.label}` : ''}</span>
                        {ticketRows.length > 1 && (
                          <button
                            className="text-red-400 hover:text-red-300"
                            onClick={() => setTicketRows(prev => prev.filter((_, i) => i !== idx))}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  className="flex items-center gap-2"
                  onClick={() => setTicketRows(prev => [...prev, { id: null, label: 'New Ticket', price: '', quantityTotal: '', description: '' }])}
                >
                  <PlusCircle size={16} /> Add ticket type
                </Button>
                <div className="flex-1" />
                <Button onClick={() => setTicketModalOpen(false)} variant="ghost">Cancel</Button>
                <Button onClick={handleSaveTickets} disabled={savingTickets}>
                  {savingTickets ? 'Saving…' : 'Save tickets'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
