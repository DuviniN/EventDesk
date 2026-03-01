const TicketType = require('../models/TicketType');
const Ticket = require('../models/Ticket');
const Event = require('../models/Event');
const Order = require('../models/Order');

// Create a ticket type (organizer only)
exports.createTicketType = async (req, res) => {
  try {
    const organizerId = req.user.id;
    const { eventId } = req.params;
    const { name, description, price, quantityTotal, saleStart, saleEnd, maxPerOrder, isActive } = req.body;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (event.organizerId.toString() !== organizerId) return res.status(403).json({ message: 'Not authorized' });

    if (!name || !price) return res.status(400).json({ message: 'Name and price are required' });

    const tt = await TicketType.create({
      eventId,
      name: String(name).trim(),
      description: description || '',
      price: Number(price),
      quantityTotal: parseInt(quantityTotal) || 0,
      quantitySold: 0,
      saleStart: saleStart ? new Date(saleStart) : null,
      saleEnd: saleEnd ? new Date(saleEnd) : null,
      maxPerOrder: maxPerOrder || 10,
      isActive: typeof isActive === 'boolean' ? isActive : true
    });

    res.status(201).json({ message: 'Ticket type created', ticketType: tt });
  } catch (err) {
    console.error('createTicketType error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// List ticket types for an event (public)
exports.listTicketTypes = async (req, res) => {
  try {
    const { eventId } = req.params;
    const ticketTypes = await TicketType.find({ eventId }).sort({ price: 1 });
    res.json({ ticketTypes });
  } catch (err) {
    console.error('listTicketTypes error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update ticket type (organizer only)
exports.updateTicketType = async (req, res) => {
  try {
    const organizerId = req.user.id;
    const { eventId, id } = req.params;
    const payload = req.body;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (event.organizerId.toString() !== organizerId) return res.status(403).json({ message: 'Not authorized' });

    const tt = await TicketType.findById(id);
    if (!tt) return res.status(404).json({ message: 'Ticket type not found' });

    // simple updates
    ['name','description','price','quantityTotal','saleStart','saleEnd','maxPerOrder','isActive'].forEach(key => {
      if (payload[key] !== undefined) tt[key] = payload[key];
    });

    await tt.save();
    res.json({ message: 'Ticket type updated', ticketType: tt });
  } catch (err) {
    console.error('updateTicketType error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete ticket type (organizer only)
exports.deleteTicketType = async (req, res) => {
  try {
    const organizerId = req.user.id;
    const { eventId, id } = req.params;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (event.organizerId.toString() !== organizerId) return res.status(403).json({ message: 'Not authorized' });

    const tt = await TicketType.findById(id);
    if (!tt) return res.status(404).json({ message: 'Ticket type not found' });

    await TicketType.deleteOne({ _id: id });
    res.json({ message: 'Ticket type deleted' });
  } catch (err) {
    console.error('deleteTicketType error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Purchase tickets (buyer)
// payload: { items: [{ ticketTypeId, quantity }], currency }
exports.purchaseTickets = async (req, res) => {
  try {
    const buyerId = req.user.id;
    const { eventId } = req.params;
    const { items, currency } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) return res.status(400).json({ message: 'No items provided' });

    // basic validation
    const updates = [];
    const orderItems = [];
    let total = 0;

    // Attempt to reserve by incrementing quantitySold atomically per ticketType
    for (const it of items) {
      if (!Number.isInteger(it.quantity) || it.quantity < 1) {
        return res.status(400).json({ message: `Invalid quantity for ticket type ${it.ticketTypeId}` });
      }

      const tt = await TicketType.findOneAndUpdate(
        {
          _id: it.ticketTypeId,
          eventId,
          isActive: true,
          // Atomically prevent oversell: only proceed if enough seats remain for the full requested quantity
          $expr: { $lte: [{ $add: ['$quantitySold', it.quantity] }, '$quantityTotal'] }
        },
        { $inc: { quantitySold: it.quantity } },
        { new: true }
      );

      if (!tt) {
        // rollback all previous increments
        for (const u of updates) {
          await TicketType.findByIdAndUpdate(u._id, { $inc: { quantitySold: -u.quantity } });
        }
        return res.status(400).json({ message: `Unable to reserve ticket type ${it.ticketTypeId}: sold out or not available` });
      }

      // Track this increment immediately — must be before any further checks so it is
      // included in the rollback if a subsequent failure occurs (fixes oversell rollback bug)
      updates.push({ _id: tt._id, quantity: it.quantity });

      // Safety double-check (should never fire given the atomic filter above)
      if (tt.quantitySold > tt.quantityTotal) {
        for (const u of updates) {
          await TicketType.findByIdAndUpdate(u._id, { $inc: { quantitySold: -u.quantity } });
        }
        return res.status(400).json({ message: 'Not enough tickets available' });
      }

      orderItems.push({ ticketTypeId: tt._id, quantity: it.quantity, unitPriceMinor: Math.round(tt.price * 100) });
      total += Math.round(tt.price * 100) * it.quantity;
    }

    // create order (status pending) - payment integration would update status to paid
    const order = await Order.create({ buyerId, eventId, items: orderItems, total, currency: currency || 'USD', status: 'pending' });

    // Generate ticket records for each item
    const createdTickets = [];
    for (const it of orderItems) {
      for (let i = 0; i < it.quantity; i++) {
        const code = `T-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
        const t = await Ticket.create({ eventId, orderId: order._id, ticketTypeId: it.ticketTypeId, ticketCode: code });
        createdTickets.push(t);
      }
    }

    res.status(201).json({ message: 'Order created', order, tickets: createdTickets });
  } catch (err) {
    console.error('purchaseTickets error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get tickets for event (organizer sees all, public sees availability counts)
exports.getTicketsForEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user ? req.user.id : null;
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });

    // if organizer, return all tickets
    if (userId && event.organizerId.toString() === userId) {
      const tickets = await Ticket.find({ eventId }).sort({ createdAt: -1 });
      return res.json({ tickets });
    }

    // public: return ticket types and availability
    const ticketTypes = await TicketType.find({ eventId }).select('-__v');
    const publicTypes = ticketTypes.map(t => ({
      id: t._id,
      name: t.name,
      description: t.description,
      price: t.price,
      remaining: Math.max(0, t.quantityTotal - t.quantitySold),
      saleStart: t.saleStart,
      saleEnd: t.saleEnd,
      maxPerOrder: t.maxPerOrder,
      isActive: t.isActive
    }));

    return res.json({ ticketTypes: publicTypes });
  } catch (err) {
    console.error('getTicketsForEvent error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
