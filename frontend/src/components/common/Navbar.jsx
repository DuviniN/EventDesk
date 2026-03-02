import { Link } from "react-router-dom";
import Button from "../ui/Button";
import { useAuth } from "../../features/auth/useAuth";
import { LogOut, User } from "lucide-react";

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-800 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">E</span>
            </div>
            <span className="text-white text-2xl font-bold">EventDesk</span>
          </Link>
          
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-gray-300 hover:text-purple-400 transition-colors">
              Home
            </Link>
            <Link to="/events" className="text-gray-300 hover:text-purple-400 transition-colors">
              Events
            </Link>
            {isAuthenticated && user?.role === 'organizer' && (
              <>
                <Link to="/create-event" className="text-gray-300 hover:text-purple-400 transition-colors">
                  Create Event
                </Link>
                <Link to="/manage-events" className="text-gray-300 hover:text-purple-400 transition-colors">
                  Manage Events
                </Link>
              </>
            )}
            <Link to="/about" className="text-gray-300 hover:text-purple-400 transition-colors">
              About
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <div className="flex items-center space-x-2 text-gray-300">
                  <User size={20} />
                  <span className="hidden md:inline">{user?.name}</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={logout}
                  className="flex items-center space-x-2"
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm">Login</Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm">Get Started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
