import { Link } from "react-router-dom";
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectIsAuthenticated, selectCurrentUser } from "../features/auth/authSlice";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import { Ticket, TicketCheck, Search, CreditCard, Mail, BarChart3, CheckCircle, Target } from "lucide-react";

export default function Landing() {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectCurrentUser);

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

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-black"></div>
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-600/30 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-800/20 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto text-center">
          <h1 className="text-6xl md:text-7xl font-extrabold mb-6 bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
            Event Ticketing Made Simple
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Your complete platform for organizing, promoting, and selling tickets for events with automated notifications and integrated payments.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/register">
              <Button variant="primary" size="lg">
                Start Free Trial
              </Button>
            </Link>
            <Link to="/events">
              <Button variant="outline" size="lg">
                Browse Events
              </Button>
            </Link>
          </div>
          
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-400">10K+</div>
              <div className="text-gray-400 mt-2">Events Created</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-400">50K+</div>
              <div className="text-gray-400 mt-2">Tickets Sold</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-400">5K+</div>
              <div className="text-gray-400 mt-2">Organizers</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-400">99.9%</div>
              <div className="text-gray-400 mt-2">Uptime</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-gradient-to-b from-black to-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-4">
              Everything You Need
            </h2>
            <p className="text-xl text-gray-400">
              Powerful features for event organizers and attendees
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} hover>
                  <div className="text-purple-500 mb-4">
                    <Icon size={40} />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-white">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400">
                    {feature.description}
                  </p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-6 bg-black">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-400">
              Get started in three simple steps
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-purple-800 rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-6">
                1
              </div>
              <h3 className="text-2xl font-semibold mb-4">Create Your Event</h3>
              <p className="text-gray-400">
                Set up your event with all the details, dates, venue, and ticket types in minutes.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-purple-800 rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-6">
                2
              </div>
              <h3 className="text-2xl font-semibold mb-4">Promote & Sell</h3>
              <p className="text-gray-400">
                Share your event and start selling tickets with integrated payment processing.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-purple-800 rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-6">
                3
              </div>
              <h3 className="text-2xl font-semibold mb-4">Manage Attendees</h3>
              <p className="text-gray-400">
                Track sales, check in attendees, and communicate with participants effortlessly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-purple-900/20 to-black">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl font-bold mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
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
