const router = require("express").Router();
const authController = require("../controllers/auth.controller");
const validate = require("../middleware/validate.middleware");
const {
	validateRegisterRequest,
	validateLoginRequest,
	validateForgotPasswordRequest,
	validateResetPasswordRequest
} = require("../middleware/auth.requestValidators");

router.post("/register", validate(validateRegisterRequest), authController.register);
router.post("/login", validate(validateLoginRequest), authController.login);
router.post("/refresh", authController.refreshToken);
router.post("/logout", authController.logout);

// protected route to get current user
const auth = require('../middleware/auth.middleware');
router.get('/me', auth(), authController.me);
router.put('/me', auth(), authController.updateProfile);
router.put('/me/password', auth(), authController.changePassword);

// password reset flows
router.post('/forgot-password', validate(validateForgotPasswordRequest), authController.forgotPassword);
router.post('/reset-password', validate(validateResetPasswordRequest), authController.resetPassword);

module.exports = router;
