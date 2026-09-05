import bcrypt from 'bcryptjs';
import pool from '../config/supabase.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken
} from '../middlewares/auth.js';

// Simple in-memory set for refresh tokens for the demo
const refreshTokens = new Set();

export async function login(req, res) {
  const loginInput = req.body.loginId || req.body.email || req.body.username;
  const password = req.body.password;

  if (!loginInput || !password) {
    return res.status(400).json({
      success: false, data: null,
      error: { code: 'VALIDATION_ERROR', message: 'Login Id and password are required' }
    });
  }

  try {
    const dbRes = await pool.query(
      `SELECT id, login_id, email, password_hash, role, is_active, created_at
       FROM users
       WHERE LOWER(email) = LOWER($1) OR LOWER(login_id) = LOWER($1)`,
      [loginInput.trim()]
    );

    if (dbRes.rows.length === 0) {
      return res.status(401).json({ success: false, data: null, error: { code: 'UNAUTHORIZED', message: 'Invalid Login Id or Password' } });
    }

    const user = dbRes.rows[0];

    if (!bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ success: false, data: null, error: { code: 'UNAUTHORIZED', message: 'Invalid Login Id or Password' } });
    }

    let linkedContact = null;
    const contactRes = await pool.query(
      'SELECT id, user_id, name, type, email FROM contacts WHERE user_id = $1 OR LOWER(email) = LOWER($2)',
      [user.id, user.email]
    );
    if (contactRes.rows.length > 0) {
      linkedContact = contactRes.rows[0];
    }

    const tokenUserPayload = {
      id: user.id,
      loginId: user.login_id || user.email.split('@')[0],
      email: user.email,
      role: user.role,
      contactId: linkedContact ? linkedContact.id : null,
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
  } catch (err) {
    return res.status(500).json({ success: false, data: null, error: { code: 'SERVER_ERROR', message: err.message } });
  }
}

export async function signup(req, res) {
  const { name, loginId, email, password, confirmPassword, role } = req.body;

  const cleanLoginId = (loginId || '').trim();
  if (!cleanLoginId || cleanLoginId.length < 6 || cleanLoginId.length > 12) {
    return res.status(400).json({ success: false, data: null, error: { code: 'VALIDATION_ERROR', message: 'Invalid loginId' } });
  }
  const cleanEmail = (email || '').trim();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return res.status(400).json({ success: false, data: null, error: { code: 'VALIDATION_ERROR', message: 'Invalid email' } });
  }

  const client = await pool.connect();
  try {
    const dupCheck = await client.query('SELECT id FROM users WHERE LOWER(login_id) = LOWER($1) OR LOWER(email) = LOWER($2)', [cleanLoginId, cleanEmail]);
    if (dupCheck.rows.length > 0) {
      return res.status(409).json({ success: false, data: null, error: { code: 'CONFLICT', message: 'User already exists' } });
    }

    await client.query('BEGIN');
    const passwordHash = bcrypt.hashSync(password, 10);
    const userRole = role && ['customer', 'vendor', 'both'].includes(role) ? role : 'customer';

    const userRes = await client.query(
      `INSERT INTO users (login_id, email, password_hash, role, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, 'contact', true, NOW(), NOW()) RETURNING id, login_id, email`,
      [cleanLoginId, cleanEmail, passwordHash]
    );
    const createdUser = userRes.rows[0];

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

export async function refresh(req, res) {
  const { refreshToken: token } = req.body;
  if (!token || !refreshTokens.has(token)) {
    return res.status(401).json({ success: false, data: null, error: { code: 'UNAUTHORIZED', message: 'Invalid refresh token' } });
  }

  try {
    const decoded = await verifyRefreshToken(token);
    const newAccessToken = generateAccessToken(decoded);
    return res.json({ success: true, data: { accessToken: newAccessToken }, error: null });
  } catch (err) {
    return res.status(401).json({ success: false, data: null, error: { code: 'UNAUTHORIZED', message: 'Expired refresh token' } });
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
