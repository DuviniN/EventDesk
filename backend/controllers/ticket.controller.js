const TicketType = require('../models/TicketType');
const Ticket = require('../models/Ticket');
const Event = require('../models/Event');
const Order = require('../models/Order');
const User = require('../models/User');
const Seat = require('../models/Seat');
const SeatHold = require('../models/SeatHold');
const SeatAssignment = require('../models/SeatAssignment');
const sendEmail = require("../utils/sendEmail");
const QRCode = require('qrcode');
const jwt = require('jsonwebtoken');

const qrSecret = process.env.QR_SECRET || process.env.JWT_ACCESS_SECRET || 'qr-fallback-secret';

const normalizeTier = (value) => {
  if (!value) return 'regular';
  return String(value).trim().toLowerCase().replace(/\s+/g, '-');
};

const buildQrPayload = (ticket, event) => {
  return jwt.sign(
    {
      tid: ticket._id.toString(),
      tc: ticket.ticketCode,
      eid: ticket.eventId.toString(),
      et: event?.title,
      email: ticket.attendee?.email,
      seat: ticket.seatLabel || null
    },
    qrSecret,
    { expiresIn: '365d' }
  );
};

const attachQrToTicket = async (ticket, event) => {
  const qrPayload = buildQrPayload(ticket, event);

  // Make the QR human-readable when scanned by phone camera/Lens (no auto-redirect),
  // but still include the token for organizer scanners.
  const lines = [
    'EventDesk Ticket',
    `Name: ${ticket.attendee?.name || 'Guest'}`,
    `Email: ${ticket.attendee?.email || 'N/A'}`,
    `Event: ${event?.title || 'Event'}`,
    event?.startAt ? `When: ${new Date(event.startAt).toLocaleString()}` : null,
    event?.venue?.city || event?.venue?.name ? `Venue: ${[event.venue?.name, event.venue?.city].filter(Boolean).join(', ')}` : null,
    ticket?.seatLabel?.section || ticket?.seatLabel?.row || ticket?.seatLabel?.number
      ? `Seat: ${[ticket.seatLabel?.section, ticket.seatLabel?.row, ticket.seatLabel?.number].filter(Boolean).join('-')}`
      : null,
    `Code: ${ticket.ticketCode}`,
    `Status: ${ticket.status || 'valid'}`,
    `token:${qrPayload}`,
    'Organizer: use token in scanner',
  ].filter(Boolean);

  const qrContent = lines.join('\n');

  const qrImage = await QRCode.toDataURL(qrContent, {
    margin: 4,
    scale: 10,
    errorCorrectionLevel: 'H',
    color: { dark: '#000000', light: '#ffffff' },
    type: 'image/png'
  });

  ticket.qrPayload = qrPayload; // raw token retained for secure verification
  ticket.qrImage = qrImage;     // image carries readable details + token line
  await ticket.save();
  return { qrPayload, qrImage };
};

const extractQrToken = (qrInput) => {
  if (!qrInput) return null;
  try {
    const url = new URL(qrInput);
    const qp = url.searchParams.get('qr');
    if (qp) return qp;
  } catch (err) {
    /* not a URL, fall through */
  }
  // Try to extract from token:xxxx pattern in text payload
  const tokenMatch = qrInput.match(/token[:=]\s*([A-Za-z0-9._-]+)/i);
  if (tokenMatch && tokenMatch[1]) return tokenMatch[1];
  return qrInput;
};

// Create a ticket type (organizer only)
exports.createTicketType = async (req, res) => {
  try {
    const organizerId = req.user.id;
    const { eventId } = req.params;
    const { name, description, price, quantityTotal, saleStart, saleEnd, maxPerOrder, isActive, tier } = req.body;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (event.organizerId.toString() !== organizerId) return res.status(403).json({ message: 'Not authorized' });

    if (!name || !price) return res.status(400).json({ message: 'Name and price are required' });

    const tt = await TicketType.create({
      eventId,
      name: String(name).trim(),
      tier: normalizeTier(tier),
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
    if (payload.tier !== undefined) tt.tier = normalizeTier(payload.tier);

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
// payload:
// - General admission: { items: [{ ticketTypeId, quantity }], currency }
// - Reserved seating: { seatHoldId, currency }
exports.purchaseTickets = async (req, res) => {
  try {
    const buyerId = req.user.id;
    const { eventId } = req.params;
    const { items, currency, seatHoldId } = req.body;

    // Reserved seating flow (seat hold)
    if (seatHoldId) {
      const hold = await SeatHold.findById(seatHoldId).lean();
      if (!hold) return res.status(400).json({ message: 'Seat hold expired or not found' });
      if (hold.eventId.toString() !== eventId) return res.status(400).json({ message: 'Seat hold does not belong to this event' });
      if (hold.buyerId.toString() !== buyerId) return res.status(403).json({ message: 'Not authorized for this hold' });
      if (new Date(hold.expiresAt).getTime() <= Date.now()) {
        return res.status(400).json({ message: 'Seat hold expired' });
      }

      const event = await Event.findById(eventId).lean();
      if (!event) return res.status(404).json({ message: 'Event not found' });
      if (event.seatingMode !== 'reserved') {
        return res.status(400).json({ message: 'This event does not use reserved seating' });
      }

      const seatIds = (hold.seatIds || []).map(sid => sid.toString());
      if (!seatIds.length) return res.status(400).json({ message: 'Seat hold has no seats' });

      const now = new Date();

      const conflictAssign = await SeatAssignment.findOne({ eventId, seatId: { $in: seatIds } }).lean();
      if (conflictAssign) return res.status(409).json({ message: 'One or more seats were just sold. Please refresh and try again.' });

      const conflictHold = await SeatHold.findOne({
        _id: { $ne: hold._id },
        eventId,
        expiresAt: { $gt: now },
        seatIds: { $in: seatIds }
      }).lean();
      if (conflictHold) return res.status(409).json({ message: 'One or more seats are currently held by another user' });

      const seats = await Seat.find({ eventId, _id: { $in: seatIds }, isActive: true }).lean();
      if (seats.length !== seatIds.length) {
        return res.status(400).json({ message: 'One or more seats are invalid' });
      }

      // Group seats by tier/category
      const byTier = new Map();
      seats.forEach(s => {
        const tier = normalizeTier(s.category);
        if (!byTier.has(tier)) byTier.set(tier, []);
        byTier.get(tier).push(s);
      });

      const updates = [];
      const orderItems = [];
      const ticketTypeByTier = new Map();
      let total = 0;

      // Reserve ticket types for each tier
      for (const [tier, tierSeats] of byTier.entries()) {
        const qty = tierSeats.length;

        const tt = await TicketType.findOneAndUpdate(
          {
            eventId,
            tier,
            isActive: true,
            $expr: { $lte: [{ $add: ['$quantitySold', qty] }, '$quantityTotal'] }
          },
          { $inc: { quantitySold: qty } },
          { new: true, sort: { price: 1 } }
        );

        if (!tt) {
          // rollback
          for (const u of updates) {
            await TicketType.findByIdAndUpdate(u._id, { $inc: { quantitySold: -u.quantity } });
          }
          return res.status(400).json({ message: `Unable to reserve tickets for tier ${tier}: sold out or not available` });
        }

        updates.push({ _id: tt._id, quantity: qty });
        ticketTypeByTier.set(tier, tt);
        orderItems.push({ ticketTypeId: tt._id, quantity: qty, unitPriceMinor: Math.round(tt.price * 100) });
        total += Math.round(tt.price * 100) * qty;
      }

      const buyer = await User.findById(buyerId).lean();
      const order = await Order.create({ buyerId, eventId, items: orderItems, total, currency: currency || 'USD', status: 'pending' });

      const createdTickets = [];
      const createdAssignments = [];

      try {
        // Create one ticket per seat
        for (const seat of seats) {
          const tier = normalizeTier(seat.category);
          const tt = ticketTypeByTier.get(tier);
          if (!tt) throw new Error('Ticket type mapping missing');

          const code = `T-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
          const attendee = buyer ? { name: buyer.name, email: buyer.email } : undefined;

          const t = await Ticket.create({
            eventId,
            orderId: order._id,
            ticketTypeId: tt._id,
            ticketCode: code,
            attendee,
            seatId: seat._id,
            seatLabel: {
              section: seat.label?.section || '',
              row: seat.label?.row || '',
              number: seat.label?.number || '',
              category: tier
            }
          });

          await attachQrToTicket(t, event);

          const assignment = await SeatAssignment.create({
            eventId,
            seatId: seat._id,
            ticketId: t._id,
            orderId: order._id,
            buyerId,
            ticketTypeId: tt._id
          });

          createdTickets.push(t);
          createdAssignments.push(assignment);
        }

        // Hold is no longer needed after successful ticket issuance
        await SeatHold.deleteOne({ _id: hold._id });
      } catch (err) {
        // Best-effort rollback
        try {
          if (createdAssignments.length) {
            await SeatAssignment.deleteMany({ _id: { $in: createdAssignments.map(a => a._id) } });
          }
          if (createdTickets.length) {
            await Ticket.deleteMany({ _id: { $in: createdTickets.map(t => t._id) } });
          }
          await Order.deleteOne({ _id: order._id });
          for (const u of updates) {
            await TicketType.findByIdAndUpdate(u._id, { $inc: { quantitySold: -u.quantity } });
          }
        } catch (rollbackErr) {
          console.error('purchaseTickets reserved rollback error:', rollbackErr);
        }

        // Duplicate key implies a race on seat assignment
        if (err && err.code === 11000) {
          return res.status(409).json({ message: 'One or more seats were just sold. Please refresh and try again.' });
        }
        console.error('purchaseTickets reserved error:', err);
        return res.status(500).json({ message: 'Server error' });
      }

      // Email confirmation (reuses existing structure; include seat label)
      let emailSent = false;
      let emailError = null;
      try {
        if (buyer && buyer.email) {
          const seatSummary = createdTickets
            .map(t => {
              const lbl = [t.seatLabel?.section, t.seatLabel?.row, t.seatLabel?.number].filter(Boolean).join('-');
              const tier = t.seatLabel?.category || '';
              return `- ${lbl || 'Seat'}${tier ? ` (${tier})` : ''}`;
            })
            .join('\n');

          const eventTitle = event ? event.title : 'your event';
          const startAt = event?.startAt ? new Date(event.startAt).toLocaleString() : null;

          const textBody = [
            `Hi ${buyer.name || 'there'},`,
            '',
            `Your reserved seats for ${eventTitle} are confirmed.`,
            startAt ? `Event start: ${startAt}` : null,
            '',
            `Order ID: ${order._id.toString()}`,
            seatSummary ? 'Seats:\n' + seatSummary : null,
            'Each ticket has a QR code attached. You can also view them in your profile.'
          ].filter(Boolean).join('\n');

          const attachments = [];
          const ticketCardsHtml = createdTickets.map(t => {
            const lbl = [t.seatLabel?.section, t.seatLabel?.row, t.seatLabel?.number].filter(Boolean).join('-');
            const tier = t.seatLabel?.category || '';
            let imgMarkup = '';
            if (t.qrImage && t.qrImage.startsWith('data:image')) {
              const base64 = t.qrImage.split(',')[1];
              const cid = `qr-${t._id}`;
              attachments.push({
                filename: `${t.ticketCode}.png`,
                content: Buffer.from(base64, 'base64'),
                cid
              });
              imgMarkup = `<img src="cid:${cid}" alt="QR for ${t.ticketCode}" style="margin-top:10px;width:180px;height:180px;object-fit:contain;border-radius:10px;" />`;
            }
            return `
              <div style="padding:12px;border-radius:12px;border:1px solid #1f2937;background:#0b0b0f;color:#e5e7eb;">
                <div style="font-weight:600;font-size:14px;">Reserved Seat</div>
                <div style="font-size:12px;color:#9ca3af;">Seat: ${lbl || 'N/A'}${tier ? ` • ${tier}` : ''}</div>
                <div style="font-size:12px;color:#9ca3af;">Code: ${t.ticketCode}</div>
                ${imgMarkup}
              </div>
            `;
          }).join('');

          const htmlBody = `
            <div style="font-family:'Inter',Arial,sans-serif;background:#05060a;padding:20px;color:#e5e7eb;">
              <h2 style="margin:0 0 6px 0;color:#c084fc;">Your seats are confirmed</h2>
              <p style="margin:0 0 8px 0;color:#cbd5e1;">${eventTitle}${startAt ? ` • ${startAt}` : ''}</p>
              <p style="margin:0 0 12px 0;color:#94a3b8;">Order ID: ${order._id.toString()}</p>
              <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;">${ticketCardsHtml}</div>
              <p style="margin-top:12px;color:#94a3b8;">You can also open your EventDesk profile to access these codes at any time.</p>
            </div>
          `;

          await sendEmail(buyer.email, `Your seats for ${eventTitle}`, { text: textBody, html: htmlBody, attachments });
          emailSent = true;
        }
      } catch (err) {
        console.error('purchaseTickets reserved email error:', err);
        emailError = 'Confirmation email could not be sent';
      }

      return res.status(201).json({
        message: emailSent ? 'Order created. Check your email for confirmation.' : 'Order created. Email confirmation pending.',
        order,
        tickets: createdTickets,
        emailSent,
        emailError
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) return res.status(400).json({ message: 'No items provided' });

    const event = await Event.findById(eventId).lean();
    if (!event) return res.status(404).json({ message: 'Event not found' });

    // basic validation
    const updates = [];
    const orderItems = [];
    const ticketTypeMeta = [];
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
      ticketTypeMeta.push({ id: tt._id.toString(), name: tt.name, price: tt.price });
      total += Math.round(tt.price * 100) * it.quantity;
    }

    const buyer = await User.findById(buyerId).lean();

    // create order (status pending) - payment integration would update status to paid
    const order = await Order.create({ buyerId, eventId, items: orderItems, total, currency: currency || 'USD', status: 'pending' });

    // Generate ticket records for each item
    const createdTickets = [];
    for (const it of orderItems) {
      for (let i = 0; i < it.quantity; i++) {
        const code = `T-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
        const attendee = buyer ? { name: buyer.name, email: buyer.email } : undefined;
        const t = await Ticket.create({ eventId, orderId: order._id, ticketTypeId: it.ticketTypeId, ticketCode: code, attendee });
        await attachQrToTicket(t, event);
        createdTickets.push(t);
      }
    }

    // Send confirmation email (non-blocking for order success)
    let emailSent = false;
    let emailError = null;
    try {
      if (buyer && buyer.email) {
        const ticketSummary = orderItems
          .map(it => {
            const meta = ticketTypeMeta.find(m => m.id === it.ticketTypeId.toString());
            const label = meta?.name ? `${meta.name}` : `${it.ticketTypeId}`;
            return `- ${it.quantity} x ${label}`;
          })
          .join('\n');

        const eventTitle = event ? event.title : 'your event';
        const startAt = event?.startAt ? new Date(event.startAt).toLocaleString() : null;

        const textBody = [
          `Hi ${buyer.name || 'there'},`,
          '',
          `Your tickets for ${eventTitle} are confirmed.`,
          startAt ? `Event start: ${startAt}` : null,
          '',
          'Order details:',
          `Order ID: ${order._id.toString()}`,
          ticketSummary ? 'Items:\n' + ticketSummary : null,
          'Each ticket has a QR code attached. You can also view them in your profile.',
        ].filter(Boolean).join('\n');

        const attachments = [];
        const ticketCardsHtml = createdTickets.map(t => {
          const label = ticketTypeMeta.find(m => m.id === t.ticketTypeId.toString())?.name || 'Ticket';
          let imgMarkup = '';
          if (t.qrImage && t.qrImage.startsWith('data:image')) {
            const base64 = t.qrImage.split(',')[1];
            const cid = `qr-${t._id}`;
            attachments.push({
              filename: `${t.ticketCode}.png`,
              content: Buffer.from(base64, 'base64'),
              cid
            });
            imgMarkup = `<img src="cid:${cid}" alt="QR for ${t.ticketCode}" style="margin-top:10px;width:180px;height:180px;object-fit:contain;border-radius:10px;" />`;
          }
          return `
            <div style="padding:12px;border-radius:12px;border:1px solid #1f2937;background:#0b0b0f;color:#e5e7eb;">
              <div style="font-weight:600;font-size:14px;">${label}</div>
              <div style="font-size:12px;color:#9ca3af;">Code: ${t.ticketCode}</div>
              ${imgMarkup}
            </div>
          `;
        }).join('');

        const htmlBody = `
          <div style="font-family:'Inter',Arial,sans-serif;background:#05060a;padding:20px;color:#e5e7eb;">
            <h2 style="margin:0 0 6px 0;color:#c084fc;">Your tickets are confirmed</h2>
            <p style="margin:0 0 8px 0;color:#cbd5e1;">${eventTitle}${startAt ? ` • ${startAt}` : ''}</p>
            <p style="margin:0 0 12px 0;color:#94a3b8;">Order ID: ${order._id.toString()}</p>
            ${ticketSummary ? `<p style="margin:0 0 12px 0;white-space:pre-line;color:#cbd5e1;">${ticketSummary}</p>` : ''}
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;">${ticketCardsHtml}</div>
            <p style="margin-top:12px;color:#94a3b8;">You can also open your EventDesk profile to access these codes at any time.</p>
          </div>
        `;

        await sendEmail(buyer.email, `Your tickets for ${eventTitle}`, { text: textBody, html: htmlBody, attachments });
        emailSent = true;
      }
    } catch (err) {
      console.error('purchaseTickets email error:', err);
      emailError = 'Confirmation email could not be sent';
    }

    res.status(201).json({
      message: emailSent ? 'Order created. Check your email for confirmation.' : 'Order created. Email confirmation pending.',
      order,
      tickets: createdTickets,
      emailSent,
      emailError
    });
  } catch (err) {
    console.error('purchaseTickets error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Attendee: list own tickets and counts
exports.getMyTickets = async (req, res) => {
  try {
    const userId = req.user.id;
    const orders = await Order.find({ buyerId: userId }).select('_id eventId createdAt').lean();
    if (!orders.length) return res.json({ tickets: [], counts: { tickets: 0, events: 0 } });

    const orderIds = orders.map(o => o._id);
    const eventIds = [...new Set(orders.map(o => o.eventId.toString()))];

    const tickets = await Ticket.find({ orderId: { $in: orderIds } })
      .populate('eventId', 'title startAt endAt venue')
      .populate('ticketTypeId', 'name price')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      tickets,
      counts: { tickets: tickets.length, events: eventIds.length }
    });
  } catch (err) {
    console.error('getMyTickets error:', err);
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

    // Organizer must own the event to view attendees
    if (!userId || event.organizerId.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to view attendees for this event' });
    }

    const tickets = await Ticket.find({ eventId })
      .populate('ticketTypeId', 'name price')
      .sort({ createdAt: -1 });

    return res.json({ tickets });
  } catch (err) {
    console.error('getTicketsForEvent error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Organizer: scan/verify a ticket QR payload
exports.scanTicket = async (req, res) => {
  try {
    const { qr } = req.body || {};
    if (!qr) return res.status(400).json({ message: 'QR payload is required' });

    const token = extractQrToken(qr);
    let decoded;
    try {
      decoded = jwt.verify(token, qrSecret);
    } catch (err) {
      return res.status(400).json({ message: 'Invalid or expired QR code' });
    }

    const ticket = await Ticket.findById(decoded.tid)
      .populate('eventId', 'title startAt endAt venue organizerId checkInCodeHash')
      .populate('ticketTypeId', 'name price')
      .populate('orderId', 'createdAt buyerId');

    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    if (!ticket.eventId || ticket.eventId.organizerId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized for this event' });
    }

    // If already checked in, treat as used
    if (ticket.status === 'checked_in') {
      return res.status(400).json({ message: 'Ticket already checked in' });
    }

    // Check-in and revoke QR
    ticket.status = 'checked_in';
    ticket.checkedInAt = new Date();
    ticket.checkedInBy = req.user.id;
    ticket.qrPayload = null;
    ticket.qrRevokedAt = new Date();
    await ticket.save();

    return res.json({
      ticket: {
        id: ticket._id,
        code: ticket.ticketCode,
        status: ticket.status,
        createdAt: ticket.createdAt,
        checkedInAt: ticket.checkedInAt,
        attendee: ticket.attendee,
        event: ticket.eventId,
        ticketType: ticket.ticketTypeId,
        orderId: ticket.orderId?._id,
      }
    });
  } catch (err) {
    console.error('scanTicket error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Public: verify a per-event check-in code and issue a short-lived session token
exports.verifyCheckInCodePublic = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { code } = req.body || {};

    if (!code) return res.status(400).json({ message: 'Code is required' });

    const event = await Event.findById(eventId).lean();
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (!event.checkInCodeHash) return res.status(400).json({ message: 'Check-in code not set for this event' });
    if (event.status === 'cancelled') return res.status(400).json({ message: 'Event is cancelled' });

    const bcrypt = require('bcryptjs');
    const ok = await bcrypt.compare(String(code).trim(), event.checkInCodeHash);
    if (!ok) return res.status(401).json({ message: 'Invalid code' });

    const sessionToken = jwt.sign(
      { scope: 'checkin', eventId: event._id.toString() },
      qrSecret,
      { expiresIn: '30m' }
    );

    return res.json({
      token: sessionToken,
      event: {
        id: event._id,
        title: event.title,
        startAt: event.startAt,
        venue: event.venue,
      },
    });
  } catch (err) {
    console.error('verifyCheckInCodePublic error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Public: verify code without needing eventId in URL (find event by code)
exports.verifyCheckInCodePublicAny = async (req, res) => {
  try {
    const { code } = req.body || {};
    if (!code) return res.status(400).json({ message: 'Code is required' });

    const bcrypt = require('bcryptjs');
    const events = await Event.find({ status: { $ne: 'cancelled' }, checkInCodeHash: { $exists: true, $ne: null } }).lean();
    let matched = null;
    for (const evt of events) {
      if (!evt.checkInCodeHash) continue;
      const ok = await bcrypt.compare(String(code).trim(), evt.checkInCodeHash);
      if (ok) {
        matched = evt;
        break;
      }
    }

    if (!matched) return res.status(401).json({ message: 'Invalid code' });

    const sessionToken = jwt.sign(
      { scope: 'checkin', eventId: matched._id.toString() },
      qrSecret,
      { expiresIn: '30m' }
    );

    return res.json({
      token: sessionToken,
      event: {
        id: matched._id,
        title: matched.title,
        startAt: matched.startAt,
        venue: matched.venue,
      },
    });
  } catch (err) {
    console.error('verifyCheckInCodePublicAny error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Public: scan QR with a valid check-in session token
exports.scanTicketWithCode = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { qr } = req.body || {};
    const bearer = req.headers.authorization?.split(' ')[1];
    const token = bearer || req.body?.token;

    if (!token) return res.status(401).json({ message: 'Check-in session token required' });

    let session;
    try {
      session = jwt.verify(token, qrSecret);
    } catch (err) {
      return res.status(401).json({ message: 'Invalid or expired session token' });
    }

    if (session.scope !== 'checkin' || session.eventId !== eventId) {
      return res.status(403).json({ message: 'Session not valid for this event' });
    }

    if (!qr) return res.status(400).json({ message: 'QR payload is required' });

    const qrToken = extractQrToken(qr);
    let decoded;
    try {
      decoded = jwt.verify(qrToken, qrSecret);
    } catch (err) {
      return res.status(400).json({ message: 'Invalid or expired QR code' });
    }

    if (decoded.eid !== eventId) {
      return res.status(400).json({ message: 'Ticket does not belong to this event' });
    }

    const ticket = await Ticket.findById(decoded.tid)
      .populate('eventId', 'title startAt endAt venue organizerId')
      .populate('ticketTypeId', 'name price')
      .populate('orderId', 'createdAt buyerId');

    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    if (!ticket.eventId) return res.status(400).json({ message: 'Ticket missing event' });
    if (ticket.eventId._id.toString() !== eventId) {
      return res.status(400).json({ message: 'Ticket does not match this event' });
    }

    if (!ticket.qrPayload || ticket.qrPayload !== qrToken) {
      return res.status(400).json({ message: 'This QR has been revoked' });
    }

    if (ticket.status === 'checked_in') {
      return res.status(400).json({ message: 'Ticket already checked in' });
    }

    ticket.status = 'checked_in';
    ticket.checkedInAt = new Date();
    ticket.checkedInBy = null; // public check-in; not tied to a user account
    ticket.qrPayload = null;   // revoke further scans
    ticket.qrRevokedAt = new Date();
    await ticket.save();

    return res.json({
      ticket: {
        id: ticket._id,
        code: ticket.ticketCode,
        status: ticket.status,
        checkedInAt: ticket.checkedInAt,
        attendee: ticket.attendee,
        event: ticket.eventId,
        ticketType: ticket.ticketTypeId,
        orderId: ticket.orderId?._id,
      },
      alreadyChecked: false,
    });
  } catch (err) {
    console.error('scanTicketWithCode error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Public verification: used when a phone camera (e.g., Google Lens) opens the QR URL
exports.verifyTicketPublic = async (req, res) => {
  try {
    const token = extractQrToken(req.query.qr);
    if (!token) return res.status(400).json({ message: 'QR payload is required' });

    let decoded;
    try {
      decoded = jwt.verify(token, qrSecret);
    } catch (err) {
      return res.status(400).json({ message: 'Invalid or expired QR code' });
    }

    const ticket = await Ticket.findById(decoded.tid)
      .populate('eventId', 'title startAt endAt venue organizerId')
      .populate('ticketTypeId', 'name price')
      .populate('orderId', 'createdAt buyerId');

    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    return res.json({
      ticket: {
        id: ticket._id,
        code: ticket.ticketCode,
        status: ticket.status,
        attendee: ticket.attendee,
        event: ticket.eventId,
        ticketType: ticket.ticketTypeId,
        orderId: ticket.orderId?._id,
      }
    });
  } catch (err) {
    console.error('verifyTicketPublic error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

const createBooking = async (req, res) => {
  try {
    const { name, email, eventName } = req.body;

    const newBooking = await Booking.create({
      name,
      email,
      eventName,
    });

    // Send confirmation email
    await sendEmail(
      email,
      "Event Booking Confirmation",
      `Hi ${name},
      
Your ticket for ${eventName} has been successfully booked!

Thank you for booking with us.`
    );

    res.status(201).json(newBooking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Organizer: list all attendees across own events
exports.getOrganizerAttendees = async (req, res) => {
  try {
    const organizerId = req.user.id;
    const events = await Event.find({ organizerId }).select('_id title startAt').lean();
    if (!events.length) return res.json({ tickets: [] });

    const eventIds = events.map(e => e._id);
    const tickets = await Ticket.find({ eventId: { $in: eventIds } })
      .populate('eventId', 'title startAt')
      .populate('ticketTypeId', 'name')
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ tickets });
  } catch (err) {
    console.error('getOrganizerAttendees error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};