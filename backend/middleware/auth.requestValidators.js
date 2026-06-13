const { isEmailValid, passwordStrength, isNameValid } = require('../utils/validators');

function validateRegisterRequest(req) {
  let { name, email, password, role } = req.body || {};
  const errors = [];

  if (!name) errors.push('Name is required');
  if (!email) errors.push('Email is required');
  if (!password) errors.push('Password is required');

  name = String(name || '').trim();
  email = String(email || '').trim().toLowerCase();

  if (name && !isNameValid(name)) errors.push('Invalid name: use letters and spaces only');
  if (email && !isEmailValid(email)) errors.push('Invalid email format');

  const pwdCheck = passwordStrength(String(password || ''));
  if (password && !pwdCheck.valid) errors.push(...pwdCheck.errors);

  if (role && !['attendee', 'organizer'].includes(role)) {
    errors.push('Invalid role');
  }

  return {
    valid: errors.length === 0,
    message: errors.length ? 'Register validation failed' : undefined,
    errors,
    sanitizedBody: {
      ...req.body,
      name,
      email
    }
  };
}

function validateLoginRequest(req) {
  let { email, password } = req.body || {};
  const errors = [];

  if (!email) errors.push('Email is required');
  if (!password) errors.push('Password is required');

  email = String(email || '').trim().toLowerCase();

  if (email && !isEmailValid(email)) {
    errors.push('Invalid email format');
  }

  return {
    valid: errors.length === 0,
    message: errors.length ? 'Login validation failed' : undefined,
    errors,
    sanitizedBody: {
      ...req.body,
      email
    }
  };
}

function validateForgotPasswordRequest(req) {
  const { email } = req.body || {};
  const normalizedEmail = String(email || '').trim().toLowerCase();

  return {
    valid: Boolean(email) && isEmailValid(normalizedEmail),
    message: 'Invalid email',
    errors: Boolean(email) && isEmailValid(normalizedEmail) ? [] : ['Invalid email'],
    sanitizedBody: {
      ...req.body,
      email: normalizedEmail
    }
  };
}

function validateResetPasswordRequest(req) {
  const { password, token, code, email } = req.body || {};
  const errors = [];

  if (!password) errors.push('Password is required');

  const pwdCheck = passwordStrength(String(password || ''));
  if (password && !pwdCheck.valid) errors.push(...pwdCheck.errors);

  const hasTokenFlow = Boolean(token) || (Boolean(code) && Boolean(email));
  if (!hasTokenFlow) {
    errors.push('Reset token or reset code and email are required');
  }

  if (email) {
    const normalizedEmail = String(email).trim().toLowerCase();
    if (!isEmailValid(normalizedEmail)) errors.push('Invalid email format');
  }

  return {
    valid: errors.length === 0,
    message: errors.length ? 'Reset password validation failed' : undefined,
    errors,
    sanitizedBody: {
      ...req.body,
      email: email ? String(email).trim().toLowerCase() : email
    }
  };
}

module.exports = {
  validateRegisterRequest,
  validateLoginRequest,
  validateForgotPasswordRequest,
  validateResetPasswordRequest
};