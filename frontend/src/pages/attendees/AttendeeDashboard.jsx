import { useMemo, useState, useEffect } from "react";
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

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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
      className="group ed-card relative rounded-3xl overflow-hidden flex flex-col"
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
          <CalendarDays size={14} style={{ color: "var(--color-accent)" }} />
          <span>{date}</span>
        </div>
        {time && (
          <div className="absolute top-4 right-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 text-slate-800 text-xs font-semibold shadow-md border border-white/60">
            <Clock size={14} style={{ color: "var(--color-accent)" }} />
            <span>{time}</span>
          </div>
        )}
      </div>

      <div className="p-6 flex flex-col flex-1 gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          {displayCategory && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full border ed-pill">
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

        <h3 className="text-slate-900 font-semibold text-xl leading-snug line-clamp-2 transition-colors duration-200 group-hover:ed-title">
          {event.title}
        </h3>

        {event.description && (
          <p className="text-slate-600 text-sm line-clamp-3 leading-relaxed flex-1">
            {event.description}
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 pt-1">
          <span className="flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-200 px-3 py-2">
            <CalendarDays size={14} style={{ color: "var(--color-accent)" }} />
            <span>{date}</span>
          </span>
          {event.venue && (
            <span className="flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-200 px-3 py-2">
              <MapPin size={14} style={{ color: "var(--color-accent)" }} />
              <span className="truncate" title={formatVenue(event.venue)}>{formatVenue(event.venue)}</span>
            </span>
          )}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-auto">
          <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--color-accent)" }}>
            <span className="group-hover:underline">View details</span>
          </div>
          <ArrowRight
            size={16}
            className="text-slate-400 group-hover:translate-x-1 transition-all duration-200"
            style={{ color: "var(--color-muted)" }}
          />
        </div>
      </div>
    </Link>
  );
}

// ── Skeleton loader ────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div
      className="rounded-3xl p-5 animate-pulse"
      style={{ background: "var(--surface-bg)", border: "1px solid var(--border-color)" }}
    >
      <div className="h-2 rounded mb-4" style={{ background: "color-mix(in srgb, var(--color-accent) 14%, transparent)" }} />
      <div className="h-5 rounded mb-2" style={{ background: "color-mix(in srgb, var(--color-accent) 14%, transparent)" }} />
      <div className="h-4 rounded w-3/4 mb-4" style={{ background: "color-mix(in srgb, var(--color-accent) 14%, transparent)" }} />
      <div className="h-3 rounded w-1/2" style={{ background: "color-mix(in srgb, var(--color-accent) 14%, transparent)" }} />
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────
export default function AttendeeDashboard() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [keyword, setKeyword] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [heroIndex, setHeroIndex] = useState(0);

  useEffect(() => {
    getPublishedEvents()
      .then((d) => {
        setEvents(d.events || []);
        setError("");
      })
      .catch((err) => {
        setError(err?.message || "Could not load events");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (HERO_IMAGES.length < 2) return undefined;
    if (prefersReducedMotion()) return undefined;
    const id = setInterval(() => {
      setHeroIndex((idx) => (idx + 1) % HERO_IMAGES.length);
    }, 6500);
    return () => clearInterval(id);
  }, []);

  const filtered = useMemo(() => {
    const keywordLower = keyword.toLowerCase();
    return events.filter((event) => {
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
  }, [events, keyword, categoryFilter]);

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
    <div className="min-h-screen text-slate-900">
      <Navbar />

      <style>
        {`
          .ed-card {
            background: var(--surface-bg);
            border: 1px solid var(--border-color);
            box-shadow: 0 18px 60px -48px rgba(0,0,0,0.35);
            transition: transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease;
          }
          .ed-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 26px 90px -64px rgba(0,0,0,0.45);
            border-color: color-mix(in srgb, var(--color-accent) 40%, var(--border-color));
          }
          .ed-pill {
            background: color-mix(in srgb, var(--color-accent) 12%, transparent);
            border-color: color-mix(in srgb, var(--color-accent) 26%, var(--border-color));
            color: var(--color-accent);
          }
          .group:hover.ed-card .group-hover\\:ed-title { color: var(--color-accent); }

          .ed-hero-panel {
            background:
              linear-gradient(var(--surface-bg), var(--surface-bg)) padding-box,
              linear-gradient(
                135deg,
                color-mix(in srgb, var(--color-accent) 42%, transparent),
                color-mix(in srgb, var(--color-primary) 22%, transparent),
                color-mix(in srgb, var(--color-accent) 10%, transparent)
              ) border-box;
            border: 1px solid transparent;
            box-shadow: 0 28px 120px -90px color-mix(in srgb, var(--color-accent) 35%, transparent);
          }
          .ed-hero-badge {
            background: color-mix(in srgb, var(--color-accent) 12%, transparent);
            border: 1px solid color-mix(in srgb, var(--color-accent) 26%, var(--border-color));
            color: var(--color-accent);
          }
          .ed-hero-chip {
            background: color-mix(in srgb, var(--surface-bg) 92%, transparent);
            border: 1px solid var(--border-color);
          }
        `}
      </style>

      {/* Hero welcome banner */}
      <section className="relative pt-20 sm:pt-24 pb-10 sm:pb-12 px-4 sm:px-6 lg:px-10 overflow-hidden">
        <img
          src={HERO_IMAGES[heroIndex]}
          alt="Live music crowd"
          className="absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-700"
          style={{ filter: "saturate(1.08)", opacity: 0.92 }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, color-mix(in srgb, var(--surface-bg) 88%, transparent) 0%, color-mix(in srgb, var(--surface-bg) 70%, transparent) 45%, color-mix(in srgb, var(--surface-bg) 82%, transparent) 100%)",
          }}
        />
        <div
          className="absolute -left-32 -top-24 w-96 h-96 rounded-full blur-3xl"
          style={{ background: "color-mix(in srgb, var(--color-accent) 18%, transparent)" }}
          aria-hidden
        />
        <div
          className="absolute -right-24 -top-10 w-80 h-80 rounded-full blur-3xl"
          style={{ background: "color-mix(in srgb, var(--color-primary) 14%, transparent)" }}
          aria-hidden
        />

        <div className="relative max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch">
            {/* Left: Welcome */}
            <div className="lg:col-span-7">
              <div className="ed-hero-panel rounded-3xl backdrop-blur-xl p-6 sm:p-8 h-full">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-[0.18em] ed-hero-badge">
                  <Sparkles size={14} className="shrink-0" />
                  Discover events
                </div>

                <h1 className="mt-4 text-3xl sm:text-4xl lg:text-[42px] font-bold tracking-tight text-slate-900 leading-[1.08]">
                  {user?.name ? (
                    <>Welcome back, <span style={{ color: "var(--color-accent)" }}>{user.name.split(" ")[0]}</span></>
                  ) : (
                    <>Find your next <span style={{ color: "var(--color-accent)" }}>experience</span></>
                  )}
                </h1>

                <p className="mt-3 text-sm sm:text-base text-slate-700 max-w-xl">
                  {loading ? "Loading events…" : `${eventCount} events available • ${filteredCount} showing`}
                </p>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <Link
                    to="/events"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
                    style={{ background: "var(--color-accent)" }}
                  >
                    <LayoutGrid size={16} /> Browse events
                  </Link>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                    <span className="px-3 py-1.5 rounded-full ed-hero-chip">Total: {eventCount}</span>
                    <span className="px-3 py-1.5 rounded-full ed-hero-chip">Showing: {filteredCount}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Search */}
            <div className="lg:col-span-5">
              <div className="ed-hero-panel rounded-3xl backdrop-blur-xl p-6 sm:p-7 h-full">
                <div className="flex items-center justify-between gap-3">
                  <label className="block text-xs uppercase tracking-[0.18em] font-semibold" style={{ color: "var(--color-muted)" }}>
                    Search
                  </label>
                  {(keyword || categoryFilter) ? (
                    <button
                      type="button"
                      onClick={() => {
                        setKeyword("");
                        setCategoryFilter("");
                      }}
                      className="text-xs font-semibold px-3 py-2 rounded-full border"
                      style={{ background: "var(--surface-bg)", borderColor: "var(--border-color)", color: "var(--color-accent)" }}
                    >
                      Reset
                    </button>
                  ) : null}
                </div>

                <div className="mt-3 relative">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "var(--color-muted)" }} />
                  <input
                    type="text"
                    placeholder="Search title, venue, category…"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    className="w-full rounded-2xl pl-12 pr-4 py-3.5 text-sm border focus:outline-none focus:ring-2"
                    style={{
                      background: "var(--surface-bg)",
                      borderColor: "var(--border-color)",
                      boxShadow: "0 18px 60px -50px color-mix(in srgb, var(--color-accent) 18%, transparent)",
                    }}
                  />
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {quickCategories.map(({ key, label, icon: Icon }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setCategoryFilter(key)}
                      className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-full border text-sm font-semibold transition-all ${
                        categoryFilter === key ? "text-white" : "text-slate-700"
                      }`}
                      style={
                        categoryFilter === key
                          ? { background: "var(--color-accent)", borderColor: "var(--color-accent)" }
                          : { background: "var(--surface-bg)", borderColor: "var(--border-color)" }
                      }
                    >
                      <Icon size={16} /> {label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setCategoryFilter("")}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full border text-sm font-semibold text-slate-700"
                    style={{ background: "var(--surface-bg)", borderColor: "var(--border-color)" }}
                  >
                    Clear
                  </button>
                </div>

                {error ? (
                  <div
                    className="mt-4 text-sm rounded-2xl border px-4 py-3"
                    style={{ background: "var(--surface-bg)", borderColor: "var(--border-color)", color: "var(--color-accent)" }}
                  >
                    {error}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="pb-20 px-4 sm:px-6 lg:px-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] font-semibold" style={{ color: "var(--color-muted)" }}>
                <SparklesIcon size={14} style={{ color: "var(--color-accent)" }} />
                Recommended
              </div>
              <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-slate-900">Events you can book now</h2>
              <p className="mt-1 text-sm text-slate-600">Published events from organizers across the platform.</p>
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
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: "color-mix(in srgb, var(--color-accent) 12%, transparent)", border: "1px solid var(--border-color)" }}
              >
                <CalendarDays size={28} style={{ color: "var(--color-accent)" }} />
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
                  className="mt-4 text-sm transition-colors"
                  style={{ color: "var(--color-accent)" }}
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
      </section>

      <Footer />
    </div>
  );
}
