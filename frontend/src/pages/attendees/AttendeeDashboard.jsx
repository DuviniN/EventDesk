import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import { useAuth } from "../../features/auth/useAuth";
import { getPublishedEvents } from "../../features/events/eventApi";
import {
  CalendarDays,
  MapPin,
  Clock,
  Search,
  ArrowRight,
  Sparkles,
  LayoutGrid,
} from "lucide-react";

function formatVenue(venue) {
  if (!venue) return "";
  if (typeof venue === "string") return venue;
  if (typeof venue === "object") {
    return [venue.name, venue.address, venue.city].filter(Boolean).join(", ");
  }
  return String(venue);
}

function toLocalDateInputValue(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// ── Event Card ─────────────────────────────────────────────────
function EventCard({ event }) {
  const dateObj = event.startAt ? new Date(event.startAt) : null;
  const date = dateObj
    ? dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "TBA";
  const time = dateObj
    ? dateObj.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
    : "";

  return (
    <Link
      to={`/event/${event._id}`}
      className="group relative bg-gray-900/60 hover:bg-gray-900 rounded-2xl border border-gray-800 hover:border-purple-500/60 transition-all duration-300 overflow-hidden flex flex-col shadow-lg hover:shadow-purple-900/30 hover:-translate-y-0.5"
    >
      {/* Top accent bar */}
      <div className="h-1 w-full bg-gradient-to-r from-purple-600 via-purple-400 to-indigo-500 opacity-50 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="p-5 flex flex-col flex-1 gap-3">
        {/* Category badge */}
        {event.category && (
          <span className="self-start text-xs font-medium px-2.5 py-1 rounded-full bg-purple-600/15 text-purple-400 border border-purple-600/20">
            {event.category}
          </span>
        )}

        {/* Title */}
        <h3 className="text-white font-semibold text-base leading-snug line-clamp-2 group-hover:text-purple-300 transition-colors duration-200">
          {event.title}
        </h3>

        {/* Description */}
        {event.description && (
          <p className="text-gray-500 text-sm line-clamp-2 leading-relaxed flex-1">
            {event.description}
          </p>
        )}

        {/* Meta */}
        <div className="flex flex-wrap gap-3 text-xs text-gray-500 pt-1">
          <span className="flex items-center gap-1.5">
            <CalendarDays size={12} className="text-purple-500" />
            {date}
          </span>
          {time && (
            <span className="flex items-center gap-1.5">
              <Clock size={12} className="text-purple-500" />
              {time}
            </span>
          )}
          {event.venue && (
            <span className="flex items-center gap-1.5">
              <MapPin size={12} className="text-purple-500" />
              <span className="truncate max-w-[120px]">{formatVenue(event.venue)}</span>
            </span>
          )}
        </div>

        {/* Footer row */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-800 mt-auto">
          <span className="text-xs font-semibold text-purple-400">View Details</span>
          <ArrowRight size={15} className="text-gray-600 group-hover:text-purple-400 group-hover:translate-x-1 transition-all duration-200" />
        </div>
      </div>
    </Link>
  );
}

// ── Skeleton loader ────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-gray-900/40 rounded-2xl border border-gray-800 p-5 animate-pulse">
      <div className="h-2 bg-gray-800 rounded mb-4" />
      <div className="h-5 bg-gray-800 rounded mb-2" />
      <div className="h-4 bg-gray-800 rounded w-3/4 mb-4" />
      <div className="h-3 bg-gray-800 rounded w-1/2" />
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────
export default function AttendeeDashboard() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  useEffect(() => {
    getPublishedEvents()
      .then((d) => setEvents(d.events || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const categories = [...new Set(events.map((e) => e.category).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b)
  );

  const locations = [
    ...new Set(
      events
        .map((e) => (typeof e.venue === "object" ? e.venue?.city || formatVenue(e.venue) : formatVenue(e.venue)))
        .filter(Boolean)
    ),
  ].sort((a, b) => a.localeCompare(b));

  const filtered = events.filter((event) => {
    const keywordLower = keyword.toLowerCase();
    const title = event.title?.toLowerCase() || "";
    const description = event.description?.toLowerCase() || "";
    const category = event.category?.toLowerCase() || "";
    const venue = formatVenue(event.venue).toLowerCase();

    const matchesKeyword =
      !keyword ||
      title.includes(keywordLower) ||
      description.includes(keywordLower) ||
      category.includes(keywordLower) ||
      venue.includes(keywordLower);

    const matchesCategory = !categoryFilter || event.category === categoryFilter;
    const matchesLocation = !locationFilter || venue.includes(locationFilter.toLowerCase());
    const matchesDate = !dateFilter || toLocalDateInputValue(event.startAt) === dateFilter;

    return matchesKeyword && matchesCategory && matchesLocation && matchesDate;
  });

  const hasActiveFilters = Boolean(keyword || categoryFilter || locationFilter || dateFilter);

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      {/* Hero welcome banner */}
      <div className="pt-24 pb-10 px-6 bg-gradient-to-b from-purple-950/30 via-black to-black">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={16} className="text-purple-400" />
                <span className="text-purple-400 text-sm font-medium">Welcome back</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                {user?.name ? (
                  <>
                    Hi, <span className="text-purple-400">{user.name.split(" ")[0]}</span>!
                  </>
                ) : (
                  "Your Dashboard"
                )}
              </h1>
              <p className="text-gray-400 mt-1 text-sm">
                {loading
                  ? "Loading events…"
                  : `${events.length} event${events.length !== 1 ? "s" : ""} available to book`}
              </p>
            </div>

            {/* Stats pill */}
            {!loading && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900 border border-gray-800 w-fit">
                <LayoutGrid size={15} className="text-purple-400" />
                <span className="text-gray-300 text-sm font-medium">{events.length} Events</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="pb-24 px-6">
        <div className="max-w-7xl mx-auto">

          {/* Discovery filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
            <div className="relative md:col-span-2 lg:col-span-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search keywords…"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-full bg-gray-900/80 border border-gray-700/80 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:bg-gray-900 transition-all duration-200"
            />
          </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full bg-gray-900/80 border border-gray-700/80 rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:border-purple-500"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="w-full bg-gray-900/80 border border-gray-700/80 rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:border-purple-500"
            >
              <option value="">All Locations</option>
              {locations.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>

            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full bg-gray-900/80 border border-gray-700/80 rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Events grid */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gray-900 border border-gray-800 flex items-center justify-center mb-4">
                <CalendarDays size={28} className="text-gray-700" />
              </div>
              <h3 className="text-white font-semibold text-lg mb-1">
                {hasActiveFilters ? "No matching events" : "No events available"}
              </h3>
              <p className="text-gray-500 text-sm max-w-xs">
                {hasActiveFilters
                  ? "Try changing your category, location, date, or keyword filters."
                  : "Check back soon — new events are added regularly."}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={() => {
                    setKeyword("");
                    setCategoryFilter("");
                    setLocationFilter("");
                    setDateFilter("");
                  }}
                  className="mt-4 text-sm text-purple-400 hover:text-purple-300 transition-colors"
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}

          {!loading && filtered.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((event) => (
                <EventCard key={event._id} event={event} />
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
