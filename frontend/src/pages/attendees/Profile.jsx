import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  CheckCircle2,
  Download,
  Mail,
  MapPin,
  QrCode,
  Sparkles,
  Ticket as TicketIcon,
  User as UserIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import useAuth from "../../features/auth/useAuth";
import { getMyTickets } from "../../features/events/eventApi";
import Navbar from "../../components/common/Navbar";

const statusStyles = {
  valid: "bg-green-500/15 text-green-300 border border-green-600/40",
  checked_in: "bg-blue-500/15 text-blue-200 border border-blue-500/30",
  cancelled: "bg-red-500/15 text-red-200 border border-red-500/30",
  refunded: "bg-amber-500/15 text-amber-200 border border-amber-500/30",
};

const formatVenue = (venue) => {
  if (!venue) return "";
  if (typeof venue === "string") return venue;
  if (typeof venue === "object") {
    return [venue.name, venue.address, venue.city].filter(Boolean).join(", ");
  }
  return String(venue);
};

const formatDateTime = (value) => {
  if (!value) return "TBA";
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

function TicketCard({ ticket }) {
  const event = ticket.eventId || {};
  const ticketType = ticket.ticketTypeId || {};
  const status = ticket.status || "valid";

  return (
    <div className="rounded-2xl border border-gray-800/70 bg-gradient-to-br from-gray-900/80 via-gray-900/60 to-gray-900/30 p-4 shadow-lg shadow-black/30">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-sm text-purple-200/80">
            <Sparkles size={14} />
            <span className="uppercase tracking-[0.08em] text-xs text-purple-200/80">Ticket</span>
          </div>
          <h3 className="text-lg font-semibold text-white">{event.title || "Event"}</h3>
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
            <div className="flex items-center gap-1.5"><Calendar size={14} />{formatDateTime(event.startAt)}</div>
            {event.venue ? (
              <div className="flex items-center gap-1.5"><MapPin size={14} />{formatVenue(event.venue)}</div>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="rounded-full bg-purple-500/15 text-purple-200 border border-purple-500/30 px-2.5 py-1 font-medium">{ticketType.name || "General"}</span>
            <span className="rounded-full bg-gray-800/80 text-gray-200 border border-gray-700 px-2.5 py-1 font-mono text-xs">{ticket.ticketCode}</span>
            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[status] || "bg-gray-800 text-gray-200 border border-gray-700"}`}>{status.replace("_", " ")}</span>
          </div>
        </div>
        {ticket.qrImage ? (
          <div className="relative">
            <div className="absolute inset-0 blur-2xl bg-purple-500/20 -z-10" />
            <img
              src={ticket.qrImage}
              alt="Ticket QR"
              className="w-28 h-28 rounded-xl border border-gray-800 bg-white/90 object-contain"
            />
          </div>
        ) : null}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {ticket.qrImage ? (
          <a
            href={ticket.qrImage}
            download={`${ticket.ticketCode}.png`}
            className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-3.5 py-2 text-sm font-semibold text-white shadow-lg shadow-purple-600/30 transition hover:bg-purple-500"
          >
            <Download size={16} /> Download QR
          </a>
        ) : null}
        {ticket.qrImage ? (
          <button
            type="button"
            onClick={() => window.open(ticket.qrImage, "_blank", "noopener")}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-700 px-3.5 py-2 text-sm font-medium text-gray-200 transition hover:border-gray-500 hover:text-white"
          >
            <QrCode size={16} /> Open large QR
          </button>
        ) : null}
        {ticket.qrPayload ? (
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(ticket.qrPayload).then(() => toast.success("QR payload copied"))}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-700 px-3.5 py-2 text-sm font-medium text-gray-200 transition hover:border-gray-500 hover:text-white"
          >
            <QrCode size={16} /> Copy payload
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const [profileForm, setProfileForm] = useState({
    name: user?.name || "",
    marketingConsent: !!user?.marketingConsent,
    avatarUrl: user?.avatarUrl || "",
  });
  const [saving, setSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatarUrl || "");

  const [tickets, setTickets] = useState([]);
  const [counts, setCounts] = useState({ tickets: 0, events: 0 });
  const [loadingTickets, setLoadingTickets] = useState(true);

  useEffect(() => {
    setProfileForm((prev) => ({
      ...prev,
      name: user?.name || "",
      marketingConsent: !!user?.marketingConsent,
      avatarUrl: user?.avatarUrl || "",
    }));
    setAvatarPreview(user?.avatarUrl || "");
  }, [user?.name, user?.marketingConsent, user?.avatarUrl]);

  useEffect(() => {
    const loadTickets = async () => {
      try {
        const res = await getMyTickets();
        setTickets(res.tickets || []);
        setCounts(res.counts || { tickets: 0, events: 0 });
      } catch (err) {
        toast.error(err.message || "Could not load tickets");
      } finally {
        setLoadingTickets(false);
      }
    };
    loadTickets();
  }, []);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile(profileForm);
      if (profileForm.avatarUrl) setAvatarPreview(profileForm.avatarUrl);
    } catch (err) {
      toast.error(err.message || "Profile update failed");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarChange = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    if (file.size > 2.5 * 1024 * 1024) {
      toast.error("Image too large (max 2.5MB)");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      setProfileForm((prev) => ({ ...prev, avatarUrl: dataUrl }));
      setAvatarPreview(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const upcomingTickets = useMemo(
    () => tickets.filter((t) => t.eventId?.startAt && new Date(t.eventId.startAt) > new Date()),
    [tickets]
  );

  const initials = useMemo(() => {
    if (!user?.name) return "U";
    return user.name
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [user?.name]);

  const nextTicket = useMemo(() => {
    const sorted = [...upcomingTickets].sort(
      (a, b) => new Date(a.eventId.startAt) - new Date(b.eventId.startAt)
    );
    return sorted[0] || null;
  }, [upcomingTickets]);

  return (
    <div className="min-h-screen bg-[#05060b] text-white pb-16">
      <Navbar />
      <div className="absolute inset-x-0 top-0 h-96 bg-[radial-gradient(circle_at_20%_20%,rgba(147,51,234,0.12),transparent_35%),radial-gradient(circle_at_80%_10%,rgba(59,130,246,0.14),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.06),transparent)]" aria-hidden />
      <div className="max-w-6xl mx-auto px-6 pt-24 relative">
        <section className="relative overflow-hidden rounded-3xl border border-gray-800/80 bg-gradient-to-r from-gray-950/90 via-[#0b0c16] to-[#0a0c1f] p-6 md:p-8 shadow-[0_30px_120px_-50px_rgba(124,58,237,0.6)]">
          <div className="absolute inset-0 opacity-50 bg-[radial-gradient(circle_at_30%_20%,rgba(147,51,234,0.15),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(59,130,246,0.15),transparent_30%)]" aria-hidden />
          <div className="relative flex flex-col lg:flex-row lg:items-center gap-6 lg:gap-10">
            <div className="flex items-start gap-4">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Profile avatar"
                  className="w-16 h-16 md:w-20 md:h-20 rounded-2xl border border-gray-800 object-cover shadow-lg shadow-purple-900/40"
                />
              ) : (
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-500 flex items-center justify-center text-xl md:text-2xl font-bold text-white shadow-lg shadow-purple-900/40">
                  {initials}
                </div>
              )}
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-[0.2em] text-purple-200/80 flex items-center gap-2">
                  <Sparkles size={14} /> Attendee profile
                </p>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
                  Hey {user?.name?.split(" ")[0] || "there"}, your wallet is ready
                </h1>
                <p className="text-gray-300 text-sm">{user?.email || "No email on file"}</p>
                <div className="flex flex-wrap gap-2 pt-2">
                  <span className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-gray-200">
                    {counts.tickets} tickets
                  </span>
                  <span className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-gray-200">
                    {counts.events} events
                  </span>
                  <span className="px-3 py-1.5 rounded-full bg-purple-500/15 border border-purple-400/30 text-xs text-purple-100">
                    {upcomingTickets.length} upcoming
                  </span>
                </div>
              </div>
            </div>

            <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4">
              <div className="rounded-2xl border border-gray-800 bg-black/50 px-4 py-4 shadow-lg shadow-black/30">
                <div className="text-xs uppercase tracking-[0.14em] text-gray-400 flex items-center gap-2"><TicketIcon size={14} className="text-purple-300" /> Tickets</div>
                <div className="mt-1 text-2xl font-bold text-white">{counts.tickets}</div>
                <p className="text-xs text-gray-500">All active and past</p>
              </div>
              <div className="rounded-2xl border border-gray-800 bg-black/50 px-4 py-4 shadow-lg shadow-black/30">
                <div className="text-xs uppercase tracking-[0.14em] text-gray-400 flex items-center gap-2"><Calendar size={14} className="text-blue-300" /> Events</div>
                <div className="mt-1 text-2xl font-bold text-white">{counts.events}</div>
                <p className="text-xs text-gray-500">Cities & venues</p>
              </div>
              <div className="rounded-2xl border border-purple-500/50 bg-gradient-to-br from-purple-900/40 via-purple-800/20 to-transparent px-4 py-4 shadow-lg shadow-purple-900/40">
                <div className="text-xs uppercase tracking-[0.14em] text-purple-100 flex items-center gap-2"><CheckCircle2 size={14} className="text-green-300" /> Upcoming</div>
                <div className="mt-1 text-2xl font-bold text-white">{upcomingTickets.length}</div>
                <p className="text-xs text-purple-100/80">Ready to scan</p>
              </div>
            </div>
          </div>

          {nextTicket ? (
            <div className="mt-6 md:mt-8 rounded-2xl border border-purple-500/30 bg-purple-500/5 px-4 py-4 md:px-6 md:py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-[0.16em] text-purple-200/90">Next check-in</p>
                <div className="text-lg font-semibold text-white">{nextTicket.eventId?.title || "Event"}</div>
                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-300">
                  <span className="flex items-center gap-1.5"><Calendar size={14} /> {formatDateTime(nextTicket.eventId?.startAt)}</span>
                  {nextTicket.eventId?.venue ? (
                    <span className="flex items-center gap-1.5"><MapPin size={14} /> {formatVenue(nextTicket.eventId.venue)}</span>
                  ) : null}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {nextTicket.qrImage ? (
                  <img src={nextTicket.qrImage} alt="Next ticket QR" className="w-20 h-20 rounded-xl border border-gray-800 bg-white/90 object-contain shadow-lg shadow-purple-900/30" />
                ) : null}
                <Link
                  to="/events"
                  className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-900/40 transition hover:bg-purple-500"
                >
                  View events
                </Link>
              </div>
            </div>
          ) : null}
        </section>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-[1.05fr,0.95fr] gap-6">
          <div className="rounded-3xl border border-gray-800/80 bg-black/60 p-6 shadow-xl shadow-black/40">
            <div className="flex items-center gap-2 text-sm uppercase tracking-[0.16em] text-gray-400">
              <UserIcon size={15} /> Profile settings
            </div>
            <h2 className="text-2xl font-semibold text-white mt-2">Personal info</h2>
            <p className="text-gray-400 text-sm mt-1">Keep your name current so it appears correctly on tickets and QR scans.</p>

            <form className="mt-6 space-y-5" onSubmit={handleSaveProfile}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-gray-300">Full name</label>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    className="w-full rounded-xl border border-gray-800 bg-gray-950/60 px-4 py-3 text-white placeholder:text-gray-600 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                    placeholder="Your name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-gray-300">Email</label>
                  <div className="flex items-center gap-3 rounded-xl border border-gray-800 bg-gray-950/60 px-4 py-3 text-gray-300">
                    <Mail size={16} className="text-purple-300" />
                    <span className="truncate">{user?.email || "Not set"}</span>
                  </div>
                </div>
              </div>

              <label className="flex items-start gap-3 rounded-2xl border border-gray-800 bg-gray-950/60 px-4 py-3 text-sm text-gray-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={profileForm.marketingConsent}
                  onChange={(e) => setProfileForm({ ...profileForm, marketingConsent: e.target.checked })}
                  className="mt-1 h-4 w-4 rounded border-gray-700 text-purple-500 focus:ring-purple-500"
                />
                <div className="space-y-0.5">
                  <div className="font-semibold text-white">Keep me posted about new events</div>
                  <p className="text-gray-400 text-xs">We only send relevant updates, and you can opt out anytime.</p>
                </div>
              </label>

              <div className="space-y-2">
                <label className="text-sm text-gray-300">Profile photo</label>
                <div className="flex items-center gap-4">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Profile avatar preview"
                      className="w-16 h-16 rounded-2xl border border-gray-800 object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-500 flex items-center justify-center text-lg font-bold text-white border border-gray-800">
                      {initials}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <label className="inline-flex items-center gap-2 rounded-xl bg-gray-900/80 border border-gray-800 px-4 py-2 text-sm font-semibold text-gray-200 cursor-pointer hover:border-purple-500 hover:text-white">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleAvatarChange(e.target.files?.[0])}
                      />
                      Change photo
                    </label>
                    {avatarPreview ? (
                      <button
                        type="button"
                        onClick={() => {
                          setAvatarPreview("");
                          setProfileForm((prev) => ({ ...prev, avatarUrl: "" }));
                        }}
                        className="inline-flex items-center gap-2 rounded-xl border border-gray-800 px-4 py-2 text-sm font-semibold text-gray-300 hover:border-gray-600 hover:text-white"
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>
                </div>
                <p className="text-xs text-gray-500">JPG/PNG up to 2.5MB.</p>
              </div>

              <div className="flex flex-wrap gap-3 pt-1">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-600/40 transition hover:bg-purple-500 disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save changes"}
                </button>
                <Link
                  to="/attendee-dashboard"
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-800 px-5 py-3 text-sm font-semibold text-gray-200 transition hover:border-gray-500 hover:text-white"
                >
                  Back to dashboard
                </Link>
              </div>
            </form>
          </div>

          <div className="rounded-3xl border border-gray-800/80 bg-gradient-to-b from-gray-950/80 via-gray-900/60 to-black/60 p-6 shadow-xl shadow-black/40">
            <div className="flex items-center gap-2 text-sm uppercase tracking-[0.16em] text-gray-400">
              <QrCode size={15} /> Ticket wallet
            </div>
            <h2 className="text-2xl font-semibold text-white mt-2">Show at the door</h2>
            <p className="text-gray-400 text-sm mt-1">Your most recent QR codes are here for quick access.</p>

            {loadingTickets ? (
              <div className="mt-6 text-gray-400">Loading your tickets...</div>
            ) : tickets.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-gray-700 bg-gray-950/60 p-6 text-gray-400">
                <p>No tickets yet. Explore events and grab your spot.</p>
                <Link
                  to="/events"
                  className="mt-3 inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-purple-600/30 transition hover:bg-purple-500"
                >
                  <Sparkles size={16} /> Browse events
                </Link>
              </div>
            ) : (
              <div className="mt-6 grid gap-4">
                {tickets.slice(0, 3).map((ticket) => (
                  <TicketCard key={ticket._id} ticket={ticket} />
                ))}
                {tickets.length > 3 ? (
                  <div className="rounded-2xl border border-gray-800 bg-gray-950/70 p-4 text-sm text-gray-300">
                    <p>You have more tickets. Grab the rest from your inbox anytime.</p>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 rounded-3xl border border-gray-800/80 bg-black/60 p-6 shadow-xl shadow-black/40">
          <div className="flex items-center gap-2 text-sm uppercase tracking-[0.16em] text-gray-400">
            <TicketIcon size={15} /> All bookings
          </div>
          <p className="text-gray-400 text-sm mt-1">Every ticket with its QR code, status, and venue details.</p>
          {loadingTickets ? (
            <div className="mt-5 text-gray-400">Loading tickets...</div>
          ) : tickets.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-gray-700 bg-gray-950/60 p-6 text-gray-400">
              No bookings found yet.
            </div>
          ) : (
            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              {tickets.map((ticket) => (
                <TicketCard key={ticket._id} ticket={ticket} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
