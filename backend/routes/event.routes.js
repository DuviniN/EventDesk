const router = require("express").Router();
const eventController = require("../controllers/event.controller");
const auth = require("../middleware/auth.middleware");
const ticketController = require("../controllers/ticket.controller");

// Get all published events (public)
router.get("/published", eventController.getAllPublishedEvents);

// Get single event (public)
router.get("/:id", eventController.getEvent);

// Ticket types (public listing)
router.get("/:eventId/ticket-types", ticketController.listTicketTypes);

// Ticket listings (public/organizer)
router.get("/:eventId/tickets", ticketController.getTicketsForEvent);

// Protected routes
// Create event (organizers only)
router.post("/", auth(["organizer"]), eventController.createEvent);

// Get organizer's events
router.get("/organizer/list", auth(["organizer"]), eventController.getOrganizerEvents);

// Update event (organizers only)
router.put("/:id", auth(["organizer"]), eventController.updateEvent);

// Publish event
router.post("/:id/publish", auth(["organizer"]), eventController.publishEvent);

// Cancel event
router.post("/:id/cancel", auth(["organizer"]), eventController.cancelEvent);

// Delete event (organizers only)
router.delete("/:id", auth(["organizer"]), eventController.deleteEvent);

// Ticket type management (organizer only)
router.post("/:eventId/ticket-types", auth(["organizer"]), ticketController.createTicketType);
router.patch("/:eventId/ticket-types/:id", auth(["organizer"]), ticketController.updateTicketType);
router.delete("/:eventId/ticket-types/:id", auth(["organizer"]), ticketController.deleteTicketType);

// Purchase tickets (authenticated users)
router.post("/:eventId/tickets/purchase", auth(), ticketController.purchaseTickets);

module.exports = router;
