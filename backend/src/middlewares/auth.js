import jwt from 'jsonwebtoken';

function getAccessSecret() {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) throw new Error('JWT_ACCESS_SECRET env variable is not set');
  return secret;
}

function getRefreshSecret() {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) throw new Error('JWT_REFRESH_SECRET env variable is not set');
  return secret;
}

/**
 * Generate Access Token (Short-lived 90 mins)
 */
export function generateAccessToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      contactId: user.contact_id || user.contactId || null
    },
    getAccessSecret(),
    { expiresIn: '90m' } // Set to 90 minutes as requested
  );
}

/**
 * Generate Refresh Token (Long-lived 7 days)
 */
export function generateRefreshToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      contactId: user.contact_id || user.contactId || null
    },
    getRefreshSecret(),
    { expiresIn: '7d' }
  );
}

/**
 * Verify Refresh Token
 */
export function verifyRefreshToken(token) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, getRefreshSecret(), (err, decoded) => {
      if (err) return reject(err);
      resolve(decoded);
    });
  });
}

/**
 * Authentication Middleware
 * Checks Authorization: Bearer <accessToken>
 */
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      data: null,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Access token missing'
      }
    });
  }

  jwt.verify(token, getAccessSecret(), (err, user) => {
    if (err) {
      return res.status(401).json({
        success: false,
        data: null,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid or expired access token'
        }
      });
    }

    req.user = user;
    next();
  });
}

/**
 * RBAC Authorization Middleware
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        data: null,
        error: {
          code: 'FORBIDDEN',
          message: `Access denied. Required role: ${allowedRoles.join(', ')}`
        }
      });
    }
    next();
  };
}
