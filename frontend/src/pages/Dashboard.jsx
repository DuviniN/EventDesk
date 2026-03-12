import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import { useAuth } from "../features/auth/useAuth";
import { getAnalyticsOverview } from "../features/analytics/analyticsApi";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (user?.role === "organizer") {
      getAnalyticsOverview().then(setStats).catch(() => {});
    }
  }, [user]);

  const totalEvents = stats?.totalEvents ?? 0;
  const ticketsSold = stats?.totalTicketsSold ?? 0;
  const revenue = stats?.totalRevenue ?? 0;

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      
      <div className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">
            Welcome, {user?.name}!
          </h1>
          <p className="text-gray-400 mb-8">
            Manage your events and track your ticket sales from your dashboard.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
              <h3 className="text-gray-400 text-sm mb-2">Total Events</h3>
              <p className="text-3xl font-bold text-purple-400">{totalEvents}</p>
            </div>
            <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
              <h3 className="text-gray-400 text-sm mb-2">Tickets Sold</h3>
              <p className="text-3xl font-bold text-purple-400">{ticketsSold.toLocaleString()}</p>
            </div>
            <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
              <h3 className="text-gray-400 text-sm mb-2">Total Revenue</h3>
              <p className="text-3xl font-bold text-purple-400">
                ${revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
          
          <div className="bg-gray-900 p-8 rounded-xl border border-gray-800 text-center">
            {totalEvents === 0 ? (
              <>
                <h2 className="text-2xl font-bold mb-4">No Events Yet</h2>
                <p className="text-gray-400 mb-6">Start by creating your first event</p>
                <button
                  onClick={() => navigate("/create-event")}
                  className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
                >
                  Create Event
                </button>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold mb-4">Your Events</h2>
                <p className="text-gray-400 mb-6">View detailed sales and attendance analytics</p>
                <div className="flex flex-wrap justify-center gap-3">
                  <button
                    onClick={() => navigate("/manage-events")}
                    className="bg-gray-800 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
                  >
                    Manage Events
                  </button>
                  <button
                    onClick={() => navigate("/analytics")}
                    className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
                  >
                    View Analytics
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
