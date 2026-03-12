import { Link } from "react-router-dom";
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { selectIsAuthenticated, selectCurrentUser } from "../features/auth/authSlice";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import { getPublishedEvents } from "../features/events/eventApi";
import { Ticket, TicketCheck, Search, CreditCard, Mail, BarChart3, CheckCircle, Target, MapPin, CalendarDays } from "lucide-react";

export default function Landing() {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectCurrentUser);
  const [events, setEvents] = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [eventsError, setEventsError] = useState("");

  const heroBackground = "https://images.unsplash.com/photo-1464375117522-1311d6a5b81f?auto=format&fit=crop&w=1800&q=80&sat=-15";

  // Redirect logged-in users straight to their dashboard
  if (isAuthenticated && user?.role === 'attendee') return <Navigate to="/attendee-dashboard" replace />;
  if (isAuthenticated && user?.role === 'organizer') return <Navigate to="/dashboard" replace />;

  const features = [
    {
      icon: Ticket,
      title: "Event Creation & Management",
      description: "Create event pages, set details, manage dates, venues, and capacity with ease."
    },
    {
      icon: TicketCheck,
      title: "Flexible Ticket Types",
      description: "Define multiple ticket types like VIP, Early Bird, and General Admission with custom pricing."
    },
    {
      icon: Search,
      title: "Event Discovery",
      description: "Search and browse events by category, location, date, and keywords."
    },
    {
      icon: CreditCard,
      title: "Secure Payments",
      description: "Integrated payment processing with Stripe and PayPal for safe transactions."
    },
    {
      icon: Mail,
      title: "Automated Notifications",
      description: "Order confirmations, event reminders, and promotional emails sent automatically."
    },
    {
      icon: BarChart3,
      title: "Analytics & Reporting",
      description: "Track sales statistics, attendance, and generate comprehensive reports."
    },
    {
      icon: CheckCircle,
      title: "Attendee Management",
      description: "Check-in tools, attendee lists, and communication features for organizers."
    },
    {
      icon: Target,
      title: "Order Management",
      description: "Complete system to track orders, generate tickets, and manage attendee lists."
    }
  ];

  useEffect(() => {
    let isMounted = true;
    const fetchEvents = async () => {
      try {
        setLoadingEvents(true);
        const { events: published } = await getPublishedEvents();
        if (!isMounted) return;
        setEvents(published || []);
      } catch (err) {
        if (!isMounted) return;
        setEventsError(err?.message || "Failed to load events");
      } finally {
        if (isMounted) setLoadingEvents(false);
      }
    };
    fetchEvents();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#6a317f] via-[#6a317f]/30 to-white text-white">
      <style>
        {`
          @keyframes hero-pan {
            0% { background-position: 50% 55%; }
            50% { background-position: 52% 48%; }
            100% { background-position: 55% 42%; }
          }
        `}
      </style>
      <Navbar />
      
      {/* Hero Section */}
      <section
        className="relative pt-32 pb-20 px-6 overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(106,49,127,0.88), rgba(106,49,127,0.55), rgba(255,255,255,0.2)), url(${heroBackground})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          animation: "hero-pan 26s ease-in-out infinite alternate"
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#6a317f]/80 via-[#6a317f]/55 to-white/50"></div>
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-[#6a317f]/30 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-white/25 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-6 text-white drop-shadow-lg">
            Event Ticketing Made Simple
          </h1>
          <p className="text-xl md:text-2xl text-white/85 mb-8 max-w-3xl mx-auto">
            Your complete platform for organizing, promoting, and selling tickets for events with automated notifications and integrated payments.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/register">
              <Button variant="primary" size="lg">
                Start Free Trial
              </Button>
            </Link>
          </div>
          
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {["10K+","50K+","5K+","99.9%"].map((stat, idx) => (
              <div key={stat} className="text-center bg-white/15 backdrop-blur-md border border-white/25 rounded-xl p-4 shadow-sm">
                <div className="text-3xl md:text-4xl font-bold text-white drop-shadow">{stat}</div>
                <div className="text-white/80 mt-2">{["Events Created","Tickets Sold","Organizers","Uptime"][idx]}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Published Events Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-10">
            <div>
              <p className="uppercase text-xs tracking-[0.25em] text-[#6a317f]/70 mb-2 flex items-center gap-2"><CalendarDays size={16} /> Live now</p>
              <h2 className="text-4xl md:text-5xl font-bold text-[#6a317f]">All Events</h2>
              <p className="text-[#6a317f]/80 mt-2 max-w-2xl">Every published event from our organizers, updated in real time.</p>
            </div>
          </div>

          {loadingEvents ? (
            <div className="text-center text-[#6a317f]/70">Loading events...</div>
          ) : eventsError ? (
            <div className="text-center text-red-500">{eventsError}</div>
          ) : events.length === 0 ? (
            <div className="text-center text-[#6a317f]/70">No events published yet. Check back soon.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {events.map((event) => (
                <div key={event._id} className="group relative overflow-hidden rounded-2xl border border-[#6a317f]/15 shadow-xl shadow-[#6a317f]/10 bg-white">
                  <div
                    className="h-56 w-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                    style={{ backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.45)), url(${event.imageUrl || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80&sat=-20'})` }}
                  />
                  <div className="p-5 space-y-3">
                    <span className="inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full bg-[#6a317f]/10 text-[#6a317f] capitalize">{event.categories?.[0] || 'Event'}</span>
                    <h3 className="text-xl font-semibold text-[#6a317f] group-hover:text-[#58276a] transition-colors">{event.title}</h3>
                    <div className="flex items-center gap-3 text-[#6a317f]/75 text-sm">
                      {event.startAt && (
                        <div className="flex items-center gap-1"><CalendarDays size={14} /> {new Date(event.startAt).toLocaleDateString()}</div>
                      )}
                      {event.venue?.city && (
                        <div className="flex items-center gap-1"><MapPin size={14} /> {event.venue.city}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-white text-[#6a317f]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-4 text-[#6a317f]">
              Everything You Need
            </h2>
            <p className="text-xl text-[#6a317f]/80">
              Powerful features for event organizers and attendees
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} hover>
                  <div className="text-[#6a317f] mb-4">
                    <Icon size={40} />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-[#6a317f]">
                    {feature.title}
                  </h3>
                  <p className="text-[#6a317f]/75">
                    {feature.description}
                  </p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-6 bg-gradient-to-b from-white via-[#6a317f]/12 to-white text-[#6a317f]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-4 text-[#6a317f]">
              How It Works
            </h2>
            <p className="text-xl text-[#6a317f]/80">
              Get started in three simple steps
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-[#6a317f] rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-6 text-white shadow-lg shadow-[#6a317f]/30">
                1
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-[#6a317f]">Create Your Event</h3>
              <p className="text-[#6a317f]/80">
                Set up your event with all the details, dates, venue, and ticket types in minutes.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-[#6a317f] rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-6 text-white shadow-lg shadow-[#6a317f]/30">
                2
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-[#6a317f]">Promote & Sell</h3>
              <p className="text-[#6a317f]/80">
                Share your event and start selling tickets with integrated payment processing.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-[#6a317f] rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-6 text-white shadow-lg shadow-[#6a317f]/30">
                3
              </div>
              <h3 className="text-2xl font-semibold mb-4 text-[#6a317f]">Manage Attendees</h3>
              <p className="text-[#6a317f]/80">
                Track sales, check in attendees, and communicate with participants effortlessly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-[#6a317f]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl font-bold mb-6 text-white drop-shadow-lg">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-white/85 mb-8">
            Join thousands of organizers using EventDesk to create amazing events.
          </p>
          <Link to="/register">
            <Button variant="primary" size="lg">
              Create Your First Event
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
