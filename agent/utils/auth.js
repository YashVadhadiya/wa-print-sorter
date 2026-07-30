const crypto = require('crypto');
const Config = require('../services/config');
const Logger = require('../services/logger');

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

const tokens = new Set();

function initToken() {
  const configToken = Config.get('auth.token', '');
  if (configToken) {
    tokens.add(configToken);
  } else {
    const token = generateToken();
    tokens.add(token);
    Config.set('auth.token', token);
    Logger.info('Auth token generated: ' + token.substring(0, 8) + '...');
  }
}

initToken();

function authMiddleware(req, res, next) {
  if (!Config.get('auth.enabled', true)) return next();

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization required' });
  }

  const token = authHeader.substring(7);
  if (!tokens.has(token)) {
    return res.status(403).json({ error: 'Invalid token' });
  }

  next();
}

module.exports = { authMiddleware, generateToken };
