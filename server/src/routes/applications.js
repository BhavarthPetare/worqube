import { Router } from 'express';
import { z } from 'zod';
import Application from '../models/Application.js';
import { APPLICATION_STATUSES } from '../lib/constants.js';
import { assertObjectId, HttpError, parse } from '../lib/errors.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/mine', requireRole('student'), async (req, res) => {
  const applications = await Application.find({ student: req.user._id })
    .sort({ createdAt: -1 })
    .populate({ path: 'job', select: 'role location type salaryRange deadline', populate: { path: 'company', select: 'name' } });
  res.json({ applications });
});

// Students may withdraw only while the application is still pending.
router.delete('/:id', requireRole('student'), async (req, res) => {
  const result = await Application.deleteOne({
    _id: assertObjectId(req.params.id, 'application id'),
    student: req.user._id,
    status: 'applied',
  });
  if (result.deletedCount === 0) throw new HttpError(404, 'Application not found or already being processed');
  res.status(204).end();
});

router.patch('/:id', requireRole('admin'), async (req, res) => {
  const { status } = parse(z.object({ status: z.enum(APPLICATION_STATUSES) }), req.body);
  const application = await Application.findByIdAndUpdate(
    assertObjectId(req.params.id, 'application id'),
    { status },
    { returnDocument: 'after' },
  );
  if (!application) throw new HttpError(404, 'Application not found');
  res.json({ application });
});

export default router;
