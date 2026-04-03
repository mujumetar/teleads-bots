/**
 * Vercel serverless entry for the Express API.
 * Do not start HTTP listen here — backend/server.js skips listen when VERCEL is set.
 */
module.exports = require('../backend/server.js');
