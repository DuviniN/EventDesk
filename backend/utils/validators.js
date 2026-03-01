// Simple validators for email, password strength and name

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isEmailValid(email) {
  if (!email || typeof email !== 'string') return false;
  if (email.length > 254) return false;
  return emailRegex.test(email.trim());
}

function passwordStrength(password) {
  const errors = [];
  if (!password || typeof password !== 'string') {
    errors.push('Password is required');
    return { valid: false, errors };
  }
  if (password.length < 8) errors.push('Password must be at least 8 characters');
  if (password.length > 128) errors.push('Password must be at most 128 characters');
  if (!/[a-z]/.test(password)) errors.push('Password must contain a lowercase letter');
  if (!/[A-Z]/.test(password)) errors.push('Password must contain an uppercase letter');
  if (!/[0-9]/.test(password)) errors.push('Password must contain a number');
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>\/?]/.test(password)) errors.push('Password must contain a special character');

  return { valid: errors.length === 0, errors };
}

// Name validator: only letters and spaces allowed (no digits, no symbols)
function isNameValid(name) {
  if (!name || typeof name !== 'string') return false;
  const trimmed = name.trim();
  if (trimmed.length < 2 || trimmed.length > 100) return false;
  // \p{L} matches any kind of letter from any language (unicode), allow spaces
  const nameRegex = /^[\p{L} ]+$/u;
  return nameRegex.test(trimmed);
}

module.exports = { isEmailValid, passwordStrength, isNameValid };
