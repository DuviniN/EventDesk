const router = require("express").Router();
const eventController = require("../controllers/event.controller");
const auth = require("../middleware/auth.middleware");
const ticketController = require("../controllers/ticket.controller");

// Protected organizer routes should be declared before dynamic :id to avoid shadowing
router.post("/", auth(["organizer"]), eventController.createEvent);
router.get("/organizer/list", auth(["organizer"]), eventController.getOrganizerEvents);
router.get("/organizer/overview", auth(["organizer"]), eventController.getOrganizerOverview);
router.post("/organizer/reminders/run", auth(["organizer"]), eventController.sendTomorrowReminders);

// Attendee: my tickets (must come before dynamic :eventId routes)
router.get("/me/tickets", auth(), ticketController.getMyTickets);

// Organizer: scan QR payload to fetch ticket details
router.post("/tickets/scan", auth(["organizer"]), ticketController.scanTicket);

// Ticket listings (public/organizer)
router.get("/:eventId/tickets", ticketController.getTicketsForEvent);

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
