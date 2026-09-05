import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.routes.js';
import contactsRoutes from './routes/contacts.routes.js';
import productsRoutes from './routes/products.routes.js';
import accountsRoutes from './routes/accounts.routes.js';
import journalsRoutes from './routes/journals.routes.js';
import taxRatesRoutes from './routes/taxRates.routes.js';
import analyticAccountsRoutes from './routes/analyticAccounts.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get(['/health', '/api/health', '/api/v1/health'], (req, res) => {
  res.json({ 
    status: 'ok', 
    supabaseUrl: process.env.SUPABASE_URL || 'Configured', 
    databaseHost: process.env.DB_HOST || 'aws-0-ap-south-1.pooler.supabase.com',
    timestamp: new Date().toISOString() 
  });
});

// Flexible Route Mounts (supports /api/v1/*, /api/*, and /*)
app.use(['/api/v1/auth', '/api/auth', '/auth'], authRoutes);
app.use(['/api/v1/contacts', '/api/contacts', '/contacts'], contactsRoutes);
app.use(['/api/v1/products', '/api/products', '/products'], productsRoutes);
app.use(['/api/v1/accounts', '/api/accounts', '/accounts'], accountsRoutes);
app.use(['/api/v1/journals', '/api/journals', '/journals'], journalsRoutes);
app.use(['/api/v1/tax-rates', '/api/tax-rates', '/tax-rates'], taxRatesRoutes);
app.use(['/api/v1/analytic-accounts', '/api/analytic-accounts', '/analytic-accounts'], analyticAccountsRoutes);

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

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    data: null,
    error: {
      code: 'VALIDATION_ERROR',
      message: err.message || 'Internal server error occurred'
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Urban Furniture ERP Backend running on port ${PORT}`);
  console.log(`🔗 API Base: http://localhost:${PORT}/api/v1`);
});

export default app;
