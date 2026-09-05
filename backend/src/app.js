import express from 'express';
import cors from 'cors';
import { apiLimiter } from './middlewares/rateLimit.js';

import authRoutes from './routes/auth.routes.js';
import contactsRoutes from './routes/contacts.routes.js';
import productsRoutes from './routes/products.routes.js';
import accountsRoutes from './routes/accounts.routes.js';
import journalsRoutes from './routes/journals.routes.js';
import taxRatesRoutes from './routes/taxRates.routes.js';
import analyticAccountsRoutes from './routes/analyticAccounts.routes.js';
import purchaseOrdersRoutes from './routes/purchaseOrders.routes.js';
import vendorBillsRoutes from './routes/vendorBills.routes.js';
import paymentsRoutes from './routes/payments.routes.js';
import salesOrdersRoutes from './routes/salesOrders.routes.js';
import reportsRoutes from './routes/reports.routes.js';
import budgetsRoutes from './routes/budgets.routes.js';
import customerInvoicesRoutes from './routes/customerInvoices.routes.js';

const app = express();

// ---------------------------------------------------------------------------
// Global Middleware
// ---------------------------------------------------------------------------
app.use(cors({ origin: ['http://localhost:3000', 'http://0.0.0.0:3000'] }));
app.use(express.json({ limit: '10mb' }));
app.use('/api', apiLimiter);

// ---------------------------------------------------------------------------
// Health Check
// ---------------------------------------------------------------------------
app.get(['/health', '/api/health', '/api/v1/health'], (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString()
    },
    error: null
  });
});

// ---------------------------------------------------------------------------
// Route Mounts (supports /api/v1/*, /api/*, and /*)
// ---------------------------------------------------------------------------
app.use(['/api/v1/auth', '/api/auth', '/auth'], authRoutes);
app.use(['/api/v1/contacts', '/api/contacts', '/contacts'], contactsRoutes);
app.use(['/api/v1/products', '/api/products', '/products'], productsRoutes);
app.use(['/api/v1/accounts', '/api/accounts', '/accounts'], accountsRoutes);
app.use(['/api/v1/journals', '/api/journals', '/journals'], journalsRoutes);
app.use(['/api/v1/tax-rates', '/api/tax-rates', '/tax-rates'], taxRatesRoutes);
app.use(['/api/v1/analytic-accounts', '/api/analytic-accounts', '/analytic-accounts'], analyticAccountsRoutes);
app.use(['/api/v1/purchase-orders', '/api/purchase-orders', '/purchase-orders'], purchaseOrdersRoutes);
app.use(['/api/v1/vendor-bills', '/api/vendor-bills', '/vendor-bills'], vendorBillsRoutes);
app.use(['/api/v1/payments', '/api/payments', '/payments'], paymentsRoutes);
app.use(['/api/v1/sales-orders', '/api/sales-orders', '/sales-orders'], salesOrdersRoutes);
app.use(['/api/v1/sales-orders', '/api/sales-orders', '/sales-orders'], salesOrdersRoutes);
app.use(['/api/v1/reports', '/api/reports', '/reports'], reportsRoutes);
app.use(['/api/v1/budgets', '/api/budgets', '/budgets'], budgetsRoutes);
app.use(['/api/v1/customer-invoices', '/api/customer-invoices', '/customer-invoices'], customerInvoicesRoutes);

// ---------------------------------------------------------------------------

// 404 — Catch-all for unmatched routes
// ---------------------------------------------------------------------------
app.use((req, res) => {
  res.status(404).json({
    success: false,
    data: null,
    error: {
      code: 'NOT_FOUND',
      message: `Endpoint ${req.method} ${req.url} not found`
    }
  });
});

// ---------------------------------------------------------------------------
// Global Error Handler
// ---------------------------------------------------------------------------
app.use((err, req, res, _next) => {
  console.error('Unhandled server error:', err);

  res.status(500).json({
    success: false,
    data: null,
    error: {
      code: 'VALIDATION_ERROR',
      message: process.env.NODE_ENV === 'production'
        ? 'Internal server error occurred'
        : (err.message || 'Internal server error occurred')
    }
  });
});

export default app;
