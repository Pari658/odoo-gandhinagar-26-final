import pool from '../config/supabase.js';

export async function getProducts(req, res) {
  try {
    const { type, category, page = 1, pageSize = 20, search } = req.query;
    const pageNum = parseInt(page, 10) || 1;
    const limit = parseInt(pageSize, 10) || 20;
    const offset = (pageNum - 1) * limit;

    let query = `SELECT * FROM products WHERE 1=1`;
    const params = [];
    let paramIndex = 1;

    if (type) {
      query += ` AND type = $${paramIndex}`;
      params.push(type);
      paramIndex++;
    }

    if (category) {
      query += ` AND LOWER(category) = $${paramIndex}`;
      params.push(category.toLowerCase());
      paramIndex++;
    }

    if (search) {
      const q = `%${search.toLowerCase()}%`;
      query += ` AND (LOWER(name) LIKE $${paramIndex} OR LOWER(category) LIKE $${paramIndex})`;
      params.push(q);
      paramIndex++;
    }

    const countQuery = `SELECT COUNT(*) FROM (${query}) AS filtered_products`;
    const countResult = await pool.query(countQuery, params);
    const totalCount = parseInt(countResult.rows[0].count, 10);

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    const paginated = result.rows.map(p => ({
      id: p.id,
      name: p.name,
      type: p.type,
      salesPrice: parseFloat(p.sales_price),
      costPrice: parseFloat(p.cost_price),
      category: p.category || 'General',
      imageUrl: p.image_url || null,
      isArchived: Boolean(p.is_archived),
      createdAt: p.created_at
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

export async function getProductCategories(req, res) {
  try {
    const result = await pool.query(`SELECT DISTINCT category FROM products WHERE category IS NOT NULL`);
    const categories = result.rows.map(row => row.category);

    return res.json({
      success: true,
      data: categories,
      error: null
    });
  } catch (err) {
    return res.status(500).json({ success: false, data: null, error: { code: 'SERVER_ERROR', message: err.message } });
  }
}

export async function createProduct(req, res) {
  try {
    const { name, type, salesPrice, costPrice, category, imageUrl } = req.body;

    if (!name || !type || salesPrice === undefined || costPrice === undefined) {
      return res.status(400).json({
        success: false,
        data: null,
        error: { code: 'VALIDATION_ERROR', message: 'Name, type, salesPrice, and costPrice are required', field: !name ? 'name' : (!type ? 'type' : 'salesPrice') }
      });
    }

    const categoryName = category && category.trim() ? category.trim() : 'General';

    const result = await pool.query(`
      INSERT INTO products (name, type, sales_price, cost_price, category, image_url)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [name, type, salesPrice, costPrice, categoryName, imageUrl || null]);

    const newProduct = result.rows[0];

    return res.status(201).json({
      success: true,
      data: {
        id: newProduct.id,
        name: newProduct.name,
        type: newProduct.type,
        salesPrice: newProduct.sales_price,
        costPrice: newProduct.cost_price,
        category: newProduct.category,
        imageUrl: newProduct.image_url,
        isArchived: newProduct.is_archived,
        createdAt: newProduct.created_at
      },
      error: null
    });
  } catch (err) {
    return res.status(500).json({ success: false, data: null, error: { code: 'SERVER_ERROR', message: err.message } });
  }
}

export async function updateProduct(req, res) {
  try {
    const { id } = req.params;
    const { name, type, salesPrice, costPrice, category, imageUrl } = req.body;

    const fields = [];
    const params = [];
    let i = 1;

    if (name) { fields.push(`name = $${i++}`); params.push(name); }
    if (type) { fields.push(`type = $${i++}`); params.push(type); }
    if (salesPrice !== undefined) { fields.push(`sales_price = $${i++}`); params.push(salesPrice); }
    if (costPrice !== undefined) { fields.push(`cost_price = $${i++}`); params.push(costPrice); }
    if (category) { fields.push(`category = $${i++}`); params.push(category.trim()); }
    if (imageUrl !== undefined) { fields.push(`image_url = $${i++}`); params.push(imageUrl); }

    if (fields.length === 0) {
      return res.status(400).json({ success: false, data: null, error: { code: 'BAD_REQUEST', message: 'No fields to update' } });
    }

    params.push(id);
    const result = await pool.query(`
      UPDATE products SET ${fields.join(', ')} WHERE id = $${i} RETURNING *
    `, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, data: null, error: { code: 'NOT_FOUND', message: `Product with ID '${id}' not found` } });
    }

    const updated = result.rows[0];

    return res.json({
      success: true,
      data: {
        id: updated.id,
        name: updated.name,
        type: updated.type,
        salesPrice: updated.sales_price,
        costPrice: updated.cost_price,
        category: updated.category,
        imageUrl: updated.image_url,
        isArchived: updated.is_archived
      },
      error: null
    });
  } catch (err) {
    return res.status(500).json({ success: false, data: null, error: { code: 'SERVER_ERROR', message: err.message } });
  }
}
