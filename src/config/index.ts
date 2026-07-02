import dotenv from 'dotenv';

dotenv.config();

/**
 * Single source of truth for configuration. Every value is read from the
 * environment (with sensible defaults) and consumed through this object, so no
 * other module touches `process.env` directly.
 */
export default {
  port: parseInt(process.env.PORT || '3000', 10),
  environment: process.env.NODE_ENV || 'development',

  api: {
    // All feature routes are mounted under this prefix.
    // Set API_PREFIX='' to expose the assignment's bare paths (e.g. POST /users).
    prefix: process.env.API_PREFIX ?? '/api',
  },

  logs: {
    level: process.env.LOG_LEVEL || 'debug',
  },

  cors: {
    // Comma-separated list; '*' (default) allows any origin.
    allowedOrigins: (process.env.CORS_ALLOWED_ORIGINS || '*')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  },

  mongo: {
    uri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/session-booking',

    // Registry of model names, referenced everywhere instead of string literals.
    models: {
      User: 'User',
      Teacher: 'Teacher',
      Session: 'Session',
    },
  },

  version: '1.0.0',
};
