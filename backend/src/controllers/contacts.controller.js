import bcrypt from 'bcryptjs';
import { pool } from '../config/supabase.js';

export async function getContacts(req, res, next) {
  try {
    const { type, page = 1, pageSize = 20, search } = req.query;
    const pageNum = parseInt(page, 10) || 1;
    const limit = parseInt(pageSize, 10) || 20;
    const offset = (pageNum - 1) * limit;

    let queryStr = `SELECT * FROM contacts WHERE 1=1`;
    let countQueryStr = `SELECT COUNT(*) FROM contacts WHERE 1=1`;
    const params = [];

    if (type) {
      params.push(type);
      queryStr += ` AND (type = $${params.length} OR type = 'both')`;
      countQueryStr += ` AND (type = $${params.length} OR type = 'both')`;
    }

    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      const searchClause = ` AND (LOWER(name) LIKE $${params.length} OR LOWER(email) LIKE $${params.length} OR LOWER(city) LIKE $${params.length})`;
      queryStr += searchClause;
      countQueryStr += searchClause;
    }

    queryStr += ` ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;

    const [itemsResult, countResult] = await Promise.all([
      pool.query(queryStr, params),
      pool.query(countQueryStr, params)
    ]);

    const paginated = itemsResult.rows.map(c => ({
      id: c.id,
      userId: c.user_id,
      name: c.name,
      type: c.type,
      email: c.email,
      mobile: c.mobile,
      city: c.city,
      state: c.state,
      pincode: c.pincode,
      profileImageUrl: c.profile_image_url,
      isArchived: c.is_archived,
      createdAt: c.created_at
    }));

    return res.json({
      success: true,
      data: {
        items: paginated,
        page: pageNum,
        pageSize: limit,
        totalCount: Number(countResult.rows[0].count)
      },
      error: null
    });
  } catch (err) {
    next(err);
  }
}

export async function getContactById(req, res, next) {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM contacts WHERE id = $1', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        data: null,
        error: {
          code: 'NOT_FOUND',
          message: `Contact with ID '${id}' not found`
        }
      });
    }

    const c = result.rows[0];
    return res.json({
      success: true,
      data: {
        id: c.id,
        userId: c.user_id,
        name: c.name,
        type: c.type,
        email: c.email,
        mobile: c.mobile,
        city: c.city,
        state: c.state,
        pincode: c.pincode,
        profileImageUrl: c.profile_image_url,
        isArchived: c.is_archived,
        createdAt: c.created_at
      },
      error: null
    });
  } catch (err) {
    next(err);
  }
}

export async function createContact(req, res, next) {
  const client = await pool.connect();
  try {
    const { name, type, email, mobile, city, state, pincode, profileImageUrl } = req.body;

    if (!name || !type) {
      return res.status(400).json({
        success: false,
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Name and type (customer/vendor/both) are required fields',
          field: !name ? 'name' : 'type'
        }
      });
    }

    await client.query('BEGIN');

    let provisionedUserId = null;
    if (email) {
      const userRes = await client.query('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [email]);
      if (userRes.rowCount === 0) {
        const hash = bcrypt.hashSync('password123', 10);
        const newUserRes = await client.query(
          'INSERT INTO users (email, password_hash, role, is_active, created_at) VALUES ($1, $2, $3, true, NOW()) RETURNING id',
          [email, hash, 'contact']
        );
        provisionedUserId = newUserRes.rows[0].id;
      } else {
        provisionedUserId = userRes.rows[0].id;
      }
    }

    const newContactRes = await client.query(
      `INSERT INTO contacts (user_id, name, type, email, mobile, city, state, pincode, profile_image_url, is_archived, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, false, NOW()) RETURNING *`,
      [provisionedUserId, name, type, email || null, mobile || null, city || null, state || null, pincode || null, profileImageUrl || null]
    );

    await client.query('COMMIT');

    const c = newContactRes.rows[0];
    return res.status(201).json({
      success: true,
      data: {
        id: c.id,
        userId: c.user_id,
        name: c.name,
        type: c.type,
        email: c.email,
        mobile: c.mobile,
        city: c.city,
        state: c.state,
        pincode: c.pincode,
        profileImageUrl: c.profile_image_url,
        isArchived: c.is_archived,
        autoProvisionedUser: Boolean(provisionedUserId),
        createdAt: c.created_at
      },
      error: null
    });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

export async function updateContact(req, res, next) {
  try {
    const { id } = req.params;
    const { name, type, email, mobile, city, state, pincode, profileImageUrl } = req.body;
    
    // Check if exists
    const existing = await pool.query('SELECT * FROM contacts WHERE id = $1', [id]);
    if (existing.rowCount === 0) {
      return res.status(404).json({
        success: false,
        data: null,
        error: { code: 'NOT_FOUND', message: `Contact not found` }
      });
    }

    const e = existing.rows[0];
    
    const updatedRes = await pool.query(
      `UPDATE contacts SET
         name = COALESCE($1, name),
         type = COALESCE($2, type),
         email = COALESCE($3, email),
         mobile = COALESCE($4, mobile),
         city = COALESCE($5, city),
         state = COALESCE($6, state),
         pincode = COALESCE($7, pincode),
         profile_image_url = $8
       WHERE id = $9 RETURNING *`,
      [name, type, email, mobile, city, state, pincode, profileImageUrl !== undefined ? profileImageUrl : e.profile_image_url, id]
    );

    const c = updatedRes.rows[0];
    return res.json({
      success: true,
      data: {
        id: c.id,
        name: c.name,
        type: c.type,
        email: c.email,
        mobile: c.mobile,
        city: c.city,
        state: c.state,
        pincode: c.pincode,
        profileImageUrl: c.profile_image_url,
        isArchived: c.is_archived
      },
      error: null
    });
  } catch (err) {
    next(err);
  }
}

export async function archiveContact(req, res, next) {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'UPDATE contacts SET is_archived = NOT is_archived WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        data: null,
        error: { code: 'NOT_FOUND', message: `Contact not found` }
      });
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
    next(err);
  }
}
