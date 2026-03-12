const router = require('express').Router();
const analyticsController = require('../controllers/analytics.controller');
const auth = require('../middleware/auth.middleware');

// Organizer-wide overview
router.get('/overview', auth(['organizer']), analyticsController.getOrganizerOverview);

// Per-event analytics
router.get('/events/:eventId', auth(['organizer']), analyticsController.getEventAnalytics);

module.exports = router;
