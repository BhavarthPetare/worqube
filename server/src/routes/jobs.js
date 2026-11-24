import { Router } from 'express';
import { z } from 'zod';
import Application from '../models/Application.js';
import Company from '../models/Company.js';
import Job from '../models/Job.js';
import { DEPARTMENTS, JOB_TYPES } from '../lib/constants.js';
import { checkEligibility } from '../lib/eligibility.js';
import { assertObjectId, HttpError, parse } from '../lib/errors.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

const jobSchema = z.object({
  companyName: z.string().trim().min(1, 'Company is required').max(100),
  role: z.string().trim().min(1, 'Role is required').max(100),
  description: z.string().trim().min(1, 'Description is required').max(5000),
  location: z.string().trim().max(100).optional(),
  type: z.enum(JOB_TYPES).default('Full-time'),
  salaryRange: z.string().trim().max(60).optional(),
  requiredSkills: z.array(z.string().trim().min(1).max(40)).max(15).default([]),
  eligibility: z
    .object({
      minCgpa: z.number().min(0).max(10).default(0),
      branches: z.array(z.enum(DEPARTMENTS)).default([]),
      maxBacklogs: z.number().int().min(0).max(50).default(0),
    })
    .default({ minCgpa: 0, branches: [], maxBacklogs: 0 }),
  deadline: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'use YYYY-MM-DD')
    .nullish()
    .transform((v) => v || undefined),
  isActive: z.boolean().default(true),
});

// Find the company by name (case-insensitive) or create it.
async function companyIdFor(name) {
  const company = await Company.findOneAndUpdate(
    { name },
    { $setOnInsert: { name } },
    { upsert: true, returnDocument: 'after', collation: { locale: 'en', strength: 2 } },
  );
  return company._id;
}

// Students: open jobs plus whether they can apply and what they already applied to.
// Admins: every job with its applicant count.
router.get('/', async (req, res) => {
  if (req.user.role === 'admin') {
    const [jobs, counts] = await Promise.all([
      Job.find().sort({ createdAt: -1 }).populate('company', 'name website'),
      Application.aggregate([{ $group: { _id: '$job', count: { $sum: 1 } } }]),
    ]);
    const countByJob = new Map(counts.map((c) => [String(c._id), c.count]));
    return res.json({
      jobs: jobs.map((job) => ({ ...job.toJSON(), applicantCount: countByJob.get(job.id) ?? 0 })),
    });
  }

  const [jobs, mine] = await Promise.all([
    Job.find({ isActive: true }).sort({ createdAt: -1 }).populate('company', 'name website'),
    Application.find({ student: req.user._id }, 'job status'),
  ]);
  const statusByJob = new Map(mine.map((a) => [String(a.job), a.status]));
  res.json({
    jobs: jobs.map((job) => ({
      ...job.toJSON(),
      myStatus: statusByJob.get(job.id) ?? null,
      eligibilityCheck: checkEligibility(req.user, job),
    })),
  });
});

router.post('/', requireRole('admin'), async (req, res) => {
  const { companyName, ...body } = parse(jobSchema, req.body);
  const job = await Job.create({ ...body, company: await companyIdFor(companyName), createdBy: req.user._id });
  await job.populate('company', 'name website');
  res.status(201).json({ job });
});

router.put('/:id', requireRole('admin'), async (req, res) => {
  const { companyName, ...body } = parse(jobSchema, req.body);
  const job = await Job.findById(assertObjectId(req.params.id, 'job id'));
  if (!job) throw new HttpError(404, 'Job not found');
  job.set({ ...body, company: await companyIdFor(companyName) });
  if (!body.deadline) job.set('deadline', undefined);
  await job.save();
  await job.populate('company', 'name website');
  res.json({ job });
});

router.patch('/:id/status', requireRole('admin'), async (req, res) => {
  const { isActive } = parse(z.object({ isActive: z.boolean() }), req.body);
  const job = await Job.findByIdAndUpdate(assertObjectId(req.params.id, 'job id'), { isActive }, { returnDocument: 'after' });
  if (!job) throw new HttpError(404, 'Job not found');
  res.json({ job });
});

router.delete('/:id', requireRole('admin'), async (req, res) => {
  const job = await Job.findByIdAndDelete(assertObjectId(req.params.id, 'job id'));
  if (!job) throw new HttpError(404, 'Job not found');
  await Application.deleteMany({ job: job._id });
  res.status(204).end();
});

// Apply: eligibility is enforced here, not just shown in the UI.
router.post('/:id/apply', requireRole('student'), async (req, res) => {
  const job = await Job.findById(assertObjectId(req.params.id, 'job id'));
  if (!job) throw new HttpError(404, 'Job not found');

  const { eligible, reasons } = checkEligibility(req.user, job);
  if (!eligible) throw new HttpError(422, reasons.join('. '));

  try {
    const application = await Application.create({ job: job._id, student: req.user._id });
    res.status(201).json({ application });
  } catch (err) {
    if (err.code === 11000) throw new HttpError(409, 'You have already applied to this job');
    throw err;
  }
});

router.get('/:id/applicants', requireRole('admin'), async (req, res) => {
  const jobId = assertObjectId(req.params.id, 'job id');
  const applications = await Application.find({ job: jobId })
    .sort({ createdAt: 1 })
    .populate('student', 'fullName email rollNumber department year cgpa activeBacklogs resume');
  res.json({ applications });
});

export default router;
