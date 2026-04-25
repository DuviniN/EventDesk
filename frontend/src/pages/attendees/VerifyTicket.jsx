import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import axios from "../../services/axios";
import { QrCode, User, Mail, CalendarDays, MapPin, Ticket as TicketIcon, AlertTriangle, CheckCircle2 } from "lucide-react";

const statusStyles = {
  valid: "bg-green-500/15 text-green-300 border border-green-600/40",
  checked_in: "bg-blue-500/15 text-blue-200 border border-blue-500/30",
  cancelled: "bg-red-500/15 text-red-200 border border-red-500/30",
  refunded: "bg-amber-500/15 text-amber-200 border border-amber-500/30",
};

const formatDate = (value) => {
  if (!value) return "TBA";
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function VerifyTicket() {
  const [params] = useSearchParams();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const qr = params.get("qr");
    if (!qr) {
      setError("QR payload missing");
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        const res = await axios.get(`/events/tickets/verify?qr=${encodeURIComponent(qr)}`);
        setTicket(res.data.ticket);
      } catch (err) {
        setError(err.message || "Verification failed");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [params]);

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <div className="max-w-5xl mx-auto px-6 pt-24 pb-16">
        <div className="rounded-3xl border border-gray-800/80 bg-gradient-to-br from-gray-950 via-gray-900 to-black p-6 shadow-xl shadow-black/40">
          <div className="flex items-center gap-2 text-sm uppercase tracking-[0.16em] text-gray-400">
            <QrCode size={16} /> Ticket verification
          </div>
          <h1 className="text-3xl font-bold mt-2">Scan result</h1>
          <p className="text-gray-400 text-sm mt-1">If this is your ticket, keep it safe. Organizers will still check you in.</p>

          {loading ? (
            <div className="mt-6 text-gray-400">Verifying...</div>
          ) : error ? (
            <div className="mt-6 flex items-center gap-2 text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-2xl px-4 py-3 text-sm">
              <AlertTriangle size={16} /> {error}
            </div>
          ) : ticket ? (
            <div className="mt-6 space-y-4">
              <div className="rounded-2xl border border-gray-800 bg-gray-950/70 p-4 flex items-center gap-3">
                <div className="rounded-full bg-gray-900 border border-gray-800 w-11 h-11 flex items-center justify-center text-sm font-semibold text-white">
                  {ticket.attendee?.name?.[0]?.toUpperCase() || "U"}
                </div>
                <div>
                  <div className="text-white font-semibold flex items-center gap-2">
                    <User size={14} className="text-purple-300" /> {ticket.attendee?.name || "Unknown"}
                  </div>
                  <div className="text-gray-400 text-sm flex items-center gap-2">
                    <Mail size={14} className="text-gray-500" /> {ticket.attendee?.email || "No email"}
                  </div>
                </div>
                <span className={`ml-auto px-2.5 py-1 rounded-full text-xs font-semibold ${statusStyles[ticket.status] || "bg-gray-800 text-gray-200 border border-gray-700"}`}>
                  {ticket.status?.replace("_", " ") || "valid"}
                </span>
              </div>

              <div className="rounded-2xl border border-gray-800 bg-gray-950/70 p-4 text-sm text-gray-200 space-y-2">
                <div className="flex items-center gap-2 text-white font-semibold">
                  <TicketIcon size={14} className="text-purple-300" /> {ticket.ticketType?.name || "Ticket"}
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                  <QrCode size={14} className="text-gray-500" /> Code: {ticket.code}
                </div>
              </div>

              <div className="rounded-2xl border border-gray-800 bg-gray-950/70 p-4 text-sm text-gray-200 space-y-2">
                <div className="flex items-center gap-2 text-white font-semibold">
                  <CalendarDays size={14} className="text-blue-300" /> {ticket.event?.title || "Event"}
                </div>
                <div className="flex flex-wrap items-center gap-3 text-gray-400">
                  <span className="flex items-center gap-1.5"><CalendarDays size={12} /> {formatDate(ticket.event?.startAt)}</span>
                  {ticket.event?.venue?.city || ticket.event?.venue?.name ? (
                    <span className="flex items-center gap-1.5"><MapPin size={12} /> {[ticket.event?.venue?.name, ticket.event?.venue?.city].filter(Boolean).join(", ")}</span>
                  ) : null}
                </div>
              </div>

              <p className="text-xs text-gray-500">Order: {ticket.orderId || "N/A"}</p>
              <div className="flex gap-2 pt-2">
                <Link
                  to="/attendee-dashboard"
                  className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-900/40 transition hover:bg-purple-500"
                >
                  <CheckCircle2 size={16} /> Go to dashboard
                </Link>
                <Link
                  to="/events"
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-800 px-4 py-2.5 text-sm font-semibold text-gray-200 transition hover:border-gray-600 hover:text-white"
                >
                  Browse events
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      </div>
      <Footer />
    </div>
  );
}
