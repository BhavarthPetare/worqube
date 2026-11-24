import { Router } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import Application from '../models/Application.js';
import Company from '../models/Company.js';
import Job from '../models/Job.js';
import User from '../models/User.js';
import { DEPARTMENTS, YEARS } from '../lib/constants.js';
import { assertObjectId, HttpError, parse } from '../lib/errors.js';
import { streamResume } from '../lib/resumes.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth, requireRole('admin'));

const csv = (allowed) =>
  z
    .string()
    .optional()
    .transform((v) => (v ? v.split(',').filter(Boolean) : []))
    .pipe(z.array(z.enum(allowed)));

const filterSchema = z.object({
  q: z.string().trim().max(100).optional(),
  departments: csv(DEPARTMENTS),
  years: csv(YEARS),
  minCgpa: z.coerce.number().min(0).max(10).optional(),
  maxCgpa: z.coerce.number().min(0).max(10).optional(),
});

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

router.get('/students', async (req, res) => {
  const f = parse(filterSchema, req.query);
  const query = { role: 'student' };
  // Values are validated above; trusted() exempts these server-built operators from sanitizeFilter.
  if (f.departments.length) query.department = mongoose.trusted({ $in: f.departments });
  if (f.years.length) query.year = mongoose.trusted({ $in: f.years });
  if (f.minCgpa != null || f.maxCgpa != null) {
    const range = {};
    if (f.minCgpa != null) range.$gte = f.minCgpa;
    if (f.maxCgpa != null) range.$lte = f.maxCgpa;
    query.cgpa = mongoose.trusted(range);
  }
  if (f.q) {
    const re = new RegExp(escapeRegex(f.q), 'i');
    query.$or = [{ fullName: re }, { email: re }, { rollNumber: re }];
  }

  const students = await User.find(query)
    .select('fullName email rollNumber department year cgpa activeBacklogs resume createdAt')
    .sort({ fullName: 1 })
    .limit(500);
  res.json({ students });
});

router.get('/students/:id', async (req, res) => {
  const student = await User.findOne({ _id: assertObjectId(req.params.id, 'student id'), role: 'student' });
  if (!student) throw new HttpError(404, 'Student not found');
  const applications = await Application.find({ student: student._id })
    .sort({ createdAt: -1 })
    .populate({ path: 'job', select: 'role', populate: { path: 'company', select: 'name' } });
  res.json({ student, applications });
});

router.get('/students/:id/resume', async (req, res) => {
  const student = await User.findOne({ _id: assertObjectId(req.params.id, 'student id'), role: 'student' });
  if (!student) throw new HttpError(404, 'Student not found');
  await streamResume(student, res);
});

router.get('/analytics', async (req, res) => {
  const [students, companies, jobs, activeJobs, byStatus, byDepartment, offersByDepartment, topJobs] =
    await Promise.all([
      User.countDocuments({ role: 'student' }),
      Company.countDocuments(),
      Job.countDocuments(),
      Job.countDocuments({ isActive: true }),
      Application.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      User.aggregate([
        { $match: { role: 'student', department: { $exists: true } } },
        { $group: { _id: '$department', count: { $sum: 1 } } },
      ]),
      Application.aggregate([
        { $match: { status: 'selected' } },
        { $lookup: { from: 'users', localField: 'student', foreignField: '_id', as: 'student' } },
        { $unwind: '$student' },
        { $group: { _id: '$student.department', offers: { $sum: 1 }, students: { $addToSet: '$student._id' } } },
        { $project: { offers: 1, placed: { $size: '$students' } } },
      ]),
      Application.aggregate([
        { $group: { _id: '$job', applicants: { $sum: 1 } } },
        { $sort: { applicants: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'jobs', localField: '_id', foreignField: '_id', as: 'job' } },
        { $unwind: '$job' },
        { $lookup: { from: 'companies', localField: 'job.company', foreignField: '_id', as: 'company' } },
        { $unwind: '$company' },
        { $project: { _id: 0, role: '$job.role', company: '$company.name', applicants: 1 } },
      ]),
    ]);

  const statusCounts = Object.fromEntries(byStatus.map((s) => [s._id, s.count]));
  const offersMap = new Map(offersByDepartment.map((d) => [d._id, d]));
  const departmentMap = new Map(byDepartment.map((d) => [d._id, d.count]));

  res.json({
    totals: {
      students,
      companies,
      jobs,
      activeJobs,
      applications: byStatus.reduce((sum, s) => sum + s.count, 0),
      offers: statusCounts.selected ?? 0,
      placedStudents: offersByDepartment.reduce((sum, d) => sum + d.placed, 0),
    },
    applicationsByStatus: statusCounts,
    departments: DEPARTMENTS.map((department) => ({
      department,
      students: departmentMap.get(department) ?? 0,
      placed: offersMap.get(department)?.placed ?? 0,
    })),
    topJobs,
  });
});

export default router;
