import { Link } from "react-router-dom";
import { useAuth } from "../../features/auth/useAuth";
import { LogOut, User, LayoutDashboard, Plus, Settings, Ticket, CalendarDays, Zap } from "lucide-react";

// ── Shared Logo ────────────────────────────────────────────────
function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5 group">
      <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl flex items-center justify-center shadow-lg shadow-purple-900/50 group-hover:shadow-purple-600/50 transition-shadow duration-300">
        <Zap size={18} className="text-white" fill="white" />
      </div>
      <span className="text-white text-xl font-bold tracking-tight">EventDesk</span>
    </Link>
  );
}

// ── Shared Sign Out button ─────────────────────────────────────
function SignOutButton({ logout, showLabel = true }) {
  return (
    <button
      onClick={logout}
      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800/80 border border-gray-700/50 hover:border-gray-600 transition-all duration-200"
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
      className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800/70 transition-all duration-200"
    >
      {icon}
      {children}
    </Link>
  );
}

// ── User pill ──────────────────────────────────────────────────
function UserPill({ name, showOnMobile = false }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-900/80 border border-gray-700/60 ${showOnMobile ? "" : "hidden md:flex"}`}>
      <User size={14} className="text-purple-400" />
      <span className="text-gray-300 text-sm font-medium truncate max-w-[120px]">{name}</span>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 1. ATTENDEE NAVBAR — minimal: logo + user pill + sign out
// ══════════════════════════════════════════════════════════════
function AttendeeNavbar({ user, logout }) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-md border-b border-gray-800/60">
      <div className="max-w-7xl mx-auto px-6 py-3.5">
        <div className="flex justify-between items-center">
          <Logo />
          <div className="flex items-center gap-3">
            <UserPill name={user?.name} showOnMobile />
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
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-md border-b border-gray-800/60">
      <div className="max-w-7xl mx-auto px-6 py-3.5">
        <div className="flex justify-between items-center">
          <Logo />
          <div className="hidden md:flex items-center gap-1">
            <NavLink to="/dashboard" icon={<LayoutDashboard size={15} />}>Dashboard</NavLink>
            <NavLink to="/create-event" icon={<Plus size={15} />}>Create Event</NavLink>
            <NavLink to="/manage-events" icon={<Settings size={15} />}>Manage Events</NavLink>
          </div>
          <div className="flex items-center gap-3">
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
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-gray-800/50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          <Logo />

          {/* Center links */}
          <div className="hidden md:flex items-center gap-1">
            <Link
              to="/events"
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800/60 transition-all duration-200"
            >
              <CalendarDays size={15} />
              Browse Events
            </Link>
            <Link
              to="/login"
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800/60 transition-all duration-200"
            >
              Sign In
            </Link>
          </div>

          {/* CTA buttons */}
          <div className="flex items-center gap-3">
            <Link to="/login">
              <button className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white border border-gray-700 hover:border-gray-500 rounded-lg transition-all duration-200">
                Login
              </button>
            </Link>
            <Link to="/register">
              <button className="px-5 py-2 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-lg shadow-lg shadow-purple-900/40 hover:shadow-purple-600/50 transition-all duration-200">
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
