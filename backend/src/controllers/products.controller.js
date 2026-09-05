import { pool } from '../config/supabase.js';

export async function getProducts(req, res, next) {
  try {
    const { type, category, page = 1, pageSize = 20, search } = req.query;
    const pageNum = parseInt(page, 10) || 1;
    const limit = parseInt(pageSize, 10) || 20;
    const offset = (pageNum - 1) * limit;

    let queryStr = `SELECT * FROM products WHERE 1=1`;
    let countQueryStr = `SELECT COUNT(*) FROM products WHERE 1=1`;
    const params = [];

    if (type) {
      params.push(type);
      queryStr += ` AND type = $${params.length}`;
      countQueryStr += ` AND type = $${params.length}`;
    }

    if (category) {
      params.push(category);
      queryStr += ` AND LOWER(category) = LOWER($${params.length})`;
      countQueryStr += ` AND LOWER(category) = LOWER($${params.length})`;
    }

    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      const searchClause = ` AND (LOWER(name) LIKE $${params.length} OR LOWER(category) LIKE $${params.length})`;
      queryStr += searchClause;
      countQueryStr += searchClause;
    }

    queryStr += ` ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;

    const [itemsResult, countResult] = await Promise.all([
      pool.query(queryStr, params),
      pool.query(countQueryStr, params)
    ]);

    const paginated = itemsResult.rows.map(p => ({
      id: p.id,
      name: p.name,
      type: p.type,
      salesPrice: parseFloat(Number(p.sales_price).toFixed(2)),
      costPrice: parseFloat(Number(p.cost_price).toFixed(2)),
      category: p.category || 'General',
      imageUrl: p.image_url,
      isArchived: p.is_archived,
      createdAt: p.created_at
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

export async function getProductCategories(req, res, next) {
  try {
    const result = await pool.query('SELECT DISTINCT category FROM products WHERE category IS NOT NULL');
    const categories = result.rows.map(r => r.category);
    
    return res.json({
      success: true,
      data: categories.length > 0 ? categories : ['General'],
      error: null
    });
  } catch (err) {
    next(err);
  }
}

export async function createProduct(req, res, next) {
  try {
    const { name, type, salesPrice, costPrice, category, imageUrl } = req.body;

    if (!name || !type || salesPrice === undefined || costPrice === undefined) {
      return res.status(400).json({
        success: false,
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Name, type, salesPrice, and costPrice are required',
          field: !name ? 'name' : (!type ? 'type' : 'salesPrice')
        }
      });
    }

    const categoryName = category && category.trim() ? category.trim() : 'General';

    const result = await pool.query(
      `INSERT INTO products (name, type, sales_price, cost_price, category, image_url, is_archived, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, false, NOW()) RETURNING *`,
      [name, type, salesPrice, costPrice, categoryName, imageUrl || null]
    );

    const p = result.rows[0];
    return res.status(201).json({
      success: true,
      data: {
        id: p.id,
        name: p.name,
        type: p.type,
        salesPrice: parseFloat(Number(p.sales_price).toFixed(2)),
        costPrice: parseFloat(Number(p.cost_price).toFixed(2)),
        category: p.category,
        imageUrl: p.image_url,
        isArchived: p.is_archived,
        createdAt: p.created_at
      },
      error: null
    });
  } catch (err) {
    next(err);
  }
}

export async function updateProduct(req, res, next) {
  try {
    const { id } = req.params;
    const { name, type, salesPrice, costPrice, category, imageUrl } = req.body;
    
    const existing = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
    if (existing.rowCount === 0) {
      return res.status(404).json({
        success: false,
        data: null,
        error: { code: 'NOT_FOUND', message: `Product not found` }
      });
    }

    const e = existing.rows[0];
    
    const result = await pool.query(
      `UPDATE products SET
         name = COALESCE($1, name),
         type = COALESCE($2, type),
         sales_price = COALESCE($3, sales_price),
         cost_price = COALESCE($4, cost_price),
         category = COALESCE($5, category),
         image_url = $6
       WHERE id = $7 RETURNING *`,
      [name, type, salesPrice, costPrice, category, imageUrl !== undefined ? imageUrl : e.image_url, id]
    );

    const p = result.rows[0];
    return res.json({
      success: true,
      data: {
        id: p.id,
        name: p.name,
        type: p.type,
        salesPrice: parseFloat(Number(p.sales_price).toFixed(2)),
        costPrice: parseFloat(Number(p.cost_price).toFixed(2)),
        category: p.category,
        imageUrl: p.image_url,
        isArchived: p.is_archived
      },
      error: null
    });
  } catch (err) {
    next(err);
  }
}
