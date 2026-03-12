import { useEffect, useState } from "react";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import { useAuth } from "../features/auth/useAuth";
import { getMyTickets } from "../features/events/eventApi";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { Ticket, Calendar, PenSquare, ShieldCheck, Lock, Mail, User as UserIcon, KeyRound, CheckCircle2 } from "lucide-react";

export default function Profile() {
  const { user, updateProfile, changePassword } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [counts, setCounts] = useState({ tickets: 0, events: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ name: user?.name || "", marketingConsent: !!user?.marketingConsent });
  const [saving, setSaving] = useState(false);
  const [pwdForm, setPwdForm] = useState({ oldPassword: "", newPassword: "" });
  const [pwdSaving, setPwdSaving] = useState(false);
  const isOrganizer = user?.role === 'organizer';

  useEffect(() => {
    setForm({ name: user?.name || "", marketingConsent: !!user?.marketingConsent });
  }, [user]);

  useEffect(() => {
    if (isOrganizer) {
      setLoading(false);
      return;
    }
    const load = async () => {
      try {
        const data = await getMyTickets();
        setTickets(data.tickets || []);
        setCounts(data.counts || { tickets: 0, events: 0 });
      } catch (err) {
        setError(err.message || "Failed to load tickets");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isOrganizer]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile({ name: form.name, marketingConsent: form.marketingConsent });
    } catch (err) {
      setError(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handlePassword = async (e) => {
    e.preventDefault();
    setPwdSaving(true);
    setError(null);
    try {
      await changePassword(pwdForm);
      setPwdForm({ oldPassword: "", newPassword: "" });
    } catch (err) {
      setError(err.message || "Failed to change password");
    } finally {
      setPwdSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <div className="pt-20 pb-12 px-6 bg-gradient-to-b from-gray-950 via-black to-black">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="bg-gray-900/80 border border-gray-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3 shadow-xl shadow-purple-900/10">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-lg bg-purple-600/15 border border-purple-500/30 flex items-center justify-center text-purple-300">
                <UserIcon size={20} />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.25em] text-gray-500">{isOrganizer ? 'Organizer' : 'Attendee'}</p>
                <h1 className="text-2xl font-semibold leading-tight">{user?.name}</h1>
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <Mail size={14} />
                  <span>{user?.email}</span>
                </div>
              </div>
            </div>
            {!isOrganizer && (
              <div className="flex gap-2 text-sm text-gray-300">
                <Badge icon={<Ticket size={14} />} label={`Tickets: ${counts.tickets}`} />
                <Badge icon={<Calendar size={14} />} label={`Events: ${counts.events}`} />
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/40 text-red-400 px-4 py-3 rounded-lg text-sm">{error}</div>
          )}
          {isOrganizer ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <MiniStat icon={<ShieldCheck size={16} />} label="Role" value="Organizer" />
                <MiniStat icon={<KeyRound size={16} />} label="Access" value="Full workspace" />
                <MiniStat icon={<CheckCircle2 size={16} />} label="Status" value="Active" />
              </div>
              <Card>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm text-gray-300 font-semibold">
                      <PenSquare size={14} className="text-purple-400" /> Profile
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-3">
                      <Input
                        label="Full Name"
                        name="name"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        required
                      />
                      <Input label="Email" value={user?.email || ''} disabled />
                      <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-500" disabled={saving}>
                        {saving ? "Saving..." : "Save Changes"}
                      </Button>
                    </form>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm text-gray-300 font-semibold">
                      <Lock size={14} className="text-purple-400" /> Password
                    </div>
                    <form onSubmit={handlePassword} className="space-y-3">
                      <Input
                        label="Current Password"
                        type="password"
                        value={pwdForm.oldPassword}
                        onChange={(e) => setPwdForm({ ...pwdForm, oldPassword: e.target.value })}
                        required
                      />
                      <Input
                        label="New Password"
                        type="password"
                        value={pwdForm.newPassword}
                        onChange={(e) => setPwdForm({ ...pwdForm, newPassword: e.target.value })}
                        required
                      />
                      <Button type="submit" className="w-full bg-gray-800 hover:bg-gray-700" disabled={pwdSaving}>
                        {pwdSaving ? "Updating..." : "Update Password"}
                      </Button>
                    </form>
                  </div>
                </div>
              </Card>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1 space-y-6">
                <Card>
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <PenSquare size={16} className="text-purple-400" /> Profile Details
                  </h2>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                      label="Full Name"
                      name="name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                    />
                    <Input label="Email" value={user?.email || ''} disabled />
                    <label className="flex items-center gap-2 text-sm text-gray-300">
                      <input
                        type="checkbox"
                        checked={form.marketingConsent}
                        onChange={(e) => setForm({ ...form, marketingConsent: e.target.checked })}
                        className="accent-purple-500"
                      />
                      Receive updates and promos
                    </label>
                    <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-500" disabled={saving}>
                      {saving ? "Saving..." : "Save Changes"}
                    </Button>
                  </form>
                </Card>

                <Card>
                  <h3 className="text-md font-semibold mb-3 flex items-center gap-2">
                    <Lock size={16} className="text-purple-400" /> Change Password
                  </h3>
                  <form onSubmit={handlePassword} className="space-y-3">
                    <Input
                      label="Current Password"
                      type="password"
                      value={pwdForm.oldPassword}
                      onChange={(e) => setPwdForm({ ...pwdForm, oldPassword: e.target.value })}
                      required
                    />
                    <Input
                      label="New Password"
                      type="password"
                      value={pwdForm.newPassword}
                      onChange={(e) => setPwdForm({ ...pwdForm, newPassword: e.target.value })}
                      required
                    />
                    <Button type="submit" className="w-full bg-gray-800 hover:bg-gray-700" disabled={pwdSaving}>
                      {pwdSaving ? "Updating..." : "Update Password"}
                    </Button>
                  </form>
                </Card>
              </div>

              <div className="lg:col-span-2">
                <Card>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold">Your Tickets</h2>
                    <span className="text-xs text-gray-400">Shows latest first</span>
                  </div>
                  {loading ? (
                    <p className="text-gray-500">Loading tickets...</p>
                  ) : tickets.length === 0 ? (
                    <div className="text-center text-gray-400 py-10">No tickets yet.</div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {tickets.map((t) => (
                        <div key={t._id} className="border border-gray-800 rounded-xl p-4 bg-gray-950/60 flex flex-col gap-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold">{t.eventId?.title || "Event"}</p>
                              <p className="text-xs text-gray-500">{t.eventId?.startAt ? new Date(t.eventId.startAt).toLocaleString() : ""}</p>
                            </div>
                            <span className="text-xs px-2 py-1 rounded-full bg-gray-800 text-gray-300">{t.ticketTypeId?.name || "Ticket"}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm text-gray-300">
                            <div className="flex items-center gap-2">
                              <Ticket size={14} className="text-purple-400" />
                              <span>Code: {t.ticketCode}</span>
                            </div>
                            <span className="text-xs text-gray-500">Booked {new Date(t.createdAt).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                            {t.qrImage ? (
                              <img
                                src={t.qrImage}
                                alt={`QR for ${t.ticketCode}`}
                                className="w-24 h-24 rounded-lg border border-gray-800 bg-black object-contain"
                              />
                            ) : (
                              <div className="w-24 h-24 rounded-lg border border-dashed border-gray-700 flex items-center justify-center text-gray-600">
                                QR pending
                              </div>
                            )}
                            <div className="space-y-1">
                              <p className="font-semibold text-gray-200">Scan at entry</p>
                              <p>{t.qrImage ? 'Show this code to be scanned.' : 'Generating your QR...'}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}

function Badge({ icon, label }) {
  return (
    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-900 border border-gray-800 text-gray-200">
      {icon}
      {label}
    </span>
  );
}

function Card({ children }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-lg shadow-black/30">
      {children}
    </div>
  );
}

function MiniStat({ icon, label, value }) {
  return (
    <div className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-sm text-gray-200">
      <div className="flex items-center gap-2 text-gray-400">
        {icon}
        <span className="uppercase tracking-[0.08em] text-[11px]">{label}</span>
      </div>
      <span className="font-semibold text-white">{value}</span>
    </div>
  );
}
