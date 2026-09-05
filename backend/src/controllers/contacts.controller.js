import bcrypt from 'bcryptjs';
import pool from '../config/supabase.js';

export async function getContacts(req, res) {
  try {
    const { type, page = 1, pageSize = 20, search } = req.query;
    const pageNum = parseInt(page, 10) || 1;
    const limit = parseInt(pageSize, 10) || 20;
    const offset = (pageNum - 1) * limit;

    let query = `SELECT * FROM contacts WHERE 1=1`;
    const params = [];
    let paramIndex = 1;

    if (type) {
      query += ` AND (type = $${paramIndex} OR type = 'both')`;
      params.push(type);
      paramIndex++;
    }

    if (search) {
      const q = `%${search.toLowerCase()}%`;
      query += ` AND (LOWER(name) LIKE $${paramIndex} OR LOWER(email) LIKE $${paramIndex} OR LOWER(city) LIKE $${paramIndex})`;
      params.push(q);
      paramIndex++;
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM (${query}) AS filtered_contacts`;
    const countResult = await pool.query(countQuery, params);
    const totalCount = parseInt(countResult.rows[0].count, 10);

    // Get paginated items
    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    const paginated = result.rows.map(c => ({
      id: c.id,
      userId: c.user_id || null,
      name: c.name,
      type: c.type,
      email: c.email || null,
      mobile: c.mobile || null,
      city: c.city || null,
      state: c.state || null,
      pincode: c.pincode || null,
      profileImageUrl: c.profile_image_url || null,
      isArchived: Boolean(c.is_archived),
      createdAt: c.created_at
    }));

    return res.json({
      success: true,
      data: {
        items: paginated,
        page: pageNum,
        pageSize: limit,
        totalCount
      },
      error: null
    });
  } catch (err) {
    return res.status(500).json({ success: false, data: null, error: { code: 'SERVER_ERROR', message: err.message } });
  }
}

export async function getContactById(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query(`SELECT * FROM contacts WHERE id = $1`, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        data: null,
        error: { code: 'NOT_FOUND', message: `Contact with ID '${id}' not found` }
      });
    }

    const contact = result.rows[0];
    return res.json({
      success: true,
      data: {
        id: contact.id,
        userId: contact.user_id || null,
        name: contact.name,
        type: contact.type,
        email: contact.email || null,
        mobile: contact.mobile || null,
        city: contact.city || null,
        state: contact.state || null,
        pincode: contact.pincode || null,
        profileImageUrl: contact.profile_image_url || null,
        isArchived: Boolean(contact.is_archived),
        createdAt: contact.created_at
      },
      error: null
    });
  } catch (err) {
    return res.status(500).json({ success: false, data: null, error: { code: 'SERVER_ERROR', message: err.message } });
  }
}

export async function createContact(req, res) {
  const client = await pool.connect();
  try {
    const { name, type, email, mobile, city, state, pincode, profileImageUrl } = req.body;

    if (!name || !type) {
      return res.status(400).json({
        success: false,
        data: null,
        error: { code: 'VALIDATION_ERROR', message: 'Name and type (customer/vendor/both) are required fields', field: !name ? 'name' : 'type' }
      });
    }

    await client.query('BEGIN');
    let provisionedUserId = null;

    if (email) {
      const existingUser = await client.query(`SELECT id FROM users WHERE LOWER(email) = $1`, [email.toLowerCase()]);
      if (existingUser.rows.length === 0) {
        const passwordHash = bcrypt.hashSync('password123', 10);
        const newUserResult = await client.query(`
          INSERT INTO users (login_id, email, password_hash, role, is_active)
          VALUES ($1, $2, $3, 'contact', true)
          RETURNING id
        `, [email.split('@')[0], email, passwordHash]);
        provisionedUserId = newUserResult.rows[0].id;
      } else {
        provisionedUserId = existingUser.rows[0].id;
      }
    }

    const newContactResult = await client.query(`
      INSERT INTO contacts (user_id, name, type, email, mobile, city, state, pincode, profile_image_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [provisionedUserId, name, type, email || null, mobile || null, city || null, state || null, pincode || null, profileImageUrl || null]);

    await client.query('COMMIT');
    const newContact = newContactResult.rows[0];

    return res.status(201).json({
      success: true,
      data: {
        id: newContact.id,
        userId: newContact.user_id,
        name: newContact.name,
        type: newContact.type,
        email: newContact.email,
        mobile: newContact.mobile,
        city: newContact.city,
        state: newContact.state,
        pincode: newContact.pincode,
        profileImageUrl: newContact.profile_image_url,
        isArchived: false,
        autoProvisionedUser: Boolean(provisionedUserId),
        createdAt: newContact.created_at
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

export async function updateContact(req, res) {
  try {
    const { id } = req.params;
    const { name, type, email, mobile, city, state, pincode, profileImageUrl } = req.body;
    
    // Simplistic update for hackathon
    const fields = [];
    const params = [];
    let i = 1;

    if (name) { fields.push(`name = $${i++}`); params.push(name); }
    if (type) { fields.push(`type = $${i++}`); params.push(type); }
    if (email) { fields.push(`email = $${i++}`); params.push(email); }
    if (mobile) { fields.push(`mobile = $${i++}`); params.push(mobile); }
    if (city) { fields.push(`city = $${i++}`); params.push(city); }
    if (state) { fields.push(`state = $${i++}`); params.push(state); }
    if (pincode) { fields.push(`pincode = $${i++}`); params.push(pincode); }
    if (profileImageUrl !== undefined) { fields.push(`profile_image_url = $${i++}`); params.push(profileImageUrl); }

    if (fields.length === 0) {
      return res.status(400).json({ success: false, data: null, error: { code: 'BAD_REQUEST', message: 'No fields to update' } });
    }

    params.push(id);
    const result = await pool.query(`
      UPDATE contacts SET ${fields.join(', ')} WHERE id = $${i} RETURNING *
    `, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, data: null, error: { code: 'NOT_FOUND', message: `Contact with ID '${id}' not found` } });
    }

    const updated = result.rows[0];
    return res.json({
      success: true,
      data: {
        id: updated.id,
        name: updated.name,
        type: updated.type,
        email: updated.email,
        mobile: updated.mobile,
        city: updated.city,
        state: updated.state,
        pincode: updated.pincode,
        profileImageUrl: updated.profile_image_url,
        isArchived: updated.is_archived
      },
      error: null
    });
  } catch (err) {
    return res.status(500).json({ success: false, data: null, error: { code: 'SERVER_ERROR', message: err.message } });
  }
}

export async function archiveContact(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      UPDATE contacts SET is_archived = NOT is_archived WHERE id = $1 RETURNING *
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, data: null, error: { code: 'NOT_FOUND', message: `Contact with ID '${id}' not found` } });
    }

    return res.json({
      success: true,
      data: {
        id: result.rows[0].id,
        isArchived: result.rows[0].is_archived
      },
      error: null
    });
  } catch (err) {
    return res.status(500).json({ success: false, data: null, error: { code: 'SERVER_ERROR', message: err.message } });
  }
}
