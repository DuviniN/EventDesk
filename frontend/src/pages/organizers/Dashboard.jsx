import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import { useAuth } from "../../features/auth/useAuth";
import { getOrganizerOverview } from "../../features/events/eventApi";
import Button from "../../components/ui/Button";
import { BarChart2, Calendar, CircleDollarSign, Ticket, Plus, ArrowRight, AlertTriangle, Clock3 } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

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
  const { isDark } = useTheme();
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
    <div className={`org-dashboard min-h-screen ${isDark ? "bg-gradient-to-b from-[#0b0b10] via-[#0f0f17] to-[#0b0b10] text-white" : "bg-gradient-to-b from-[#f8f5ff] via-white to-[#f0e8ff] text-slate-900"}`}>
      <Navbar />

      <div className="pt-24 pb-16 px-6">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Hero */}
          <div className={`rounded-3xl p-6 lg:p-8 shadow-[0_40px_120px_-80px_rgba(140,119,255,0.55)] flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between ${isDark ? "border border-white/5 bg-white/5 backdrop-blur-sm" : "border border-purple-100 bg-white"}`}>
            <div className="space-y-2">
              <p className={`text-xs uppercase tracking-[0.28em] ${isDark ? "text-purple-200" : "text-purple-600"}`}>Organizer</p>
              <h1 className="text-3xl lg:text-4xl font-bold">Welcome back, {user?.name}</h1>
              <p className={`text-sm ${isDark ? "text-gray-300" : "text-slate-600"}`}>Quick snapshot of your events, sales, and what’s coming next.</p>
              {error && (
                <div className="mt-3 inline-flex items-center gap-2 text-amber-300 bg-amber-500/10 border border-amber-500/30 px-3 py-2 rounded-lg text-sm">
                  <AlertTriangle size={14} /> {error}
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => navigate('/manage-events')} variant="secondary" className={isDark ? "bg-white/10 border-white/20" : "bg-white border-purple-200 text-purple-700"}>
                <span className="flex items-center gap-2">Manage Events</span>
              </Button>
              <Button onClick={() => navigate('/create-event')} icon={<Plus size={16} />} className="bg-purple-600 hover:bg-purple-500 shadow-purple-700/30">
                Create Event
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard isDark={isDark} label="Total Events" value={stats.totals.total || 0} icon={<Calendar size={18} />} />
            <StatCard isDark={isDark} label="Published" value={stats.totals.published || 0} icon={<BarChart2 size={18} />} />
            <StatCard isDark={isDark} label="Tickets Sold" value={stats.sales.ticketsSold || 0} icon={<Ticket size={18} />} />
            <StatCard isDark={isDark} label="Revenue" value={fmtCurrency(stats.sales.revenue || stats.sales.revenueMinor / 100)} icon={<CircleDollarSign size={18} />} />
          </div>

          {/* Highlights */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <CompactPanel isDark={isDark} title="Upcoming" items={upcoming} empty="No upcoming events" />
            <CompactPanel isDark={isDark} title="Recent" items={recent} empty="No recent events" />
            <QuickLinks isDark={isDark} onManage={() => navigate('/manage-events')} onCreate={() => navigate('/create-event')} />
          </div>

          {/* Events table */}
          <EventGrid isDark={isDark} events={events} loading={loading} />
        </div>
      </div>

      <Footer />
    </div>
  );
}

function StatCard({ label, value, icon, isDark }) {
  return (
    <div className={`rounded-2xl p-4 flex items-center gap-3 ${isDark ? "border border-white/5 bg-white/5 shadow-inner shadow-black/20" : "border border-purple-100 bg-white shadow-sm"}`}>
      <div className={`p-2.5 rounded-xl border border-purple-500/30 ${isDark ? "bg-purple-500/15 text-purple-200" : "bg-purple-50 text-purple-700"}`}>
        {icon}
      </div>
      <div>
        <p className={`text-[11px] uppercase tracking-[0.16em] ${isDark ? "text-gray-400" : "text-slate-500"}`}>{label}</p>
        <p className="text-2xl font-semibold">{value}</p>
      </div>
    </div>
  );
}

function CompactPanel({ title, items, empty, isDark }) {
  return (
    <div className={`rounded-2xl p-4 ${isDark ? "border border-white/5 bg-white/3" : "border border-purple-100 bg-white"}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">{title}</h3>
        <Link to="/manage-events" className={`text-xs flex items-center gap-1 ${isDark ? "text-purple-200 hover:text-white" : "text-purple-600 hover:text-purple-700"}`}>
          Manage <ArrowRight size={12} />
        </Link>
      </div>
      <div className="space-y-3">
        {(!items || items.length === 0) && <p className={`text-sm ${isDark ? "text-gray-500" : "text-slate-700"}`}>{empty}</p>}
        {items?.map((ev) => (
          <div key={ev._id} className={`flex items-start justify-between gap-3 rounded-xl p-3 ${isDark ? "border border-white/5 bg-black/40" : "border border-purple-100 bg-purple-50/50"}`}>
            <div>
              <p className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>{ev.title}</p>
              <p className={`text-xs inline-flex items-center gap-1 ${isDark ? "text-gray-500" : "text-slate-700"}`}>
                <Clock3 size={12} /> {ev.startAt ? new Date(ev.startAt).toLocaleString() : 'TBD'}
              </p>
            </div>
            {isSoldOut(ev) && <span className="text-[11px] px-2 py-1 rounded-full bg-red-500/15 text-red-300">Sold out</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

function QuickLinks({ onManage, onCreate, isDark }) {
  return (
    <div className={`rounded-2xl p-4 flex flex-col gap-3 ${isDark ? "border border-white/5 bg-gradient-to-br from-purple-700/30 via-purple-600/10 to-purple-900/10" : "border border-purple-100 bg-gradient-to-br from-purple-50 via-white to-purple-100/50"}`}>
      <h3 className="text-lg font-semibold">Quick actions</h3>
      <Button onClick={onManage} variant="secondary" className={isDark ? "bg-white/10 border-white/20" : "bg-white border-purple-200 text-purple-700"}>Manage events</Button>
      <Button onClick={onCreate} icon={<Plus size={16} />} className="bg-purple-600 hover:bg-purple-500">Create event</Button>
      <p className={`text-xs ${isDark ? "text-gray-400" : "text-slate-500"}`}>Use these shortcuts to keep your workspace tidy.</p>
    </div>
  );
}

function EventGrid({ events, loading, isDark }) {
  if (loading) {
    return <p className={isDark ? "text-gray-400" : "text-slate-700"}>Loading events...</p>;
  }

  if (!events || events.length === 0) {
    return (
      <div className={`rounded-xl p-8 text-center ${isDark ? "bg-gray-900 border border-gray-800" : "bg-white border border-purple-100"}`}>
        <h2 className="text-2xl font-bold mb-2">No events yet</h2>
        <p className={`mb-4 ${isDark ? "text-gray-400" : "text-slate-700"}`}>Create your first event to see it here.</p>
        <Link to="/create-event">
          <Button variant="primary">Create Event</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl p-4 ${isDark ? "border border-white/5 bg-black/30" : "border border-purple-100 bg-white"}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold">Events</h3>
        <Link to="/manage-events" className={`text-sm flex items-center gap-1 ${isDark ? "text-purple-200 hover:text-white" : "text-purple-600 hover:text-purple-700"}`}>Manage <ArrowRight size={14} /></Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {events.map((ev) => (
          <div key={ev._id} className={`rounded-xl p-4 flex flex-col gap-3 ${isDark ? "border border-white/5 bg-white/5 shadow-inner shadow-black/20" : "border border-purple-200 bg-white shadow-sm"}`}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className={`text-lg font-semibold leading-tight ${isDark ? "text-white" : "text-slate-900"}`}>{ev.title}</p>
                <p className={`text-xs ${isDark ? "text-gray-500" : "text-slate-700"}`}>{ev.startAt ? new Date(ev.startAt).toLocaleString() : 'TBD'}</p>
              </div>
              {isSoldOut(ev) && <span className="text-[11px] px-2 py-1 rounded-full bg-red-500/15 text-red-300">Sold out</span>}
            </div>
            <p className={`text-sm line-clamp-2 ${isDark ? "text-gray-300" : "text-slate-800"}`}>{ev.description || 'No description provided.'}</p>
            <div className={`flex items-center gap-3 text-xs ${isDark ? "text-gray-300" : "text-slate-800"}`}>
              <span className={`px-2 py-1 rounded ${isDark ? "bg-black/40 border border-white/10" : "bg-white border border-purple-200 text-purple-700"}`}>{ev.status}</span>
              {typeof ev.capacity === 'number' && <span>Cap: {ev.capacity}</span>}
            </div>
            <div className={`flex items-center justify-between text-sm mt-auto ${isDark ? "text-gray-200" : "text-slate-800"}`}>
              <div className="flex items-center gap-2">
                <Ticket size={14} className={isDark ? "text-purple-300" : "text-purple-600"} />
                <span>Sold: {ev.ticketsSold ?? '—'}</span>
              </div>
              <Link to={`/edit-event/${ev._id}`} className={`text-xs ${isDark ? "text-purple-200 hover:text-white" : "text-purple-600 hover:text-purple-700"}`}>Edit</Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
