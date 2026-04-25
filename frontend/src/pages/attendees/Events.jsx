import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { getPublishedEvents } from "../../features/events/eventApi";

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

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [keyword, setKeyword] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  useEffect(() => {
    async function fetch() {
      try {
        const data = await getPublishedEvents();
        setEvents(data.events || []);
      } catch (err) {
        console.error('Failed to load events', err);
        setError('Unable to load events.');
      } finally {
        setLoading(false);
      }
    }
    fetch();
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

  const filteredEvents = events.filter((event) => {
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
      <div className="pt-24 pb-12 px-6 max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-6">Browse Events</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <input
            type="text"
            placeholder="Search keywords"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
          />

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
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
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
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
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
          />
        </div>

        {loading && <div className="text-gray-400">Loading events...</div>}
        {error && <div className="text-red-500 mb-4">{error}</div>}

        {!loading && filteredEvents.length === 0 && (
          <div className="text-center text-gray-400">
            {hasActiveFilters ? "No events match your filters." : "No events found. Check back later!"}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <Card key={event._id} hover>
              <h2 className="text-2xl font-semibold mb-2 text-white">
                {event.title}
              </h2>
              <p className="text-gray-400 mb-4 line-clamp-3">
                {event.description}
              </p>
              <div className="text-sm text-gray-400 mb-3">
                {event.category && <span>{event.category}</span>}
                {event.category && event.venue && <span> · </span>}
                {event.venue && <span>{formatVenue(event.venue)}</span>}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-300">
                  {new Date(event.startAt).toLocaleDateString()}
                </span>
                <Link to={`/event/${event._id}`}>
                  <Button size="sm" variant="primary">
                    View
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}
