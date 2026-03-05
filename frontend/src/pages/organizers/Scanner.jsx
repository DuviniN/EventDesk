import { useEffect, useRef, useState } from "react";
import Navbar from "../../components/common/Navbar";
import Footer from "../../components/common/Footer";
import { scanTicketQr } from "../../features/tickets/ticketsApi";
import { QrCode, Camera, Info, CheckCircle2, User, Mail, CalendarDays, MapPin, Ticket } from "lucide-react";
import toast from "react-hot-toast";

const statusStyles = {
  valid: "bg-green-500/15 text-green-300 border border-green-600/40",
  checked_in: "bg-blue-500/15 text-blue-200 border border-blue-500/30",
  cancelled: "bg-red-500/15 text-red-200 border border-red-500/30",
  refunded: "bg-amber-500/15 text-amber-200 border border-amber-500/30",
};

export default function Scanner() {
  const videoRef = useRef(null);
  const [qrValue, setQrValue] = useState("");
  const [ticket, setTicket] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState("");

  useEffect(() => {
    let stream;
    let frameReq;
    let detector;

    const start = async () => {
      if (!window.BarcodeDetector) {
        setCameraError("Camera scanning not supported on this device. Paste the QR payload below.");
        return;
      }
      try {
        detector = new BarcodeDetector({ formats: ["qr_code"] });
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setScanning(true);
        const scanFrame = async () => {
          if (!videoRef.current) return;
          try {
            const barcodes = await detector.detect(videoRef.current);
            if (barcodes && barcodes.length > 0) {
              handleScan(barcodes[0].rawValue);
            }
          } catch (err) {
            // ignore per-frame errors
          }
          frameReq = requestAnimationFrame(scanFrame);
        };
        frameReq = requestAnimationFrame(scanFrame);
      } catch (err) {
        setCameraError("Unable to access camera. Paste the QR payload below.");
        setScanning(false);
      }
    };

    start();

    return () => {
      if (frameReq) cancelAnimationFrame(frameReq);
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const handleScan = async (value) => {
    if (!value) return;
    setQrValue(value);
    try {
      const res = await scanTicketQr(value);
      setTicket(res.ticket);
      toast.success("Ticket found");
    } catch (err) {
      toast.error(err.message || "Scan failed");
      setTicket(null);
    }
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

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <div className="max-w-6xl mx-auto px-6 pt-24 pb-16">
        <div className="grid lg:grid-cols-[1.1fr,0.9fr] gap-6">
          <div className="rounded-3xl border border-gray-800/80 bg-gradient-to-br from-gray-950 via-gray-900 to-black p-6 shadow-xl shadow-black/40">
            <div className="flex items-center gap-2 text-sm uppercase tracking-[0.16em] text-gray-400">
              <QrCode size={16} /> Scan ticket
            </div>
            <h1 className="text-3xl font-bold mt-2">Point and check in</h1>
            <p className="text-gray-400 text-sm mt-1">Use your phone camera. If it fails, paste the QR payload below.</p>

            <div className="mt-4 rounded-2xl border border-gray-800 bg-black/70 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <Camera size={16} className="text-purple-300" /> Live camera
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${scanning ? "bg-green-500/20 text-green-200" : "bg-gray-800 text-gray-400"}`}>
                  {scanning ? "Scanning" : "Idle"}
                </span>
              </div>
              <div className="aspect-video rounded-xl overflow-hidden border border-gray-800 bg-gray-950">
                {cameraError ? (
                  <div className="h-full flex items-center justify-center text-gray-500 text-sm text-center px-6">
                    {cameraError}
                  </div>
                ) : (
                  <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">Tip: Max brightness on the attendee phone and fill the frame with the QR.</p>
            </div>

            <div className="mt-4">
              <label className="text-sm text-gray-300">QR payload (paste if camera fails)</label>
              <div className="flex flex-col sm:flex-row gap-2 mt-2">
                <input
                  type="text"
                  value={qrValue}
                  onChange={(e) => setQrValue(e.target.value)}
                  placeholder="Paste QR payload"
                  className="flex-1 rounded-xl border border-gray-800 bg-black/60 px-4 py-3 text-sm text-white placeholder:text-gray-600 focus:border-purple-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleScan(qrValue)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-900/40 transition hover:bg-purple-500"
                >
                  Check ticket
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-gray-800/80 bg-black/70 p-6 shadow-xl shadow-black/40 min-h-[320px]">
            <div className="flex items-center gap-2 text-sm uppercase tracking-[0.16em] text-gray-400">
              <Info size={15} /> Ticket details
            </div>
            {!ticket ? (
              <div className="h-full flex items-center justify-center text-gray-500 text-sm text-center">
                Scan a code to see attendee details.
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-gray-900 border border-gray-800 w-10 h-10 flex items-center justify-center text-sm font-semibold text-white">
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
                </div>

                <div className="rounded-2xl border border-gray-800 bg-gray-950/60 p-3 text-sm text-gray-200 space-y-2">
                  <div className="flex items-center gap-2 text-white font-semibold">
                    <Ticket size={14} className="text-purple-300" /> {ticket.ticketType?.name || "Ticket"}
                    <span className={`ml-auto px-2 py-1 rounded-full text-xs font-semibold ${statusStyles[ticket.status] || "bg-gray-800 text-gray-200 border border-gray-700"}`}>
                      {ticket.status?.replace("_", " ") || "valid"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-400">
                    <QrCode size={14} className="text-gray-500" /> Code: {ticket.code}
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-800 bg-gray-950/60 p-3 text-sm text-gray-200 space-y-2">
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

                <div className="text-xs text-gray-500">Order: {ticket.orderId || "N/A"}</div>
                {ticket.checkedInAt ? (
                  <div className="text-xs text-green-300">Checked in at {formatDate(ticket.checkedInAt)}</div>
                ) : (
                  <div className="text-xs text-gray-400">Not yet checked in</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
