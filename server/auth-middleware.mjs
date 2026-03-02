import jwt from 'jsonwebtoken';
import { userDb } from './database.mjs';

const SECRET = process.env.NEXTAUTH_SECRET;

function extractToken(req) {
  const auth = req.headers.authorization;
  if (auth?.startsWith('Bearer ')) {
    return auth.slice(7);
  }
  return null;
}

export function authenticateToken(req, res, next) {
  if (!SECRET) {
    return res.status(500).json({ error: 'Auth not configured' });
  }

  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, SECRET);
    const user = userDb.getById(decoded.userId || decoded.sub);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    req.user = { id: user.id, email: user.email, name: user.name, credits: user.credits };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

export function optionalAuth(req, res, next) {
  if (!SECRET) {
    return next();
  }

  const token = extractToken(req);
  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, SECRET);
    const user = userDb.getById(decoded.userId || decoded.sub);
    if (user) {
      req.user = { id: user.id, email: user.email, name: user.name, credits: user.credits };
    }
  } catch {
    // Token invalid, proceed without auth
  }
  next();
}
