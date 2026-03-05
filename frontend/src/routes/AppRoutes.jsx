import { Routes, Route } from "react-router-dom";

// Public page
import Landing from "../pages/Landing";

// Auth pages
import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import ForgotPassword from "../pages/auth/ForgotPassword";
import ResetPassword from "../pages/auth/ResetPassword";

// Attendee pages
import AttendeeDashboard from "../pages/attendees/AttendeeDashboard";
import Events from "../pages/attendees/Events";
import EventDetail from "../pages/attendees/EventDetail";
import VerifyTicket from "../pages/attendees/VerifyTicket";
import Profile from "../pages/attendees/Profile";

// Organizer pages
import OrganizerDashboard from "../pages/organizers/Dashboard";
import CreateEvent from "../pages/organizers/CreateEvent";
import EditEvent from "../pages/organizers/EditEvent";
import ManageEvents from "../pages/organizers/ManageEvents";
import ManageTickets from "../pages/organizers/ManageTickets";
import Scanner from "../pages/organizers/Scanner";

import ProtectedRoute from "./ProtectedRoute";


export default function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/events" element={<Events />} />
      <Route path="/event/:id" element={<EventDetail />} />
      <Route path="/ticket/verify" element={<VerifyTicket />} />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />

      {/* Attendee protected */}
      <Route
        path="/attendee-dashboard"
        element={
          <ProtectedRoute requiredRole="attendee">
            <AttendeeDashboard />
          </ProtectedRoute>
        }
      />

      {/* Organizer protected */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute requiredRole="organizer">
            <OrganizerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/event/:id/manage-tickets"
        element={
          <ProtectedRoute requiredRole="organizer">
            <ManageTickets />
          </ProtectedRoute>
        }
      />
      <Route
        path="/organizer/scanner"
        element={
          <ProtectedRoute requiredRole="organizer">
            <Scanner />
          </ProtectedRoute>
        }
      />
      <Route
        path="/edit-event/:id"
        element={
          <ProtectedRoute requiredRole="organizer">
            <EditEvent />
          </ProtectedRoute>
        }
      />
      <Route
        path="/create-event"
        element={
          <ProtectedRoute requiredRole="organizer">
            <CreateEvent />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manage-events"
        element={
          <ProtectedRoute requiredRole="organizer">
            <ManageEvents />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
