import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import { getPublishedEvents } from "../features/events/eventApi";

export default function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <div className="pt-24 pb-12 px-6 max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-6">Browse Events</h1>

        {loading && <div className="text-gray-400">Loading events...</div>}
        {error && <div className="text-red-500 mb-4">{error}</div>}

        {!loading && events.length === 0 && (
          <div className="text-center text-gray-400">
            No events found. Check back later!
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <Card key={event._id} hover>
              <h2 className="text-2xl font-semibold mb-2 text-white">
                {event.title}
              </h2>
              <p className="text-gray-400 mb-4 line-clamp-3">
                {event.description}
              </p>
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
