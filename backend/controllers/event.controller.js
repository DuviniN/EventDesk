const Event = require("../models/Event");

/**
 * CREATE EVENT
 */
exports.createEvent = async (req, res) => {
  try {
    const { title, description, categories, startAt, endAt, venue, capacity } = req.body;
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

    const event = await Event.create({
      organizerId,
      title: String(title).trim(),
      description: description ? String(description).trim() : '',
      categories: categories || [],
      startAt: new Date(startAt),
      endAt: new Date(endAt),
      venue,
      capacity: parseInt(capacity),
      status: 'draft'
    });

    res.status(201).json({
      message: 'Event created successfully',
      event
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

    const events = await Event.find({ organizerId }).sort({ createdAt: -1 });

    res.json({ events });
  } catch (err) {
    console.error('Get organizer events error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * GET SINGLE EVENT
 */
exports.getEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json({ event });
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
    const { title, description, categories, startAt, endAt, venue, capacity, status } = req.body;
    const organizerId = req.user.id;

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user is the organizer
    if (event.organizerId.toString() !== organizerId) {
      return res.status(403).json({ message: 'You are not authorized to update this event' });
    }

    // Only allow draft events to be updated
    if (event.status !== 'draft') {
      return res.status(400).json({ message: 'Only draft events can be updated' });
    }

    if (title) event.title = String(title).trim();
    if (description) event.description = String(description).trim();
    if (categories) event.categories = categories;
    if (startAt) event.startAt = new Date(startAt);
    if (endAt) event.endAt = new Date(endAt);
    if (venue) event.venue = venue;
    if (capacity) event.capacity = parseInt(capacity);
    if (status && ['draft', 'published', 'cancelled'].includes(status)) {
      event.status = status;
    }

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

    if (event.status !== 'draft') {
      return res.status(400).json({ message: 'Only draft events can be published' });
    }

    event.status = 'published';
    await event.save();

    res.json({
      message: 'Event published successfully',
      event
    });
  } catch (err) {
    console.error('Publish event error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

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

    // Only allow draft events to be deleted
    if (event.status !== 'draft') {
      return res.status(400).json({ message: 'Only draft events can be deleted' });
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
    const events = await Event.find({ status: 'published' }).sort({ startAt: 1 });
    res.json({ events });
  } catch (err) {
    console.error('Get published events error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};
