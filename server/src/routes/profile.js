import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { HttpError, parse } from '../lib/errors.js';
import { DEPARTMENTS, RESUME_MAX_BYTES, SKILL_LEVELS, YEARS } from '../lib/constants.js';
import { saveResume, streamResume } from '../lib/resumes.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth, requireRole('student'));

// Empty strings from forms mean "clear this field".
const optionalText = (max) =>
  z.string().trim().max(max).nullish().transform((v) => (v ? v : undefined));
const optionalUrl = z
  .string()
  .trim()
  .max(300)
  .nullish()
  .transform((v) => (v ? v : undefined))
  .refine((v) => !v || /^https?:\/\/\S+$/i.test(v), 'must be a URL starting with http(s)://');
const month = z.string().regex(/^\d{4}-\d{2}$/, 'use YYYY-MM').nullish().transform((v) => v || undefined);

const basicSchema = z.object({
  fullName: z.string().trim().min(1, 'Full name is required').max(100),
  rollNumber: optionalText(20),
  phone: optionalText(20),
  department: z.enum(DEPARTMENTS).nullish().transform((v) => v ?? undefined),
  year: z.enum(YEARS).nullish().transform((v) => v ?? undefined),
  cgpa: z.number().min(0).max(10).nullish().transform((v) => v ?? undefined),
  activeBacklogs: z.number().int().min(0).max(50).default(0),
  links: z
    .object({ github: optionalUrl, linkedin: optionalUrl, leetcode: optionalUrl, codechef: optionalUrl })
    .default({}),
});

const sections = {
  skills: z
    .array(z.object({ name: z.string().trim().min(1).max(50), level: z.enum(SKILL_LEVELS).default('Intermediate') }))
    .max(40),
  projects: z
    .array(
      z.object({
        title: z.string().trim().min(1, 'Project title is required').max(150),
        description: optionalText(2000),
        technologies: z.array(z.string().trim().min(1).max(40)).max(15).default([]),
        githubUrl: optionalUrl,
        projectUrl: optionalUrl,
      }),
    )
    .max(20),
  experience: z
    .array(
      z.object({
        company: z.string().trim().min(1, 'Company is required').max(100),
        role: z.string().trim().min(1, 'Role is required').max(100),
        location: optionalText(100),
        description: optionalText(2000),
        startDate: month,
        endDate: month,
        current: z.boolean().default(false),
      }),
    )
    .max(20),
  certifications: z
    .array(
      z.object({
        name: z.string().trim().min(1, 'Certification name is required').max(150),
        issuer: optionalText(100),
        issueDate: month,
        credentialUrl: optionalUrl,
      }),
    )
    .max(30),
};

router.get('/', (req, res) => {
  res.json({ user: req.user });
});

router.put('/', async (req, res) => {
  const body = parse(basicSchema, req.body);
  // Explicit field list: role, email and password can never be changed here.
  for (const key of ['fullName', 'rollNumber', 'phone', 'department', 'year', 'cgpa', 'activeBacklogs']) {
    req.user.set(key, body[key]);
  }
  req.user.set('links', body.links);
  await req.user.save();
  res.json({ user: req.user });
});

// Replace a whole list (the UI edits lists locally, then saves them).
router.put('/:section', async (req, res) => {
  const schema = sections[req.params.section];
  if (!schema) throw new HttpError(404, 'Not found');
  req.user.set(req.params.section, parse(schema, req.body));
  await req.user.save();
  res.json({ user: req.user });
});

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: RESUME_MAX_BYTES, files: 1 } });

router.post('/resume', upload.single('resume'), async (req, res) => {
  if (!req.file) throw new HttpError(400, 'Choose a PDF to upload');
  await saveResume(req.user, req.file);
  res.status(201).json({ user: req.user });
});

router.get('/resume', async (req, res) => {
  await streamResume(req.user, res);
});

export default router;
