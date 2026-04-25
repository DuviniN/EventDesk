import { Link } from "react-router-dom";
import { useAuth } from "../../features/auth/useAuth";
import { LogOut, User, LayoutDashboard, Plus, Settings, Ticket, CalendarDays, Zap, QrCode, Users } from "lucide-react";

// ── Shared Logo ────────────────────────────────────────────────
function Logo({ variant = "dark" }) {
  const textColor = variant === "light" ? "text-slate-900" : "text-white";
  return (
    <Link to="/" className="flex items-center gap-3 group">
      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500 via-fuchsia-500 to-indigo-500 flex items-center justify-center shadow-[0_12px_35px_-12px_rgba(99,102,241,0.8)] group-hover:shadow-[0_16px_45px_-12px_rgba(99,102,241,1)] transition-all duration-300">
        <Zap size={20} className="text-white" fill="white" />
      </div>
      <span className={`${textColor} text-2xl font-bold tracking-tight drop-shadow-sm`}>EventDesk</span>
    </Link>
  );
}

// ── Shared Sign Out button ─────────────────────────────────────
function SignOutButton({ logout, showLabel = true }) {
  return (
    <button
      onClick={logout}
      className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-white bg-white/10 border border-white/20 hover:border-white/50 hover:bg-white/15 shadow-[0_10px_30px_-15px_rgba(255,255,255,0.6)] backdrop-blur-lg transition-all duration-200"
    >
      <LogOut size={15} />
      {showLabel && <span>Sign Out</span>}
    </button>
  );
}

// ── Organizer nav link ─────────────────────────────────────────
function NavLink({ to, icon, children }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-2.5 px-4 py-2.5 rounded-full text-sm font-semibold text-white/85 hover:text-white bg-white/0 hover:bg-white/12 border border-transparent hover:border-white/15 transition-all duration-200"
    >
      {icon}
      {children}
    </Link>
  );
}

// ── User pill ──────────────────────────────────────────────────
function UserPill({ name, to = "/profile", showOnMobile = false }) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/10 border border-white/20 hover:border-white/40 text-sm font-semibold text-white backdrop-blur-lg transition-colors ${showOnMobile ? "" : "hidden md:flex"}`}
    >
      <User size={16} className="text-white" />
      <span className="text-white text-sm font-semibold truncate max-w-[140px]">{name}</span>
    </Link>
  );
}

// ══════════════════════════════════════════════════════════════
// 1. ATTENDEE NAVBAR — minimal: logo + user pill + sign out
// ══════════════════════════════════════════════════════════════
function AttendeeNavbar({ user, logout }) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-[#0b1024]/90 via-[#141a33]/88 to-[#231437]/85 backdrop-blur-xl border-b border-white/10 shadow-[0_16px_50px_-24px_rgba(0,0,0,0.8)]">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          <Logo />
          <div className="hidden md:flex items-center gap-2">
            <NavLink to="/attendee-dashboard" icon={<LayoutDashboard size={15} />}>Dashboard</NavLink>
          </div>
          <div className="flex items-center gap-3">
            <UserPill name={user?.name} showOnMobile to="/profile" />
            <SignOutButton logout={logout} />
          </div>
        </div>
      </div>
    </nav>
  );
}

// ══════════════════════════════════════════════════════════════
// 2. ORGANIZER NAVBAR — logo + management links + sign out
// ══════════════════════════════════════════════════════════════
function OrganizerNavbar({ user, logout }) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-[#0b1024]/90 via-[#141a33]/88 to-[#231437]/85 backdrop-blur-xl border-b border-white/10 shadow-[0_16px_50px_-24px_rgba(0,0,0,0.8)]">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          <Logo />
          <div className="hidden md:flex items-center gap-2">
            <NavLink to="/dashboard" icon={<LayoutDashboard size={15} />}>Dashboard</NavLink>
            <NavLink to="/create-event" icon={<Plus size={15} />}>Create Event</NavLink>
            <NavLink to="/manage-events" icon={<Settings size={15} />}>Manage Events</NavLink>
            <NavLink to="/organizer/attendees" icon={<Users size={15} />}>Attendees</NavLink>
          </div>
          <div className="flex items-center gap-3.5">
            <UserPill name={user?.name} />
            <SignOutButton logout={logout} />
          </div>
        </div>
      </div>
    </nav>
  );
}

// ══════════════════════════════════════════════════════════════
// 3. DEFAULT NAVBAR — public, modern design
// ══════════════════════════════════════════════════════════════
function DefaultNavbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-b border-slate-200/70 shadow-[0_16px_40px_-28px_rgba(0,0,0,0.35)]">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          <Logo variant="light" />

          <div className="flex-1" />

          {/* CTA buttons */}
          <div className="flex items-center gap-3">
            <Link to="/login">
              <button className="px-4 py-2 text-sm font-semibold text-slate-800 border border-slate-200 hover:border-slate-300 rounded-full transition-all duration-200 bg-white hover:bg-slate-50 shadow-[0_10px_25px_-20px_rgba(0,0,0,0.6)]">
                Sign In
              </button>
            </Link>
            <Link to="/register">
              <button className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 border border-transparent rounded-full shadow-[0_18px_40px_-18px_rgba(129,140,248,0.9)] transition-all duration-200">
                Get Started
              </button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

// ══════════════════════════════════════════════════════════════
// MAIN EXPORT — role-based switch
// ══════════════════════════════════════════════════════════════
export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();

  if (isAuthenticated && user?.role === "attendee") {
    return <AttendeeNavbar user={user} logout={logout} />;
  }

  if (isAuthenticated && user?.role === "organizer") {
    return <OrganizerNavbar user={user} logout={logout} />;
  }

  return <DefaultNavbar />;
}
