import { Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

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
import CheckIn from "../pages/public/CheckIn";

// Organizer pages
import OrganizerDashboard from "../pages/organizers/Dashboard";
import CreateEvent from "../pages/organizers/CreateEvent";
import EditEvent from "../pages/organizers/EditEvent";
import ManageEvents from "../pages/organizers/ManageEvents";
import ManageTickets from "../pages/organizers/ManageTickets";
import Attendees from "../pages/organizers/Attendees";
import AllAttendees from "../pages/organizers/AllAttendees";

import ProtectedRoute from "./ProtectedRoute";
import { selectCurrentUser, selectIsAuthenticated } from "../features/auth/authSlice";


export default function AppRoutes() {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const user = useSelector(selectCurrentUser);

  const isAttendee = isAuthenticated && user?.role === "attendee";

  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/check-in" element={<CheckIn />} />
      <Route path="/check-in/:eventId" element={<CheckIn />} />
      <Route
        path="/events"
        element={isAttendee ? <Navigate to="/attendee-dashboard" replace /> : <Events />}
      />
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
        path="/organizer/attendees"
        element={
          <ProtectedRoute requiredRole="organizer">
            <AllAttendees />
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
        path="/event/:id/attendees"
        element={
          <ProtectedRoute requiredRole="organizer">
            <Attendees />
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
