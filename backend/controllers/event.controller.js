const mongoose = require("mongoose");
const crypto = require("crypto");
const Event = require("../models/Event");
const Order = require("../models/Order");
const TicketType = require("../models/TicketType");
const User = require("../models/User");
const Email = require("../models/Email");
const sendEmail = require("../utils/sendEmail");
const bcrypt = require("bcryptjs");

const generateCheckInCode = () => {
  // 6-digit numeric code for quick sharing; collision risk is minimal per event creation
  return crypto.randomInt(100000, 999999).toString();
};

const formatUptimeLabel = (seconds) => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const parts = [];
  if (days) parts.push(`${days}d`);
  if (hours) parts.push(`${hours}h`);
  if (!days && minutes) parts.push(`${minutes}m`);
  return parts.length ? parts.join(" ") : "<1m";
};

/**
 * CREATE EVENT
 */
exports.createEvent = async (req, res) => {
  try {
    const { title, description, categories, imageUrl, startAt, endAt, venue, capacity } = req.body;
    const organizerId = req.user.id;

    if (!title) {
      return res.status(400).json({ message: 'Event title is required' });
    }

    if (!startAt) {
      return res.status(400).json({ message: 'Event start date is required' });
    }

    if (!endAt) {
      return res.status(400).json({ message: 'Event end date is required' });
    }

    if (new Date(startAt) >= new Date(endAt)) {
      return res.status(400).json({ message: 'Start date must be before end date' });
    }

    if (!venue || !venue.name || !venue.address || !venue.city) {
      return res.status(400).json({ message: 'Venue information is required' });
    }

    if (!capacity || capacity <= 0) {
      return res.status(400).json({ message: 'Event capacity must be greater than 0' });
    }

    // Always create as draft so the organizer can review details before publishing.
    const initialStatus = 'draft';

    const checkInCode = generateCheckInCode();
    const checkInCodeHash = await bcrypt.hash(checkInCode, 10);

    const event = await Event.create({
      organizerId,
      title: String(title).trim(),
      description: description ? String(description).trim() : '',
      imageUrl: imageUrl ? String(imageUrl).trim() : '',
      categories: categories || [],
      startAt: new Date(startAt),
      endAt: new Date(endAt),
      venue,
      capacity: parseInt(capacity),
      status: initialStatus,
      checkInCodeHash,
      checkInCodePlain: checkInCode,
      checkInCodeUpdatedAt: new Date()
    });

    res.status(201).json({
      message: 'Event created as draft. Review details and publish when ready.',
      event,
      checkInCode
    });
  } catch (err) {
    console.error('Create event error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * GET ALL EVENTS FOR ORGANIZER
 */
exports.getOrganizerEvents = async (req, res) => {
  try {
    const organizerId = req.user.id;

    const events = await Event.find({ organizerId }).sort({ createdAt: -1 }).lean();

    const sanitized = events.map(evt => {
      const obj = { ...evt };
      obj.checkInCode = evt.checkInCodePlain || null;
      delete obj.checkInCodeHash;
      delete obj.checkInCodePlain;
      delete obj.checkInCodeUpdatedAt;
      return obj;
    });

    res.json({ events: sanitized });
  } catch (err) {
    console.error('Get organizer events error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Organizer dashboard overview: totals, sold counts, revenue, upcoming/recent
exports.getOrganizerOverview = async (req, res) => {
  try {
    const organizerId = req.user.id;

    const events = await Event.find({ organizerId }).sort({ createdAt: -1 }).lean();
    const eventIds = events.map(e => e._id);

    if (!eventIds.length) {
      return res.json({
        totals: { total: 0, draft: 0, published: 0, cancelled: 0 },
        sales: { ticketsSold: 0, revenueMinor: 0, revenue: 0 },
        upcoming: [],
        recent: [],
        events: []
      });
    }

    const [statusBuckets, upcoming, recent, salesAgg] = await Promise.all([
      Event.aggregate([
        { $match: { organizerId: new mongoose.Types.ObjectId(organizerId) } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Event.find({ organizerId, startAt: { $gte: new Date() } })
        .sort({ startAt: 1 })
        .limit(5)
        .lean(),
      Event.find({ organizerId })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      TicketType.aggregate([
        { $match: { eventId: { $in: eventIds } } },
        {
          $group: {
            _id: null,
            ticketsSold: { $sum: '$quantitySold' },
            revenueMinor: { $sum: { $multiply: ['$quantitySold', '$price', 100] } }
          }
        }
      ])
    ]);

    const statusCounts = { draft: 0, published: 0, cancelled: 0 };
    statusBuckets.forEach(b => {
      if (statusCounts[b._id] !== undefined) statusCounts[b._id] = b.count;
    });
    const total = statusBuckets.reduce((sum, b) => sum + b.count, 0);

    const sales = salesAgg[0] || { ticketsSold: 0, revenueMinor: 0 };

    res.json({
      totals: {
        total,
        draft: statusCounts.draft,
        published: statusCounts.published,
        cancelled: statusCounts.cancelled
      },
      sales: {
        ticketsSold: sales.ticketsSold || 0,
        revenueMinor: sales.revenueMinor || 0,
        revenue: ((sales.revenueMinor || 0) / 100).toFixed(2)
      },
      upcoming,
      recent,
      events
    });
  } catch (err) {
    console.error('Get organizer overview error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Platform-wide public stats for landing page
exports.getPlatformStats = async (_req, res) => {
  try {
    const [eventsCreated, eventsPublished, ticketsAgg, organizers] = await Promise.all([
      Event.countDocuments({}),
      Event.countDocuments({ status: 'published' }),
      TicketType.aggregate([
        { $group: { _id: null, ticketsSold: { $sum: '$quantitySold' } } }
      ]),
      User.countDocuments({ role: 'organizer' })
    ]);

    const ticketsSold = (ticketsAgg[0]?.ticketsSold) || 0;
    const uptimeSeconds = Math.floor(process.uptime());

    res.json({
      eventsCreated,
      eventsPublished,
      ticketsSold,
      organizers,
      uptimeSeconds,
      uptimeLabel: formatUptimeLabel(uptimeSeconds)
    });
  } catch (err) {
    console.error('getPlatformStats error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * GET SINGLE EVENT
 */
exports.getEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Event.findById(id).lean();
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Only expose check-in code to the organizer of this event
    const isOrganizer = req.user && event.organizerId.toString() === req.user.id;
    const responseEvent = { ...event };
    if (isOrganizer) {
      responseEvent.checkInCode = event.checkInCodePlain || null;
    } else {
      delete responseEvent.checkInCodeHash;
      delete responseEvent.checkInCodePlain;
      delete responseEvent.checkInCodeUpdatedAt;
    }

    res.json({ event: responseEvent });
  } catch (err) {
    console.error('Get event error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * UPDATE EVENT
 */
exports.updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, categories, imageUrl, startAt, endAt, venue, capacity } = req.body;
    const organizerId = req.user.id;

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user is the organizer
    if (event.organizerId.toString() !== organizerId) {
      return res.status(403).json({ message: 'You are not authorized to update this event' });
    }

    // Prevent updates on cancelled events
    if (event.status === 'cancelled') {
      return res.status(400).json({ message: 'Cancelled events cannot be updated' });
    }

    // Prevent updates on published events
    if (event.status === 'published') {
      return res.status(400).json({ message: 'Published events cannot be updated' });
    }

    if (title) event.title = String(title).trim();
    if (description) event.description = String(description).trim();
    if (typeof imageUrl === 'string') event.imageUrl = imageUrl.trim();
    if (categories) event.categories = categories;
    if (startAt) event.startAt = new Date(startAt);
    if (endAt) event.endAt = new Date(endAt);
    if (venue) event.venue = venue;
    if (capacity) event.capacity = parseInt(capacity);

    // Validate dates
    if (event.startAt >= event.endAt) {
      return res.status(400).json({ message: 'Start date must be before end date' });
    }

    await event.save();

    res.json({
      message: 'Event updated successfully',
      event
    });
  } catch (err) {
    console.error('Update event error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * PUBLISH EVENT
 */
exports.publishEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const organizerId = req.user.id;

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user is the organizer
    if (event.organizerId.toString() !== organizerId) {
      return res.status(403).json({ message: 'You are not authorized to publish this event' });
    }

    // Require check-in code to be configured before publish so scanning always uses the code
    if (!event.checkInCodeHash) {
      return res.status(400).json({ message: 'Set a check-in code before publishing this event' });
    }

    if (event.status !== 'draft') {
      return res.status(400).json({ message: 'Only draft events can be published' });
    }

    event.status = 'published';
    await event.save();

    // Best-effort: email attendees who opted in for new event announcements
    queueNewEventAnnouncements(event).catch((err) => {
      console.error('queueNewEventAnnouncements error:', err);
    });

    res.json({
      message: 'Event published successfully',
      event
    });
  } catch (err) {
    console.error('Publish event error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Send announcement to marketing-consented attendees when a new event is published
async function queueNewEventAnnouncements(event) {
  try {
    const subscribers = await User.find({ marketingConsent: true, role: 'attendee', email: { $exists: true, $ne: null } })
      .select('name email')
      .lean();

    if (!subscribers.length) return;

    for (const u of subscribers) {
      const already = await Email.findOne({ type: 'promo', eventId: event._id, userId: u._id });
      if (already) continue;

      const startLocal = event.startAt ? new Date(event.startAt).toLocaleString() : '';
      const venueStr = event.venue?.name ? `${event.venue.name}${event.venue.city ? ' — ' + event.venue.city : ''}` : '';

      const textBody = [
        `Hi ${u.name || 'there'},`,
        '',
        `A new event just went live: ${event.title}.`,
        startLocal ? `Starts: ${startLocal}` : null,
        venueStr ? `Venue: ${venueStr}` : null,
        '',
        'Open EventDesk to grab tickets before they sell out.'
      ].filter(Boolean).join('\n');

      const htmlBody = `
        <div style="font-family:'Inter',Arial,sans-serif;background:#0b0c10;padding:20px;color:#e5e7eb;">
          <h2 style="margin:0 0 6px 0;color:#c084fc;">New event published</h2>
          <p style="margin:0 0 6px 0;color:#cbd5e1;">${event.title}</p>
          ${startLocal ? `<p style=\"margin:0 0 4px 0;color:#cbd5e1;\">Starts: ${startLocal}</p>` : ''}
          ${venueStr ? `<p style=\"margin:0 0 10px 0;color:#94a3b8;\">${venueStr}</p>` : ''}
          <p style="margin:0 0 0 0;color:#94a3b8;">Log in to reserve your spot.</p>
        </div>
      `;

      await sendEmail(u.email, `New event: ${event.title}`, { text: textBody, html: htmlBody });
      await Email.create({ type: 'promo', to: u.email, userId: u._id, eventId: event._id, status: 'sent', sentAt: new Date() });
    }
  } catch (err) {
    console.error('queueNewEventAnnouncements internal error:', err);
  }
}

/**
 * CANCEL EVENT
 */
exports.cancelEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const organizerId = req.user.id;

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user is the organizer
    if (event.organizerId.toString() !== organizerId) {
      return res.status(403).json({ message: 'You are not authorized to cancel this event' });
    }

    event.status = 'cancelled';
    await event.save();

    res.json({
      message: 'Event cancelled successfully',
      event
    });
  } catch (err) {
    console.error('Cancel event error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Organizer: set or update per-event check-in code
exports.setCheckInCode = async (req, res) => {
  try {
    const { id } = req.params;
    const { code } = req.body || {};
    const organizerId = req.user.id;

    if (!code || String(code).trim().length < 4) {
      return res.status(400).json({ message: 'A code of at least 4 characters is required' });
    }

    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (event.organizerId.toString() !== organizerId) {
      return res.status(403).json({ message: 'You are not authorized to update this event' });
    }
    if (event.status === 'cancelled') {
      return res.status(400).json({ message: 'Cancelled events cannot be updated' });
    }
    if (event.status === 'published') {
      return res.status(400).json({ message: 'Published events cannot be updated' });
    }

    const plain = String(code).trim();
    const hash = await bcrypt.hash(plain, 10);
    event.checkInCodeHash = hash;
    event.checkInCodePlain = plain;
    event.checkInCodeUpdatedAt = new Date();
    await event.save();

    return res.json({
      message: 'Check-in code set for this event',
      updatedAt: event.checkInCodeUpdatedAt,
      checkInCode: event.checkInCodePlain
    });
  } catch (err) {
    console.error('Set check-in code error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * DELETE EVENT
 */
exports.deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const organizerId = req.user.id;

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user is the organizer
    if (event.organizerId.toString() !== organizerId) {
      return res.status(403).json({ message: 'You are not authorized to delete this event' });
    }

    // Only block deletion for published events; cancelled and draft can be removed
    if (event.status === 'published') {
      return res.status(400).json({ message: 'Published events must be cancelled before deletion' });
    }

    await Event.deleteOne({ _id: id });

    res.json({ message: 'Event deleted successfully' });
  } catch (err) {
    console.error('Delete event error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * GET ALL PUBLISHED EVENTS
 */
exports.getAllPublishedEvents = async (req, res) => {
  try {
    const events = await Event.find({ status: 'published' }).sort({ startAt: 1 }).lean();
    const sanitized = events.map(evt => {
      const obj = { ...evt };
      delete obj.checkInCodeHash;
      delete obj.checkInCodePlain;
      delete obj.checkInCodeUpdatedAt;
      return obj;
    });
    res.json({ events: sanitized });
  } catch (err) {
    console.error('Get published events error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Organizer: send reminder emails for events happening tomorrow
exports.sendTomorrowReminders = async (req, res) => {
  try {
    const organizerId = req.user.id;

    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() + 1);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 1);

    const events = await Event.find({
      organizerId,
      status: 'published',
      startAt: { $gte: start, $lt: end }
    }).lean();

    if (!events.length) {
      return res.json({ message: 'No published events happening tomorrow for this organizer', sent: 0 });
    }

    let sentCount = 0;

    for (const evt of events) {
      const orders = await Order.find({
        eventId: evt._id,
        status: { $nin: ['failed', 'cancelled', 'refunded'] }
      }).select('buyerId').lean();

      const buyerIds = [...new Set(orders.map(o => o.buyerId?.toString()).filter(Boolean))];
      if (!buyerIds.length) continue;

      const users = await User.find({ _id: { $in: buyerIds } }).select('name email').lean();

      for (const u of users) {
        if (!u.email) continue;

        const already = await Email.findOne({ type: 'event_reminder', userId: u._id, eventId: evt._id });
        if (already) continue;

        const startLocal = evt.startAt ? new Date(evt.startAt).toLocaleString() : '';
        const venueStr = evt.venue?.name ? `${evt.venue.name}${evt.venue.city ? ' — ' + evt.venue.city : ''}` : '';

        const textBody = [
          `Hi ${u.name || 'there'},`,
          '',
          `Reminder: ${evt.title} is happening tomorrow.`,
          startLocal ? `Starts: ${startLocal}` : null,
          venueStr ? `Venue: ${venueStr}` : null,
          '',
          'Show your QR ticket in your profile at entry.',
          'See you there!'
        ].filter(Boolean).join('\n');

        const htmlBody = `
          <div style="font-family:'Inter',Arial,sans-serif;background:#0b0c10;padding:20px;color:#e5e7eb;">
            <h2 style="margin:0 0 6px 0;color:#c084fc;">Reminder for tomorrow</h2>
            <p style="margin:0 0 8px 0;color:#cbd5e1;">${evt.title}</p>
            ${startLocal ? `<p style="margin:0 0 4px 0;color:#cbd5e1;">Starts: ${startLocal}</p>` : ''}
            ${venueStr ? `<p style="margin:0 0 10px 0;color:#94a3b8;">${venueStr}</p>` : ''}
            <p style="margin:0 0 0 0;color:#94a3b8;">Bring your QR ticket (Profile → Tickets) for entry.</p>
          </div>
        `;

        await sendEmail(u.email, `Reminder: ${evt.title} is tomorrow`, { text: textBody, html: htmlBody });
        await Email.create({ type: 'event_reminder', to: u.email, userId: u._id, eventId: evt._id, status: 'sent', sentAt: new Date() });
        sentCount += 1;
      }
    }

    res.json({ message: 'Reminders processed', sent: sentCount });
  } catch (err) {
    console.error('sendTomorrowReminders error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};
