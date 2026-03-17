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
  Music2,
  Drama,
  Users,
  Sparkles as SparklesIcon,
} from "lucide-react";

const HERO_IMAGES = [
  "https://images.unsplash.com/photo-1497032205916-ac775f0649ae?auto=format&fit=crop&w=1800&q=80", // festival crowd
  "https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=1800&q=80", // DJ booth lights
  "https://images.unsplash.com/photo-1507878866276-a947ef722fee?auto=format&fit=crop&w=1800&q=80" // live stage
];

const CATEGORY_LABELS = {
  concert: "Concert",
  theatre: "Theatre",
  family: "Family",
  other: "Other"
};

const normalizeCategory = (value = "") => value.toString().trim().toLowerCase();

const getPrimaryCategory = (event) => {
  if (!event) return "";
  if (Array.isArray(event.categories) && event.categories.length) return event.categories[0];
  return event.category || "";
};

function formatVenue(venue) {
  if (!venue) return "";
  if (typeof venue === "string") return venue;
  if (typeof venue === "object") {
    return [venue.name, venue.address, venue.city].filter(Boolean).join(", ");
  }
  return String(venue);
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

  const rawCategory = getPrimaryCategory(event);
  const normalizedCategory = normalizeCategory(rawCategory);
  const displayCategory = CATEGORY_LABELS[normalizedCategory] || rawCategory;
  const imageSrc = event.imageUrl || "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1200&q=80";

  return (
    <Link
      to={`/event/${event._id}`}
      className="group relative rounded-2xl border border-purple-100 hover:border-purple-300 transition-all duration-300 overflow-hidden flex flex-col bg-white shadow-lg hover:-translate-y-0.5 hover:shadow-purple-200"
    >
      <div className="relative h-56 w-full overflow-hidden">
        <img
          src={imageSrc}
          alt={event.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-black/15 to-black/55" />
        <div className="absolute top-4 left-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 text-slate-800 text-xs font-semibold shadow-md border border-white/60">
          <CalendarDays size={14} className="text-purple-600" />
          <span>{date}</span>
        </div>
        {time && (
          <div className="absolute top-4 right-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 text-slate-800 text-xs font-semibold shadow-md border border-white/60">
            <Clock size={14} className="text-purple-600" />
            <span>{time}</span>
          </div>
        )}
      </div>

      <div className="p-6 flex flex-col flex-1 gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          {displayCategory && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
              {displayCategory}
            </span>
          )}
          {event.status && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
            </span>
          )}
        </div>

        <h3 className="text-slate-900 font-semibold text-xl leading-snug line-clamp-2 group-hover:text-purple-700 transition-colors duration-200">
          {event.title}
        </h3>

        {event.description && (
          <p className="text-slate-600 text-sm line-clamp-3 leading-relaxed flex-1">
            {event.description}
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 pt-1">
          <span className="flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-200 px-3 py-2">
            <CalendarDays size={14} className="text-purple-500" />
            <span>{date}</span>
          </span>
          {event.venue && (
            <span className="flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-200 px-3 py-2">
              <MapPin size={14} className="text-purple-500" />
              <span className="truncate" title={formatVenue(event.venue)}>{formatVenue(event.venue)}</span>
            </span>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-auto">
          <div className="flex items-center gap-2 text-sm text-purple-600 font-semibold">
            <span className="group-hover:underline">View details</span>
          </div>
          <ArrowRight size={16} className="text-slate-400 group-hover:text-purple-500 group-hover:translate-x-1 transition-all duration-200" />
        </div>
      </div>
    </Link>
  );
}

// ── Skeleton loader ────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-purple-100 p-5 shadow-sm animate-pulse">
      <div className="h-2 bg-purple-100 rounded mb-4" />
      <div className="h-5 bg-purple-100 rounded mb-2" />
      <div className="h-4 bg-purple-100 rounded w-3/4 mb-4" />
      <div className="h-3 bg-purple-100 rounded w-1/2" />
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

  const filtered = events.filter((event) => {
    const keywordLower = keyword.toLowerCase();
    const title = event.title?.toLowerCase() || "";
    const description = event.description?.toLowerCase() || "";
    const category = normalizeCategory(getPrimaryCategory(event));
    const venue = formatVenue(event.venue).toLowerCase();

    const matchesKeyword =
      !keyword ||
      title.includes(keywordLower) ||
      description.includes(keywordLower) ||
      category.includes(keywordLower) ||
      venue.includes(keywordLower);

    const matchesCategory = !categoryFilter || category === categoryFilter;

    return matchesKeyword && matchesCategory;
  });

  const hasActiveFilters = Boolean(keyword || categoryFilter);
  const eventCount = events.length;
  const filteredCount = filtered.length;

  const quickCategories = [
    { key: "concert", label: "Concert", icon: Music2 },
    { key: "theatre", label: "Theatre", icon: Drama },
    { key: "family", label: "Family", icon: Users },
    { key: "other", label: "Other", icon: SparklesIcon },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8f5ff] via-white to-[#f0e8ff] text-slate-900">
      <Navbar />

      {/* Hero welcome banner */}
      <div className="relative pt-24 pb-12 px-4 sm:px-8 lg:px-12 xl:px-16 overflow-hidden" style={{ backgroundColor: "#f5f1ff" }}>
        <img
          src={HERO_IMAGES[heroIndex]}
          alt="Live music crowd"
          className="absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-700"
          style={{ filter: "saturate(1.08)", opacity: 0.9 }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/82 via-[#f1e9ff]/68 to-[#e5dbff]/75" />
        <div className="absolute -left-32 -top-24 w-96 h-96 rounded-full bg-purple-300/30 blur-3xl" />
        <div className="absolute -right-24 -top-10 w-80 h-80 rounded-full bg-indigo-300/25 blur-3xl" />
        <div className="relative w-full mx-auto max-w-[1200px]">
          <div className="grid grid-cols-1">
            <div className="bg-white/80 border border-purple-100 backdrop-blur-xl rounded-2xl p-7 shadow-2xl shadow-purple-200">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={16} className="text-purple-600 drop-shadow" />
                <span className="text-purple-700 text-sm font-medium">Discover live music near you</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 drop-shadow-sm">
                {user?.name ? (
                  <>
                    Hey {user.name.split(" ")[0]}, let’s find your next show
                  </>
                ) : (
                  "Find your next show"
                )}
              </h1>
              <p className="text-slate-700 mt-2 text-sm drop-shadow-sm">
                {loading
                  ? "Loading events…"
                  : `${eventCount} events ready for you`}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  to="/events"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold shadow-lg shadow-purple-300/50 transition-all"
                >
                  <LayoutGrid size={15} /> Browse all events
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="pb-24 px-4 sm:px-8 lg:px-12 xl:px-16">
        <div className="max-w-[1400px] w-full mx-auto">
          <div className="relative overflow-hidden bg-white/95 border border-[#6a317f]/25 rounded-2xl p-6 md:p-7 mb-8 shadow-[0_25px_90px_-40px_rgba(106,49,127,0.65)]">
            <div className="absolute -left-24 -top-28 w-72 h-72 bg-[#6a317f]/10 blur-3xl" />
            <div className="absolute -right-16 -bottom-14 w-64 h-64 bg-[#6a317f]/8 blur-3xl" />

            <div className="relative flex flex-wrap items-center gap-3 mb-5">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#6a317f]/12 border border-[#6a317f]/30 text-sm font-semibold text-[#6a317f] shadow-sm">
                <Search size={16} className="text-[#6a317f]" />
                Search & Filter
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white border border-[#6a317f]/20 text-[#6a317f] font-semibold shadow-sm">
                  Total: {eventCount}
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white border border-[#6a317f]/20 text-[#6a317f] font-semibold shadow-sm">
                  Showing: {filteredCount}
                </span>
              </div>
              {hasActiveFilters && (
                <button
                  onClick={() => { setKeyword(""); setCategoryFilter(""); }}
                  className="ml-auto text-xs text-[#6a317f] hover:text-[#58276a] font-semibold px-3 py-1.5 rounded-full border border-[#6a317f]/30 bg-white shadow-sm"
                >
                  Clear all
                </button>
              )}
            </div>

            <div className="relative flex flex-col gap-3">
              <div className="relative w-full">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6a317f]" />
                <input
                  type="text"
                  placeholder="Search artist, city, vibe…"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="w-full bg-white border border-[#6a317f]/30 rounded-2xl pl-12 pr-4 py-4 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#6a317f] focus:ring-2 focus:ring-[#6a317f]/20 shadow-sm"
                />
              </div>

              <div className="flex flex-wrap gap-2 items-center">
                {quickCategories.map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setCategoryFilter(key)}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-full border text-sm font-semibold transition-all shadow-sm ${
                      categoryFilter === key
                        ? "bg-[#6a317f] text-white border-[#6a317f] shadow-purple-200"
                        : "bg-white text-slate-700 border-slate-200 hover:border-[#6a317f]/60 hover:text-[#6a317f]"
                    }`}
                  >
                    <Icon size={16} /> {label}
                  </button>
                ))}
                <button
                  onClick={() => setCategoryFilter("")}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full border text-sm font-semibold text-slate-700 bg-white border-slate-200 hover:border-[#6a317f]/60 hover:text-[#6a317f]"
                >
                  Clear category
                </button>
              </div>
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
              <div className="w-16 h-16 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center mb-4 shadow-sm">
                <CalendarDays size={28} className="text-purple-500" />
              </div>
              <h3 className="text-slate-900 font-semibold text-lg mb-1">
                {hasActiveFilters ? "No matching events" : "No events available"}
              </h3>
              <p className="text-slate-500 text-sm max-w-xs">
                {hasActiveFilters
                  ? "Try a different search or category."
                  : "Check back soon — new events are added regularly."}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={() => {
                    setKeyword("");
                    setCategoryFilter("");
                  }}
                  className="mt-4 text-sm text-purple-600 hover:text-purple-700 transition-colors"
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
