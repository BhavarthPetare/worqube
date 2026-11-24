// Test harness: real Express app + throwaway in-memory MongoDB (never Atlas).
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-that-is-long-enough-1234567890';

let mongod;
let server;
export let baseUrl;

export async function start() {
  mongod = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongod.getUri();
  await mongoose.connect(process.env.MONGO_URI);
  const { createApp } = await import('../src/app.js');
  await Promise.all(Object.values(mongoose.models).map((m) => m.init()));
  server = createApp().listen(0);
  baseUrl = `http://127.0.0.1:${server.address().port}`;
}

export async function stop() {
  server?.close();
  await mongoose.disconnect();
  await mongod?.stop();
}

export async function reset() {
  const { collections } = mongoose.connection;
  await Promise.all(Object.values(collections).map((c) => c.deleteMany({})));
}

// Minimal client that keeps the session cookie, like a browser.
export function client() {
  let cookie = '';
  const request = async (method, path, body, { raw } = {}) => {
    const headers = {};
    if (cookie) headers.cookie = cookie;
    let payload;
    if (raw) payload = raw;
    else if (body !== undefined) {
      headers['content-type'] = 'application/json';
      payload = JSON.stringify(body);
    }
    const res = await fetch(baseUrl + path, { method, headers, body: payload });
    const setCookie = res.headers.get('set-cookie');
    if (setCookie) cookie = setCookie.split(';')[0];
    const text = await res.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }
    return { status: res.status, data, headers: res.headers };
  };
  return {
    get: (p) => request('GET', p),
    post: (p, b) => request('POST', p, b),
    put: (p, b) => request('PUT', p, b),
    patch: (p, b) => request('PATCH', p, b),
    del: (p) => request('DELETE', p),
    upload: (p, form) => request('POST', p, undefined, { raw: form }),
  };
}

export async function createAdmin(email = 'admin@test.dev', password = 'admin-password') {
  const User = mongoose.model('User');
  await User.create({ email, fullName: 'Admin', role: 'admin', passwordHash: await bcrypt.hash(password, 4) });
  const c = client();
  await c.post('/api/auth/login', { email, password });
  return c;
}

export async function registerStudent(email = 'student@test.dev', profile = {}) {
  const c = client();
  const res = await c.post('/api/auth/register', { fullName: 'Student One', email, password: 'student-password' });
  if (Object.keys(profile).length) await c.put('/api/profile', { fullName: 'Student One', ...profile });
  return { c, user: res.data.user };
}

export const PDF = Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n');

export async function uploadResume(c, buffer = PDF, type = 'application/pdf') {
  const form = new FormData();
  form.append('resume', new Blob([buffer], { type }), 'resume.pdf');
  return c.upload('/api/profile/resume', form);
}
