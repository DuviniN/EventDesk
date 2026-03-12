import { useEffect, useMemo, useState } from "react";
import Navbar from "../../components/common/Navbar";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import { getOrganizerAttendees } from "../../features/tickets/ticketsApi";
import { RefreshCw, Users, UserCheck, Ticket, Mail, CalendarClock } from "lucide-react";
import toast from "react-hot-toast";

const statusStyles = {
  checked_in: "bg-emerald-900/60 text-emerald-200 border border-emerald-700/60",
  valid: "bg-blue-900/40 text-blue-100 border border-blue-700/50",
  cancelled: "bg-rose-900/50 text-rose-100 border border-rose-700/60",
  refunded: "bg-amber-900/50 text-amber-100 border border-amber-700/60",
};

export default function AllAttendees() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [eventFilter, setEventFilter] = useState("all");

  const load = async () => {
    setRefreshing(true);
    setLoading(true);
    try {
      const res = await getOrganizerAttendees();
      setTickets(res.tickets || []);
    } catch (err) {
      console.error(err);
      toast.error(err?.message || "Could not load attendees");
      setTickets([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return tickets.filter((t) => {
      const matchesTerm = term
        ? [t.attendee?.name, t.attendee?.email, t.ticketCode, t.eventId?.title]
            .filter(Boolean)
            .some((val) => String(val).toLowerCase().includes(term))
        : true;
      const matchesStatus = statusFilter === "all" ? true : t.status === statusFilter;
      const matchesEvent = eventFilter === "all" ? true : t.eventId?._id === eventFilter;
      return matchesTerm && matchesStatus && matchesEvent;
    });
  }, [tickets, search, statusFilter, eventFilter]);

  const eventOptions = useMemo(() => {
    const unique = new Map();
    tickets.forEach((t) => {
      if (t.eventId?._id && !unique.has(t.eventId._id)) {
        unique.set(t.eventId._id, t.eventId.title || "Event");
      }
    });
    return Array.from(unique.entries());
  }, [tickets]);

  const stats = useMemo(() => {
    const total = tickets.length;
    const attended = tickets.filter((t) => t.status === "checked_in").length;
    return { total, attended, remaining: Math.max(0, total - attended) };
  }, [tickets]);

  const renderStatusBadge = (status) => {
    const label = status === "checked_in" ? "Attended" : status?.replace("_", " ") || "unknown";
    const cls = statusStyles[status] || "bg-gray-800 text-gray-200 border border-gray-700";
    return <span className={`px-2 py-1 rounded-full text-xs font-semibold ${cls}`}>{label}</span>;
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <div className="pt-24 pb-12 max-w-6xl mx-auto px-6 space-y-6">
        <div className="bg-gradient-to-r from-purple-900/60 via-gray-900 to-gray-950 border border-gray-800 rounded-2xl p-6 shadow-2xl shadow-black/40">
          <div className="flex flex-wrap items-start gap-4 justify-between">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.2em] text-purple-200">Organizer</p>
              <h1 className="text-3xl font-bold text-white">All Attendees</h1>
              <p className="text-sm text-gray-300">View attendee name, email, event, and attendance status across your events.</p>
            </div>
            <Button variant="primary" size="sm" onClick={load} disabled={refreshing} className="inline-flex items-center gap-2">
              <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
              Refresh
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
            <StatCard icon={<Users size={16} />} label="Total tickets" value={stats.total} />
            <StatCard icon={<UserCheck size={16} />} label="Attended" value={stats.attended} accent="text-emerald-300" />
            <StatCard icon={<Ticket size={16} />} label="Remaining" value={stats.remaining} />
          </div>
        </div>

        <div className="bg-gray-950/80 border border-gray-800 rounded-2xl p-5 shadow-xl shadow-black/30 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="flex-1 w-full">
              <Input
                placeholder="Search by name, email, code, or event"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg bg-gray-900 border border-gray-700 text-white px-3 py-2 text-sm focus:outline-none"
              >
                <option value="all">All statuses</option>
                <option value="checked_in">Attended</option>
                <option value="valid">Valid</option>
                <option value="cancelled">Cancelled</option>
                <option value="refunded">Refunded</option>
              </select>
              <select
                value={eventFilter}
                onChange={(e) => setEventFilter(e.target.value)}
                className="rounded-lg bg-gray-900 border border-gray-700 text-white px-3 py-2 text-sm focus:outline-none"
              >
                <option value="all">All events</option>
                {eventOptions.map(([id, title]) => (
                  <option key={id} value={id}>{title}</option>
                ))}
              </select>
              <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setStatusFilter("all"); setEventFilter("all"); }}>
                Clear
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-gray-400">Loading attendees...</div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center text-gray-400">No attendees found for these filters.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-gray-100">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-[0.18em] text-gray-400">
                    <th className="py-2 pr-4">Attendee</th>
                    <th className="py-2 pr-4">Email</th>
                    <th className="py-2 pr-4">Event</th>
                    <th className="py-2 pr-4">Ticket</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Checked in</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {filtered.map((t) => (
                    <tr key={t._id} className="hover:bg-white/5">
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-purple-900/60 border border-purple-700/60 flex items-center justify-center text-xs font-semibold text-white">
                            {t.attendee?.name?.[0]?.toUpperCase() || "U"}
                          </div>
                          <div>
                            <div className="font-semibold">{t.attendee?.name || "Unknown"}</div>
                            <div className="text-[11px] text-gray-400">#{t.ticketCode?.slice(-6) || "--"}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-gray-200">{t.attendee?.email || "—"}</td>
                      <td className="py-3 pr-4 text-gray-200">
                        <div className="flex flex-col">
                          <span className="font-semibold">{t.eventId?.title || "Event"}</span>
                          {t.eventId?.startAt ? (
                            <span className="text-xs text-gray-500 inline-flex items-center gap-1"><CalendarClock size={12} /> {new Date(t.eventId.startAt).toLocaleString()}</span>
                          ) : null}
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-gray-200">{t.ticketTypeId?.name || "Ticket"}</td>
                      <td className="py-3 pr-4">{renderStatusBadge(t.status)}</td>
                      <td className="py-3 pr-4 text-gray-300">
                        {t.checkedInAt ? (
                          <span className="text-emerald-200">{new Date(t.checkedInAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                        ) : (
                          <span className="text-gray-500">Not yet</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, accent }) {
  return (
    <div className="rounded-xl border border-gray-800 bg-black/40 p-4 flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-purple-900/50 border border-purple-800 flex items-center justify-center text-white">
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className={`text-xl font-semibold text-white ${accent || ""}`}>{value}</p>
      </div>
    </div>
  );
}
