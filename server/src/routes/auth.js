import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import User from '../models/User.js';
import { HttpError, parse } from '../lib/errors.js';
import { currentUser, endSession, requireAuth, startSession } from '../middleware/auth.js';
import { IS_TEST } from '../config.js';

const router = Router();

// Brute-force protection on credential endpoints.
const credentialLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: IS_TEST ? 1000 : 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many attempts. Try again in a few minutes.' },
});

const email = z.email('Enter a valid email').trim().toLowerCase().max(254);
// bcrypt only uses the first 72 bytes.
const password = z.string().min(8, 'Password must be at least 8 characters').max(72);

const registerSchema = z.object({
  fullName: z.string().trim().min(1, 'Full name is required').max(100),
  email,
  password,
});

const loginSchema = z.object({ email, password: z.string().min(1).max(72) });

// Self-registration always creates a student. Admins (T&P coordinators) are created
// by the placement cell with the seed script.
router.post('/register', credentialLimiter, async (req, res) => {
  const body = parse(registerSchema, req.body);
  if (await User.exists({ email: body.email })) throw new HttpError(409, 'An account with this email already exists');

  const user = await User.create({
    fullName: body.fullName,
    email: body.email,
    passwordHash: await bcrypt.hash(body.password, 10),
  });
  startSession(res, user);
  res.status(201).json({ user });
});

router.post('/login', credentialLimiter, async (req, res) => {
  const body = parse(loginSchema, req.body);
  const user = await User.findOne({ email: body.email }).select('+passwordHash');
  if (!user || !(await bcrypt.compare(body.password, user.passwordHash))) {
    throw new HttpError(401, 'Incorrect email or password');
  }
  startSession(res, user);
  res.json({ user });
});

router.post('/logout', (req, res) => {
  endSession(res);
  res.status(204).end();
});

// Who is signed in? 200 with user: null for visitors (not an error).
router.get('/me', async (req, res) => {
  res.json({ user: await currentUser(req, res) });
});

router.post('/change-password', requireAuth, credentialLimiter, async (req, res) => {
  const body = parse(z.object({ currentPassword: z.string().min(1).max(72), newPassword: password }), req.body);
  const user = await User.findById(req.user.id).select('+passwordHash');
  if (!(await bcrypt.compare(body.currentPassword, user.passwordHash))) {
    throw new HttpError(400, 'Current password is incorrect');
  }
  user.passwordHash = await bcrypt.hash(body.newPassword, 10);
  await user.save();
  res.status(204).end();
});

export default router;
