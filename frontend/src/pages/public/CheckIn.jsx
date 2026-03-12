import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import Footer from "../../components/common/Footer";
import { verifyCheckInCode, verifyCheckInCodeAny, scanCheckInQr } from "../../features/events/eventApi";
import { QrCode, Camera, ShieldCheck, Ticket, User, Mail, CalendarDays, MapPin, CheckCircle2, Lock, Zap } from "lucide-react";

const statusStyles = {
  valid: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  checked_in: "bg-blue-100 text-blue-700 border border-blue-200",
  cancelled: "bg-rose-100 text-rose-700 border border-rose-200",
  refunded: "bg-amber-100 text-amber-700 border border-amber-200",
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

export default function CheckIn() {
  const { eventId: eventIdParam } = useParams();
  const videoRef = useRef(null);
  const [eventId, setEventId] = useState(eventIdParam || "");
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [sessionToken, setSessionToken] = useState("");
  const [eventMeta, setEventMeta] = useState(null);
  const [qrValue, setQrValue] = useState("");
  const [ticket, setTicket] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState("");

  useEffect(() => {
    if (!sessionToken) return undefined;
    let stream;
    let frameReq;
    let detector;

    const start = async () => {
      if (!window.BarcodeDetector) {
        setCameraError("Camera scanning not supported. Paste the QR payload below.");
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
            /* ignore per-frame errors */
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
  }, [sessionToken]);

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    if (!code.trim()) return toast.error("Enter the code provided by the organizer");
    setVerifying(true);
    try {
      const res = eventId
        ? await verifyCheckInCode(eventId, code.trim())
        : await verifyCheckInCodeAny(code.trim());
      setSessionToken(res.token);
      setEventMeta(res.event);
      if (!eventId && res.event?.id) {
        setEventId(res.event.id);
      }
      toast.success("Code verified. Scanner ready.");
    } catch (err) {
      toast.error(err.message || "Invalid code");
    } finally {
      setVerifying(false);
    }
  };

  const handleScan = async (value) => {
    if (!value || !sessionToken || !eventId) return;
    setQrValue(value);
    try {
      const res = await scanCheckInQr(eventId, value, sessionToken);
      setTicket(res.ticket);
      if (res.alreadyChecked) {
        toast.success("Already checked in");
      } else {
        toast.success("Checked in");
      }
    } catch (err) {
      toast.error(err.message || "Scan failed");
      setTicket(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f7f2ff] via-white to-[#f2ecff] text-[#1f0f26]">
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#6a317f] backdrop-blur-md border-b border-white/15 shadow-lg shadow-[#6a317f]/25">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-11 h-11 bg-white/10 border border-white/30 rounded-xl flex items-center justify-center shadow-lg shadow-[#6a317f]/40">
              <Zap size={20} className="text-white" />
            </div>
            <span className="text-white text-2xl font-bold tracking-tight">EventDesk</span>
          </Link>
        </div>
      </header>
      <div className="max-w-6xl mx-auto px-6 pt-20 pb-14">
        <div className="grid gap-6 lg:grid-cols-[1.05fr,0.95fr]">
          <div className="relative overflow-hidden rounded-3xl border border-[#6a317f]/20 bg-white/90 backdrop-blur-xl p-6 shadow-[0_24px_120px_-60px_rgba(106,49,127,0.45)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(106,49,127,0.10),transparent_36%),radial-gradient(circle_at_80%_12%,rgba(106,49,127,0.12),transparent_34%)]" aria-hidden />
            <div className="relative space-y-4">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[#6a317f] font-semibold">
                <ShieldCheck size={14} /> Guest check-in
              </div>
              <h1 className="text-3xl font-bold">Enter the code, then scan QR</h1>
              <p className="text-[#6a317f]/75 text-sm">No login needed. Any event code works; we’ll attach the right event automatically.</p>

              <form onSubmit={handleVerifyCode} className="mt-2 space-y-3">
                <label className="text-sm text-[#6a317f] font-semibold flex items-center gap-2">
                  <Lock size={16} /> Verify code
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Enter code for this event"
                    className="flex-1 rounded-xl border border-[#6a317f]/25 bg-white px-4 py-3 text-[#1f0f26] placeholder:text-[#6a317f]/50 focus:border-[#6a317f] focus:outline-none focus:ring-2 focus:ring-[#6a317f]/20"
                  />
                  <button
                    type="submit"
                    disabled={verifying}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#6a317f] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-[#6a317f]/30 transition hover:bg-[#58276a] disabled:opacity-60"
                  >
                    {verifying ? "Verifying..." : "Unlock"}
                  </button>
                </div>
                {eventMeta ? (
                  <div className="rounded-2xl border border-[#6a317f]/20 bg-white px-4 py-3 text-sm text-[#6a317f] flex items-center gap-3">
                    <CheckCircle2 size={16} className="text-emerald-500" />
                    <div>
                      <div className="font-semibold text-[#1f0f26]">{eventMeta.title}</div>
                      <div className="text-xs text-[#6a317f]/70 flex flex-wrap gap-2 items-center">
                        <span className="flex items-center gap-1"><CalendarDays size={12} /> {formatDate(eventMeta.startAt)}</span>
                        {eventMeta.venue?.city || eventMeta.venue?.name ? (
                          <span className="flex items-center gap-1"><MapPin size={12} /> {[eventMeta.venue?.name, eventMeta.venue?.city].filter(Boolean).join(", ")}</span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ) : null}
              </form>

              <div className="mt-4 rounded-2xl border border-[#6a317f]/25 bg-white/90 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-sm text-[#6a317f]">
                    <Camera size={16} className="text-[#6a317f]" /> Live camera
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${scanning ? "bg-emerald-100 text-emerald-700" : "bg-[#6a317f]/10 text-[#6a317f]"}`}>
                    {sessionToken ? (scanning ? "Scanning" : "Ready") : "Locked"}
                  </span>
                </div>
                <div className="aspect-video rounded-xl overflow-hidden border border-[#6a317f]/25 bg-[#f6f0ff]">
                  {!sessionToken ? (
                    <div className="h-full flex items-center justify-center text-[#6a317f]/70 text-sm px-6 text-center">Enter the code to enable scanning.</div>
                  ) : cameraError ? (
                    <div className="h-full flex items-center justify-center text-[#6a317f]/70 text-sm px-6 text-center">{cameraError}</div>
                  ) : (
                    <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
                  )}
                </div>
                <p className="text-xs text-[#6a317f]/70 mt-2">If camera fails, paste the QR payload below.</p>

                <div className="mt-3 flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={qrValue}
                    onChange={(e) => setQrValue(e.target.value)}
                    placeholder="Paste QR payload"
                    className="flex-1 rounded-xl border border-[#6a317f]/25 bg-white px-4 py-3 text-[#1f0f26] placeholder:text-[#6a317f]/50 focus:border-[#6a317f] focus:outline-none focus:ring-2 focus:ring-[#6a317f]/20"
                  />
                  <button
                    type="button"
                    onClick={() => handleScan(qrValue)}
                    disabled={!sessionToken}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#6a317f]/25 bg-white px-4 py-3 text-sm font-semibold text-[#6a317f] transition hover:border-[#6a317f]/50 disabled:opacity-60"
                  >
                    Check ticket
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-[#6a317f]/20 bg-white/90 backdrop-blur-xl p-6 shadow-[0_24px_120px_-60px_rgba(106,49,127,0.35)] min-h-[340px]">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[#6a317f] font-semibold">
              <QrCode size={14} /> Scan result
            </div>
            {!ticket ? (
              <div className="h-full flex items-center justify-center text-[#6a317f]/70 text-sm text-center">
                Unlock scanning and point at a QR to see attendee details.
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-[#6a317f]/10 border border-[#6a317f]/20 w-11 h-11 flex items-center justify-center text-sm font-semibold text-[#6a317f]">
                    {ticket.attendee?.name?.[0]?.toUpperCase() || "U"}
                  </div>
                  <div>
                    <div className="text-[#1f0f26] font-semibold flex items-center gap-2">
                      <User size={14} className="text-[#6a317f]" /> {ticket.attendee?.name || "Unknown"}
                    </div>
                    <div className="text-[#6a317f]/70 text-sm flex items-center gap-2">
                      <Mail size={14} className="text-[#6a317f]/70" /> {ticket.attendee?.email || "No email"}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-[#6a317f]/20 bg-white p-3 text-sm text-[#1f0f26] space-y-2">
                  <div className="flex items-center gap-2 font-semibold">
                    <Ticket size={14} className="text-[#6a317f]" /> {ticket.ticketType?.name || "Ticket"}
                    <span className={`ml-auto px-2 py-1 rounded-full text-xs font-semibold ${statusStyles[ticket.status] || "bg-[#f1f0f5] text-[#1f0f26] border border-[#e3dff1]"}`}>
                      {ticket.status?.replace("_", " ") || "valid"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[#6a317f]">
                    <QrCode size={14} className="text-[#6a317f]" /> Code: {ticket.code}
                  </div>
                  {ticket.checkedInAt ? (
                    <div className="text-xs text-emerald-600">Checked in at {formatDate(ticket.checkedInAt)}</div>
                  ) : (
                    <div className="text-xs text-[#6a317f]/70">Not yet checked in</div>
                  )}
                </div>

                <div className="rounded-2xl border border-[#6a317f]/20 bg-white p-3 text-sm text-[#1f0f26] space-y-2">
                  <div className="flex items-center gap-2 font-semibold">
                    <CalendarDays size={14} className="text-[#6a317f]" /> {ticket.event?.title || "Event"}
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-[#6a317f]">
                    <span className="flex items-center gap-1.5"><CalendarDays size={12} /> {formatDate(ticket.event?.startAt)}</span>
                    {ticket.event?.venue?.city || ticket.event?.venue?.name ? (
                      <span className="flex items-center gap-1.5"><MapPin size={12} /> {[ticket.event?.venue?.name, ticket.event?.venue?.city].filter(Boolean).join(", ")}</span>
                    ) : null}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
