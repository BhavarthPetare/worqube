// Seeds a fresh Worqube database with demo data.
//
//   npm run seed             # refuses to run if the database already has users
//   npm run seed -- --reset  # wipes users, jobs, companies, applications and resumes first
//
// Creates 2 admin (T&P coordinator) logins and 4 student logins with random passwords,
// printed once and saved to ../accounts.local.csv (gitignored). Also creates demo students
// without usable logins so the admin dashboard and charts have data.
// Companies are fictional on purpose: demo job posts must not look like real offers.
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import User from '../src/models/User.js';
import Company from '../src/models/Company.js';
import Job from '../src/models/Job.js';
import Application from '../src/models/Application.js';
import { saveResume } from '../src/lib/resumes.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const reset = process.argv.includes('--reset');

const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
const password = (n = 16) => Array.from(crypto.randomBytes(n), (b) => ALPHABET[b % ALPHABET.length]).join('');

// Deterministic pseudo-random numbers so every seed produces the same demo data.
let state = 42;
const rand = () => ((state = (state * 1664525 + 1013904223) % 2 ** 32) / 2 ** 32);
const pick = (arr) => arr[Math.floor(rand() * arr.length)];

// A small but valid one-page PDF containing the given lines.
function makePdf(lines) {
  const text = lines
    .map((line, i) => `BT /F1 ${i === 0 ? 18 : 11} Tf 60 ${760 - i * 22} Td (${line.replace(/[()\\]/g, '')}) Tj ET`)
    .join('\n');
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${Buffer.byteLength(text)} >>\nstream\n${text}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = objects.map((obj, i) => {
    const offset = Buffer.byteLength(pdf);
    pdf += `${i + 1} 0 obj\n${obj}\nendobj\n`;
    return offset;
  });
  const xref = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('');
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(pdf, 'latin1');
}

const COMPANIES = [
  { name: 'Nimbus Systems', website: 'https://example.com/nimbus', description: 'Cloud infrastructure and developer tools.' },
  { name: 'Kestrel Analytics', website: 'https://example.com/kestrel', description: 'Data platforms for retail and logistics.' },
  { name: 'Bluefin Fintech', website: 'https://example.com/bluefin', description: 'Payments and lending products.' },
  { name: 'Orbit Robotics', website: 'https://example.com/orbit', description: 'Embedded systems and industrial automation.' },
  { name: 'Saffron Labs', website: 'https://example.com/saffron', description: 'Applied machine learning research.' },
  { name: 'Tidewater Software', website: 'https://example.com/tidewater', description: 'Enterprise SaaS for healthcare.' },
];

const inDays = (days) => {
  const d = new Date(Date.now() + days * 86_400_000);
  return d.toISOString().slice(0, 10);
};

const JOBS = [
  { company: 'Nimbus Systems', role: 'Software Development Engineer', type: 'Full-time', location: 'Pune', salaryRange: '12-16 LPA', requiredSkills: ['Java', 'DSA', 'System Design'], eligibility: { minCgpa: 7.5, branches: ['CE', 'IT', 'AIDS'], maxBacklogs: 0 }, deadline: inDays(14) },
  { company: 'Kestrel Analytics', role: 'Data Analyst', type: 'Full-time', location: 'Bengaluru', salaryRange: '8-10 LPA', requiredSkills: ['SQL', 'Python', 'Power BI'], eligibility: { minCgpa: 7, branches: [], maxBacklogs: 1 }, deadline: inDays(10) },
  { company: 'Bluefin Fintech', role: 'Backend Engineer', type: 'Full-time', location: 'Mumbai', salaryRange: '14-18 LPA', requiredSkills: ['Node.js', 'PostgreSQL', 'AWS'], eligibility: { minCgpa: 8, branches: ['CE', 'IT'], maxBacklogs: 0 }, deadline: inDays(21) },
  { company: 'Orbit Robotics', role: 'Embedded Systems Engineer', type: 'Full-time', location: 'Pune', salaryRange: '7-9 LPA', requiredSkills: ['C', 'Embedded C', 'RTOS'], eligibility: { minCgpa: 6.5, branches: ['EnTC', 'ECE'], maxBacklogs: 1 }, deadline: inDays(18) },
  { company: 'Saffron Labs', role: 'ML Engineer Intern', type: 'Internship', location: 'Remote', salaryRange: '40k/month', requiredSkills: ['Python', 'PyTorch', 'ML'], eligibility: { minCgpa: 8, branches: ['CE', 'IT', 'AIDS'], maxBacklogs: 0 }, deadline: inDays(7) },
  { company: 'Tidewater Software', role: 'Full Stack Developer', type: 'Full-time', location: 'Hyderabad', salaryRange: '9-12 LPA', requiredSkills: ['React', 'TypeScript', 'Node.js'], eligibility: { minCgpa: 7, branches: [], maxBacklogs: 0 }, deadline: inDays(25) },
  { company: 'Nimbus Systems', role: 'Site Reliability Intern', type: 'Internship', location: 'Pune', salaryRange: '35k/month', requiredSkills: ['Linux', 'Docker', 'Go'], eligibility: { minCgpa: 7, branches: ['CE', 'IT', 'ECE'], maxBacklogs: 0 }, deadline: inDays(30) },
  { company: 'Kestrel Analytics', role: 'Business Analyst (2025 drive)', type: 'Full-time', location: 'Bengaluru', salaryRange: '7 LPA', requiredSkills: ['Excel', 'SQL'], eligibility: { minCgpa: 6, branches: [], maxBacklogs: 2 }, deadline: inDays(-20), isActive: false },
];

const FIRST = ['Aarav', 'Ananya', 'Ishaan', 'Diya', 'Rohan', 'Sneha', 'Kabir', 'Meera', 'Arjun', 'Tanvi', 'Vihaan', 'Riya', 'Aditya', 'Pooja', 'Siddharth', 'Neha', 'Omkar', 'Gauri', 'Yash', 'Sakshi'];
const LAST = ['Kulkarni', 'Deshpande', 'Patil', 'Joshi', 'Shah', 'Iyer', 'Pawar', 'Gokhale', 'Mehta', 'Rao'];
const SKILLS = ['Python', 'Java', 'C++', 'React', 'Node.js', 'SQL', 'DSA', 'Machine Learning', 'Docker', 'Embedded C', 'TypeScript', 'AWS'];
const LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
const DEPTS = ['CE', 'IT', 'EnTC', 'AIDS', 'ECE'];

function studentProfile(i, fullName) {
  const department = DEPTS[i % DEPTS.length];
  const skills = [...new Set(Array.from({ length: 4 }, () => pick(SKILLS)))].map((name) => ({ name, level: pick(LEVELS) }));
  return {
    fullName,
    rollNumber: `4${department === 'CE' ? 1 : department === 'IT' ? 3 : department === 'EnTC' ? 2 : department === 'AIDS' ? 5 : 4}${String(100 + i).padStart(3, '0')}`,
    phone: `98${String(10000000 + Math.floor(rand() * 89999999))}`,
    department,
    year: i % 5 === 4 ? 'TE' : 'BE',
    cgpa: Math.round((6.2 + rand() * 3.6) * 100) / 100,
    activeBacklogs: rand() < 0.12 ? 1 : 0,
    links: { github: `https://github.com/demo-${fullName.split(' ')[0].toLowerCase()}` },
    skills,
    projects: [
      {
        title: pick(['Campus Event Planner', 'Expense Tracker', 'Traffic Sign Classifier', 'IoT Weather Station', 'Library Management API']),
        description: 'Final-year style demo project.',
        technologies: skills.slice(0, 2).map((s) => s.name),
      },
    ],
    certifications: rand() < 0.5 ? [{ name: 'Cloud Practitioner (demo)', issuer: 'Demo Academy', issueDate: '2025-06' }] : [],
  };
}

async function createUser({ email, role, fullName, profile = {}, withLogin = true }) {
  const plain = password();
  const user = await User.create({
    email,
    role,
    fullName,
    // Demo-only students get an unguessable password nobody knows.
    passwordHash: await bcrypt.hash(withLogin ? plain : password(32), 10),
    ...profile,
  });
  return { user, password: withLogin ? plain : null };
}

async function main() {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is not set (server/.env)');
  await mongoose.connect(process.env.MONGO_URI);
  console.log(`Connected to ${mongoose.connection.host}/${mongoose.connection.name}`);
  await Promise.all([User.init(), Company.init(), Job.init(), Application.init()]);

  const existing = await User.countDocuments();
  if (existing && !reset) throw new Error(`Database already has ${existing} user(s). Re-run with --reset to wipe and reseed.`);
  if (reset) {
    await Promise.all([User.deleteMany({}), Company.deleteMany({}), Job.deleteMany({}), Application.deleteMany({})]);
    const db = mongoose.connection.db;
    await Promise.all(['resumes.files', 'resumes.chunks'].map((c) => db.collection(c).deleteMany({})));
    console.log('Cleared existing data.');
  }

  const companies = new Map();
  for (const c of COMPANIES) companies.set(c.name, await Company.create(c));

  const accounts = [];
  const admins = [];
  for (const [i, name] of ['T&P Coordinator One', 'T&P Coordinator Two'].entries()) {
    const { user, password: pw } = await createUser({ email: `admin${i + 1}@worqube.test`, role: 'admin', fullName: name });
    admins.push(user);
    accounts.push({ role: 'admin', name, email: user.email, password: pw });
  }

  const jobs = [];
  for (const j of JOBS) {
    const { company, ...rest } = j;
    jobs.push(await Job.create({
      ...rest,
      description: `${j.role} at ${company} (demo posting).\n\nYou will work with a small team on production systems. Freshers from the 2026 batch are welcome.\n\nSelection: online test, two technical interviews, HR round.`,
      company: companies.get(company)._id,
      createdBy: admins[0]._id,
    }));
  }

  const students = [];
  for (let i = 0; i < 20; i++) {
    const fullName = `${FIRST[i]} ${LAST[i % LAST.length]}`;
    const isLogin = i < 4;
    const email = isLogin ? `student${i + 1}@worqube.test` : `${FIRST[i].toLowerCase()}.${LAST[i % LAST.length].toLowerCase()}@demo.worqube.test`;
    const { user, password: pw } = await createUser({ email, role: 'student', fullName, profile: studentProfile(i, fullName), withLogin: isLogin });
    // Student 4 is left without a resume to demo the "complete your profile" flow.
    if (i !== 3) {
      const pdf = makePdf([fullName, `${user.department} | ${user.year} | CGPA ${user.cgpa}`, `Skills: ${user.skills.map((s) => s.name).join(', ')}`, 'Demo resume generated by the Worqube seed script.']);
      await saveResume(user, { mimetype: 'application/pdf', buffer: pdf, size: pdf.length });
    }
    students.push(user);
    if (isLogin) accounts.push({ role: 'student', name: fullName, email, password: pw });
  }

  // Applications: each demo student applies to the open jobs they're eligible for, with
  // a spread of outcomes. Login students 1-2 get a couple of applications to explore.
  const { checkEligibility } = await import('../src/lib/eligibility.js');
  const outcomes = ['applied', 'applied', 'shortlisted', 'rejected', 'selected'];
  let applicationCount = 0;
  for (const [i, student] of students.entries()) {
    if (i === 2 || i === 3) continue; // students 3-4 start with no applications
    const eligibleJobs = jobs.filter((job) => checkEligibility(student, job).eligible);
    const chosen = eligibleJobs.filter(() => rand() < 0.6).slice(0, i < 2 ? 2 : 3);
    for (const job of chosen) {
      await Application.create({ job: job._id, student: student._id, status: i < 2 ? pick(['applied', 'shortlisted']) : pick(outcomes) });
      applicationCount++;
    }
  }

  console.log(`Seeded ${companies.size} companies, ${jobs.length} jobs, ${students.length} students, ${applicationCount} applications.`);
  const csvPath = path.join(ROOT, 'accounts.local.csv');
  fs.writeFileSync(csvPath, ['role,name,email,password', ...accounts.map((a) => `${a.role},${a.name},${a.email},${a.password}`)].join('\n') + '\n');
  console.log(`\nLogin accounts (saved to ${csvPath}, which is gitignored):`);
  console.table(accounts);
}

main()
  .catch((err) => {
    console.error('Seed failed:', err.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
