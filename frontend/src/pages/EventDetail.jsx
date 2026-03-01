import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import Button from "../components/ui/Button";
import { getEvent } from "../features/events/eventApi";

export default function EventDetail() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetch() {
      try {
        const data = await getEvent(id);
        setEvent(data.event);
      } catch (err) {
        console.error(err);
        setError('Unable to load event');
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [id]);

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <div className="pt-24 pb-12 px-6 max-w-3xl mx-auto">
        {loading && <div className="text-gray-400">Loading...</div>}
        {error && <div className="text-red-500">{error}</div>}
        {event && (
          <>
            <h1 className="text-4xl font-bold mb-4">{event.title}</h1>
            <p className="text-gray-400 mb-2">{event.description}</p>
            <p className="text-sm text-gray-300 mb-6">
              {new Date(event.startAt).toLocaleString()} - {new Date(event.endAt).toLocaleString()}
            </p>
            <Link to="/events">
              <Button variant="ghost">Back to Events</Button>
            </Link>
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}
