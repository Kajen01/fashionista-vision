import User from '../models/userModel.js';
import generateToken from '../utils/generateToken.js';
import { addToBlacklist } from "../middleware/tokenBlacklist.js";
import crypto from 'crypto';
import { sendVerificationEmail } from '../utils/sendVerificationEmail.js';

function isVerificationRequired() {
  return process.env.REQUIRE_EMAIL_VERIFICATION === 'true';
}

function normalizeEmail(email = '') {
  return email.trim().toLowerCase();
}

function buildAuthResponse(user, extras = {}) {
  return {
    token: generateToken(user),
    user: user.toSafeObject ? user.toSafeObject() : user,
    ...extras,
  };
}

function createVerificationToken() {
  return crypto.randomBytes(24).toString('hex');
}

async function issueVerification(user) {
  const token = createVerificationToken();
  user.verificationToken = token;
  user.verificationTokenExpires = new Date(Date.now() + (24 * 60 * 60 * 1000));

  const delivery = await sendVerificationEmail({ user, token });
  return delivery;
}

// REGISTER
export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const trimmedName = (name || '').trim();
    const normalizedEmail = normalizeEmail(email);
    const trimmedPassword = (password || '').trim();

    if (!trimmedName || !normalizedEmail || !trimmedPassword) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    if (trimmedPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    const userExists = await User.findOne({ email: normalizedEmail });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    const user = new User({
      name: trimmedName,
      email: normalizedEmail,
      password: trimmedPassword,
      role: 'user',
      isAdmin: false,
      isVerified: !isVerificationRequired(),
    });

    let verificationPreview = null;

    if (!user.isVerified) {
      verificationPreview = await issueVerification(user);
    }

    await user.save();

    if (!user.isVerified) {
      return res.status(201).json({
        message: 'Registration successful. Please verify your email before logging in.',
        verificationRequired: true,
        verificationPreviewUrl: verificationPreview?.verificationUrl || null,
      });
    }

    res.status(201).json(buildAuthResponse(user, {
      message: 'Registration successful.',
      verificationRequired: false,
    }));

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// LOGIN
export const loginUser = async (req, res) => {
  try {
    const { email, password, loginAs } = req.body;
    const normalizedEmail = normalizeEmail(email);

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) return res.status(400).json({ message: "Invalid email or password" });

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(400).json({ message: "Invalid email or password" });

    if (isVerificationRequired() && !user.isVerified) {
      return res.status(403).json({
        message: 'Please verify your email before logging in.',
        code: 'EMAIL_NOT_VERIFIED',
      });
    }

    const resolvedRole = user.role || (user.isAdmin ? 'admin' : 'user');

    if (loginAs === 'admin' && resolvedRole !== 'admin') {
      return res.status(403).json({
        message: 'This account is not authorized for admin login.',
      });
    }

    if (loginAs === 'user' && resolvedRole !== 'user') {
      return res.status(403).json({
        message: 'This account is not authorized for user login.',
      });
    }

    user.lastLoginAt = new Date();
    await user.save();

    res.json(buildAuthResponse(user, { message: 'Login successful.' }));

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// LOGOUT
export const logoutUser = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (token) addToBlacklist(token);

    res.json({ message: "User logged out successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getCurrentUser = async (req, res) => {
  res.json({
    user: req.user.toSafeObject ? req.user.toSafeObject() : req.user,
  });
};

export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: 'Verification token is required.' });
    }

    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Verification token is invalid or has expired.' });
    }

    user.isVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpires = null;

    await user.save();

    res.json({
      message: 'Email verified successfully. You can now log in.',
      user: user.toSafeObject(),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const resendVerification = async (req, res) => {
  try {
    const emailFromBody = normalizeEmail(req.body.email || '');
    const emailFromUser = req.user?.email ? normalizeEmail(req.user.email) : '';
    const lookupEmail = emailFromBody || emailFromUser;

    if (!lookupEmail) {
      return res.status(400).json({ message: 'Email is required to resend verification.' });
    }

    const user = await User.findOne({ email: lookupEmail });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: 'Email is already verified.' });
    }

    const delivery = await issueVerification(user);
    await user.save();

    res.json({
      message: 'Verification email sent.',
      verificationPreviewUrl: delivery?.verificationUrl || null,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    const nextName = (name || '').trim();
    const nextEmail = normalizeEmail(email || req.user.email);

    if (!nextName) {
      return res.status(400).json({ message: 'Name is required.' });
    }

    const duplicate = await User.findOne({
      email: nextEmail,
      _id: { $ne: req.user._id },
    });

    if (duplicate) {
      return res.status(400).json({ message: 'Email is already in use.' });
    }

    const user = await User.findById(req.user._id);
    user.name = nextName;
    const emailChanged = user.email !== nextEmail;
    user.email = nextEmail;

    if (emailChanged && isVerificationRequired()) {
      user.isVerified = false;
      const delivery = await issueVerification(user);
      await user.save();

      return res.json({
        user: user.toSafeObject(),
        message: 'Profile updated. Please verify your new email address.',
        verificationRequired: true,
        verificationPreviewUrl: delivery?.verificationUrl || null,
      });
    }

    await user.save();

    res.json({
      user: user.toSafeObject(),
      message: 'Profile updated successfully.',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long.' });
    }

    const user = await User.findById(req.user._id);
    const isMatch = await user.matchPassword(currentPassword);

    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect.' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
