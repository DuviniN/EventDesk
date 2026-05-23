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
    <div
      className="rounded-2xl p-3 shadow-sm"
      style={{ background: "var(--surface-bg)", border: "1px solid var(--border-color)" }}
    >
      {showEventMeta ? (
        <div className="mb-2 pb-2" style={{ borderBottom: "1px solid var(--border-color)" }}>
          <h3 className="text-lg font-bold text-slate-900">{event.title || "Event"}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm" style={{ color: "var(--color-muted)" }}>
            <span className="inline-flex items-center gap-1.5"><Calendar size={14} />{formatDateTime(event.startAt)}</span>
            {event.venue ? <span className="inline-flex items-center gap-1.5"><MapPin size={14} />{formatVenue(event.venue)}</span> : null}
          </div>
        </div>
      ) : null}

      <div className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.12em] font-semibold" style={{ color: "var(--color-muted)" }}>Ticket type</p>
            <p className="text-sm font-semibold text-slate-900">{ticketType.name || "General"}</p>
          </div>
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${statusStyles[status] || "bg-slate-100 text-slate-700 border border-slate-200"}`}>
            {status.replace("_", " ")}
          </span>
        </div>

        <div className="rounded-xl px-2.5 py-2" style={{ border: "1px solid var(--border-color)" }}>
          <p className="text-[11px] uppercase tracking-[0.12em] font-semibold" style={{ color: "var(--color-muted)" }}>Ticket ID</p>
          <p className="text-xs sm:text-sm text-slate-900 font-mono truncate">{ticket.ticketCode}</p>
        </div>

        {ticket.qrImage ? (
          <div className="flex items-center justify-between gap-2 pt-1">
            <img
              src={ticket.qrImage}
              alt="Ticket QR"
              className="w-14 h-14 rounded-xl object-contain"
              style={{ background: "var(--surface-bg)", border: "1px solid var(--border-color)" }}
            />
            <div className="flex gap-2">
              <a
                href={ticket.qrImage}
                download={`${ticket.ticketCode}.png`}
                className="inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-white transition"
                style={{ background: "var(--color-accent)" }}
              >
                <Download size={12} /> Save
              </a>
              <button
                type="button"
                onClick={() => window.open(ticket.qrImage, "_blank", "noopener")}
                className="inline-flex items-center gap-1 rounded-xl border px-2.5 py-1.5 text-xs font-semibold transition"
                style={{
                  background: "var(--surface-bg)",
                  borderColor: "var(--border-color)",
                  color: "var(--color-accent)",
                }}
              >
                <QrCode size={12} /> View
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function Profile() {
  const { isDark } = useTheme();
  const { user, updateProfile } = useAuth();
  const [isTicketsOpen, setIsTicketsOpen] = useState(false);
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

  useEffect(() => {
    if (!isTicketsOpen) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") setIsTicketsOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isTicketsOpen]);

  return (
    <div className="attendee-profile min-h-screen pb-16" style={{ background: "var(--bg-main)", color: "var(--text-primary)" }}>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-24 relative">

        <style>
          {`
            .ed-panel {
              background: var(--surface-bg);
              border: 1px solid var(--border-color);
              box-shadow: 0 22px 90px -70px color-mix(in srgb, var(--color-accent) 26%, transparent);
            }
            .ed-subpanel {
              background: color-mix(in srgb, var(--surface-bg) 92%, transparent);
              border: 1px solid var(--border-color);
            }
            .ed-label {
              color: var(--color-muted);
              text-transform: uppercase;
              letter-spacing: 0.16em;
              font-weight: 700;
              font-size: 12px;
            }
            .ed-input {
              background: var(--surface-bg);
              border: 1px solid var(--border-color);
              color: var(--text-primary);
            }
            .ed-input:focus {
              outline: none;
              border-color: color-mix(in srgb, var(--color-accent) 42%, var(--border-color));
              box-shadow: 0 0 0 4px color-mix(in srgb, var(--color-accent) 18%, transparent);
            }
            .ed-chip {
              background: color-mix(in srgb, var(--surface-bg) 92%, transparent);
              border: 1px solid var(--border-color);
              color: var(--color-accent);
              font-weight: 700;
            }
            .ed-btn-primary {
              background: var(--color-accent);
              color: white;
            }
            .ed-btn-primary:hover {
              filter: brightness(0.95);
            }
            .ed-btn-outline {
              background: var(--surface-bg);
              border: 1px solid var(--border-color);
              color: var(--color-accent);
            }
            .ed-btn-outline:hover {
              border-color: color-mix(in srgb, var(--color-accent) 38%, var(--border-color));
            }
          `}
        </style>

        {/* Header: Profile summary + next check-in */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <section className={`lg:col-span-7 rounded-3xl p-6 md:p-8 backdrop-blur-xl ${isDark ? "border-white/10 bg-white/5" : "ed-panel"}`}>
            <div className="flex items-start gap-4 min-w-0">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Profile avatar"
                  className="w-16 h-16 md:w-20 md:h-20 rounded-2xl object-cover"
                  style={{ border: "1px solid var(--border-color)" }}
                />
              ) : (
                <div
                  className="w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center text-xl md:text-2xl font-bold text-white"
                  style={{ background: "linear-gradient(135deg, var(--color-accent), color-mix(in srgb, var(--color-accent) 72%, #000 28%))" }}
                >
                  {initials}
                </div>
              )}

              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 ed-label">
                  <Sparkles size={14} style={{ color: "var(--color-accent)" }} />
                  Attendee profile
                </div>
                <h1 className={`text-3xl md:text-4xl font-bold tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
                  {user?.name ? <>Hey {user.name.split(" ")[0]}</> : "Hey there"}
                </h1>
                <p className={`text-sm truncate ${isDark ? "text-white/75" : "text-slate-700"}`}>{user?.email || "No email on file"}</p>

                <div className="flex flex-wrap gap-2 pt-3">
                  <span className={`px-3 py-1.5 rounded-full text-xs border font-semibold ${isDark ? "bg-white/10 border-white/20 text-white" : "ed-chip"}`}>
                    {counts.tickets} tickets
                  </span>
                  <span className={`px-3 py-1.5 rounded-full text-xs border font-semibold ${isDark ? "bg-white/10 border-white/20 text-white" : "ed-chip"}`}>
                    {counts.events} events
                  </span>
                  <span className={`px-3 py-1.5 rounded-full text-xs border font-semibold ${isDark ? "bg-[#6a317f]/35 border-[#6a317f]/50 text-white" : "ed-chip"}`}>
                    {upcomingTickets.length} upcoming
                  </span>
                </div>

                <div className="pt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setIsTicketsOpen(true)}
                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                      isDark ? "bg-[#6a317f] text-white hover:bg-[#58276a]" : "ed-btn-primary"
                    }`}
                  >
                    <TicketIcon size={16} /> Your ticket
                  </button>
                  <Link
                    to="/attendee-dashboard"
                    className={`inline-flex items-center rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                      isDark ? "border-white/20 text-white bg-white/10" : "ed-btn-outline"
                    }`}
                  >
                    Back
                  </Link>
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className={`rounded-2xl border px-4 py-4 ${isDark ? "bg-white/10 border-white/15" : ""}`} style={isDark ? undefined : { background: "var(--surface-bg)", borderColor: "var(--border-color)" }}>
                <div className="ed-label flex items-center gap-2"><TicketIcon size={14} style={{ color: "var(--color-accent)" }} /> Tickets</div>
                <div className={`mt-1 text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>{counts.tickets}</div>
                <p className={`text-xs ${isDark ? "text-white/65" : "text-slate-600"}`}>All active and past</p>
              </div>
              <div className={`rounded-2xl border px-4 py-4 ${isDark ? "bg-white/10 border-white/15" : ""}`} style={isDark ? undefined : { background: "var(--surface-bg)", borderColor: "var(--border-color)" }}>
                <div className="ed-label flex items-center gap-2"><Calendar size={14} style={{ color: "var(--color-accent)" }} /> Events</div>
                <div className={`mt-1 text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>{counts.events}</div>
                <p className={`text-xs ${isDark ? "text-white/65" : "text-slate-600"}`}>Cities & venues</p>
              </div>
              <div className={`rounded-2xl border px-4 py-4 ${isDark ? "bg-[#6a317f]/25 border-[#6a317f]/45" : ""}`} style={isDark ? undefined : { background: "color-mix(in srgb, var(--color-accent) 10%, var(--surface-bg))", borderColor: "var(--border-color)" }}>
                <div className="ed-label flex items-center gap-2"><CheckCircle2 size={14} style={{ color: "var(--color-accent)" }} /> Upcoming</div>
                <div className={`mt-1 text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>{upcomingTickets.length}</div>
                <p className={`text-xs ${isDark ? "text-white/70" : "text-slate-600"}`}>Ready to scan</p>
              </div>
            </div>
          </section>

          <section className={`lg:col-span-5 rounded-3xl p-6 md:p-8 backdrop-blur-xl ${isDark ? "border-white/10 bg-white/5" : "ed-panel"}`}>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <div className="ed-label flex items-center gap-2">
                  <QrCode size={14} style={{ color: "var(--color-accent)" }} /> Next check-in
                </div>
                <h2 className={`mt-2 text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Your next event</h2>
                <p className={`mt-1 text-sm ${isDark ? "text-white/70" : "text-slate-600"}`}>
                  Show this QR at the entrance.
                </p>
              </div>
              <Link
                to="/attendee-dashboard"
                className={`inline-flex items-center rounded-xl border px-4 py-2 text-sm font-semibold transition ${isDark ? "border-white/20 text-white bg-white/10" : ""}`}
                style={isDark ? undefined : { background: "var(--surface-bg)", borderColor: "var(--border-color)", color: "var(--color-accent)" }}
              >
                Back
              </Link>
            </div>

            {nextTicket ? (
              <div className="mt-5 rounded-2xl p-4" style={isDark ? undefined : { background: "color-mix(in srgb, var(--color-accent) 6%, var(--surface-bg))", border: "1px solid var(--border-color)" }}>
                <div className="space-y-1">
                  <div className={`text-lg font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>{nextTicket.eventId?.title || "Event"}</div>
                  <div className={`flex flex-wrap items-center gap-3 text-sm ${isDark ? "text-white/80" : ""}`} style={isDark ? undefined : { color: "var(--color-muted)" }}>
                    <span className="flex items-center gap-1.5"><Calendar size={14} /> {formatDateTime(nextTicket.eventId?.startAt)}</span>
                    {nextTicket.eventId?.venue ? (
                      <span className="flex items-center gap-1.5"><MapPin size={14} /> {formatVenue(nextTicket.eventId.venue)}</span>
                    ) : null}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                  {nextTicket.qrImage ? (
                    <img
                      src={nextTicket.qrImage}
                      alt="Next ticket QR"
                      className="w-20 h-20 rounded-2xl object-contain"
                      style={{ background: "var(--surface-bg)", border: "1px solid var(--border-color)" }}
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-2xl flex items-center justify-center" style={{ background: "var(--surface-bg)", border: "1px solid var(--border-color)" }}>
                      <QrCode size={22} style={{ color: "var(--color-accent)" }} />
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    {nextTicket.qrImage ? (
                      <a
                        href={nextTicket.qrImage}
                        download={`${nextTicket.ticketCode}.png`}
                        className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white"
                        style={{ background: "var(--color-accent)" }}
                      >
                        <Download size={16} /> Download QR
                      </a>
                    ) : null}
                    <Link
                      to="/attendee-dashboard"
                      className="inline-flex items-center rounded-xl border px-4 py-2 text-sm font-semibold"
                      style={{ background: "var(--surface-bg)", borderColor: "var(--border-color)", color: "var(--color-accent)" }}
                    >
                      View events
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className={`mt-5 rounded-2xl border border-dashed p-6 ${isDark ? "border-white/20 bg-white/5 text-white/70" : ""}`} style={isDark ? undefined : { borderColor: "var(--border-color)", background: "var(--surface-bg)", color: "var(--color-muted)" }}>
                No upcoming events yet. Book a ticket to see your next QR here.
              </div>
            )}
          </section>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6">
          <section
            className={`rounded-3xl p-6 shadow-xl ${isDark ? "border border-white/10 bg-white/5" : "ed-panel"}`}
          >
            <div className={`flex items-center gap-2 ${isDark ? "text-white/80" : "ed-label"}`}>
              <UserIcon size={15} style={{ color: "var(--color-accent)" }} /> Profile settings
            </div>
            <h2 className={`text-2xl font-semibold mt-2 ${isDark ? "text-white" : "text-slate-900"}`}>Personal info</h2>
            <p className={`text-sm mt-1 ${isDark ? "text-white/70" : "text-slate-600"}`}>
              Keep your details up to date for faster check-ins.
            </p>

            <form className="mt-6 space-y-5" onSubmit={handleSaveProfile}>
              <div className="space-y-2">
                <label className={`text-sm font-semibold ${isDark ? "text-white/85" : ""}`} style={isDark ? undefined : { color: "var(--color-muted)" }}>
                  Full name
                </label>
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className={`w-full rounded-xl px-4 py-3 placeholder:text-slate-400 ${isDark ? "border border-white/15 bg-white/10 text-white placeholder:text-white/40" : "ed-input"}`}
                  placeholder="Your name"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className={`text-sm font-semibold ${isDark ? "text-white/85" : ""}`} style={isDark ? undefined : { color: "var(--color-muted)" }}>
                  Email
                </label>
                <div
                  className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${isDark ? "border-white/15 bg-white/10 text-white/85" : ""}`}
                  style={isDark ? undefined : { background: "var(--surface-bg)", borderColor: "var(--border-color)", color: "var(--color-muted)" }}
                >
                  <Mail size={16} style={{ color: "var(--color-accent)" }} />
                  <span className="truncate">{user?.email || "Not set"}</span>
                </div>
              </div>

              <label
                className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm cursor-pointer ${isDark ? "border-white/15 bg-white/10 text-white" : ""}`}
                style={isDark ? undefined : { background: "var(--surface-bg)", borderColor: "var(--border-color)", color: "var(--text-primary)" }}
              >
                <input
                  type="checkbox"
                  checked={profileForm.marketingConsent}
                  onChange={(e) => setProfileForm({ ...profileForm, marketingConsent: e.target.checked })}
                  className={`mt-1 h-4 w-4 rounded ${isDark ? "border-white/30" : ""}`}
                  style={{ accentColor: "var(--color-accent)" }}
                />
                <div className="space-y-0.5">
                  <div className={`font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>Keep me posted about new events</div>
                  <p className={`text-xs ${isDark ? "text-white/70" : "text-slate-600"}`}>We only send relevant updates.</p>
                </div>
              </label>

              <div className="space-y-2">
                <label className={`text-sm font-semibold ${isDark ? "text-white/85" : ""}`} style={isDark ? undefined : { color: "var(--color-muted)" }}>
                  Profile photo
                </label>
                <div className="flex items-center gap-4">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Profile avatar preview"
                      className="w-14 h-14 rounded-xl object-cover"
                      style={{ border: "1px solid var(--border-color)", background: "var(--surface-bg)" }}
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#6a317f] to-[#58276a] flex items-center justify-center text-base font-bold text-white border border-[#6a317f]/25">
                      {initials}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <label
                      className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold cursor-pointer ${isDark ? "bg-white/10 border-white/20 text-white" : "ed-btn-outline"}`}
                    >
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleAvatarChange(e.target.files?.[0])}
                      />
                      Change
                    </label>
                    {avatarPreview ? (
                      <button
                        type="button"
                        onClick={() => {
                          setAvatarPreview("");
                          setProfileForm((prev) => ({ ...prev, avatarUrl: "" }));
                        }}
                        className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold ${isDark ? "border-white/20 text-white bg-white/10" : "ed-btn-outline"}`}
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>
                </div>
                <p className={`text-xs ${isDark ? "text-white/65" : "text-slate-600"}`}>JPG/PNG up to 2.5MB.</p>
              </div>

              <div className="flex flex-wrap gap-3 pt-1">
                <button
                  type="submit"
                  disabled={saving}
                  className={`inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold transition disabled:opacity-60 ${isDark ? "bg-[#6a317f] text-white hover:bg-[#58276a]" : "ed-btn-primary"}`}
                >
                  {saving ? "Saving..." : "Save changes"}
                </button>
                <Link
                  to="/attendee-dashboard"
                  className={`inline-flex items-center rounded-xl border px-5 py-2.5 text-sm font-semibold transition ${isDark ? "border-white/20 text-white bg-white/10" : "ed-btn-outline"}`}
                >
                  Back to dashboard
                </Link>
              </div>
            </form>
          </section>
        </div>
      </div>

      {isTicketsOpen ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Your tickets"
        >
          <button
            type="button"
            className="absolute inset-0"
            onClick={() => setIsTicketsOpen(false)}
            aria-label="Close tickets"
            style={{ background: "rgba(0,0,0,0.55)" }}
          />

          <div
            className={`relative w-full max-w-5xl max-h-[85vh] overflow-hidden rounded-3xl border shadow-2xl ${
              isDark ? "border-white/10 bg-[#0b0d14]/80" : ""
            }`}
            style={
              isDark
                ? { backdropFilter: "blur(14px)" }
                : { background: "var(--surface-bg)", borderColor: "var(--border-color)", backdropFilter: "blur(14px)" }
            }
          >
            <div className="flex items-start justify-between gap-4 p-5 md:p-6" style={{ borderBottom: "1px solid var(--border-color)" }}>
              <div className="min-w-0">
                <div className={`flex items-center gap-2 ${isDark ? "text-white/80" : "ed-label"}`}>
                  <TicketIcon size={16} style={{ color: "var(--color-accent)" }} /> Your tickets
                </div>
                <p className={`mt-1 text-sm ${isDark ? "text-white/70" : "text-slate-600"}`}>
                  QR codes, status, and ticket IDs.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className={`hidden sm:inline-flex px-3 py-1.5 rounded-full text-xs font-semibold border ${isDark ? "bg-white/10 border-white/20 text-white" : "ed-chip"}`}>
                  {tickets.length} total
                </span>
                <button
                  type="button"
                  onClick={() => setIsTicketsOpen(false)}
                  className={`inline-flex items-center rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                    isDark ? "border-white/20 text-white bg-white/10" : "ed-btn-outline"
                  }`}
                >
                  Close
                </button>
              </div>
            </div>

            <div className="p-5 md:p-6 overflow-auto max-h-[calc(85vh-86px)]">
              {loadingTickets ? (
                <div className={`${isDark ? "text-white/70" : ""}`} style={isDark ? undefined : { color: "var(--color-muted)" }}>
                  Loading tickets...
                </div>
              ) : tickets.length === 0 ? (
                <div
                  className={`rounded-2xl border border-dashed p-6 ${isDark ? "border-white/20 bg-white/5 text-white/70" : ""}`}
                  style={isDark ? undefined : { borderColor: "var(--border-color)", background: "var(--surface-bg)", color: "var(--color-muted)" }}
                >
                  No bookings found yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {groupedTickets.map((group) => {
                    const event = group.event || {};
                    const groupKey = event._id || event.id || event.slug || `group-${group.tickets[0]?._id}`;

                    return (
                      <div
                        key={groupKey}
                        className={`rounded-2xl border p-4 ${isDark ? "border-white/15 bg-white/5" : "ed-subpanel"}`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="space-y-1 min-w-0">
                            <p
                              className={`text-xs uppercase tracking-[0.14em] font-semibold flex items-center gap-2 ${isDark ? "text-white/80" : ""}`}
                              style={isDark ? undefined : { color: "var(--color-muted)" }}
                            >
                              <TicketIcon size={14} style={{ color: "var(--color-accent)" }} /> Event
                            </p>
                            <h3 className={`text-xl md:text-2xl font-bold leading-snug truncate ${isDark ? "text-white" : "text-slate-900"}`}>
                              {event.title || "Event"}
                            </h3>
                            <div
                              className={`flex flex-wrap items-center gap-3 text-sm ${isDark ? "text-white/75" : ""}`}
                              style={isDark ? undefined : { color: "var(--color-muted)" }}
                            >
                              <span className="flex items-center gap-1.5"><Calendar size={14} /> {formatDateTime(event.startAt)}</span>
                              {event.venue ? (
                                <span className="flex items-center gap-1.5"><MapPin size={14} /> {formatVenue(event.venue)}</span>
                              ) : null}
                            </div>
                          </div>
                          <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${isDark ? "bg-white/10 border-white/20 text-white" : "ed-chip"}`}>
                            {group.tickets.length} ticket{group.tickets.length > 1 ? "s" : ""}
                          </span>
                        </div>

                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
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
      ) : null}
    </div>
  );
}
