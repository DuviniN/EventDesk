import { Link } from "react-router-dom";
import { useAuth } from "../../features/auth/useAuth";
import { LogOut, User, LayoutDashboard, Plus, Settings, Ticket, CalendarDays, Zap, QrCode, Users } from "lucide-react";

// ── Shared Logo ────────────────────────────────────────────────
function Logo() {
  return (
    <Link to="/" className="flex items-center gap-3 group">
      <div className="w-11 h-11 bg-[#6a317f] rounded-xl flex items-center justify-center shadow-lg shadow-[#6a317f]/50 group-hover:shadow-[#6a317f]/70 transition-shadow duration-300">
        <Zap size={20} className="text-white" fill="white" />
      </div>
      <span className="text-white text-2xl font-bold tracking-tight">EventDesk</span>
    </Link>
  );
}

// ── Shared Sign Out button ─────────────────────────────────────
function SignOutButton({ logout, showLabel = true }) {
  return (
    <button
      onClick={logout}
      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-white/10 border border-white/30 hover:border-white/60 hover:bg-white/15 backdrop-blur-sm transition-all duration-200"
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
      className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg text-base font-medium text-white/90 hover:text-white hover:bg-white/15 transition-all duration-200"
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
      className={`flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/10 border border-white/30 hover:border-white/50 text-base text-white backdrop-blur-sm transition-colors ${showOnMobile ? "" : "hidden md:flex"}`}
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
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#6a317f] backdrop-blur-md border-b border-white/15 shadow-lg shadow-[#6a317f]/30">
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
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#6a317f] backdrop-blur-md border-b border-white/15 shadow-lg shadow-[#6a317f]/30">
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
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#6a317f] backdrop-blur-md border-b border-white/15 shadow-lg shadow-[#6a317f]/25">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          <Logo />

          <div className="flex-1" />

          {/* CTA buttons */}
          <div className="flex items-center gap-3">
            <Link to="/login">
              <button className="px-4 py-2 text-sm font-medium text-white border border-white/35 hover:border-white/60 rounded-lg transition-all duration-200 bg-white/10 hover:bg-white/15 backdrop-blur-sm">
                Sign In
              </button>
            </Link>
            <Link to="/register">
              <button className="px-5 py-2 text-sm font-semibold text-white bg-white/20 hover:bg-white/30 border border-white/30 rounded-lg shadow-lg shadow-[#6a317f]/40 hover:shadow-[#6a317f]/50 transition-all duration-200">
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
