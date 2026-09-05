import bcrypt from 'bcryptjs';
import { query, pool, inMemoryStore } from '../db/index.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken
} from '../middlewares/auth.js';

// Simple in-memory set for refresh tokens for the demo
const refreshTokens = new Set();

export async function login(req, res) {
  const loginInput = req.body.email || req.body.username;
  const password = req.body.password;

  if (!loginInput || !password) {
    return res.status(400).json({
      success: false,
      // data: null,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Login Id and password are required',
        field: !loginInput ? 'loginId' : 'password'
      }
    });
  }

  let user = null;
  let linkedContact = null;

  // 1. Single JOIN Query: Fetch User + Linked Contact in 1 DB Roundtrip
  try {
    const dbRes = await pool.query(
      `SELECT u.id, u.login_id, u.email, u.password_hash, u.role, u.is_active, u.created_at,
              c.id AS contact_id, c.name AS contact_name, c.type AS contact_type
       FROM users u
       LEFT JOIN contacts c ON c.user_id = u.id OR LOWER(c.email) = LOWER(u.email)
       WHERE LOWER(u.email) = LOWER($1) OR LOWER(u.login_id) = LOWER($1)
       LIMIT 1`,
      [loginInput.trim()]
    );
    if (dbRes && dbRes.rows && dbRes.rows.length > 0) {
      const row = dbRes.rows[0];
      user = {
        id: row.id,
        login_id: row.login_id,
        email: row.email,
        password_hash: row.password_hash,
        role: row.role,
        is_active: row.is_active,
        created_at: row.created_at
      };
      if (row.contact_id) {
        linkedContact = {
          id: row.contact_id,
          name: row.contact_name,
          type: row.contact_type
        };
      }
    }
  } catch (err) {
    console.warn('Supabase DB user query warning:', err.message);
  }

  // 2. DB fallback removed as we are completely on Postgres


  // 3. Verify password
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid Login Id or Password'
      }
    });
  }

  // (Contact fallback removed)

  const tokenUserPayload = {
    id: user.id,
    loginId: user.login_id,
    email: user.email,
    role: user.role,
    contactId: user.contact_id || (linkedContact ? linkedContact.id : null),
    contactType: linkedContact ? linkedContact.type : null
  };

    const accessToken = generateAccessToken(tokenUserPayload);
    const refreshToken = generateRefreshToken(tokenUserPayload);

    refreshTokens.add(refreshToken);

    return res.json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          loginId: user.login_id || user.email.split('@')[0],
          email: user.email,
          role: user.role,
          contactId: tokenUserPayload.contactId,
          contactType: tokenUserPayload.contactType,
          name: linkedContact ? linkedContact.name : (user.login_id || user.email.split('@')[0])
        }
      },
      error: null
    });
}


/**
 * Signup Endpoint - Optimized Single Query Duplicate Check & Direct DB Insertion
 */
export async function signup(req, res) {
  const { name, loginId, email, password, role } = req.body;

  const cleanLoginId = (loginId || '').trim();
  if (!cleanLoginId || cleanLoginId.length < 6 || cleanLoginId.length > 12) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Login Id Should be unique and must be in between 6-12 characters.',
        field: 'loginId'
      }
    });
  }
  const cleanEmail = (email || '').trim();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'A valid Email Id is required',
        field: 'email'
      }
    });
  }

  // 3. Password Check
  const hasSmall = /[a-z]/.test(password);
  const hasLarge = /[A-Z]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  
  if (!password || password.length <= 8 || !hasSmall || !hasLarge || !hasSpecial) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'password must be unique and must contain a small case, a large case and a special character and length should be more than 8 characters',
        field: 'password'
      }
    });
  }

  // 4. Single SQL Query Duplicate Check (Checks Login ID & Email in 1 DB Roundtrip)
  try {
    const dupRes = await pool.query(
      'SELECT login_id, email FROM users WHERE LOWER(login_id) = LOWER($1) OR LOWER(email) = LOWER($2)',
      [cleanLoginId, cleanEmail]
    );
    if (dupRes && dupRes.rows && dupRes.rows.length > 0) {
      for (const row of dupRes.rows) {
        if (row.login_id?.toLowerCase() === cleanLoginId.toLowerCase()) {
          return res.status(409).json({
            success: false,
            error: {
              code: 'CONFLICT',
              message: 'Login Id should be unique and already exists in database',
              field: 'loginId'
            }
          });
        }
        if (row.email?.toLowerCase() === cleanEmail.toLowerCase()) {
          return res.status(409).json({
            success: false,
            error: {
              code: 'CONFLICT',
              message: 'Email Id should not be a duplicate in database',
              field: 'email'
            }
          });
        }
      }
    }
  } catch (e) {
    console.warn('Duplicate check warning:', e.message);
  }

  // Fallback memory checks removed
  const userRole = role && ['customer', 'vendor', 'both'].includes(role) ? role : 'customer';
  const passwordHash = bcrypt.hashSync(password, 10);
  const contactName = name && name.trim() ? name.trim() : cleanLoginId;

  let createdUser = null;
  let createdContact = null;

  // 6. SQL INSERT Into Supabase PostgreSQL Database — wrapped in a transaction
  const client = await pool.connect().catch(() => null);

  if (client) {
    try {
      await client.query('BEGIN');

      const userInsertRes = await client.query(
        `INSERT INTO users (login_id, email, password_hash, role, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, 'contact', true, NOW(), NOW())
         RETURNING id, login_id, email, role, created_at`,
        [cleanLoginId, cleanEmail, passwordHash]
      );
      createdUser = userInsertRes.rows[0];

    const contactRes = await client.query(
      `INSERT INTO contacts (user_id, name, type, email, is_archived, created_at, updated_at)
       VALUES ($1, $2, $3, $4, false, NOW(), NOW()) RETURNING id, type, name`,
      [createdUser.id, name || cleanLoginId, userRole, cleanEmail]
    );
    const createdContact = contactRes.rows[0];

    await client.query('COMMIT');

    const tokenPayload = {
      id: createdUser.id,
      loginId: createdUser.login_id,
      email: createdUser.email,
      role: 'contact',
      contactId: createdContact.id,
      contactType: createdContact.type
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);
    refreshTokens.add(refreshToken);

    return res.status(201).json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: { ...tokenPayload, name: createdContact.name }
      },
      error: null
    });
  } catch (err) {
    await client.query('ROLLBACK');
    return res.status(500).json({ success: false, data: null, error: { code: 'SERVER_ERROR', message: err.message } });
  } finally {
    client.release();
  }
}
}

export async function refresh(req, res) {
  const { refreshToken } = req.body;

  if (!refreshToken || !refreshTokens.has(refreshToken)) {
    return res.status(401).json({
      success: false,
      // data: null,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid or revoked refresh token'
      }
    });
  }

  try {
    const decoded = await verifyRefreshToken(refreshToken);
    const newAccessToken = generateAccessToken(decoded);
    return res.json({ success: true, data: { accessToken: newAccessToken }, error: null });
  } catch (err) {
    return res.status(401).json({
      success: false,
      // data: null,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Expired or invalid refresh token'
      }
    });
  }
}

export async function logout(req, res) {
  const { refreshToken: token } = req.body;
  if (token) refreshTokens.delete(token);
  return res.json({ success: true, data: { message: 'Logged out' }, error: null });
}

export async function me(req, res) {
  try {
    let linkedContact = null;
    const contactRes = await pool.query(
      'SELECT id, name, type FROM contacts WHERE user_id = $1 OR LOWER(email) = LOWER($2)',
      [req.user.id, req.user.email]
    );
    if (contactRes.rows.length > 0) linkedContact = contactRes.rows[0];

    return res.json({
      success: true,
      data: {
        id: req.user.id,
        email: req.user.email,
        role: req.user.role,
        contactId: linkedContact ? linkedContact.id : null,
        contactType: linkedContact ? linkedContact.type : null,
        name: linkedContact ? linkedContact.name : req.user.email.split('@')[0]
      },
      error: null
    });
  } catch (err) {
    return res.status(500).json({ success: false, data: null, error: { code: 'SERVER_ERROR', message: err.message } });
  }
}
