import {
  createSalesOrder,
  getSalesOrders,
  getSalesOrderById,
  confirmSalesOrder,
  updateSalesOrder,
} from '../services/salesOrders.service.js';

/**
 * POST /api/v1/sales-orders
 */
export async function handleCreateSalesOrder(req, res) {
  try {
    const { customerId, orderDate, lines } = req.body;

    // Basic input validation
    if (!customerId || typeof customerId !== 'string') {
      return res.status(400).json({
        success: false,
        data: null,
        error: { code: 'VALIDATION_ERROR', message: 'Valid customerId is required', field: 'customerId' },
      });
    }

    if (orderDate && isNaN(new Date(orderDate).getTime())) {
      return res.status(400).json({
        success: false,
        data: null,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid orderDate format', field: 'orderDate' },
      });
    }

    if (!lines || !Array.isArray(lines) || lines.length === 0) {
      return res.status(400).json({
        success: false,
        data: null,
        error: { code: 'VALIDATION_ERROR', message: 'At least one line item is required', field: 'lines' },
      });
    }

    for (const [i, line] of lines.entries()) {
      if (!line.productId || !line.quantity || !line.unitPrice) {
        return res.status(400).json({
          success: false,
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: `Line ${i + 1}: productId, quantity, and unitPrice are required`,
            field: 'lines',
          },
        });
      }
      if (line.quantity <= 0) {
        return res.status(400).json({
          success: false,
          data: null,
          error: { code: 'VALIDATION_ERROR', message: `Line ${i + 1}: quantity must be greater than 0`, field: 'lines' },
        });
      }
      if (line.unitPrice < 0) {
        return res.status(400).json({
          success: false,
          data: null,
          error: { code: 'VALIDATION_ERROR', message: `Line ${i + 1}: unitPrice cannot be negative`, field: 'lines' },
        });
      }
    }

  
    const createdBy = req.user?.id || null;

    const result = await createSalesOrder({ customerId, orderDate, lines, createdBy });

    res.status(201).json({ success: true, data: result, error: null });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({
      success: false,
      data: null,
      error: { code: err.code || 'SERVER_ERROR', message: err.message, field: err.field },
    });
  }
}

/**
 * GET /api/v1/sales-orders
 */
export async function handleGetSalesOrders(req, res) {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const pageSize = parseInt(req.query.pageSize, 10) || 10;
    const search = req.query.search || '';

    const result = await getSalesOrders({ page, pageSize, search });

    res.json({ success: true, data: result, error: null });
  } catch (err) {
    res.status(500).json({
      success: false,
      data: null,
      error: { code: 'SERVER_ERROR', message: err.message },
    });
  }
}

/**
 * PUT /api/v1/sales-orders/:id
 */
export async function handleUpdateSalesOrder(req, res) {
  try {
    const { customerId, orderDate, lines } = req.body;

    if (!customerId || typeof customerId !== 'string') {
      return res.status(400).json({
        success: false,
        data: null,
        error: { code: 'VALIDATION_ERROR', message: 'Valid customerId is required', field: 'customerId' },
      });
    }

    if (!lines || !Array.isArray(lines) || lines.length === 0) {
      return res.status(400).json({
        success: false,
        data: null,
        error: { code: 'VALIDATION_ERROR', message: 'At least one line item is required', field: 'lines' },
      });
    }

    const result = await updateSalesOrder(req.params.id, { customerId, orderDate, lines });

    res.json({ success: true, data: result, error: null });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({
      success: false,
      data: null,
      error: { code: err.code || 'SERVER_ERROR', message: err.message },
    });
  }
}

/**
 * GET /api/v1/sales-orders/:id
 */
export async function handleGetSalesOrderById(req, res) {
  try {
    const result = await getSalesOrderById(req.params.id);

    res.json({ success: true, data: result, error: null });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({
      success: false,
      data: null,
      error: { code: err.code || 'SERVER_ERROR', message: err.message },
    });
  }
}

/**
 * POST /api/v1/sales-orders/:id/confirm
 */
export async function handleConfirmSalesOrder(req, res) {
  try {
    const result = await confirmSalesOrder(req.params.id);

    res.json({ success: true, data: result, error: null });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({
      success: false,
      data: null,
      error: { code: err.code || 'SERVER_ERROR', message: err.message },
    });
  }
}
