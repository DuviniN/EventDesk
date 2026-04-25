import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { TrendingUp, Ticket, Calendar, Users } from "lucide-react";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import { getAnalyticsOverview } from "../../features/analytics/analyticsApi";

const CHART_COLORS = ["#8b5cf6", "#f59e0b", "#06b6d4", "#6b7280", "#ef4444"];

const TOOLTIP_STYLE = {
  backgroundColor: "#1f2937",
  border: "1px solid #374151",
  borderRadius: "8px",
  color: "#f9fafb",
};

const AXIS_TICK = { fill: "#9ca3af", fontSize: 12 };

function StatCard({ icon: Icon, label, value, sub }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-3">
        <div className="bg-purple-600/20 p-2 rounded-lg">
          <Icon className="w-5 h-5 text-purple-400" />
        </div>
        <span className="text-gray-400 text-sm">{label}</span>
      </div>
      <p className="text-3xl font-bold text-white">{value}</p>
      {sub && <p className="text-gray-500 text-xs mt-1">{sub}</p>}
    </div>
  );
}

function SectionTitle({ children }) {
  return <h2 className="text-xl font-semibold text-white mb-4">{children}</h2>;
}

const CustomTooltip = ({ active, payload, label, prefix = "", suffix = "" }) => {
  if (active && payload && payload.length) {
    return (
      <div style={TOOLTIP_STYLE} className="px-4 py-3 text-sm">
        <p className="text-gray-400 mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color || "#8b5cf6" }}>
            {p.name}: {prefix}{typeof p.value === "number" ? p.value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : p.value}{suffix}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Analytics() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getAnalyticsOverview()
      .then(setData)
      .catch((err) => setError(err.message || "Failed to load analytics"))
      .finally(() => setLoading(false));
  }, []);

  const pieData = data
    ? [
        { name: "Valid", value: data.ticketStatusBreakdown.valid },
        { name: "Checked In", value: data.ticketStatusBreakdown.checked_in },
        { name: "Cancelled", value: data.ticketStatusBreakdown.cancelled },
        { name: "Refunded", value: data.ticketStatusBreakdown.refunded },
      ].filter((d) => d.value > 0)
    : [];

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      <div className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2">Analytics Overview</h1>
              <p className="text-gray-400">Sales statistics and performance across all your events</p>
            </div>
            <button
              onClick={() => navigate("/manage-events")}
              className="text-gray-400 hover:text-white text-sm transition-colors"
            >
              ← Manage Events
            </button>
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-32">
              <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-900/30 border border-red-800 text-red-300 rounded-xl p-6 text-center">
              {error}
            </div>
          )}

          {/* Content */}
          {data && !loading && (
            <>
              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
                <StatCard
                  icon={TrendingUp}
                  label="Total Revenue"
                  value={`$${data.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  sub="From paid orders"
                />
                <StatCard
                  icon={Ticket}
                  label="Tickets Sold"
                  value={data.totalTicketsSold.toLocaleString()}
                  sub="Across all events"
                />
                <StatCard
                  icon={Calendar}
                  label="Total Events"
                  value={data.totalEvents}
                  sub="Created by you"
                />
                <StatCard
                  icon={Users}
                  label="Check-in Rate"
                  value={`${data.checkinRate}%`}
                  sub="Of issued tickets"
                />
              </div>

              {/* Charts row 1 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Revenue by Event */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                  <SectionTitle>Revenue by Event</SectionTitle>
                  {data.revenueByEvent.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-12">No paid orders yet</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={data.revenueByEvent} margin={{ top: 4, right: 8, left: 0, bottom: 60 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                        <XAxis
                          dataKey="name"
                          tick={AXIS_TICK}
                          angle={-35}
                          textAnchor="end"
                          interval={0}
                          tickLine={false}
                          axisLine={{ stroke: "#374151" }}
                        />
                        <YAxis
                          tick={AXIS_TICK}
                          tickFormatter={(v) => `$${v}`}
                          tickLine={false}
                          axisLine={false}
                          width={60}
                        />
                        <Tooltip content={<CustomTooltip prefix="$" />} />
                        <Bar dataKey="revenue" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Revenue" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* Ticket Status Breakdown */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                  <SectionTitle>Ticket Status Breakdown</SectionTitle>
                  {pieData.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-12">No tickets yet</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={65}
                          outerRadius={100}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={TOOLTIP_STYLE}
                          itemStyle={{ color: "#f9fafb" }}
                          labelStyle={{ color: "#9ca3af" }}
                        />
                        <Legend
                          iconType="circle"
                          wrapperStyle={{ color: "#9ca3af", fontSize: 13 }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Daily Revenue Line Chart */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <SectionTitle>Daily Revenue — Last 30 Days</SectionTitle>
                {data.dailyRevenue.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-12">No revenue data in the last 30 days</p>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <LineChart data={data.dailyRevenue} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                      <XAxis
                        dataKey="date"
                        tick={AXIS_TICK}
                        tickLine={false}
                        axisLine={{ stroke: "#374151" }}
                        tickFormatter={(v) => v.slice(5)}
                      />
                      <YAxis
                        tick={AXIS_TICK}
                        tickFormatter={(v) => `$${v}`}
                        tickLine={false}
                        axisLine={false}
                        width={60}
                      />
                      <Tooltip content={<CustomTooltip prefix="$" />} />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="#8b5cf6"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 5, fill: "#8b5cf6" }}
                        name="Revenue"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
