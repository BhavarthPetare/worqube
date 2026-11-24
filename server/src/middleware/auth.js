import jwt from 'jsonwebtoken';
import { config, IS_PROD } from '../config.js';
import { HttpError } from '../lib/errors.js';
import User from '../models/User.js';

const cookieOptions = () => ({
  httpOnly: true, // not readable by page scripts, so XSS can't steal the session
  sameSite: 'lax', // not sent on cross-site POSTs, which blocks CSRF
  secure: IS_PROD,
  path: '/',
  maxAge: config.sessionDays * 24 * 60 * 60 * 1000,
});

export function startSession(res, user) {
  const token = jwt.sign({ sub: user.id }, config.jwtSecret, { expiresIn: `${config.sessionDays}d` });
  res.cookie(config.cookieName, token, cookieOptions());
}

export function endSession(res) {
  const { maxAge: _ignored, ...options } = cookieOptions();
  res.clearCookie(config.cookieName, options);
}

// Returns the signed-in user, or null. Clears cookies that are invalid or point to a
// deleted account. Loads the user every time, so role changes apply immediately.
export async function currentUser(req, res) {
  const token = req.cookies?.[config.cookieName];
  if (!token) return null;
  try {
    const { sub } = jwt.verify(token, config.jwtSecret);
    const user = await User.findById(sub);
    if (!user) endSession(res);
    return user;
  } catch {
    endSession(res);
    return null;
  }
}

export async function requireAuth(req, res, next) {
  const user = await currentUser(req, res);
  if (!user) throw new HttpError(401, 'Please log in');
  req.user = user;
  next();
}

export const requireRole = (role) => (req, _res, next) => {
  if (req.user?.role !== role) throw new HttpError(403, 'You do not have access to this');
  next();
};
