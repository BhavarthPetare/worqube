import mongoose from 'mongoose';
import { assertConfig, config } from './config.js';
import { createApp } from './app.js';

try {
  assertConfig();
  await mongoose.connect(config.mongoUri);
  console.log('MongoDB connected');
} catch (err) {
  console.error('Startup failed:', err.message);
  process.exit(1);
}

const server = createApp().listen(config.port, () => console.log(`Worqube API on port ${config.port}`));

// Graceful shutdown on redeploy (SIGTERM) or Ctrl+C.
let closing = false;
for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => {
    if (closing) return;
    closing = true;
    setTimeout(() => process.exit(1), 10_000).unref();
    server.close(async () => {
      await mongoose.disconnect();
      process.exit(0);
    });
  });
}
