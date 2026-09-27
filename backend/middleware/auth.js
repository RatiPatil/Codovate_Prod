/**
 * ═══════════════════════════════════════════════════════════════
 *  BACKWARD COMPATIBILITY LAYER
 * ═══════════════════════════════════════════════════════════════
 * 
 * This file now delegates to the new authenticate middleware.
 * All existing code that uses `const protect = require('./middleware/auth')`
 * will continue to work without any changes.
 * 
 * The new middleware adds permission loading on top of JWT verification.
 */

const authenticate = require('./authenticate');

module.exports = authenticate;