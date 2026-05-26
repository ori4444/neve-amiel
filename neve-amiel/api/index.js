// Vercel serverless entry point.
// All /api/* requests are rewritten here by vercel.json.
const { initializeDatabase } = require('../server/db');
const app = require('../server/app');

// initializeDatabase() is called once per cold start and resolves instantly on
// subsequent warm invocations (Promise is module-level).
const ready = initializeDatabase().catch((err) => {
  console.error('[startup] DB init failed:', err.message);
});

module.exports = async (req, res) => {
  await ready;
  app(req, res);
};
