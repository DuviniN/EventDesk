import { BrowserRouter, useLocation } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import ThemeToggle from "./components/common/ThemeToggle";

function AppShell() {
  const { pathname } = useLocation();

  const isOrganizerRoute =
    pathname === "/dashboard" ||
    pathname === "/create-event" ||
    pathname === "/manage-events" ||
    pathname === "/analytics" ||
    pathname.startsWith("/organizer/") ||
    pathname.startsWith("/edit-event/") ||
    /^\/event\/[^/]+\/(manage-tickets|attendees|analytics)$/.test(pathname);

  const isAttendeeRoute =
    pathname === "/attendee-dashboard" ||
    pathname === "/events" ||
    pathname === "/profile" ||
    pathname === "/ticket/verify" ||
    /^\/event\/[^/]+$/.test(pathname);

  const pageClass = [
    isOrganizerRoute ? "organizer-light" : "",
    isAttendeeRoute ? "attendee-side" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={pageClass}>
      <AppRoutes />
      <div className="fixed bottom-5 right-5 z-[70]">
        <ThemeToggle />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}

