const router = require("express").Router();
const eventController = require("../controllers/event.controller");
const auth = require("../middleware/auth.middleware");
const ticketController = require("../controllers/ticket.controller");

// Protected organizer routes should be declared before dynamic :id to avoid shadowing
router.post("/", auth(["organizer"]), eventController.createEvent);
router.get("/organizer/list", auth(["organizer"]), eventController.getOrganizerEvents);
router.get("/organizer/overview", auth(["organizer"]), eventController.getOrganizerOverview);
router.post("/organizer/reminders/run", auth(["organizer"]), eventController.sendTomorrowReminders);
router.get("/organizer/attendees", auth(["organizer"]), ticketController.getOrganizerAttendees);

// Public platform stats for landing page
router.get("/stats", eventController.getPlatformStats);

// Organizer: set per-event check-in code
router.post("/:id/checkin/code", auth(["organizer"]), eventController.setCheckInCode);

// Attendee: my tickets (must come before dynamic :eventId routes)
router.get("/me/tickets", auth(), ticketController.getMyTickets);

// Public check-in flow (code verify + QR scan) — kept before :eventId catchalls
router.post("/checkin/verify", ticketController.verifyCheckInCodePublicAny);
router.post("/:eventId/checkin/verify", ticketController.verifyCheckInCodePublic);
router.post("/:eventId/checkin/scan", ticketController.scanTicketWithCode);

// Organizer: scan QR payload to fetch ticket details
router.post("/tickets/scan", auth(["organizer"]), ticketController.scanTicket);

// Public: verify ticket details via QR URL (for Google Lens / phone cameras)
router.get("/tickets/verify", ticketController.verifyTicketPublic);

// Ticket listings for organizers (attendee list)
router.get("/:eventId/tickets", auth(["organizer"]), ticketController.getTicketsForEvent);

// Purchase tickets (authenticated users)
router.post("/:eventId/tickets/purchase", auth(), ticketController.purchaseTickets);
router.get("/:eventId/ticket-types", ticketController.listTicketTypes);

// Ticket type management (organizer only)
router.post("/:eventId/ticket-types", auth(["organizer"]), ticketController.createTicketType);
router.patch("/:eventId/ticket-types/:id", auth(["organizer"]), ticketController.updateTicketType);
router.delete("/:eventId/ticket-types/:id", auth(["organizer"]), ticketController.deleteTicketType);

// Public
router.get("/published", eventController.getAllPublishedEvents);
router.get("/:id", eventController.getEvent);
router.put("/:id", auth(["organizer"]), eventController.updateEvent);
router.post("/:id/publish", auth(["organizer"]), eventController.publishEvent);
router.post("/:id/cancel", auth(["organizer"]), eventController.cancelEvent);
router.delete("/:id", auth(["organizer"]), eventController.deleteEvent);

module.exports = router;
