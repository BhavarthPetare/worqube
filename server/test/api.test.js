import { after, before, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { client, createAdmin, registerStudent, reset, start, stop, uploadResume } from './helpers.js';

before(start);
after(stop);
beforeEach(reset);

const ELIGIBLE = { department: 'CE', year: 'BE', cgpa: 8.2, activeBacklogs: 0 };

async function postJob(admin, overrides = {}) {
  const res = await admin.post('/api/jobs', {
    companyName: 'Nimbus Systems',
    role: 'Software Engineer',
    description: 'Build things.',
    eligibility: { minCgpa: 7, branches: ['CE', 'IT'], maxBacklogs: 0 },
    ...overrides,
  });
  assert.equal(res.status, 201, JSON.stringify(res.data));
  return res.data.job;
}

describe('auth', () => {
  test('register creates a student and starts an httpOnly session', async () => {
    const c = client();
    const res = await c.post('/api/auth/register', { fullName: 'Asha', email: 'ASHA@Test.dev', password: 'long-enough' });
    assert.equal(res.status, 201);
    assert.equal(res.data.user.role, 'student');
    assert.equal(res.data.user.email, 'asha@test.dev');
    assert.equal(res.data.user.passwordHash, undefined);
    assert.match(res.headers.get('set-cookie'), /HttpOnly/i);
    assert.equal((await c.get('/api/auth/me')).data.user.email, 'asha@test.dev');
  });

  test('rejects short passwords, duplicates and wrong credentials', async () => {
    const c = client();
    assert.equal((await c.post('/api/auth/register', { fullName: 'A', email: 'a@t.dev', password: 'short' })).status, 400);
    await c.post('/api/auth/register', { fullName: 'A', email: 'a@t.dev', password: 'long-enough' });
    assert.equal((await client().post('/api/auth/register', { fullName: 'B', email: 'A@T.dev', password: 'long-enough' })).status, 409);
    assert.equal((await client().post('/api/auth/login', { email: 'a@t.dev', password: 'wrong-pass' })).status, 401);
  });

  test('blocks NoSQL operator injection on login', async () => {
    await registerStudent('x@t.dev');
    const res = await client().post('/api/auth/login', { email: { $gt: '' }, password: 'student-password' });
    assert.equal(res.status, 400);
  });

  test('signup cannot create an admin', async () => {
    const res = await client().post('/api/auth/register', { fullName: 'Eve', email: 'eve@t.dev', password: 'long-enough', role: 'admin' });
    assert.equal(res.data.user.role, 'student');
  });

  test('logout ends the session', async () => {
    const { c } = await registerStudent();
    await c.post('/api/auth/logout');
    assert.equal((await c.get('/api/auth/me')).data.user, null);
    assert.equal((await c.get('/api/profile')).status, 401);
  });
});

describe('profile', () => {
  test('students update their profile but not their role or email', async () => {
    const { c } = await registerStudent();
    const res = await c.put('/api/profile', { fullName: 'New Name', role: 'admin', email: 'hacker@x.dev', ...ELIGIBLE });
    assert.equal(res.status, 200);
    assert.equal(res.data.user.fullName, 'New Name');
    assert.equal(res.data.user.role, 'student');
    assert.equal(res.data.user.email, 'student@test.dev');
    assert.equal(res.data.user.cgpa, 8.2);
  });

  test('validates fields', async () => {
    const { c } = await registerStudent();
    assert.equal((await c.put('/api/profile', { fullName: 'A', cgpa: 11 })).status, 400);
    assert.equal((await c.put('/api/profile', { fullName: 'A', department: 'XYZ' })).status, 400);
    assert.equal((await c.put('/api/profile', { fullName: 'A', links: { github: 'javascript:alert(1)' } })).status, 400);
  });

  test('roll numbers are unique', async () => {
    const { c: a } = await registerStudent('a@t.dev', { rollNumber: '41201' });
    assert.ok(a);
    const { c: b } = await registerStudent('b@t.dev');
    assert.equal((await b.put('/api/profile', { fullName: 'B', rollNumber: '41201' })).status, 409);
  });

  test('saves list sections', async () => {
    const { c } = await registerStudent();
    const res = await c.put('/api/profile/projects', [{ title: 'Worqube', technologies: ['React'], githubUrl: 'https://github.com/x/y' }]);
    assert.equal(res.status, 200);
    assert.equal(res.data.user.projects[0].title, 'Worqube');
    assert.equal((await c.put('/api/profile/skills', [{ name: '' }])).status, 400);
  });

  test('resume upload accepts real PDFs only and can be read back by owner and admin', async () => {
    const { c, user } = await registerStudent();
    assert.equal((await uploadResume(c, Buffer.from('not a pdf'))).status, 400);
    const up = await uploadResume(c);
    assert.equal(up.status, 201);
    assert.ok(up.data.user.resume.fileId);
    assert.equal((await c.get('/api/profile/resume')).headers.get('content-type'), 'application/pdf');

    const admin = await createAdmin();
    assert.equal((await admin.get(`/api/admin/students/${user.id}/resume`)).status, 200);
    const other = (await registerStudent('o@t.dev')).c;
    assert.equal((await other.get(`/api/admin/students/${user.id}/resume`)).status, 403);
  });
});

describe('jobs and applications', () => {
  test('only admins post jobs', async () => {
    const { c } = await registerStudent();
    assert.equal((await c.post('/api/jobs', { companyName: 'X', role: 'R', description: 'D' })).status, 403);
    assert.equal((await client().post('/api/jobs', {})).status, 401);
  });

  test('eligible student applies once; status flows back', async () => {
    const admin = await createAdmin();
    const job = await postJob(admin);
    const { c } = await registerStudent('s@t.dev', ELIGIBLE);

    let list = (await c.get('/api/jobs')).data.jobs;
    assert.equal(list[0].eligibilityCheck.eligible, false, 'no resume yet');
    await uploadResume(c);
    list = (await c.get('/api/jobs')).data.jobs;
    assert.deepEqual(list[0].eligibilityCheck, { eligible: true, reasons: [] });
    assert.equal(list[0].eligibility.minCgpa, 7, 'rules are kept alongside the check');

    assert.equal((await c.post(`/api/jobs/${job.id}/apply`)).status, 201);
    assert.equal((await c.post(`/api/jobs/${job.id}/apply`)).status, 409);

    const applicants = (await admin.get(`/api/jobs/${job.id}/applicants`)).data.applications;
    assert.equal(applicants.length, 1);
    assert.equal((await admin.patch(`/api/applications/${applicants[0].id}`, { status: 'selected' })).status, 200);

    const mine = (await c.get('/api/applications/mine')).data.applications;
    assert.equal(mine[0].status, 'selected');
    assert.equal(mine[0].job.company.name, 'Nimbus Systems');
    // Can't withdraw once processed; can't change own status.
    assert.equal((await c.del(`/api/applications/${mine[0].id}`)).status, 404);
    assert.equal((await c.patch(`/api/applications/${mine[0].id}`, { status: 'selected' })).status, 403);
  });

  test('server enforces eligibility', async () => {
    const admin = await createAdmin();
    const job = await postJob(admin);
    const { c } = await registerStudent('low@t.dev', { ...ELIGIBLE, cgpa: 6.1, department: 'EnTC' });
    await uploadResume(c);
    const res = await c.post(`/api/jobs/${job.id}/apply`);
    assert.equal(res.status, 422);
    assert.match(res.data.message, /CGPA 7\+/);
    assert.match(res.data.message, /CE, IT only/);
  });

  test('closed and expired jobs reject applications and closed jobs are hidden', async () => {
    const admin = await createAdmin();
    const expired = await postJob(admin, { role: 'Old', deadline: '2020-01-01' });
    const closed = await postJob(admin, { role: 'Closed' });
    await admin.patch(`/api/jobs/${closed.id}/status`, { isActive: false });
    const { c } = await registerStudent('s@t.dev', ELIGIBLE);
    await uploadResume(c);

    assert.match((await c.post(`/api/jobs/${expired.id}/apply`)).data.message, /deadline/);
    assert.equal((await c.post(`/api/jobs/${closed.id}/apply`)).status, 422);
    const roles = (await c.get('/api/jobs')).data.jobs.map((j) => j.role);
    assert.deepEqual(roles, ['Old']);
  });

  test('students can withdraw pending applications', async () => {
    const admin = await createAdmin();
    const job = await postJob(admin);
    const { c } = await registerStudent('s@t.dev', ELIGIBLE);
    await uploadResume(c);
    await c.post(`/api/jobs/${job.id}/apply`);
    const [app] = (await c.get('/api/applications/mine')).data.applications;
    assert.equal((await c.del(`/api/applications/${app.id}`)).status, 204);
  });

  test('companies are matched case-insensitively', async () => {
    const admin = await createAdmin();
    const a = await postJob(admin, { companyName: 'Acme' });
    const b = await postJob(admin, { companyName: 'ACME' });
    assert.equal(a.company.id, b.company.id);
  });
});

describe('admin and public', () => {
  test('student filters and analytics', async () => {
    const admin = await createAdmin();
    await registerStudent('ce@t.dev', { ...ELIGIBLE, department: 'CE' });
    await registerStudent('it@t.dev', { ...ELIGIBLE, department: 'IT', cgpa: 6.5 });

    const ce = (await admin.get('/api/admin/students?departments=CE')).data.students;
    assert.equal(ce.length, 1);
    const high = (await admin.get('/api/admin/students?minCgpa=8')).data.students;
    assert.equal(high.length, 1);
    assert.equal((await admin.get('/api/admin/students?departments=XYZ')).status, 400);

    const analytics = (await admin.get('/api/admin/analytics')).data;
    assert.equal(analytics.totals.students, 2);
    assert.equal(analytics.departments.find((d) => d.department === 'IT').students, 1);
  });

  test('students cannot use admin endpoints', async () => {
    const { c } = await registerStudent();
    assert.equal((await c.get('/api/admin/students')).status, 403);
    assert.equal((await c.get('/api/admin/analytics')).status, 403);
  });

  test('public stats expose counts only', async () => {
    await registerStudent();
    const res = await client().get('/api/stats');
    assert.equal(res.status, 200);
    assert.equal(res.data.students, 1);
    assert.equal(JSON.stringify(res.data).includes('@'), false);
  });

  test('health and unknown API routes', async () => {
    assert.equal((await client().get('/api/health')).status, 200);
    assert.equal((await client().get('/api/nope')).status, 404);
  });
});
