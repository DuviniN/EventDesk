import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import { getEvent } from "../../features/events/eventApi";
import { getTicketTypes, purchaseTickets } from "../../features/tickets/ticketsApi";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  MapPin,
  Tag,
  Users,
  Ticket,
  Minus,
  Plus,
  CheckCircle2,
  Loader2,
} from "lucide-react";

function formatVenue(venue) {
  if (!venue) return "";
  if (typeof venue === "string") return venue;
  if (typeof venue === "object") {
    return [venue.name, venue.address, venue.city].filter(Boolean).join(", ");
  }
  return String(venue);
}

const CATEGORY_LABELS = {
  concert: "Concert",
  theatre: "Theatre",
  family: "Family",
  other: "Other"
};

const TIER_LABELS = {
  "vip": "VIP",
  "premium": "Premium",
  "regular": "Regular",
  "early-bird": "Early Bird",
  "student": "Student Ticket"
};

const normalizeCategory = (value = "") => value.toString().trim().toLowerCase();

const getPrimaryCategory = (event) => {
  if (!event) return "";
  if (Array.isArray(event.categories) && event.categories.length) return event.categories[0];
  return event.category || "";
};

// ── Quantity stepper ───────────────────────────────────────────
function Stepper({ value, min = 0, max = 10, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
      >
        <Minus size={14} className="text-white" />
      </button>
      <span className="w-8 text-center text-white font-semibold text-sm select-none">{value}</span>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
      >
        <Plus size={14} className="text-white" />
      </button>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────
export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [ticketTypes, setTicketTypes] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [loadingEvent, setLoadingEvent] = useState(true);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [booked, setBooked] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const [evtData, ttData] = await Promise.all([
          getEvent(id),
          getTicketTypes(id).catch(() => ({ ticketTypes: [] })),
        ]);
        setEvent(evtData.event);
        const types = ttData.ticketTypes || [];
        setTicketTypes(types);
        const init = {};
        types.forEach((t) => { init[t._id] = 0; });
        setQuantities(init);
      } catch (err) {
        console.error(err);
        setError("Could not load event.");
      } finally {
        setLoadingEvent(false);
        setLoadingTickets(false);
      }
    }
    load();
  }, [id]);

  const setQty = useCallback((ttId, val) => {
    setQuantities((prev) => ({ ...prev, [ttId]: val }));
  }, []);

  const totalPrice = ticketTypes.reduce((sum, tt) => {
    return sum + (quantities[tt._id] || 0) * (tt.price || 0);
  }, 0);

  const totalTickets = Object.values(quantities).reduce((a, b) => a + b, 0);

  const handleBook = async () => {
    const items = ticketTypes
      .filter((tt) => quantities[tt._id] > 0)
      .map((tt) => ({ ticketTypeId: tt._id, quantity: quantities[tt._id] }));

    if (items.length === 0) {
      toast.error("Please select at least one ticket.");
      return;
    }

    setPurchasing(true);
    try {
      await purchaseTickets(id, { items });
      setBooked(true);
      toast.success("Booking confirmed!");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Booking failed. Please try again.");
    } finally {
      setPurchasing(false);
    }
  };

  // ── Success screen ───────────────────────────────────────────
  if (booked) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#f6efff] via-white to-[#f9f5ff] text-slate-900">
        <Navbar />
        <div className="pt-32 pb-20 flex flex-col items-center justify-center px-6 text-center">
          <div className="w-20 h-20 rounded-full bg-green-100 border border-green-300 flex items-center justify-center mb-6">
            <CheckCircle2 size={40} className="text-green-500" />
          </div>
          <h1 className="text-3xl font-bold mb-2 text-slate-900">Booking Confirmed!</h1>
          <p className="text-slate-600 mb-2 text-base">
            You successfully booked <span className="text-slate-900 font-semibold">{totalTickets} ticket{totalTickets !== 1 ? "s" : ""}</span> for
          </p>
          <p className="text-purple-600 font-semibold text-lg mb-8">{event?.title}</p>
          <button
            onClick={() => navigate("/attendee-dashboard")}
            className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm transition-colors shadow-lg shadow-purple-300/60"
          >
            Back to Dashboard
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  // ── Loading / error ──────────────────────────────────────────
  if (loadingEvent) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#f6efff] via-white to-[#f9f5ff] text-slate-900 flex items-center justify-center">
        <Navbar />
        <Loader2 size={32} className="animate-spin text-purple-500" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#f6efff] via-white to-[#f9f5ff] text-slate-900">
        <Navbar />
        <div className="pt-32 text-center text-red-500 px-6">{error || "Event not found."}</div>
      </div>
    );
  }

  // ── Date helpers ─────────────────────────────────────────────
  const startDate = event.startAt ? new Date(event.startAt) : null;
  const endDate = event.endAt ? new Date(event.endAt) : null;
  const formattedDate = startDate
    ? startDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })
    : "Date TBA";
  const formattedTime = startDate
    ? startDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
    : "";
  const formattedEnd = endDate
    ? endDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
    : "";

  const primaryCategory = getPrimaryCategory(event);
  const displayCategory = CATEGORY_LABELS[normalizeCategory(primaryCategory)] || primaryCategory;
  const imageSrc = event.imageUrl || "https://images.unsplash.com/photo-1464375117522-1311d6a5b81f?auto=format&fit=crop&w=1600&q=80";

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f6efff] via-white to-[#f9f5ff] text-slate-900">
      <Navbar />

      <div className="pt-24 pb-20 px-6 sm:px-8 lg:px-16">
        <div className="max-w-6xl mx-auto">

          {/* Hero image full-bleed within page padding */}
          <div className="-mx-6 sm:-mx-8 lg:-mx-16 mb-10">
            <div className="relative overflow-hidden rounded-none sm:rounded-3xl border border-slate-200 shadow-2xl shadow-slate-200/60">
              <div className="h-72 sm:h-80 md:h-96 w-full">
                <img
                  src={imageSrc}
                  alt={event.title}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/25 to-black/60" />
              </div>
              <div className="absolute inset-0 flex items-end p-6 sm:p-8">
                <div className="space-y-3">
                  {displayCategory && (
                    <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-purple-600/80 text-white text-xs font-semibold border border-purple-400/60 shadow-lg shadow-purple-900/40">
                      {displayCategory}
                    </span>
                  )}
                  <h1 className="text-3xl sm:text-4xl font-bold text-white drop-shadow-lg max-w-4xl">
                    {event.title}
                  </h1>
                  <div className="flex flex-wrap gap-3 text-sm text-gray-200 drop-shadow">
                    {formattedDate && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 border border-white/10">
                        <CalendarDays size={15} /> {formattedDate}
                      </span>
                    )}
                    {(formattedTime || formattedEnd) && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 border border-white/10">
                        <Clock size={15} /> {formattedTime}{formattedEnd ? ` – ${formattedEnd}` : ""}
                      </span>
                    )}
                    {event.venue && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 border border-white/10">
                        <MapPin size={15} /> {formatVenue(event.venue)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Back button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors mb-8 group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
            Back
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">

            {/* ── LEFT: Event info ─────────────────────────────── */}
            <div className="lg:col-span-3 space-y-6">

              {/* Status badge */}
              {event.status && (
                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border ${
                  event.status === "published"
                    ? "bg-green-500/10 text-green-400 border-green-500/20"
                    : "bg-gray-800 text-gray-400 border-gray-700"
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${event.status === "published" ? "bg-green-400" : "bg-gray-500"}`} />
                  {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                </span>
              )}

              {/* Title */}
              <h1 className="text-3xl sm:text-4xl font-bold leading-tight">
                {event.title}
              </h1>

              {/* Meta grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-start gap-3 bg-slate-50 rounded-xl p-3.5 border border-slate-200">
                  <CalendarDays size={18} className="text-purple-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-500 mb-0.5 font-medium">Date</p>
                    <p className="text-slate-900 text-sm font-medium">{formattedDate}</p>
                  </div>
                </div>
                {(formattedTime || formattedEnd) && (
                  <div className="flex items-start gap-3 bg-slate-50 rounded-xl p-3.5 border border-slate-200">
                    <Clock size={18} className="text-purple-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-slate-500 mb-0.5 font-medium">Time</p>
                      <p className="text-slate-900 text-sm font-medium">
                        {formattedTime}{formattedEnd ? ` – ${formattedEnd}` : ""}
                      </p>
                    </div>
                  </div>
                )}
                {event.venue && (
                  <div className="flex items-start gap-3 bg-slate-50 rounded-xl p-3.5 border border-slate-200">
                    <MapPin size={18} className="text-purple-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-slate-500 mb-0.5 font-medium">Venue</p>
                      <p className="text-slate-900 text-sm font-medium">{formatVenue(event.venue)}</p>
                    </div>
                  </div>
                )}
                {displayCategory && (
                  <div className="flex items-start gap-3 bg-slate-50 rounded-xl p-3.5 border border-slate-200">
                    <Tag size={18} className="text-purple-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-slate-500 mb-0.5 font-medium">Category</p>
                      <p className="text-slate-900 text-sm font-medium">{displayCategory}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              {event.description && (
                <div>
                  <h2 className="text-base font-semibold text-slate-900 mb-2">About this event</h2>
                  <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
                    {event.description}
                  </p>
                </div>
              )}
            </div>

            {/* ── RIGHT: Ticket booking panel ──────────────────── */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-3xl border border-purple-200/80 overflow-hidden sticky top-20 shadow-[0_30px_80px_-40px_rgba(126,34,206,0.35)]">
                {/* Panel header */}
                <div className="px-6 py-5 border-b border-purple-100 flex items-center gap-2 bg-gradient-to-r from-purple-50 to-indigo-50">
                  <div className="w-10 h-10 rounded-2xl bg-white shadow-sm border border-purple-100 flex items-center justify-center">
                    <Ticket size={18} className="text-purple-600" />
                  </div>
                  <h2 className="text-slate-900 font-semibold text-lg">Book Tickets</h2>
                </div>

                <div className="p-6 space-y-5">
                  {loadingTickets && (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 size={22} className="animate-spin text-purple-500" />
                    </div>
                  )}

                  {!loadingTickets && ticketTypes.length === 0 && (
                    <div className="text-center py-10 bg-slate-50 rounded-2xl border border-slate-200">
                      <Users size={32} className="text-slate-400 mx-auto mb-3" />
                      <p className="text-slate-500 text-sm">No tickets available for this event.</p>
                    </div>
                  )}

                  {!loadingTickets && ticketTypes.map((tt) => {
                    const remaining = tt.remaining !== undefined
                      ? tt.remaining
                      : Math.max(0, (tt.quantityTotal || 0) - (tt.quantitySold || 0));
                    const maxQty = Math.min(tt.maxPerOrder || 10, remaining);
                    const tierLabel = TIER_LABELS[tt.tier] || "Regular";

                    return (
                      <div
                        key={tt._id}
                        className="bg-slate-50 rounded-xl border border-purple-100 p-5 space-y-3 shadow-[0_16px_40px_-28px_rgba(126,34,206,0.35)]"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="px-2.5 py-1 rounded-full text-[11px] uppercase tracking-wide font-semibold bg-purple-100 text-purple-800 border border-purple-200">{tierLabel}</span>
                              <p className="text-slate-900 font-semibold text-base truncate">{tt.name}</p>
                            </div>
                            {tt.description && (
                              <p className="text-slate-500 text-xs mt-0.5 line-clamp-2">{tt.description}</p>
                            )}
                          </div>
                          <span className="text-purple-700 font-bold text-base shrink-0">
                            {tt.price === 0 ? "Free" : `$${tt.price}`}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-semibold ${remaining === 0 ? "text-red-500" : "text-slate-500"}`}>
                            {remaining === 0 ? "Sold out" : `${remaining} left`}
                          </span>
                          <Stepper
                            value={quantities[tt._id] || 0}
                            min={0}
                            max={maxQty}
                            onChange={(v) => setQty(tt._id, v)}
                          />
                        </div>

                        {remaining === 0 && (
                          <p className="text-xs text-red-500/80 text-center">This ticket type is sold out.</p>
                        )}
                      </div>
                    );
                  })}

                  {/* Total + CTA */}
                  {ticketTypes.length > 0 && (
                    <>
                      <div className="flex items-center justify-between pt-3 border-t border-purple-100">
                        <span className="text-slate-600 text-sm font-semibold">
                          {totalTickets > 0
                            ? `${totalTickets} ticket${totalTickets !== 1 ? "s" : ""} selected`
                            : "No tickets selected"}
                        </span>
                        <span className="text-slate-900 font-bold text-xl">
                          {totalPrice === 0 && totalTickets > 0 ? "Free" : totalPrice > 0 ? `$${totalPrice.toFixed(2)}` : "-"}
                        </span>
                      </div>

                      <button
                        onClick={handleBook}
                        disabled={totalTickets === 0 || purchasing}
                        className="w-full py-3.5 rounded-2xl font-semibold text-base text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all duration-200 shadow-[0_16px_40px_-18px_rgba(126,34,206,0.55)]"
                      >
                        {purchasing ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            Processing…
                          </>
                        ) : (
                          <>
                            <Ticket size={16} />
                            Book Now
                          </>
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

