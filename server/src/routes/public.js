import { Router } from 'express';
import mongoose from 'mongoose';
import Application from '../models/Application.js';
import Company from '../models/Company.js';
import Job from '../models/Job.js';
import User from '../models/User.js';
import { todayInIndia } from '../lib/eligibility.js';

const router = Router();

// Health check for the host: 200 only when the database is connected.
router.get('/health', (req, res) => {
  const up = mongoose.connection.readyState === 1;
  res.status(up ? 200 : 503).json({ status: up ? 'ok' : 'degraded' });
});

// Landing-page numbers: counts only, no personal data.
router.get('/stats', async (req, res) => {
  const today = todayInIndia();
  const [students, companies, activeJobs, offers, recruiters] = await Promise.all([
    User.countDocuments({ role: 'student' }),
    Company.countDocuments(),
    Job.countDocuments({
      isActive: true,
      // trusted(): server-built operators, exempt from sanitizeFilter (which targets user input).
      $or: [{ deadline: mongoose.trusted({ $exists: false }) }, { deadline: mongoose.trusted({ $gte: today }) }],
    }),
    Application.countDocuments({ status: 'selected' }),
    Company.find({}, 'name').sort({ name: 1 }).limit(12),
  ]);
  res.set('Cache-Control', 'public, max-age=60');
  res.json({ students, companies, activeJobs, offers, recruiters: recruiters.map((c) => c.name) });
});

export default router;
