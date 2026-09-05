import bcrypt from 'bcryptjs';
import { pool, query as supabaseQuery } from '../config/supabase.js';

// Initial Seed & Demo Store (matches DB architecture schema 1:1)
const inMemoryStore = {
  users: [
    {
      id: 'u-admin-001',
      login_id: 'adminuser',
      email: 'admin@urbanfurniture.com',
      password_hash: bcrypt.hashSync('admin123', 10),
      role: 'admin',
      is_active: true,
      created_at: new Date().toISOString()
    },
    {
      id: 'u-accountant-001',
      login_id: 'acctuser',
      email: 'accountant@urbanfurniture.com',
      password_hash: bcrypt.hashSync('accountant123', 10),
      role: 'accountant',
      is_active: true,
      created_at: new Date().toISOString()
    },
    {
      id: 'u-contact-001',
      login_id: 'nimesh12',
      email: 'nimesh@pathak.com',
      password_hash: bcrypt.hashSync('contact123', 10),
      role: 'contact',
      is_active: true,
      created_at: new Date().toISOString()
    }
  ],
  refreshTokens: new Set(),
  contacts: [
    {
      id: 'c-101',
      user_id: null,
      name: 'Azure Furniture Ltd.',
      type: 'vendor',
      email: 'contact@azurefurniture.com',
      mobile: '9876543210',
      city: 'Ahmedabad',
      state: 'Gujarat',
      pincode: '380001',
      profile_image_url: 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?w=150',
      is_archived: false,
      created_at: new Date().toISOString()
    },
    {
      id: 'c-102',
      user_id: 'u-contact-001',
      name: 'Nimesh Pathak',
      type: 'customer',
      email: 'nimesh@pathak.com',
      mobile: '9898989898',
      city: 'Anand',
      state: 'Gujarat',
      pincode: '388001',
      profile_image_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      is_archived: false,
      created_at: new Date().toISOString()
    },
    {
      id: 'c-103',
      user_id: null,
      name: 'Rahul Sharma',
      type: 'both',
      email: 'rahul@sharmawood.com',
      mobile: '9797979797',
      city: 'Gandhinagar',
      state: 'Gujarat',
      pincode: '382010',
      profile_image_url: null,
      is_archived: false,
      created_at: new Date().toISOString()
    }
  ],
  products: [
    {
      id: 'p-201',
      name: 'Ergonomic Office Chair',
      type: 'goods',
      sales_price: 3500.00,
      cost_price: 2200.00,
      category: 'Seating',
      image_url: 'https://images.unsplash.com/photo-1580481072645-022f9a6d8310?w=300',
      is_archived: false,
      created_at: new Date().toISOString()
    },
    {
      id: 'p-202',
      name: 'Solid Teak Dining Table',
      type: 'goods',
      sales_price: 12500.00,
      cost_price: 7800.00,
      category: 'Tables',
      image_url: 'https://images.unsplash.com/photo-1530018607912-eff2daa1bac4?w=300',
      is_archived: false,
      created_at: new Date().toISOString()
    },
    {
      id: 'p-203',
      name: 'Custom Wood Polishing Service',
      type: 'service',
      sales_price: 1500.00,
      cost_price: 500.00,
      category: 'Services',
      image_url: null,
      is_archived: false,
      created_at: new Date().toISOString()
    }
  ],
  product_categories: ['Seating', 'Tables', 'Storage', 'Services'],
  chart_of_accounts: [
    {
      id: 'acc-101',
      name: 'HDFC Operating Bank Account',
      type: 'bank',
      report_group: 'balance_sheet',
      is_archived: false,
      created_at: new Date().toISOString()
    },
    {
      id: 'acc-102',
      name: 'Petty Cash',
      type: 'cash',
      report_group: 'balance_sheet',
      is_archived: false,
      created_at: new Date().toISOString()
    },
    {
      id: 'acc-103',
      name: 'Accounts Receivable (Debtors)',
      type: 'asset',
      report_group: 'balance_sheet',
      is_archived: false,
      created_at: new Date().toISOString()
    },
    {
      id: 'acc-201',
      name: 'Accounts Payable (Creditors)',
      type: 'liability',
      report_group: 'balance_sheet',
      is_archived: false,
      created_at: new Date().toISOString()
    },
    {
      id: 'acc-301',
      name: 'Owner Capital A/c',
      type: 'capital',
      report_group: 'balance_sheet',
      is_archived: false,
      created_at: new Date().toISOString()
    },
    {
      id: 'acc-401',
      name: 'Furniture Sales Income',
      type: 'income',
      report_group: 'profit_and_loss',
      is_archived: false,
      created_at: new Date().toISOString()
    },
    {
      id: 'acc-501',
      name: 'Raw Timber Purchase Expense',
      type: 'expense',
      report_group: 'profit_and_loss',
      is_archived: false,
      created_at: new Date().toISOString()
    },
    {
      id: 'acc-502',
      name: 'Workshop Electricity & Utility',
      type: 'other_expense',
      report_group: 'profit_and_loss',
      is_archived: false,
      created_at: new Date().toISOString()
    }
  ],
  journals: [],
  tax_rates: [
    {
      id: 'tax-gst18',
      name: 'GST 18%',
      rate_percent: 18.00,
      linked_account_id: 'acc-201'
    },
    {
      id: 'tax-gst5',
      name: 'GST 5%',
      rate_percent: 5.00,
      linked_account_id: 'acc-201'
    },
    {
      id: 'tax-exempt',
      name: 'Exempt / Zero Tax',
      rate_percent: 0.00,
      linked_account_id: null
    }
  ],
  analytic_accounts: [
    {
      id: 'aa-001',
      name: 'Office Furniture Line',
      type: 'income'
    },
    {
      id: 'aa-002',
      name: 'Teak Raw Material Procurement',
      type: 'expense'
    },
    {
      id: 'aa-003',
      name: 'Gandhinagar Store Renovation Project',
      type: 'expense'
    }
  ],
  sales_orders: [],
  sales_order_lines: []
};

export async function query(text, params = []) {
  try {
    return await supabaseQuery(text, params);
  } catch (err) {
    console.warn('Supabase database query fallback active:', err.message);
  }
  return { rows: [] };
}

export { pool, inMemoryStore };
