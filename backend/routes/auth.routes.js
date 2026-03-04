const router = require("express").Router();
const authController = require("../controllers/auth.controller");

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/refresh", authController.refreshToken);
router.post("/logout", authController.logout);

// protected route to get current user
const auth = require('../middleware/auth.middleware');
router.get('/me', auth(), authController.me);
router.put('/me', auth(), authController.updateProfile);
router.put('/me/password', auth(), authController.changePassword);

// password reset flows
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

module.exports = router;
