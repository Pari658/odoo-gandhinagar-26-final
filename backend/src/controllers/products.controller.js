import { inMemoryStore } from '../db/index.js';

export async function getProducts(req, res) {
  const { type, category, page = 1, pageSize = 20, search } = req.query;
  const pageNum = parseInt(page, 10) || 1;
  const limit = parseInt(pageSize, 10) || 20;

  let items = [...inMemoryStore.products];

  if (type) {
    items = items.filter(p => p.type === type);
  }

  if (category) {
    items = items.filter(p => p.category && p.category.toLowerCase() === category.toLowerCase());
  }

  if (search) {
    const q = search.toLowerCase();
    items = items.filter(p => 
      p.name.toLowerCase().includes(q) || 
      (p.category && p.category.toLowerCase().includes(q))
    );
  }

  const totalCount = items.length;
  const paginated = items.slice((pageNum - 1) * limit, pageNum * limit).map(p => ({
    id: p.id,
    name: p.name,
    type: p.type,
    salesPrice: parseFloat(Number(p.sales_price).toFixed(2)),
    costPrice: parseFloat(Number(p.cost_price).toFixed(2)),
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
}

export async function getProductCategories(req, res) {
  const categoriesSet = new Set(inMemoryStore.product_categories);
  inMemoryStore.products.forEach(p => {
    if (p.category) categoriesSet.add(p.category);
  });

  return res.json({
    success: true,
    data: Array.from(categoriesSet),
    error: null
  });
}

export async function createProduct(req, res) {
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
  if (!inMemoryStore.product_categories.includes(categoryName)) {
    inMemoryStore.product_categories.push(categoryName);
  }

  const newProduct = {
    id: `p-${Date.now().toString().slice(-4)}`,
    name,
    type,
    sales_price: parseFloat(Number(salesPrice).toFixed(2)),
    cost_price: parseFloat(Number(costPrice).toFixed(2)),
    category: categoryName,
    image_url: imageUrl || null,
    is_archived: false,
    created_at: new Date().toISOString()
  };

  inMemoryStore.products.unshift(newProduct);

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
      isArchived: false,
      createdAt: newProduct.created_at
    },
    error: null
  });
}

export async function updateProduct(req, res) {
  const { id } = req.params;
  const index = inMemoryStore.products.findIndex(p => p.id === id);

  if (index === -1) {
    return res.status(404).json({
      success: false,
      data: null,
      error: {
        code: 'NOT_FOUND',
        message: `Product with ID '${id}' not found`
      }
    });
  }

  const existing = inMemoryStore.products[index];
  const { name, type, salesPrice, costPrice, category, imageUrl } = req.body;

  if (category && !inMemoryStore.product_categories.includes(category.trim())) {
    inMemoryStore.product_categories.push(category.trim());
  }

  const updated = {
    ...existing,
    name: name || existing.name,
    type: type || existing.type,
    sales_price: salesPrice !== undefined ? parseFloat(Number(salesPrice).toFixed(2)) : existing.sales_price,
    cost_price: costPrice !== undefined ? parseFloat(Number(costPrice).toFixed(2)) : existing.cost_price,
    category: category ? category.trim() : existing.category,
    image_url: imageUrl !== undefined ? imageUrl : existing.image_url
  };

  inMemoryStore.products[index] = updated;

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
}
