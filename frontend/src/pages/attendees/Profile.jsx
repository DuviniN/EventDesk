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
  ArrowRight,
} from "lucide-react";
import toast from "react-hot-toast";
import useAuth from "../../features/auth/useAuth";
import { getMyTickets } from "../../features/events/eventApi";
import Navbar from "../../components/common/Navbar";
import { useTheme } from "../../context/ThemeContext";

const statusStyles = {
  valid: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  checked_in: "bg-blue-50 text-blue-700 border border-blue-200",
  cancelled: "bg-rose-50 text-rose-700 border border-rose-200",
  refunded: "bg-amber-50 text-amber-700 border border-amber-200",
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

function TicketCard({ ticket, showEventMeta = true }) {
  const event = ticket.eventId || {};
  const ticketType = ticket.ticketTypeId || {};
  const status = ticket.status || "valid";

  return (
    <div className="rounded-2xl border border-[#6a317f]/18 bg-white p-5 shadow-lg shadow-[#6a317f]/12">
      <div className="grid grid-cols-1 sm:grid-cols-[1.1fr,0.9fr] gap-4 items-start">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.08em] text-[#6a317f] font-semibold">
            <Sparkles size={14} />
            <span>Ticket</span>
          </div>
          {showEventMeta ? (
            <>
              <h3 className="text-xl font-semibold text-[#2b1833] leading-snug">{event.title || "Event"}</h3>
              <div className="flex flex-wrap items-center gap-3 text-sm text-[#6a317f]">
                <div className="flex items-center gap-1.5"><Calendar size={14} />{formatDateTime(event.startAt)}</div>
                {event.venue ? (
                  <div className="flex items-center gap-1.5"><MapPin size={14} />{formatVenue(event.venue)}</div>
                ) : null}
              </div>
            </>
          ) : null}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="rounded-xl border border-[#6a317f]/25 bg-white px-3 py-2">
              <p className="text-[11px] uppercase tracking-[0.12em] text-[#6a317f]/80 font-semibold">Type</p>
              <p className="text-sm font-semibold text-[#2b1833]">{ticketType.name || "General"}</p>
            </div>
            <div className="rounded-xl border border-[#6a317f]/25 bg-white px-3 py-2">
              <p className="text-[11px] uppercase tracking-[0.12em] text-[#6a317f]/80 font-semibold">Ticket ID</p>
              <p className="text-sm font-mono text-[#2b1833]">{ticket.ticketCode}</p>
            </div>
            <div className="rounded-xl border border-[#6a317f]/25 bg-white px-3 py-2">
              <p className="text-[11px] uppercase tracking-[0.12em] text-[#6a317f]/80 font-semibold">Status</p>
              <span className={`inline-flex items-center px-2.5 py-1 mt-1 rounded-full text-xs font-semibold ${statusStyles[status] || "bg-slate-100 text-slate-700 border border-slate-200"}`}>
                {status.replace("_", " ")}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:items-end gap-3">
          {ticket.qrImage ? (
            <div className="relative w-full sm:w-40">
              <div className="absolute inset-0 blur-2xl bg-[#6a317f]/18 -z-10" />
              <div className="rounded-2xl border border-[#6a317f]/25 bg-white shadow-lg shadow-[#6a317f]/20 p-3 flex items-center justify-center">
                <img
                  src={ticket.qrImage}
                  alt="Ticket QR"
                  className="w-28 h-28 rounded-xl border border-[#6a317f]/15 bg-white object-contain"
                />
              </div>
              <p className="mt-2 text-xs text-[#6a317f]/80 sm:text-right">Show this QR at entry</p>
            </div>
          ) : null}

          <div className="flex flex-wrap justify-start sm:justify-end gap-2">
            {ticket.qrImage ? (
              <a
                href={ticket.qrImage}
                download={`${ticket.ticketCode}.png`}
                className="inline-flex items-center gap-2 rounded-lg bg-[#6a317f] px-3.5 py-2 text-sm font-semibold text-white shadow-lg shadow-[#6a317f]/30 transition hover:bg-[#58276a]"
              >
                <Download size={16} /> Download QR
              </a>
            ) : null}
            {ticket.qrImage ? (
              <button
                type="button"
                onClick={() => window.open(ticket.qrImage, "_blank", "noopener")}
                className="inline-flex items-center gap-2 rounded-lg border border-[#6a317f]/25 px-3.5 py-2 text-sm font-semibold text-[#6a317f] bg-white transition hover:border-[#6a317f]/50"
              >
                <QrCode size={16} /> Open large
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Profile() {
  const { isDark } = useTheme();
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

  const groupedTickets = useMemo(() => {
    const map = new Map();

    tickets.forEach((ticket) => {
      const eventData = typeof ticket.eventId === "object" && ticket.eventId !== null ? ticket.eventId : { _id: ticket.eventId };
      const rawEventKey = eventData?._id || eventData?.id || eventData?.slug;
      const eventKey = rawEventKey || `event-${ticket.eventId || ticket._id || ticket.ticketCode || map.size}`;

      if (!map.has(eventKey)) {
        map.set(eventKey, { event: eventData, tickets: [] });
      }

      map.get(eventKey).tickets.push(ticket);
    });

    return Array.from(map.values());
  }, [tickets]);

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
    <div className={`attendee-profile min-h-screen pb-16 ${isDark ? "bg-gradient-to-b from-[#0b0d14] via-[#131726] to-[#0f1220] text-white" : "bg-gradient-to-b from-[#f7f2ff] via-white to-[#f3ecff] text-[#2b1833]"}`}>
      <Navbar />
      <div className="absolute inset-x-0 top-0 h-96 bg-[radial-gradient(circle_at_20%_20%,rgba(106,49,127,0.14),transparent_35%),radial-gradient(circle_at_80%_10%,rgba(106,49,127,0.12),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.2),transparent)]" aria-hidden />
      <div className="max-w-6xl mx-auto px-6 pt-24 relative">
        <section className="relative overflow-hidden rounded-3xl border border-[#6a317f]/20 bg-gradient-to-r from-white via-[#f7f0ff] to-white p-6 md:p-8 shadow-[0_30px_120px_-60px_rgba(106,49,127,0.55)]">
          <div className="absolute inset-0 opacity-70 bg-[radial-gradient(circle_at_30%_20%,rgba(106,49,127,0.1),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(106,49,127,0.08),transparent_30%)]" aria-hidden />
          <div className="relative flex flex-col lg:flex-row lg:items-center gap-6 lg:gap-10">
            <div className="flex items-start gap-4">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Profile avatar"
                  className="w-16 h-16 md:w-20 md:h-20 rounded-2xl border border-[#6a317f]/20 object-cover shadow-lg shadow-[#6a317f]/30"
                />
              ) : (
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-[#6a317f] to-[#58276a] flex items-center justify-center text-xl md:text-2xl font-bold text-white shadow-lg shadow-[#6a317f]/30">
                  {initials}
                </div>
              )}
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-[0.2em] text-[#6a317f] flex items-center gap-2 font-semibold">
                  <Sparkles size={14} /> Attendee profile
                </p>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[#2b1833]">
                  Hey {user?.name?.split(" ")[0] || "there"}, your wallet is ready
                </h1>
                <p className="text-[#6a317f] text-sm">{user?.email || "No email on file"}</p>
                <div className="flex flex-wrap gap-2 pt-2">
                  <span className="px-3 py-1.5 rounded-full bg-white border border-[#6a317f]/25 text-xs text-[#6a317f] font-semibold">
                    {counts.tickets} tickets
                  </span>
                  <span className="px-3 py-1.5 rounded-full bg-white border border-[#6a317f]/25 text-xs text-[#6a317f] font-semibold">
                    {counts.events} events
                  </span>
                  <span className="px-3 py-1.5 rounded-full bg-[#6a317f]/10 border border-[#6a317f]/30 text-xs text-[#6a317f] font-semibold">
                    {upcomingTickets.length} upcoming
                  </span>
                </div>
              </div>
            </div>

            <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4">
              <div className="rounded-2xl border border-[#6a317f]/20 bg-white px-4 py-4 shadow-md shadow-[#6a317f]/10">
                <div className="text-xs uppercase tracking-[0.14em] text-[#6a317f] flex items-center gap-2 font-semibold"><TicketIcon size={14} /> Tickets</div>
                <div className="mt-1 text-2xl font-bold text-[#2b1833]">{counts.tickets}</div>
                <p className="text-xs text-[#6a317f]/70">All active and past</p>
              </div>
              <div className="rounded-2xl border border-[#6a317f]/20 bg-white px-4 py-4 shadow-md shadow-[#6a317f]/10">
                <div className="text-xs uppercase tracking-[0.14em] text-[#6a317f] flex items-center gap-2 font-semibold"><Calendar size={14} /> Events</div>
                <div className="mt-1 text-2xl font-bold text-[#2b1833]">{counts.events}</div>
                <p className="text-xs text-[#6a317f]/70">Cities & venues</p>
              </div>
              <div className="rounded-2xl border border-[#6a317f]/30 bg-gradient-to-br from-[#6a317f]/12 via-white to-white px-4 py-4 shadow-md shadow-[#6a317f]/15">
                <div className="text-xs uppercase tracking-[0.14em] text-[#6a317f] flex items-center gap-2 font-semibold"><CheckCircle2 size={14} className="text-[#6a317f]" /> Upcoming</div>
                <div className="mt-1 text-2xl font-bold text-[#2b1833]">{upcomingTickets.length}</div>
                <p className="text-xs text-[#6a317f]/70">Ready to scan</p>
              </div>
            </div>
          </div>

          {nextTicket ? (
            <div className="mt-6 md:mt-8 rounded-2xl border border-[#6a317f]/25 bg-[#6a317f]/8 px-4 py-4 md:px-6 md:py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-[0.16em] text-[#6a317f] font-semibold">Next check-in</p>
                <div className="text-lg font-semibold text-[#2b1833]">{nextTicket.eventId?.title || "Event"}</div>
                <div className="flex flex-wrap items-center gap-3 text-sm text-[#6a317f]">
                  <span className="flex items-center gap-1.5"><Calendar size={14} /> {formatDateTime(nextTicket.eventId?.startAt)}</span>
                  {nextTicket.eventId?.venue ? (
                    <span className="flex items-center gap-1.5"><MapPin size={14} /> {formatVenue(nextTicket.eventId.venue)}</span>
                  ) : null}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {nextTicket.qrImage ? (
                  <img src={nextTicket.qrImage} alt="Next ticket QR" className="w-20 h-20 rounded-xl border border-[#6a317f]/25 bg-white object-contain shadow-lg shadow-[#6a317f]/20" />
                ) : null}
                <Link
                  to="/events"
                  className="inline-flex items-center gap-2 rounded-xl bg-white text-[#6a317f] border border-[#6a317f]/25 px-4 py-2.5 text-sm font-semibold shadow-lg shadow-[#6a317f]/20 transition hover:border-[#6a317f]/45"
                >
                  view details
                </Link>
              </div>
            </div>
          ) : null}
        </section>

        <div className="mt-8 rounded-3xl border border-[#6a317f]/20 bg-white p-6 shadow-xl shadow-[#6a317f]/10">
          <div className="flex items-center gap-2 text-sm uppercase tracking-[0.16em] text-[#6a317f] font-semibold">
            <UserIcon size={15} /> Profile settings
          </div>
          <h2 className="text-2xl font-semibold text-[#2b1833] mt-2">Personal info</h2>
          <p className="text-[#6a317f]/75 text-sm mt-1">Keep your name current so it appears correctly on tickets and QR scans.</p>

          <form className="mt-6 space-y-5" onSubmit={handleSaveProfile}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm text-[#6a317f] font-semibold">Full name</label>
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="w-full rounded-xl border border-[#6a317f]/25 bg-white px-4 py-3 text-[#2b1833] placeholder:text-[#6a317f]/50 focus:border-[#6a317f] focus:outline-none focus:ring-2 focus:ring-[#6a317f]/25"
                  placeholder="Your name"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-[#6a317f] font-semibold">Email</label>
                <div className="flex items-center gap-3 rounded-xl border border-[#6a317f]/25 bg-white px-4 py-3 text-[#6a317f]">
                  <Mail size={16} className="text-[#6a317f]" />
                  <span className="truncate">{user?.email || "Not set"}</span>
                </div>
              </div>
            </div>

            <label className="flex items-start gap-3 rounded-2xl border border-[#6a317f]/25 bg-white px-4 py-3 text-sm text-[#2b1833] cursor-pointer">
              <input
                type="checkbox"
                checked={profileForm.marketingConsent}
                onChange={(e) => setProfileForm({ ...profileForm, marketingConsent: e.target.checked })}
                className="mt-1 h-4 w-4 rounded border-[#6a317f]/40 text-[#6a317f] focus:ring-[#6a317f]"
              />
              <div className="space-y-0.5">
                <div className="font-semibold text-[#2b1833]">Keep me posted about new events</div>
                <p className="text-[#6a317f]/75 text-xs">We only send relevant updates, and you can opt out anytime.</p>
              </div>
            </label>

            <div className="space-y-2">
              <label className="text-sm text-[#6a317f] font-semibold">Profile photo</label>
              <div className="flex items-center gap-4">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Profile avatar preview"
                    className="w-16 h-16 rounded-2xl border border-[#6a317f]/25 object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#6a317f] to-[#58276a] flex items-center justify-center text-lg font-bold text-white border border-[#6a317f]/25">
                    {initials}
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  <label className="inline-flex items-center gap-2 rounded-xl bg-white border border-[#6a317f]/25 px-4 py-2 text-sm font-semibold text-[#6a317f] cursor-pointer hover:border-[#6a317f]/60">
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
                      className="inline-flex items-center gap-2 rounded-xl border border-[#6a317f]/25 px-4 py-2 text-sm font-semibold text-[#6a317f] bg-white hover:border-[#6a317f]/50"
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
              </div>
              <p className="text-xs text-[#6a317f]/60">JPG/PNG up to 2.5MB.</p>
            </div>

            <div className="flex flex-wrap gap-3 pt-1">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#6a317f] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#6a317f]/30 transition hover:bg-[#58276a] disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save changes"}
              </button>
              <Link
                to="/attendee-dashboard"
                className="inline-flex items-center gap-2 rounded-xl border border-[#6a317f]/25 px-5 py-3 text-sm font-semibold text-[#6a317f] bg-white transition hover:border-[#6a317f]/45"
              >
                Back to dashboard
              </Link>
            </div>
          </form>
        </div>

        <div className="mt-8 rounded-3xl border border-[#6a317f]/20 bg-white p-6 shadow-xl shadow-[#6a317f]/10">
          <div className="flex items-center gap-2 text-sm uppercase tracking-[0.16em] text-[#6a317f] font-semibold">
            <TicketIcon size={15} /> All bookings
          </div>
          <p className="text-[#6a317f]/75 text-sm mt-1">Every ticket with its QR code, status, and venue details.</p>
          {loadingTickets ? (
            <div className="mt-5 text-[#6a317f]/70">Loading tickets...</div>
          ) : tickets.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-[#6a317f]/30 bg-white p-6 text-[#6a317f]/75">
              No bookings found yet.
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              {groupedTickets.map((group) => {
                const event = group.event || {};
                const groupKey = event._id || event.id || event.slug || `group-${group.tickets[0]?._id}`;

                return (
                  <div
                    key={groupKey}
                    className="rounded-2xl border border-[#6a317f]/18 bg-gradient-to-br from-white via-[#f9f4ff] to-white p-5 shadow-lg shadow-[#6a317f]/12"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-xs uppercase tracking-[0.14em] text-[#6a317f] font-semibold flex items-center gap-2">
                          <TicketIcon size={14} /> Event
                        </p>
                        <h3 className="text-xl font-semibold text-[#2b1833] leading-snug">{event.title || "Event"}</h3>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-[#6a317f]">
                          <span className="flex items-center gap-1.5"><Calendar size={14} /> {formatDateTime(event.startAt)}</span>
                          {event.venue ? (
                            <span className="flex items-center gap-1.5"><MapPin size={14} /> {formatVenue(event.venue)}</span>
                          ) : null}
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-2 rounded-full bg-white border border-[#6a317f]/25 px-3 py-1.5 text-xs font-semibold text-[#6a317f]">
                        {group.tickets.length} ticket{group.tickets.length > 1 ? "s" : ""}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {group.tickets.map((ticket) => (
                        <TicketCard
                          key={ticket._id || ticket.ticketCode}
                          ticket={{ ...ticket, eventId: event }}
                          showEventMeta={false}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
