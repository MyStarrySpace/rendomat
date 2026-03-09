import jwt from 'jsonwebtoken';
import { userDb } from './database.mjs';

const SECRET = process.env.NEXTAUTH_SECRET;
const NEON_AUTH_URL = process.env.NEXT_PUBLIC_NEON_AUTH_URL;

function extractToken(req) {
  const auth = req.headers.authorization;
  if (auth?.startsWith('Bearer ')) {
    return auth.slice(7);
  }
  return null;
}

// Validate a session token against the Neon Auth server
async function validateNeonSession(token) {
  if (!NEON_AUTH_URL) return null;
  try {
    const res = await fetch(`${NEON_AUTH_URL}/get-session`, {
      headers: { cookie: `better-auth.session_token=${token}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.session ? data : null;
  } catch {
    return null;
  }
}

// Resolve user from Neon Auth session, upsert into local DB
function resolveUser(sessionData) {
  if (!sessionData?.user) return null;
  const { id, email, name, image } = sessionData.user;
  // Upsert: create or update user in local DB
  let user = userDb.getById(id);
  if (!user) {
    user = userDb.create({
      id,
      email,
      name,
      image,
      provider: 'neon-auth',
      provider_id: id,
    });
  }
  return { id: user.id, email: user.email, name: user.name, credits: user.credits };
}

export function authenticateToken(req, res, next) {
  // Try Neon Auth session validation
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Try JWT first (legacy), then Neon Auth session
  if (SECRET) {
    try {
      const decoded = jwt.verify(token, SECRET);
      const user = userDb.getById(decoded.userId || decoded.sub);
      if (user) {
        req.user = { id: user.id, email: user.email, name: user.name, credits: user.credits };
        return next();
      }
    } catch {
      // JWT failed, try Neon Auth session
    }
  }

  // Try Neon Auth session
  validateNeonSession(token).then(sessionData => {
    const user = resolveUser(sessionData);
    if (!user) {
      return res.status(401).json({ error: 'Invalid session' });
    }
    req.user = user;
    next();
  }).catch(() => {
    res.status(401).json({ error: 'Authentication failed' });
  });
}

export function requireUser(req, res, next) {
  if (!SECRET && !NEON_AUTH_URL) {
    // Local/Electron mode: no auth configured, use local sentinel user
    req.user = { id: 'local', email: 'local@localhost', name: 'Local User', credits: Infinity };
    return next();
  }

  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Try JWT first (legacy)
  if (SECRET) {
    try {
      const decoded = jwt.verify(token, SECRET);
      const user = userDb.getById(decoded.userId || decoded.sub);
      if (user) {
        req.user = { id: user.id, email: user.email, name: user.name, credits: user.credits };
        return next();
      }
    } catch {
      // JWT failed, try Neon Auth session
    }
  }

  // Try Neon Auth session
  validateNeonSession(token).then(sessionData => {
    const user = resolveUser(sessionData);
    if (!user) {
      return res.status(401).json({ error: 'Invalid session' });
    }
    req.user = user;
    next();
  }).catch(() => {
    res.status(401).json({ error: 'Authentication failed' });
  });
}

export function assertOwnership(res, resource, message = 'Not found') {
  if (!resource) {
    res.status(404).json({ error: message });
    return false;
  }
  return true;
}

export function optionalAuth(req, res, next) {
  const token = extractToken(req);
  if (!token) {
    return next();
  }

  // Try JWT first
  if (SECRET) {
    try {
      const decoded = jwt.verify(token, SECRET);
      const user = userDb.getById(decoded.userId || decoded.sub);
      if (user) {
        req.user = { id: user.id, email: user.email, name: user.name, credits: user.credits };
        return next();
      }
    } catch {
      // JWT failed, try Neon Auth
    }
  }

  // Try Neon Auth session
  validateNeonSession(token).then(sessionData => {
    const user = resolveUser(sessionData);
    if (user) {
      req.user = user;
    }
    next();
  }).catch(() => {
    next();
  });
}
