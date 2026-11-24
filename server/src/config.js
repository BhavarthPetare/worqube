// Central configuration. Fails fast on missing or unsafe settings.
const env = process.env;

export const IS_PROD = env.NODE_ENV === 'production';
export const IS_TEST = env.NODE_ENV === 'test';

export const config = {
  port: Number(env.PORT) || 5000,
  mongoUri: env.MONGO_URI,
  jwtSecret: env.JWT_SECRET,
  trustProxy: env.TRUST_PROXY ? Number(env.TRUST_PROXY) || 1 : false,
  cookieName: 'wq_session',
  sessionDays: 7,
};

export function assertConfig() {
  for (const key of ['MONGO_URI', 'JWT_SECRET']) {
    if (!env[key]) throw new Error(`Missing required environment variable: ${key}`);
  }
  // A weak secret lets anyone forge session tokens.
  if (IS_PROD && (env.JWT_SECRET.length < 32 || /change-me/i.test(env.JWT_SECRET))) {
    throw new Error('JWT_SECRET is too weak for production (use 32+ random characters)');
  }
}
