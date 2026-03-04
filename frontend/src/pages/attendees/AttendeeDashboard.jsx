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

const HERO_IMAGES = [
  "https://images.unsplash.com/photo-1497032205916-ac775f0649ae?auto=format&fit=crop&w=1800&q=80", // festival crowd
  "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=1800&q=80", // DJ booth lights
  "https://images.unsplash.com/photo-1507878866276-a947ef722fee?auto=format&fit=crop&w=1800&q=80" // live stage
];

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
      className="group relative rounded-2xl border border-gray-800/70 hover:border-purple-500/60 transition-all duration-300 overflow-hidden flex flex-col bg-gradient-to-b from-gray-900/70 via-gray-950 to-black shadow-lg hover:-translate-y-0.5 hover:shadow-purple-900/30"
    >
      <div className="h-10 w-full bg-gradient-to-r from-purple-700/40 via-purple-500/35 to-blue-500/30" />

      <div className="p-5 flex flex-col flex-1 gap-3">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          {event.category && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-purple-600/15 text-purple-300 border border-purple-500/30">
              {event.category}
            </span>
          )}
          {time && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-800/70 text-gray-200 border border-gray-700">
              <Clock size={12} className="text-purple-300" />
              {time}
            </span>
          )}
        </div>

        <h3 className="text-white font-semibold text-lg leading-snug line-clamp-2 group-hover:text-purple-200 transition-colors duration-200">
          {event.title}
        </h3>

        {event.description && (
          <p className="text-gray-400 text-sm line-clamp-2 leading-relaxed flex-1">
            {event.description}
          </p>
        )}

        <div className="flex flex-wrap gap-3 text-xs text-gray-400 pt-1">
          <span className="flex items-center gap-1.5">
            <CalendarDays size={12} className="text-purple-400" />
            {date}
          </span>
          {event.venue && (
            <span className="flex items-center gap-1.5">
              <MapPin size={12} className="text-purple-400" />
              <span className="truncate max-w-[140px]">{formatVenue(event.venue)}</span>
            </span>
          )}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-800 mt-auto">
          <div className="flex items-center gap-2 text-xs text-purple-300 font-semibold">
            <span>View Details</span>
          </div>
          <ArrowRight size={16} className="text-gray-500 group-hover:text-purple-300 group-hover:translate-x-1 transition-all duration-200" />
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

function StatCard({ label, value, highlight = false }) {
  return (
    <div className={`rounded-2xl border ${highlight ? "border-purple-500/70" : "border-gray-800"} bg-black/60 backdrop-blur p-4 shadow-lg shadow-black/30`}> 
      <p className="text-xs uppercase tracking-wide text-gray-400">{label}</p>
      <p className="text-2xl font-bold text-white mt-1">{value}</p>
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
  const [heroIndex, setHeroIndex] = useState(0);

  useEffect(() => {
    getPublishedEvents()
      .then((d) => setEvents(d.events || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (HERO_IMAGES.length < 2) return undefined;
    const id = setInterval(() => {
      setHeroIndex((idx) => (idx + 1) % HERO_IMAGES.length);
    }, 6500);
    return () => clearInterval(id);
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
  const eventCount = events.length;
  const cityCount = locations.length;
  const upcomingCount = events.filter((e) => new Date(e.startAt || 0) > new Date()).length;
  const topCategories = categories.slice(0, 4);

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      {/* Hero welcome banner */}
      <div className="relative pt-24 pb-10 px-6 overflow-hidden" style={{ backgroundColor: "#000" }}>
        <div
          className="absolute inset-0 transition-opacity duration-700"
          style={{
            backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.22) 0%, rgba(0,0,0,0.6) 55%, rgba(0,0,0,0.88) 100%), url(${HERO_IMAGES[heroIndex]})`,
            backgroundSize: "cover",
            backgroundPosition: "center 18%",
            backgroundRepeat: "no-repeat",
            filter: "saturate(1.05)",
            opacity: 0.95
          }}
        />
        <div className="absolute -left-32 -top-24 w-96 h-96 rounded-full bg-purple-700/20 blur-3xl" />
        <div className="absolute -right-24 -top-10 w-80 h-80 rounded-full bg-indigo-500/15 blur-3xl" />
        <div className="relative max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-3 gap-6 items-end">
            <div className="lg:col-span-2 bg-black/55 border border-gray-800/70 backdrop-blur-xl rounded-2xl p-6 shadow-2xl shadow-black/40">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={16} className="text-purple-300 drop-shadow" />
                <span className="text-purple-200 text-sm font-medium">Discover live music near you</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white drop-shadow">
                {user?.name ? (
                  <>
                    Hey {user.name.split(" ")[0]}, let’s find your next show
                  </>
                ) : (
                  "Find your next show"
                )}
              </h1>
              <p className="text-gray-200 mt-2 text-sm drop-shadow">
                {loading
                  ? "Loading events…"
                  : `${eventCount} events • ${cityCount} cities • ${upcomingCount} upcoming`}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  to="/events"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold shadow-lg shadow-purple-900/40 transition-all"
                >
                  <LayoutGrid size={15} /> Browse all events
                </Link>
                <button
                  onClick={() => { setKeyword(""); setCategoryFilter(""); setLocationFilter(""); setDateFilter(""); }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-700 text-gray-200 hover:border-purple-400 hover:text-white text-sm font-medium transition-all"
                >
                  Clear filters
                </button>
              </div>
              {topCategories.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {topCategories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${categoryFilter === cat ? "bg-purple-600 text-white border-purple-500" : "bg-black/50 border-gray-700 text-gray-200 hover:border-purple-400"}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 lg:grid-cols-1 gap-3">
              <StatCard label="Events" value={eventCount} />
              <StatCard label="Cities" value={cityCount} />
              <StatCard label="Upcoming" value={upcomingCount} highlight />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="pb-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gray-950/80 border border-gray-800 rounded-2xl p-5 mb-8 shadow-xl shadow-black/40">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <Search size={16} className="text-purple-300" />
                <span>Find the right event</span>
              </div>
              {hasActiveFilters && (
                <button
                  onClick={() => { setKeyword(""); setCategoryFilter(""); setLocationFilter(""); setDateFilter(""); }}
                  className="text-xs text-purple-300 hover:text-purple-200"
                >
                  Clear all filters
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="relative md:col-span-2 lg:col-span-1">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search artist, city, vibe…"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="w-full bg-black/60 border border-gray-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:bg-black"
                />
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full bg-black/60 border border-gray-800 rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:border-purple-500"
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
                className="w-full bg-black/60 border border-gray-800 rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:border-purple-500"
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
                className="w-full bg-black/60 border border-gray-800 rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>
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
