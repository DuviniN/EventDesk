import { Routes, Route } from "react-router-dom";
import Landing from "../pages/Landing";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Dashboard from "../pages/Dashboard";
import ForgotPassword from "../pages/ForgotPassword";
import ResetPassword from "../pages/ResetPassword";
import CreateEvent from "../pages/CreateEvent";
import ManageEvents from "../pages/ManageEvents";
import Events from "../pages/Events";
import ProtectedRoute from "./ProtectedRoute";
import EventDetail from "../pages/EventDetail";
import EditEvent from "../pages/EditEvent";
import ManageTickets from "../pages/ManageTickets";


export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      <Route path="/events" element={<Events />} />
      <Route path="/event/:id" element={<EventDetail />} />
      <Route 
        path="/event/:id/manage-tickets" 
        element={
          <ProtectedRoute>
            <ManageTickets />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/edit-event/:id" 
        element={
          <ProtectedRoute>
            <EditEvent />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/create-event" 
        element={
          <ProtectedRoute>
            <CreateEvent />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/manage-events" 
        element={
          <ProtectedRoute>
            <ManageEvents />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
}
