import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { TrendingUp, Ticket, Users, CheckCircle } from "lucide-react";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import { getEventAnalytics } from "../../features/analytics/analyticsApi";

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

const STATUS_BADGE = {
  valid: "bg-blue-900/40 text-blue-300",
  checked_in: "bg-green-900/40 text-green-300",
  cancelled: "bg-red-900/40 text-red-300",
  refunded: "bg-yellow-900/40 text-yellow-300",
};

export default function EventAnalytics() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getEventAnalytics(id)
      .then(setData)
      .catch((err) => setError(err.message || "Failed to load event analytics"))
      .finally(() => setLoading(false));
  }, [id]);

  const orderPieData = data
    ? Object.entries(data.orderStatusBreakdown).map(([status, { count }]) => ({
        name: status.charAt(0).toUpperCase() + status.slice(1),
        value: count,
      }))
    : [];

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />

      <div className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2">
                {data ? data.event.title : "Event Analytics"}
              </h1>
              <p className="text-gray-400">Detailed sales and attendance breakdown</p>
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
                  label="Event Revenue"
                  value={`$${data.eventRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  sub="From paid orders"
                />
                <StatCard
                  icon={Ticket}
                  label="Tickets Sold"
                  value={data.totalSold.toLocaleString()}
                  sub={`of ${data.event.capacity} capacity`}
                />
                <StatCard
                  icon={Users}
                  label="Capacity Used"
                  value={`${data.capacityUsed}%`}
                  sub={`${data.totalSold} / ${data.event.capacity} seats`}
                />
                <StatCard
                  icon={CheckCircle}
                  label="Check-in Rate"
                  value={`${data.checkinRate}%`}
                  sub="Of issued tickets"
                />
              </div>

              {/* Charts row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Ticket Types Bar Chart */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                  <SectionTitle>Tickets by Type</SectionTitle>
                  {data.ticketTypeStats.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-12">No ticket types created</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart
                        data={data.ticketTypeStats}
                        margin={{ top: 4, right: 8, left: 0, bottom: 60 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                        <XAxis
                          dataKey="name"
                          tick={AXIS_TICK}
                          angle={-30}
                          textAnchor="end"
                          interval={0}
                          tickLine={false}
                          axisLine={{ stroke: "#374151" }}
                        />
                        <YAxis
                          tick={AXIS_TICK}
                          tickLine={false}
                          axisLine={false}
                          allowDecimals={false}
                        />
                        <Tooltip
                          contentStyle={TOOLTIP_STYLE}
                          itemStyle={{ color: "#f9fafb" }}
                          labelStyle={{ color: "#9ca3af" }}
                        />
                        <Legend
                          iconType="square"
                          wrapperStyle={{ color: "#9ca3af", fontSize: 13, paddingTop: 8 }}
                        />
                        <Bar dataKey="sold" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Sold" />
                        <Bar dataKey="remaining" fill="#374151" radius={[4, 4, 0, 0]} name="Remaining" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* Order Status Pie */}
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                  <SectionTitle>Order Status Distribution</SectionTitle>
                  {orderPieData.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-12">No orders yet</p>
                  ) : (
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie
                          data={orderPieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={65}
                          outerRadius={100}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {orderPieData.map((entry, index) => (
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

              {/* Attendee Table */}
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <SectionTitle>
                    Attendees
                    <span className="text-gray-500 text-sm font-normal ml-2">
                      ({data.attendees.length} records)
                    </span>
                  </SectionTitle>
                </div>

                {data.attendees.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-12">No attendees yet</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-800">
                          <th className="text-left text-gray-400 font-medium pb-3 pr-4">Name</th>
                          <th className="text-left text-gray-400 font-medium pb-3 pr-4">Email</th>
                          <th className="text-left text-gray-400 font-medium pb-3 pr-4">Ticket Type</th>
                          <th className="text-left text-gray-400 font-medium pb-3 pr-4">Code</th>
                          <th className="text-left text-gray-400 font-medium pb-3 pr-4">Status</th>
                          <th className="text-left text-gray-400 font-medium pb-3">Checked In</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.attendees.map((a) => (
                          <tr key={a.ticketCode} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                            <td className="py-3 pr-4 text-white">{a.name || "—"}</td>
                            <td className="py-3 pr-4 text-gray-300">{a.email || "—"}</td>
                            <td className="py-3 pr-4 text-gray-300">{a.ticketType || "—"}</td>
                            <td className="py-3 pr-4 font-mono text-gray-400 text-xs">{a.ticketCode}</td>
                            <td className="py-3 pr-4">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[a.status] || "bg-gray-800 text-gray-400"}`}>
                                {a.status.replace("_", " ")}
                              </span>
                            </td>
                            <td className="py-3 text-gray-400 text-xs">
                              {a.checkedInAt
                                ? new Date(a.checkedInAt).toLocaleString()
                                : "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
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
