// Runs the API against a throwaway in-memory MongoDB filled with seed data, so the app
// can be tried without installing or configuring a database. Data is lost on exit.
//   npm run dev:demo   (from the repo root), then `npm run dev:web` in another terminal
import { spawn, execFileSync } from 'child_process';
import { MongoMemoryServer } from 'mongodb-memory-server';

const mongod = await MongoMemoryServer.create();
const env = {
  ...process.env,
  MONGO_URI: `${mongod.getUri()}worqube`,
  JWT_SECRET: process.env.JWT_SECRET ?? 'demo-only-secret-not-for-production-use',
};

execFileSync(process.execPath, ['scripts/seed.js'], { env, stdio: 'inherit' });
const api = spawn(process.execPath, ['src/index.js'], { env, stdio: 'inherit' });

const shutdown = async () => {
  api.kill();
  await mongod.stop();
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
