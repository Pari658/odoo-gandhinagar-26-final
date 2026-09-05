import bcrypt from 'bcryptjs';
import { query, pool, inMemoryStore } from '../db/index.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken
} from '../middlewares/auth.js';

/**
 * Login Endpoint
 */
export async function login(req, res) {
  const loginInput = req.body.email || req.body.username;
  const password = req.body.password;

  if (!loginInput || !password) {
    return res.status(400).json({
      success: false,
      data: null,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Login Id and password are required',
        field: !loginInput ? 'loginId' : 'password'
      }
    });
  }

  let user = null;

  // 1. Try querying Supabase PostgreSQL
  try {
    const dbRes = await query(
      `SELECT id, login_id, email, password_hash, role,  is_active, created_at
       FROM users
       WHERE LOWER(email) = LOWER($1) OR LOWER(login_id) = LOWER($1)`,
      [loginInput.trim()]
    );
    if (dbRes && dbRes.rows && dbRes.rows.length > 0) {
      user = dbRes.rows[0];
    }
  } catch (err) {
    console.warn('Supabase DB user query warning:', err.message);
  }

  // 2. Fallback to inMemoryStore if not found in DB
  if (!user) {
    user = inMemoryStore.users.find(u =>
      u.email?.toLowerCase() === loginInput.trim().toLowerCase() ||
      u.login_id?.toLowerCase() === loginInput.trim().toLowerCase()
    );
  }

  // 3. Verify password
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({
      success: false,
      data: null,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid Login Id or Password'
      }
    });
  }

  // 4. Find linked contact from Supabase DB or store
  let linkedContact = null;
  try {
    const contactRes = await query(
      'SELECT id, user_id, name, type, email FROM contacts WHERE user_id = $1 OR LOWER(email) = LOWER($2)',
      [user.id, user.email]
    );
    if (contactRes && contactRes.rows && contactRes.rows.length > 0) {
      linkedContact = contactRes.rows[0];
    }
  } catch (e) {
    console.warn('Contact lookup warning:', e.message);
  }

  if (!linkedContact) {
    linkedContact = inMemoryStore.contacts.find(c =>
      c.id === user.contact_id || c.email?.toLowerCase() === user.email.toLowerCase()
    );
  }

  const tokenUserPayload = {
    id: user.id,
    loginId: user.login_id || user.email.split('@')[0],
    email: user.email,
    role: user.role,
    contactId: user.contact_id || (linkedContact ? linkedContact.id : null),
    contactType: linkedContact ? linkedContact.type : null
  };

  const accessToken = generateAccessToken(tokenUserPayload);
  const refreshToken = generateRefreshToken(tokenUserPayload);

  inMemoryStore.refreshTokens.add(refreshToken);

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
 * Signup Endpoint - Inserts directly into Supabase PostgreSQL database
 */
export async function signup(req, res) {
  const { name, loginId, email, password, confirmPassword, role } = req.body;

  // 1. Login Id Validation: 6-12 characters
  const cleanLoginId = (loginId || '').trim();
  if (!cleanLoginId || cleanLoginId.length < 6 || cleanLoginId.length > 12) {
    return res.status(400).json({
      success: false,
      data: null,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Login Id Should be unique and must be in between 6-12 characters.',
        field: 'loginId'
      }
    });
  }

  // 2. Email Validation
  const cleanEmail = (email || '').trim();
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return res.status(400).json({
      success: false,
      data: null,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'A valid Email Id is required',
        field: 'email'
      }
    });
  }

  // 3. Password Complexity: small case, large case, special char, length > 8
  const hasSmall = /[a-z]/.test(password || '');
  const hasLarge = /[A-Z]/.test(password || '');
  const hasSpecial = /[^A-Za-z0-9]/.test(password || '');
  const isMoreThan8 = (password || '').length > 8;

  if (!password || !hasSmall || !hasLarge || !hasSpecial || !isMoreThan8) {
    return res.status(400).json({
      success: false,
      data: null,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'password must be unique and must contain a small case, a large case and a special character and length should be more than 8 characters',
        field: 'password'
      }
    });
  }

  if (confirmPassword && password !== confirmPassword) {
    return res.status(400).json({
      success: false,
      data: null,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Passwords do not match',
        field: 'confirmPassword'
      }
    });
  }

  // 4. Check Duplicate Login ID in Supabase DB & store
  try {
    const dupLoginRes = await query('SELECT id FROM users WHERE LOWER(login_id) = LOWER($1)', [cleanLoginId]);
    if (dupLoginRes && dupLoginRes.rows && dupLoginRes.rows.length > 0) {
      return res.status(409).json({
        success: false,
        data: null,
        error: {
          code: 'CONFLICT',
          message: 'Login Id should be unique and already exists in database',
          field: 'loginId'
        }
      });
    }
  } catch (e) {
    console.warn('Duplicate login check warning:', e.message);
  }

  const memDupLogin = inMemoryStore.users.find(u => u.login_id?.toLowerCase() === cleanLoginId.toLowerCase());
  if (memDupLogin) {
    return res.status(409).json({
      success: false,
      data: null,
      error: {
        code: 'CONFLICT',
        message: 'Login Id should be unique and already exists in database',
        field: 'loginId'
      }
    });
  }

  // 5. Check Duplicate Email in Supabase DB & store
  try {
    const dupEmailRes = await query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [cleanEmail]);
    if (dupEmailRes && dupEmailRes.rows && dupEmailRes.rows.length > 0) {
      return res.status(409).json({
        success: false,
        data: null,
        error: {
          code: 'CONFLICT',
          message: 'Email Id should not be a duplicate in database',
          field: 'email'
        }
      });
    }
  } catch (e) {
    console.warn('Duplicate email check warning:', e.message);
  }

  const memDupEmail = inMemoryStore.users.find(u => u.email.toLowerCase() === cleanEmail.toLowerCase());
  if (memDupEmail) {
    return res.status(409).json({
      success: false,
      data: null,
      error: {
        code: 'CONFLICT',
        message: 'Email Id should not be a duplicate in database',
        field: 'email'
      }
    });
  }

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

      if (userInsertRes && userInsertRes.rows && userInsertRes.rows.length > 0) {
        createdUser = userInsertRes.rows[0];

        const contactInsertRes = await client.query(
          `INSERT INTO contacts (user_id, name, type, email, is_archived, created_at, updated_at)
           VALUES ($1, $2, $3, $4, false, NOW(), NOW())
           RETURNING id, user_id, name, type, email, created_at`,
          [createdUser.id, contactName, userRole, cleanEmail]
        );

        if (contactInsertRes && contactInsertRes.rows && contactInsertRes.rows.length > 0) {
          createdContact = contactInsertRes.rows[0];
        }
      }

      await client.query('COMMIT');
    } catch (dbErr) {
      await client.query('ROLLBACK').catch(() => {});
      console.warn('Supabase DB Insert Warning (using store fallback):', dbErr.message);
      createdUser = null;
      createdContact = null;
    } finally {
      client.release();
    }
  }

  // 7. Fallback / Sync to store
  if (!createdUser) {
    const userId = `u-${Date.now().toString().slice(-4)}`;
    const contactId = `c-${Date.now().toString().slice(-4)}`;

    createdUser = {
      id: userId,
      login_id: cleanLoginId,
      email: cleanEmail,
      password_hash: passwordHash,
      role: 'contact',
      contact_id: contactId,
      is_active: true,
      created_at: new Date().toISOString()
    };

    createdContact = {
      id: contactId,
      user_id: userId,
      name: contactName,
      type: userRole,
      email: cleanEmail,
      is_archived: false,
      created_at: new Date().toISOString()
    };

    inMemoryStore.users.push(createdUser);
    inMemoryStore.contacts.unshift(createdContact);
  } else {
    // Keep inMemoryStore in sync
    inMemoryStore.users.push({
      ...createdUser,
      password_hash: passwordHash,
      contact_id: createdContact ? createdContact.id : null
    });
    if (createdContact) inMemoryStore.contacts.unshift(createdContact);
  }

  // 8. Generate JWT Tokens & Return Response
  const userPayload = {
    id: createdUser.id,
    loginId: createdUser.login_id,
    email: createdUser.email,
    role: 'contact',
    contactId: createdContact ? createdContact.id : null,
    contactType: createdContact ? createdContact.type : userRole
  };

  const accessToken = generateAccessToken(userPayload);
  const refreshToken = generateRefreshToken(userPayload);

  inMemoryStore.refreshTokens.add(refreshToken);

  console.log(`✅ USER & CONTACT CREATED! ID: ${createdUser.id}, LoginID: ${createdUser.login_id}`);

  return res.status(201).json({
    success: true,
    data: {
      accessToken,
      refreshToken,
      user: {
        id: createdUser.id,
        loginId: createdUser.login_id,
        email: createdUser.email,
        role: 'contact',
        contactId: userPayload.contactId,
        contactType: userPayload.contactType,
        name: createdContact ? createdContact.name : contactName
      }
    },
    error: null
  });
}

/**
 * 2-Way JWT Refresh Endpoint
 */
export async function refresh(req, res) {
  const { refreshToken } = req.body;

  if (!refreshToken || !inMemoryStore.refreshTokens.has(refreshToken)) {
    return res.status(401).json({
      success: false,
      data: null,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid or revoked refresh token'
      }
    });
  }

  try {
    const decoded = await verifyRefreshToken(refreshToken);
    const newAccessToken = generateAccessToken(decoded);

    return res.json({
      success: true,
      data: {
        accessToken: newAccessToken
      },
      error: null
    });
  } catch (err) {
    return res.status(401).json({
      success: false,
      data: null,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Expired or invalid refresh token'
      }
    });
  }
}

/**
 * Logout Endpoint
 */
export async function logout(req, res) {
  const { refreshToken } = req.body;
  if (refreshToken) {
    inMemoryStore.refreshTokens.delete(refreshToken);
  }

  return res.json({
    success: true,
    data: { message: 'Logged out successfully' },
    error: null
  });
}

/**
 * Get Current User Profile
 */
export async function me(req, res) {
  let linkedContact = null;
  try {
    const contactRes = await query(
      'SELECT id, user_id, name, type, email FROM contacts WHERE user_id = $1 OR LOWER(email) = LOWER($2)',
      [req.user.id, req.user.email]
    );
    if (contactRes && contactRes.rows && contactRes.rows.length > 0) {
      linkedContact = contactRes.rows[0];
    }
  } catch (e) {
    console.warn('Contact lookup in /me warning:', e.message);
  }

  if (!linkedContact) {
    linkedContact = inMemoryStore.contacts.find(c =>
      c.id === req.user.contactId || c.email?.toLowerCase() === req.user.email.toLowerCase()
    );
  }

  return res.json({
    success: true,
    data: {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role,
      contactId: req.user.contactId || (linkedContact ? linkedContact.id : null),
      contactType: linkedContact ? linkedContact.type : null,
      name: linkedContact ? linkedContact.name : req.user.email.split('@')[0]
    },
    error: null
  });
}
