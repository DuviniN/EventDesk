const bcrypt = require("bcryptjs");
const User = require("../models/User");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken
} = require("../utils/jwt");
const { isEmailValid, passwordStrength } = require("../utils/validators");
const crypto = require('crypto');
const RefreshToken = require('../models/RefreshToken');
const sendEmail = require("../utils/sendEmail");

/**
 * REGISTER
 */
exports.register = async (req, res) => {
  try {
    let { name, email, password, role, marketingConsent } = req.body || {};

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Missing required fields: name, email, password' });
    }

    name = String(name).trim();
    const { isNameValid } = require('../utils/validators');
    if (!isNameValid(name)) {
      return res.status(400).json({ message: 'Invalid name: use letters and spaces only (no numbers or symbols)' });
    }

    email = String(email).trim().toLowerCase();
    if (!isEmailValid(email)) return res.status(400).json({ message: 'Invalid email format' });

    const pwdCheck = passwordStrength(String(password));
    if (!pwdCheck.valid) return res.status(400).json({ message: 'Weak password', errors: pwdCheck.errors });

    // Validate role
    if (role && !['attendee', 'organizer'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'Email already exists' });
    }

    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const user = await User.create({
      name,
      email,
      passwordHash,
      role: role || 'attendee',
      marketingConsent
    });

    res.status(201).json({ message: 'User registered successfully', user: { id: user._id, email: user.email, name: user.name, role: user.role, avatarUrl: user.avatarUrl, marketingConsent: user.marketingConsent } });
    console.log(`New user registered: ${email} (${user._id})`);
  } catch (err) {
    console.error('Register error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * LOGIN
 */
exports.login = async (req, res) => {
  try {
    let { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: 'Missing credentials' });

    email = String(email).trim().toLowerCase();
    if (!isEmailValid(email)) return res.status(400).json({ message: 'Invalid email format' });

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // store refresh token on user (simple implementation). Consider separate RefreshToken model in prod.
    user.refreshToken = refreshToken;
    await user.save();

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    // Send access token as httpOnly cookie as a fallback for clients that miss the header
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 // align with ACCESS_TOKEN_EXPIRE
    });

    res.json({
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
        marketingConsent: user.marketingConsent
      }
    });
  } catch (err) {
    console.error('Login error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// return current user (req.user set by auth middleware)
exports.me = async (req, res) => {
  try {
    if (!req.user || !req.user.id) return res.status(401).json({ message: 'Unauthorized' });
    const user = await User.findById(req.user.id).select('-passwordHash -refreshToken');
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json({ user });
  } catch (err) {
    console.error('Me error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Update current user profile (name, marketingConsent, avatarUrl)
exports.updateProfile = async (req, res) => {
  try {
    if (!req.user || !req.user.id) return res.status(401).json({ message: 'Unauthorized' });

    const { name, marketingConsent, avatarUrl } = req.body || {};
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (name !== undefined) {
      const trimmed = String(name).trim();
      const { isNameValid } = require('../utils/validators');
      if (!isNameValid(trimmed)) {
        return res.status(400).json({ message: 'Invalid name: use letters and spaces only (no numbers or symbols)' });
      }
      user.name = trimmed;
    }

    if (marketingConsent !== undefined) {
      user.marketingConsent = !!marketingConsent;
    }

    if (avatarUrl !== undefined) {
      // Accept data URLs or external URLs; basic length guard to prevent huge payloads
      const trimmed = typeof avatarUrl === 'string' ? avatarUrl.trim() : '';
      if (trimmed && trimmed.length > 500000) {
        return res.status(400).json({ message: 'Avatar too large' });
      }
      user.avatarUrl = trimmed || null;
    }

    await user.save();
    const sanitized = user.toObject();
    delete sanitized.passwordHash;
    delete sanitized.refreshToken;

    res.json({ message: 'Profile updated', user: sanitized });
  } catch (err) {
    console.error('Update profile error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Change password for current user (requires oldPassword, newPassword)
exports.changePassword = async (req, res) => {
  try {
    if (!req.user || !req.user.id) return res.status(401).json({ message: 'Unauthorized' });
    const { oldPassword, newPassword } = req.body || {};
    if (!oldPassword || !newPassword) return res.status(400).json({ message: 'Old and new passwords are required' });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(String(oldPassword), user.passwordHash);
    if (!isMatch) return res.status(401).json({ message: 'Old password is incorrect' });

    const pwdCheck = passwordStrength(String(newPassword));
    if (!pwdCheck.valid) return res.status(400).json({ message: 'Weak password', errors: pwdCheck.errors });

    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12;
    user.passwordHash = await bcrypt.hash(String(newPassword), saltRounds);
    await user.save();

    return res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Change password error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Forgot password - generate short code, email it, store hashed with expiry
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email || !isEmailValid(email)) return res.status(400).json({ message: 'Invalid email' });
    const user = await User.findOne({ email: String(email).trim().toLowerCase() });
    if (!user) return res.status(200).json({ message: 'If that email exists, a reset code has been sent' });

    const code = (crypto.randomInt(100000, 999999)).toString();
    const tokenHash = crypto.createHash('sha256').update(code).digest('hex');
    const expires = new Date(Date.now() + 1000 * 60 * 15); // 15 minutes

    user.passwordResetToken = tokenHash;
    user.passwordResetExpires = expires;
    await user.save();

    const textBody = [
      `Hi ${user.name || 'there'},`,
      '',
      'Use the code below to reset your EventDesk password:',
      '',
      `Reset code: ${code}`,
      '',
      'This code expires in 15 minutes. If you did not request this, you can ignore this email.'
    ].join('\n');

    const htmlBody = `
      <div style="font-family:'Inter',Arial,sans-serif;background:#0b0c10;padding:20px;color:#e5e7eb;">
        <h2 style="margin:0 0 8px 0;color:#c084fc;">Reset your password</h2>
        <p style="margin:0 0 6px 0;color:#cbd5e1;">Use this code to reset your password. It expires in 15 minutes.</p>
        <div style="margin:12px 0;padding:12px 16px;background:#111827;border:1px solid #1f2937;border-radius:10px;font-size:20px;font-weight:700;letter-spacing:3px;color:#e5e7eb;">${code}</div>
        <p style="margin:0;color:#94a3b8;">If you did not request this, you can ignore this email.</p>
      </div>
    `;

    await sendEmail(user.email, 'Your EventDesk reset code', { text: textBody, html: htmlBody });

    return res.json({ message: 'If that email exists, a reset code has been sent' });
  } catch (err) {
    console.error('Forgot password error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Reset password
exports.resetPassword = async (req, res) => {
  try {
    const { token, code, email, password } = req.body || {};
    if (!password) return res.status(400).json({ message: 'Missing password' });

    let user = null;

    if (code && email) {
      const hash = crypto.createHash('sha256').update(String(code)).digest('hex');
      user = await User.findOne({ email: String(email).trim().toLowerCase(), passwordResetToken: hash, passwordResetExpires: { $gt: new Date() } });
    } else if (token) {
      const hash = crypto.createHash('sha256').update(token).digest('hex');
      user = await User.findOne({ passwordResetToken: hash, passwordResetExpires: { $gt: new Date() } });
    } else {
      return res.status(400).json({ message: 'Missing reset code or token' });
    }

    if (!user) return res.status(400).json({ message: 'Invalid or expired reset code' });

    const pwdCheck = passwordStrength(String(password));
    if (!pwdCheck.valid) return res.status(400).json({ message: 'Weak password', errors: pwdCheck.errors });

    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12;
    user.passwordHash = await bcrypt.hash(password, saltRounds);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    return res.json({ message: 'Password has been reset' });
  } catch (err) {
    console.error('Reset password error', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * REFRESH TOKEN
 */
exports.refreshToken = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) return res.sendStatus(401);

    const user = await User.findOne({ refreshToken: token });
    if (!user) return res.sendStatus(403);

    // Verify JWT signature and expiry — reject tampered or expired tokens
    let payload;
    try {
      payload = verifyRefreshToken(token);
    } catch (err) {
      // Token is invalid or expired — clear the stored token (token rotation hygiene)
      user.refreshToken = null;
      await user.save();
      return res.sendStatus(403);
    }

    // Ensure payload matches the user we found
    if (!payload || payload.id !== user._id.toString()) {
      user.refreshToken = null;
      await user.save();
      return res.sendStatus(403);
    }

    const accessToken = generateAccessToken(user);
    res.json({ accessToken });
  } catch (err) {
    console.error('Refresh token error', err);
    return res.sendStatus(500);
  }
};

/**
 * LOGOUT
 */
exports.logout = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (token) {
      await User.updateOne(
        { refreshToken: token },
        { $set: { refreshToken: null } }
      );
    }

    res.clearCookie("refreshToken");
    res.json({ message: "Logged out" });
  } catch (err) {
    console.error('Logout error', err);
    return res.sendStatus(500);
  }
};
