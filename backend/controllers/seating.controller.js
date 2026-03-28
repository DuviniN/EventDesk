const mongoose = require('mongoose');
const Event = require('../models/Event');
const VenueLayout = require('../models/VenueLayout');
const Seat = require('../models/Seat');
const SeatHold = require('../models/SeatHold');
const SeatAssignment = require('../models/SeatAssignment');

const normalizeTier = (value) => {
  if (!value) return 'regular';
  return String(value).trim().toLowerCase().replace(/\s+/g, '-');
};

const formatSeatLabel = (seat) => {
  const section = seat?.label?.section || '';
  const row = seat?.label?.row || '';
  const number = seat?.label?.number || '';
  return [section, row, number].filter(Boolean).join('-');
};

exports.getLayout = async (req, res) => {
  try {
    const { eventId } = req.params;
    const layout = await VenueLayout.findOne({ eventId }).lean();
    return res.json({ layout: layout || null });
  } catch (err) {
    console.error('getLayout error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.upsertLayout = async (req, res) => {
  try {
    const organizerId = req.user.id;
    const { eventId } = req.params;
    const { assetType, assetDataUrl, publish } = req.body || {};

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (event.organizerId.toString() !== organizerId) return res.status(403).json({ message: 'Not authorized' });
    if (event.status === 'cancelled') return res.status(400).json({ message: 'Cancelled events cannot be updated' });

    const type = assetType === 'svg' ? 'svg' : 'image';
    const dataUrl = typeof assetDataUrl === 'string' ? assetDataUrl : '';

    let layout = await VenueLayout.findOne({ eventId });
    if (!layout) {
      layout = await VenueLayout.create({
        eventId,
        assetType: type,
        assetDataUrl: dataUrl,
        version: 1,
        createdBy: organizerId,
        updatedBy: organizerId,
        publishedAt: publish ? new Date() : undefined
      });
    } else {
      layout.assetType = type;
      if (assetDataUrl !== undefined) layout.assetDataUrl = dataUrl;
      layout.version = (layout.version || 1) + 1;
      layout.updatedBy = organizerId;
      if (publish) layout.publishedAt = new Date();
      await layout.save();
    }

    // If reserved seating is being used, ensure event flags are set.
    event.isIndoor = true;
    event.seatingMode = 'reserved';
    await event.save();

    return res.json({ message: 'Layout saved', layout });
  } catch (err) {
    console.error('upsertLayout error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.listSeats = async (req, res) => {
  try {
    const { eventId } = req.params;
    const now = new Date();
    const userId = req.user?.id ? String(req.user.id) : null;

    const seats = await Seat.find({ eventId, isActive: true }).lean();

    if (!seats.length) {
      return res.json({ seats: [], holds: [], assignments: [] });
    }

    const seatIds = seats.map(s => s._id);

    const [assignments, holds] = await Promise.all([
      SeatAssignment.find({ eventId, seatId: { $in: seatIds } }).select('seatId').lean(),
      SeatHold.find({ eventId, expiresAt: { $gt: now }, seatIds: { $in: seatIds } })
        .select('seatIds buyerId expiresAt')
        .lean()
    ]);

    const assignedSet = new Set(assignments.map(a => a.seatId.toString()));
    const holdBySeat = new Map();
    holds.forEach(h => {
      (h.seatIds || []).forEach(sid => {
        const key = sid.toString();
        // Keep first hold encountered; any conflicts are treated as held.
        if (!holdBySeat.has(key)) {
          holdBySeat.set(key, {
            holdId: h._id.toString(),
            buyerId: h.buyerId?.toString(),
            expiresAt: h.expiresAt
          });
        }
      });
    });

    const decorated = seats.map(s => {
      const id = s._id.toString();
      const hold = holdBySeat.get(id);
      const isAssigned = assignedSet.has(id);
      const isHeld = Boolean(hold);
      const heldByMe = userId && hold && String(hold.buyerId) === userId;
      return {
        ...s,
        category: normalizeTier(s.category),
        displayLabel: formatSeatLabel(s),
        status: isAssigned ? 'assigned' : isHeld ? 'held' : 'available',
        hold: hold ? { id: hold.holdId, expiresAt: hold.expiresAt, mine: heldByMe } : null
      };
    });

    return res.json({ seats: decorated });
  } catch (err) {
    console.error('listSeats error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.replaceSeats = async (req, res) => {
  try {
    const organizerId = req.user.id;
    const { eventId } = req.params;
    const { seats } = req.body || {};

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (event.organizerId.toString() !== organizerId) return res.status(403).json({ message: 'Not authorized' });
    if (event.status === 'cancelled') {
      return res.status(400).json({ message: 'Cancelled events cannot be updated' });
    }

    const layout = await VenueLayout.findOne({ eventId });
    if (!layout) return res.status(400).json({ message: 'Create a layout before adding seats' });

    const assignedCount = await SeatAssignment.countDocuments({ eventId });
    if (assignedCount > 0) {
      return res.status(400).json({ message: 'Seating cannot be modified after seats have been sold' });
    }

    if (!Array.isArray(seats)) return res.status(400).json({ message: 'Seats array is required' });

    const cleaned = seats
      .filter(s => s && typeof s.x === 'number' && typeof s.y === 'number')
      .map(s => {
        const sectionRaw = s.section ?? s.label?.section;
        const rowRaw = s.row ?? s.label?.row;
        const numberRaw = s.number ?? s.label?.number;

        const label = {};
        const section = sectionRaw != null ? String(sectionRaw).trim() : '';
        const row = rowRaw != null ? String(rowRaw).trim() : '';
        const number = numberRaw != null ? String(numberRaw).trim() : '';
        if (section) label.section = section;
        if (row) label.row = row;
        if (number) label.number = number;

        return {
          eventId,
          layoutId: layout._id,
          ...(Object.keys(label).length ? { label } : {}),
          category: normalizeTier(s.category || 'regular'),
          x: Math.max(0, Math.min(1, Number(s.x))),
          y: Math.max(0, Math.min(1, Number(s.y))),
          isActive: s.isActive === false ? false : true
        };
      });

    // Replace in one shot (safe during draft).
    await Seat.deleteMany({ eventId });
    const inserted = cleaned.length ? await Seat.insertMany(cleaned) : [];

    // Ensure event flags are set.
    event.isIndoor = true;
    event.seatingMode = 'reserved';
    await event.save();

    return res.json({ message: 'Seats saved', seats: inserted });
  } catch (err) {
    console.error('replaceSeats error:', err);
    // Handle duplicate label collisions cleanly
    if (err && err.code === 11000) {
      return res.status(400).json({ message: 'Duplicate seat label detected (same section/row/number)' });
    }
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.createHold = async (req, res) => {
  try {
    const buyerId = req.user.id;
    const { eventId } = req.params;
    const { seatIds } = req.body || {};

    if (!Array.isArray(seatIds) || seatIds.length === 0) {
      return res.status(400).json({ message: 'seatIds is required' });
    }
    if (seatIds.length > 10) {
      return res.status(400).json({ message: 'You can hold at most 10 seats per order' });
    }

    const event = await Event.findById(eventId).lean();
    if (!event) return res.status(404).json({ message: 'Event not found' });
    if (event.status !== 'published') {
      // You can relax this, but it prevents holds while organizer is still editing.
      return res.status(400).json({ message: 'Seating selection is available after the event is published' });
    }
    if (event.seatingMode !== 'reserved') {
      return res.status(400).json({ message: 'This event does not use reserved seating' });
    }

    const seatObjectIds = seatIds.map(id => new mongoose.Types.ObjectId(id));

    const seats = await Seat.find({ eventId, _id: { $in: seatObjectIds }, isActive: true }).lean();
    if (seats.length !== seatObjectIds.length) {
      return res.status(400).json({ message: 'One or more seats are invalid' });
    }

    const now = new Date();

    const assigned = await SeatAssignment.findOne({ eventId, seatId: { $in: seatObjectIds } }).lean();
    if (assigned) return res.status(400).json({ message: 'One or more seats are already assigned' });

    const conflictingHold = await SeatHold.findOne({
      eventId,
      expiresAt: { $gt: now },
      seatIds: { $in: seatObjectIds }
    }).lean();

    if (conflictingHold) {
      return res.status(409).json({ message: 'One or more seats are currently held by another user' });
    }

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const hold = await SeatHold.create({ eventId, seatIds: seatObjectIds, buyerId, expiresAt });

    return res.status(201).json({ message: 'Seats held', hold: { id: hold._id, expiresAt: hold.expiresAt } });
  } catch (err) {
    console.error('createHold error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.cancelHold = async (req, res) => {
  try {
    const buyerId = req.user.id;
    const { eventId, holdId } = req.params;

    const hold = await SeatHold.findById(holdId);
    if (!hold) return res.json({ message: 'Hold already expired or cancelled' });
    if (hold.eventId.toString() !== eventId) return res.status(400).json({ message: 'Hold does not belong to this event' });
    if (hold.buyerId.toString() !== buyerId) return res.status(403).json({ message: 'Not authorized' });

    await SeatHold.deleteOne({ _id: holdId });
    return res.json({ message: 'Hold cancelled' });
  } catch (err) {
    console.error('cancelHold error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};
