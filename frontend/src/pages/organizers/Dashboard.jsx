import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import { useAuth } from "../../features/auth/useAuth";
import { getOrganizerOverview } from "../../features/events/eventApi";
import Button from "../../components/ui/Button";
import { BarChart2, CalendarClock, CircleDollarSign, Ticket, Plus, ArrowRight, AlertTriangle } from "lucide-react";

// Format currency safely
const fmtCurrency = (amount) => {
  const num = Number(amount || 0);
  return num.toLocaleString(undefined, { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
};

// Compute sold-out flag for a given event using remaining counts
const isSoldOut = (event) => {
  // We rely on ticket types remaining if present, otherwise use capacity
  if (typeof event.remaining === 'number') return event.remaining <= 0;
  if (typeof event.capacity === 'number' && typeof event.ticketsSold === 'number') {
    return event.capacity - event.ticketsSold <= 0;
  }
  return false;
};

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getOrganizerOverview();
        setOverview(data);
      } catch (err) {
        setError(err.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const stats = useMemo(() => {
    if (!overview) return { totals: {}, sales: {} };
    return {
      totals: overview.totals || { total: 0, published: 0, draft: 0, cancelled: 0 },
      sales: overview.sales || { ticketsSold: 0, revenue: '0.00' }
    };
  }, [overview]);

  const upcoming = overview?.upcoming || [];
  const recent = overview?.recent || [];
  const events = overview?.events || [];

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      <div className="pt-28 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-10">
            <div>
              <p className="text-sm text-gray-400">Organizer Dashboard</p>
              <h1 className="text-4xl font-bold">Welcome, {user?.name}</h1>
              <p className="text-gray-400 mt-1">Track your events, revenue, and ticket sales.</p>
            </div>
            <Button
              onClick={() => navigate('/create-event')}
              icon={<Plus size={16} />}
              className="bg-purple-600 hover:bg-purple-500"
            >
              Create Event
            </Button>
          </div>

          {error && (
            <div className="mb-6 flex items-center gap-2 text-amber-400 bg-amber-500/10 border border-amber-500/30 px-4 py-3 rounded-lg">
              <AlertTriangle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <StatCard label="Total Events" value={stats.totals.total || 0} icon={<CalendarClock size={16} />} />
            <StatCard label="Published" value={stats.totals.published || 0} icon={<BarChart2 size={16} />} />
            <StatCard label="Tickets Sold" value={stats.sales.ticketsSold || 0} icon={<Ticket size={16} />} />
            <StatCard label="Revenue" value={fmtCurrency(stats.sales.revenue || stats.sales.revenueMinor / 100)} icon={<CircleDollarSign size={16} />} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
            <Panel title="Upcoming Events" items={upcoming} empty="No upcoming events" />
            <Panel title="Recent Events" items={recent} empty="No recent events" />
            <Panel title="All Events" items={events} empty="No events yet" showLink />
          </div>

          <EventGrid events={events} loading={loading} />
        </div>
      </div>

      <Footer />
    </div>
  );
}

function StatCard({ label, value, icon }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex items-center gap-3">
      <div className="p-2 rounded-lg bg-purple-600/20 text-purple-300">
        {icon}
      </div>
      <div>
        <p className="text-xs uppercase tracking-wide text-gray-400">{label}</p>
        <p className="text-2xl font-semibold">{value}</p>
      </div>
    </div>
  );
}

function Panel({ title, items, empty, showLink = false }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        {showLink && (
          <Link to="/manage-events" className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1">
            Manage <ArrowRight size={14} />
          </Link>
        )}
      </div>
      <div className="space-y-3">
        {(!items || items.length === 0) && (
          <p className="text-gray-500 text-sm">{empty}</p>
        )}
        {items?.map((ev) => (
          <div key={ev._id} className="flex items-start justify-between gap-3 border border-gray-800/80 rounded-lg p-3 bg-gray-950/60">
            <div>
              <p className="font-semibold">{ev.title}</p>
              <p className="text-xs text-gray-500">{ev.startAt ? new Date(ev.startAt).toLocaleString() : 'TBD'}</p>
            </div>
            {isSoldOut(ev) && (
              <span className="text-xs px-2 py-1 rounded-full bg-red-500/20 text-red-400">Sold out</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function EventGrid({ events, loading }) {
  if (loading) {
    return <p className="text-gray-500">Loading events...</p>;
  }

  if (!events || events.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
        <h2 className="text-2xl font-bold mb-2">No events yet</h2>
        <p className="text-gray-400 mb-4">Create your first event to see it here.</p>
        <Link to="/create-event">
          <Button variant="primary">Create Event</Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">Event Details</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {events.map((ev) => (
          <div key={ev._id} className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold">{ev.title}</p>
                <p className="text-xs text-gray-500">{ev.startAt ? new Date(ev.startAt).toLocaleString() : 'TBD'}</p>
              </div>
              {isSoldOut(ev) && (
                <span className="text-xs px-2 py-1 rounded-full bg-red-500/20 text-red-400">Sold Out</span>
              )}
            </div>
            <p className="text-sm text-gray-400 line-clamp-2">{ev.description || 'No description provided.'}</p>
            <div className="flex items-center gap-3 text-sm text-gray-300">
              <span className="px-2 py-1 rounded bg-gray-800/80 border border-gray-700 text-xs">{ev.status}</span>
              {typeof ev.capacity === 'number' && (
                <span className="text-xs text-gray-400">Cap: {ev.capacity}</span>
              )}
            </div>
            <div className="flex items-center justify-between text-sm text-gray-200 mt-auto">
              <div className="flex items-center gap-2">
                <Ticket size={14} className="text-purple-400" />
                <span>Sold: {ev.ticketsSold ?? '—'}</span>
              </div>
              <Link to={`/edit-event/${ev._id}`} className="text-purple-400 hover:text-purple-300 text-xs">Edit</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
