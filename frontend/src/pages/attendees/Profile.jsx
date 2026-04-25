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
    <div className="rounded-lg border border-[#6a317f]/20 bg-white p-3 shadow-sm">
      {showEventMeta ? (
        <div className="mb-2 pb-2 border-b border-[#6a317f]/15">
          <h3 className="text-lg font-bold text-[#2b1833]">{event.title || "Event"}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-[#6a317f]">
            <span className="inline-flex items-center gap-1.5"><Calendar size={14} />{formatDateTime(event.startAt)}</span>
            {event.venue ? <span className="inline-flex items-center gap-1.5"><MapPin size={14} />{formatVenue(event.venue)}</span> : null}
          </div>
        </div>
      ) : null}

      <div className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.12em] text-[#6a317f]/80 font-semibold">Ticket type</p>
            <p className="text-sm font-semibold text-[#2b1833]">{ticketType.name || "General"}</p>
          </div>
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${statusStyles[status] || "bg-slate-100 text-slate-700 border border-slate-200"}`}>
            {status.replace("_", " ")}
          </span>
        </div>

        <div className="rounded-md border border-[#6a317f]/20 px-2.5 py-1.5">
          <p className="text-[11px] uppercase tracking-[0.12em] text-[#6a317f]/80 font-semibold">Ticket ID</p>
          <p className="text-xs sm:text-sm text-[#2b1833] font-mono truncate">{ticket.ticketCode}</p>
        </div>

        {ticket.qrImage ? (
          <div className="flex items-center justify-between gap-2 pt-1">
            <img
              src={ticket.qrImage}
              alt="Ticket QR"
              className="w-14 h-14 rounded-md border border-[#6a317f]/20 bg-white object-contain"
            />
            <div className="flex gap-2">
              <a
                href={ticket.qrImage}
                download={`${ticket.ticketCode}.png`}
                className="inline-flex items-center gap-1 rounded-md bg-[#6a317f] px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-[#58276a]"
              >
                <Download size={12} /> Save
              </a>
              <button
                type="button"
                onClick={() => window.open(ticket.qrImage, "_blank", "noopener")}
                className="inline-flex items-center gap-1 rounded-md border border-[#6a317f]/25 px-2.5 py-1.5 text-xs font-semibold text-[#6a317f] bg-white hover:border-[#6a317f]/50"
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
      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-24 relative">
        <section
          className={`rounded-3xl border p-6 md:p-8 shadow-[0_20px_80px_-50px_rgba(106,49,127,0.45)] ${
            isDark
              ? "border-white/10 bg-white/5 backdrop-blur"
              : "border-[#6a317f]/20 bg-white/90 backdrop-blur"
          }`}
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-start gap-4 min-w-0">
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
              <div className="space-y-1 min-w-0">
                <p className="text-xs uppercase tracking-[0.2em] text-[#6a317f] flex items-center gap-2 font-semibold">
                  <Sparkles size={14} /> Attendee profile
                </p>
                <h1 className={`text-3xl md:text-4xl font-bold tracking-tight ${isDark ? "text-white" : "text-[#2b1833]"}`}>
                  Hey {user?.name?.split(" ")[0] || "there"}
                </h1>
                <p className={`${isDark ? "text-white/75" : "text-[#6a317f]"} text-sm truncate`}>
                  {user?.email || "No email on file"}
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                  <span className={`px-3 py-1.5 rounded-full border text-xs font-semibold ${isDark ? "bg-white/10 border-white/20 text-white" : "bg-white border-[#6a317f]/25 text-[#6a317f]"}`}>
                    {counts.tickets} tickets
                  </span>
                  <span className={`px-3 py-1.5 rounded-full border text-xs font-semibold ${isDark ? "bg-white/10 border-white/20 text-white" : "bg-white border-[#6a317f]/25 text-[#6a317f]"}`}>
                    {counts.events} events
                  </span>
                  <span className={`px-3 py-1.5 rounded-full border text-xs font-semibold ${isDark ? "bg-[#6a317f]/35 border-[#6a317f]/50 text-white" : "bg-[#6a317f]/10 border-[#6a317f]/30 text-[#6a317f]"}`}>
                    {upcomingTickets.length} upcoming
                  </span>
                </div>
              </div>
            </div>

            <div className="w-full lg:w-auto grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className={`rounded-2xl border px-4 py-4 ${isDark ? "bg-white/10 border-white/15" : "bg-white border-[#6a317f]/20"}`}>
                <div className="text-xs uppercase tracking-[0.14em] text-[#6a317f] flex items-center gap-2 font-semibold"><TicketIcon size={14} /> Tickets</div>
                <div className={`mt-1 text-2xl font-bold ${isDark ? "text-white" : "text-[#2b1833]"}`}>{counts.tickets}</div>
                <p className={`text-xs ${isDark ? "text-white/65" : "text-[#6a317f]/70"}`}>All active and past</p>
              </div>
              <div className={`rounded-2xl border px-4 py-4 ${isDark ? "bg-white/10 border-white/15" : "bg-white border-[#6a317f]/20"}`}>
                <div className="text-xs uppercase tracking-[0.14em] text-[#6a317f] flex items-center gap-2 font-semibold"><Calendar size={14} /> Events</div>
                <div className={`mt-1 text-2xl font-bold ${isDark ? "text-white" : "text-[#2b1833]"}`}>{counts.events}</div>
                <p className={`text-xs ${isDark ? "text-white/65" : "text-[#6a317f]/70"}`}>Cities & venues</p>
              </div>
              <div className={`rounded-2xl border px-4 py-4 ${isDark ? "bg-[#6a317f]/25 border-[#6a317f]/45" : "bg-gradient-to-br from-[#6a317f]/12 via-white to-white border-[#6a317f]/30"}`}>
                <div className="text-xs uppercase tracking-[0.14em] text-[#6a317f] flex items-center gap-2 font-semibold"><CheckCircle2 size={14} className="text-[#6a317f]" /> Upcoming</div>
                <div className={`mt-1 text-2xl font-bold ${isDark ? "text-white" : "text-[#2b1833]"}`}>{upcomingTickets.length}</div>
                <p className={`text-xs ${isDark ? "text-white/70" : "text-[#6a317f]/70"}`}>Ready to scan</p>
              </div>
            </div>
          </div>

          {nextTicket ? (
            <div className={`mt-6 rounded-2xl border px-4 py-4 md:px-6 md:py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${isDark ? "border-[#6a317f]/45 bg-[#6a317f]/20" : "border-[#6a317f]/25 bg-[#6a317f]/8"}`}>
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-[0.16em] text-[#6a317f] font-semibold">Next check-in</p>
                <div className={`text-lg font-semibold ${isDark ? "text-white" : "text-[#2b1833]"}`}>{nextTicket.eventId?.title || "Event"}</div>
                <div className={`flex flex-wrap items-center gap-3 text-sm ${isDark ? "text-white/80" : "text-[#6a317f]"}`}>
                  <span className="flex items-center gap-1.5"><Calendar size={14} /> {formatDateTime(nextTicket.eventId?.startAt)}</span>
                  {nextTicket.eventId?.venue ? (
                    <span className="flex items-center gap-1.5"><MapPin size={14} /> {formatVenue(nextTicket.eventId.venue)}</span>
                  ) : null}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {nextTicket.qrImage ? (
                  <img src={nextTicket.qrImage} alt="Next ticket QR" className="w-16 h-16 rounded-xl border border-[#6a317f]/25 bg-white object-contain" />
                ) : null}
                <Link
                  to="/events"
                  className="inline-flex items-center gap-2 rounded-xl bg-white text-[#6a317f] border border-[#6a317f]/25 px-4 py-2 text-sm font-semibold transition hover:border-[#6a317f]/45"
                >
                  View details
                </Link>
              </div>
            </div>
          ) : null}
        </section>

        <div className="mt-8 grid grid-cols-1 xl:grid-cols-[360px,1fr] gap-6">
          <section
            className={`rounded-3xl border p-6 shadow-xl ${
              isDark ? "border-white/10 bg-white/5" : "border-[#6a317f]/20 bg-white"
            }`}
          >
            <div className="flex items-center gap-2 text-sm uppercase tracking-[0.16em] text-[#6a317f] font-semibold">
              <UserIcon size={15} /> Profile settings
            </div>
            <h2 className={`text-2xl font-semibold mt-2 ${isDark ? "text-white" : "text-[#2b1833]"}`}>Personal info</h2>
            <p className={`text-sm mt-1 ${isDark ? "text-white/70" : "text-[#6a317f]/75"}`}>
              Keep your details up to date for faster check-ins.
            </p>

            <form className="mt-6 space-y-5" onSubmit={handleSaveProfile}>
              <div className="space-y-2">
                <label className="text-sm text-[#6a317f] font-semibold">Full name</label>
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className={`w-full rounded-xl border px-4 py-3 placeholder:text-[#6a317f]/50 focus:border-[#6a317f] focus:outline-none focus:ring-2 focus:ring-[#6a317f]/25 ${
                    isDark
                      ? "border-white/15 bg-white/10 text-white"
                      : "border-[#6a317f]/25 bg-white text-[#2b1833]"
                  }`}
                  placeholder="Your name"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-[#6a317f] font-semibold">Email</label>
                <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${isDark ? "border-white/15 bg-white/10 text-white/85" : "border-[#6a317f]/25 bg-white text-[#6a317f]"}`}>
                  <Mail size={16} className="text-[#6a317f]" />
                  <span className="truncate">{user?.email || "Not set"}</span>
                </div>
              </div>

              <label className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm cursor-pointer ${isDark ? "border-white/15 bg-white/10 text-white" : "border-[#6a317f]/25 bg-white text-[#2b1833]"}`}>
                <input
                  type="checkbox"
                  checked={profileForm.marketingConsent}
                  onChange={(e) => setProfileForm({ ...profileForm, marketingConsent: e.target.checked })}
                  className="mt-1 h-4 w-4 rounded border-[#6a317f]/40 text-[#6a317f] focus:ring-[#6a317f]"
                />
                <div className="space-y-0.5">
                  <div className={`font-semibold ${isDark ? "text-white" : "text-[#2b1833]"}`}>Keep me posted about new events</div>
                  <p className={`text-xs ${isDark ? "text-white/70" : "text-[#6a317f]/75"}`}>We only send relevant updates.</p>
                </div>
              </label>

              <div className="space-y-2">
                <label className="text-sm text-[#6a317f] font-semibold">Profile photo</label>
                <div className="flex items-center gap-4">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Profile avatar preview"
                      className="w-14 h-14 rounded-xl border border-[#6a317f]/25 object-cover"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#6a317f] to-[#58276a] flex items-center justify-center text-base font-bold text-white border border-[#6a317f]/25">
                      {initials}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <label className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold cursor-pointer ${isDark ? "bg-white/10 border-white/20 text-white" : "bg-white border-[#6a317f]/25 text-[#6a317f]"}`}>
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
                        className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold ${isDark ? "border-white/20 text-white bg-white/10" : "border-[#6a317f]/25 text-[#6a317f] bg-white"}`}
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>
                </div>
                <p className={`text-xs ${isDark ? "text-white/65" : "text-[#6a317f]/60"}`}>JPG/PNG up to 2.5MB.</p>
              </div>

              <div className="flex flex-wrap gap-3 pt-1">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center rounded-xl bg-[#6a317f] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#58276a] disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save changes"}
                </button>
                <Link
                  to="/attendee-dashboard"
                  className={`inline-flex items-center rounded-xl border px-5 py-2.5 text-sm font-semibold transition ${isDark ? "border-white/20 text-white bg-white/10" : "border-[#6a317f]/25 text-[#6a317f] bg-white"}`}
                >
                  Back to dashboard
                </Link>
              </div>
            </form>
          </section>

          <section
            className={`rounded-3xl border p-6 shadow-xl ${
              isDark ? "border-white/10 bg-white/5" : "border-[#6a317f]/20 bg-white"
            }`}
          >
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <div className="flex items-center gap-2 text-sm uppercase tracking-[0.16em] text-[#6a317f] font-semibold">
                  <TicketIcon size={15} /> Your tickets
                </div>
                <p className={`text-sm mt-1 ${isDark ? "text-white/70" : "text-[#6a317f]/75"}`}>
                  Clear, compact ticket list with QR access.
                </p>
              </div>
              <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${isDark ? "bg-white/10 border-white/20 text-white" : "bg-white border-[#6a317f]/25 text-[#6a317f]"}`}>
                {tickets.length} total
              </span>
            </div>

            {loadingTickets ? (
              <div className={`mt-5 ${isDark ? "text-white/70" : "text-[#6a317f]/70"}`}>Loading tickets...</div>
            ) : tickets.length === 0 ? (
              <div className={`mt-5 rounded-2xl border border-dashed p-6 ${isDark ? "border-white/20 bg-white/5 text-white/70" : "border-[#6a317f]/30 bg-white text-[#6a317f]/75"}`}>
                No bookings found yet.
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                {groupedTickets.map((group) => {
                  const event = group.event || {};
                  const groupKey = event._id || event.id || event.slug || `group-${group.tickets[0]?._id}`;

                  return (
                    <div key={groupKey} className={`rounded-2xl border p-4 ${isDark ? "border-white/15 bg-white/5" : "border-[#6a317f]/18 bg-white"}`}>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="space-y-1 min-w-0">
                          <p className="text-xs uppercase tracking-[0.14em] text-[#6a317f] font-semibold flex items-center gap-2">
                            <TicketIcon size={14} /> Event
                          </p>
                          <h3 className={`text-xl md:text-2xl font-bold leading-snug truncate ${isDark ? "text-white" : "text-[#2b1833]"}`}>
                            {event.title || "Event"}
                          </h3>
                          <div className={`flex flex-wrap items-center gap-3 text-sm ${isDark ? "text-white/75" : "text-[#6a317f]"}`}>
                            <span className="flex items-center gap-1.5"><Calendar size={14} /> {formatDateTime(event.startAt)}</span>
                            {event.venue ? (
                              <span className="flex items-center gap-1.5"><MapPin size={14} /> {formatVenue(event.venue)}</span>
                            ) : null}
                          </div>
                        </div>
                        <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${isDark ? "bg-white/10 border-white/20 text-white" : "bg-white border-[#6a317f]/25 text-[#6a317f]"}`}>
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
          </section>
        </div>
      </div>
    </div>
  );
}
