const Event = require('../models/Event');
const Order = require('../models/Order');
const Ticket = require('../models/Ticket');
const TicketType = require('../models/TicketType');
const mongoose = require('mongoose');

/**
 * GET /api/analytics/overview
 * Organizer-wide summary: revenue, tickets, daily series, top events
 */
exports.getOrganizerOverview = async (req, res) => {
  try {
    const organizerId = new mongoose.Types.ObjectId(req.user.id);

    // All events owned by this organizer
    const events = await Event.find({ organizerId }).select('_id title').lean();
    const eventIds = events.map((e) => e._id);

    if (eventIds.length === 0) {
      return res.json({
        totalRevenue: 0,
        totalTicketsSold: 0,
        totalEvents: 0,
        checkinRate: 0,
        dailyRevenue: [],
        revenueByEvent: [],
        ticketStatusBreakdown: { valid: 0, checked_in: 0, cancelled: 0, refunded: 0 },
      });
    }

    // --- Revenue from paid orders ---
    const revenueAgg = await Order.aggregate([
      { $match: { eventId: { $in: eventIds }, status: 'paid' } },
      { $group: { _id: null, totalMinor: { $sum: '$total' }, count: { $sum: 1 } } },
    ]);
    const totalRevenue = revenueAgg.length ? revenueAgg[0].totalMinor / 100 : 0;

    // --- Tickets sold (sum quantitySold across ticket types) ---
    const soldAgg = await TicketType.aggregate([
      { $match: { eventId: { $in: eventIds } } },
      { $group: { _id: null, totalSold: { $sum: '$quantitySold' } } },
    ]);
    const totalTicketsSold = soldAgg.length ? soldAgg[0].totalSold : 0;

    // --- Ticket status breakdown ---
    const ticketStatusAgg = await Ticket.aggregate([
      { $match: { eventId: { $in: eventIds } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const ticketStatusBreakdown = { valid: 0, checked_in: 0, cancelled: 0, refunded: 0 };
    ticketStatusAgg.forEach(({ _id, count }) => {
      if (_id in ticketStatusBreakdown) ticketStatusBreakdown[_id] = count;
    });

    const totalTickets = Object.values(ticketStatusBreakdown).reduce((a, b) => a + b, 0);
    const checkinRate = totalTickets > 0 ? Math.round((ticketStatusBreakdown.checked_in / totalTickets) * 100) : 0;

    // --- Daily revenue: last 30 days ---
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyRevenueAgg = await Order.aggregate([
      {
        $match: {
          eventId: { $in: eventIds },
          status: 'paid',
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$total' },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    const dailyRevenue = dailyRevenueAgg.map((d) => ({
      date: d._id,
      revenue: d.revenue / 100,
    }));

    // --- Revenue per event (top 10) ---
    const revenueByEventAgg = await Order.aggregate([
      { $match: { eventId: { $in: eventIds }, status: 'paid' } },
      { $group: { _id: '$eventId', revenue: { $sum: '$total' }, orders: { $sum: 1 } } },
      { $sort: { revenue: -1 } },
      { $limit: 10 },
    ]);

    // Map event names
    const eventMap = {};
    events.forEach((e) => { eventMap[e._id.toString()] = e.title; });

    const revenueByEvent = revenueByEventAgg.map((r) => ({
      eventId: r._id,
      name: eventMap[r._id.toString()] || 'Unknown',
      revenue: r.revenue / 100,
      orders: r.orders,
    }));

    res.json({
      totalRevenue,
      totalTicketsSold,
      totalEvents: events.length,
      checkinRate,
      dailyRevenue,
      revenueByEvent,
      ticketStatusBreakdown,
    });
  } catch (err) {
    console.error('getOrganizerOverview error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * GET /api/analytics/events/:eventId
 * Per-event analytics: ticket types, orders, attendees
 */
exports.getEventAnalytics = async (req, res) => {
  try {
    const organizerId = req.user.id;
    const { eventId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
      return res.status(400).json({ message: 'Invalid event ID' });
    }

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (event.organizerId.toString() !== organizerId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const eventObjectId = new mongoose.Types.ObjectId(eventId);

    // --- Ticket types with sold/remaining ---
    const ticketTypes = await TicketType.find({ eventId }).lean();
    const ticketTypeStats = ticketTypes.map((tt) => ({
      id: tt._id,
      name: tt.name,
      price: tt.price,
      sold: tt.quantitySold,
      remaining: Math.max(0, tt.quantityTotal - tt.quantitySold),
      total: tt.quantityTotal,
    }));

    // --- Order summary by status ---
    const orderStatusAgg = await Order.aggregate([
      { $match: { eventId: eventObjectId } },
      { $group: { _id: '$status', count: { $sum: 1 }, revenue: { $sum: '$total' } } },
    ]);
    const orderStatusBreakdown = {};
    orderStatusAgg.forEach(({ _id, count, revenue }) => {
      orderStatusBreakdown[_id] = { count, revenue: revenue / 100 };
    });

    // Total paid revenue for this event
    const eventRevenue = (orderStatusBreakdown.paid?.revenue) || 0;

    // --- Ticket status counts ---
    const ticketStatusAgg = await Ticket.aggregate([
      { $match: { eventId: eventObjectId } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const ticketStatusBreakdown = { valid: 0, checked_in: 0, cancelled: 0, refunded: 0 };
    ticketStatusAgg.forEach(({ _id, count }) => {
      if (_id in ticketStatusBreakdown) ticketStatusBreakdown[_id] = count;
    });

    const totalTickets = Object.values(ticketStatusBreakdown).reduce((a, b) => a + b, 0);
    const checkinRate = totalTickets > 0
      ? Math.round((ticketStatusBreakdown.checked_in / totalTickets) * 100)
      : 0;

    const totalSold = ticketTypeStats.reduce((sum, tt) => sum + tt.sold, 0);
    const capacityUsed = event.capacity > 0
      ? Math.round((totalSold / event.capacity) * 100)
      : 0;

    // --- Attendee list ---
    const attendees = await Ticket.find({ eventId })
      .populate('ticketTypeId', 'name price')
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();

    const attendeeList = attendees.map((t) => ({
      ticketCode: t.ticketCode,
      name: t.attendee?.name || '',
      email: t.attendee?.email || '',
      ticketType: t.ticketTypeId?.name || '',
      status: t.status,
      checkedInAt: t.checkedInAt || null,
    }));

    res.json({
      event: {
        id: event._id,
        title: event.title,
        startAt: event.startAt,
        endAt: event.endAt,
        capacity: event.capacity,
        status: event.status,
      },
      eventRevenue,
      totalSold,
      capacityUsed,
      checkinRate,
      ticketTypeStats,
      orderStatusBreakdown,
      ticketStatusBreakdown,
      attendees: attendeeList,
    });
  } catch (err) {
    console.error('getEventAnalytics error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
