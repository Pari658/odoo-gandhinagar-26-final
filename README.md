# 🪑 Urban Furniture — Accounting & ERP System

A full-stack, modern ERP and accounting platform built for furniture retail businesses. Manage your entire operation — from purchase orders and vendor bills to sales orders, customer invoices, budgets, and financial reports — all from a single, beautifully designed interface.

---

## 📸 Overview

**Urban Furniture** is a production-grade web application that provides:

- **Double-entry accounting** with journals, chart of accounts, and a general ledger
- **Procurement-to-payment** workflow (Purchase Orders → Vendor Bills → Payments)
- **Order-to-cash** workflow (Sales Orders → Customer Invoices → Payments)
- **Budget management** with real-time spend tracking tied to analytic accounts
- **Role-based access control** (Admin, Accountant, Contact/Customer portal)
- **Financial reporting** (Trial Balance, Balance Sheet, Profit & Loss, General Ledger)

---

## 🛠️ Tech Stack

| Layer        | Technology                                                                 |
| ------------ | -------------------------------------------------------------------------- |
| **Frontend** | React 19, Vite, Tailwind CSS 4, Framer Motion, Lucide Icons               |
| **Backend**  | Node.js, Express 4, Zod (validation), JWT (auth), bcrypt                   |
| **Database** | PostgreSQL (hosted on Supabase), `pg` driver, raw SQL                      |
| **Auth**     | JWT Access + Refresh tokens, role-based middleware (`admin` / `accountant` / `contact`) |

---

## 📂 Project Structure

```
odoo-gandhinagar-26-final/
├── backend/
│   ├── src/
│   │   ├── app.js                  # Express app setup, middleware, route mounts
│   │   ├── server.js               # HTTP server entry point
│   │   ├── config/                  # Supabase/PG pool configuration
│   │   ├── controllers/            # Request handlers (14 controllers)
│   │   │   ├── auth.controller.js
│   │   │   ├── contacts.controller.js
│   │   │   ├── products.controller.js
│   │   │   ├── accounts.controller.js
│   │   │   ├── journals.controller.js
│   │   │   ├── taxRates.controller.js
│   │   │   ├── analyticAccounts.controller.js
│   │   │   ├── purchaseOrders.controller.js
│   │   │   ├── vendorBills.controller.js
│   │   │   ├── salesOrders.controller.js
│   │   │   ├── customerInvoices.controller.js
│   │   │   ├── payments.controller.js
│   │   │   ├── budgets.controller.js
│   │   │   └── reports.controller.js
│   │   ├── routes/                  # Express route definitions
│   │   ├── schemas/                 # Zod validation schemas
│   │   ├── services/                # Business logic (sales orders, ledger)
│   │   ├── middlewares/             # Auth, rate limiting, validation
│   │   ├── lib/                     # Helpers and utilities
│   │   ├── db/                      # Database connection & queries
│   │   └── scripts/                 # Seed/demo data scripts
│   ├── .env                         # Environment variables
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx                  # Main app shell, tab routing, sidebar
│   │   ├── main.jsx                 # Vite entry point
│   │   ├── index.css                # Global styles
│   │   ├── api/                     # API client & service wrappers
│   │   │   ├── client.js            # Centralized fetch wrapper with auth
│   │   │   └── salesOrders.js       # Sales Orders API functions
│   │   ├── context/                 # React Context (AuthContext)
│   │   └── components/              # UI Modules (31 components)
│   │       ├── LandingPage.jsx
│   │       ├── AuthPage.jsx
│   │       ├── Sidebar.jsx
│   │       ├── AdminDashboard.jsx
│   │       ├── ContactsModule.jsx
│   │       ├── ProductsModule.jsx
│   │       ├── AccountsModule.jsx
│   │       ├── JournalsModule.jsx
│   │       ├── TaxRatesModule.jsx
│   │       ├── AnalyticAccountsModule.jsx
│   │       ├── PurchaseOrdersModule.jsx
│   │       ├── SalesOrdersModule.jsx
│   │       ├── VendorBillsModule.jsx
│   │       ├── BillsInvoicesModule.jsx
│   │       ├── CustomerBillsModule.jsx
│   │       ├── PaymentsModule.jsx
│   │       ├── BudgetModule.jsx
│   │       ├── ReportsModule.jsx
│   │       └── ... (detail, form, and modal sub-components)
│   └── package.json
│
├── database.md                      # Full PostgreSQL schema reference
└── README.md                        # ← You are here
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+ (v20 recommended)
- **npm** v9+
- A **PostgreSQL** database (e.g., [Supabase](https://supabase.com/) free tier)

### 1. Clone the Repository

```bash
git clone https://github.com/Pari658/odoo-gandhinagar-26-final.git
cd odoo-gandhinagar-26-final
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory:

```env
PORT=5000
SUPABASE_CONNECTION_STRING=postgresql://user:password@host:5432/dbname
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_supabase_anon_key
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
```

Start the backend:

```bash
npm run dev     # Development (auto-restart on changes)
npm start       # Production
```

The API will be available at `http://localhost:5000`.

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:3000`.

---

## 🔐 Authentication & Roles

The system uses JWT-based authentication with three user roles:

| Role          | Access Level                                                                 |
| ------------- | ---------------------------------------------------------------------------- |
| **Admin**     | Full access to all modules, CRUD on all resources, manage users              |
| **Accountant**| Full access to all accounting modules, can create/confirm/delete records     |
| **Contact**   | Customer portal only — can view their own purchases and bills (My Bills tab) |

### Default Credentials

Use the Sign Up flow on the Auth page, or seed the database with demo data using the Budget module's demo seed functionality.

---

## 📋 Modules & Features

### Master Data
- **Contacts** — Customers, vendors, or both. Includes name, email, mobile, city, state, pincode, and profile images.
- **Products** — Goods and services with sales price, cost price, category, and images.
- **Chart of Accounts** — Categorized by type (asset, liability, equity, income, expense) and report group (balance sheet, profit & loss).
- **Journals** — Sales, Purchase, Bank, Cash journals with default debit/credit accounts.
- **Tax Rates** — Configurable tax rates applied to order lines.
- **Analytic Accounts** — Cost centers for tracking expenses across departments or projects.

### Procurement (Purchase-to-Pay)
- **Purchase Orders** — Create, confirm, and convert to vendor bills.
- **Vendor Bills** — Receive bills from vendors, confirm to post journal entries. On confirmation, budget impact is calculated and returned in real time.
- **Payments** — Register partial or full payments against vendor bills.

### Sales (Order-to-Cash)
- **Sales Orders** — Create, confirm, and invoice. Draft → Confirmed → Invoiced workflow.
- **Customer Invoices** — Automatically generated when a sales order is invoiced. Creates journal entries in the ledger.

### Financial Management
- **Budgets** — Create budgets tied to analytic accounts with date ranges. Track committed vs. achieved amounts in real time. Budget deductions happen automatically when vendor bills are confirmed.
- **Bills & Invoices** — Unified view of all vendor bills and customer invoices with full document detail modals, summary statistics, and direct navigation from Sales Orders and Vendor Bills.
- **Payments** — Central payment management with bank/cash journal support.

### Reporting
- **Trial Balance** — Period-filtered trial balance report.
- **Balance Sheet** — Assets, liabilities, and equity breakdown.
- **Profit & Loss** — Income vs. expense statement.
- **General Ledger** — Detailed journal entry listing by account.

### User Experience
- **Admin Dashboard** — Quick-glance KPIs and navigation shortcuts.
- **Dark Mode** — Full dark theme support across all modules.
- **Responsive Design** — Works on desktop, tablet, and mobile with a collapsible sidebar.
- **Landing Page** — Animated landing page with feature highlights.

---

## 🗄️ Database Schema

The system uses **20+ PostgreSQL tables** including:

| Table                    | Purpose                                       |
| ------------------------ | --------------------------------------------- |
| `users`                  | Authentication accounts                       |
| `contacts`               | Customers & vendors                           |
| `products`               | Inventory items                               |
| `chart_of_accounts`      | GL accounts                                   |
| `journals`               | Accounting journals                           |
| `tax_rates`              | Tax configurations                            |
| `analytic_accounts`      | Cost centers                                  |
| `purchase_orders`        | Purchase order headers                        |
| `purchase_order_lines`   | PO line items                                 |
| `sales_orders`           | Sales order headers                           |
| `sales_order_lines`      | SO line items                                 |
| `vendor_bills`           | Vendor bill headers                           |
| `vendor_bill_lines`      | Bill line items                               |
| `customer_invoices`      | Customer invoice headers                      |
| `customer_invoice_lines` | Invoice line items                            |
| `journal_entries`        | Double-entry journal entries                  |
| `journal_entry_lines`    | Individual debit/credit lines                 |
| `payments`               | Payment records                               |
| `budgets`                | Budget tracking by analytic account & period  |

Full schema reference: [`database.md`](./database.md)

---

## 🌐 API Endpoints

All endpoints are prefixed with `/api/v1/`, `/api/`, or accessible at the root. Standard response format:

```json
{
  "success": true,
  "data": { ... },
  "error": null
}
```

### Auth
| Method | Endpoint                | Description              |
| ------ | ----------------------- | ------------------------ |
| POST   | `/auth/login`           | Login with email/password|
| POST   | `/auth/register`        | Register a new user      |
| POST   | `/auth/refresh`         | Refresh JWT token        |

### Master Data
| Method | Endpoint                        | Description                |
| ------ | ------------------------------- | -------------------------- |
| GET    | `/contacts`                     | List contacts (paginated)  |
| POST   | `/contacts`                     | Create contact             |
| GET    | `/products`                     | List products              |
| POST   | `/products`                     | Create product             |
| GET    | `/accounts`                     | List chart of accounts     |
| GET    | `/journals`                     | List journals              |
| GET    | `/tax-rates`                    | List tax rates             |
| GET    | `/analytic-accounts`            | List analytic accounts     |

### Transactions
| Method | Endpoint                          | Description                     |
| ------ | --------------------------------- | ------------------------------- |
| GET    | `/purchase-orders`                | List purchase orders            |
| POST   | `/purchase-orders`                | Create purchase order           |
| POST   | `/purchase-orders/:id/confirm`    | Confirm a purchase order        |
| GET    | `/vendor-bills`                   | List vendor bills               |
| POST   | `/vendor-bills`                   | Create vendor bill              |
| POST   | `/vendor-bills/:id/confirm`       | Confirm bill (posts JE + budget)|
| GET    | `/sales-orders`                   | List sales orders               |
| POST   | `/sales-orders`                   | Create sales order              |
| POST   | `/sales-orders/:id/confirm`       | Confirm a sales order           |
| POST   | `/sales-orders/:id/invoice`       | Invoice a confirmed SO          |
| GET    | `/customer-invoices`              | List customer invoices          |
| GET    | `/customer-invoices/:id`          | Get invoice detail with lines   |
| GET    | `/payments`                       | List payments                   |
| POST   | `/payments`                       | Register a payment              |

### Budgets & Reports
| Method | Endpoint                    | Description                  |
| ------ | --------------------------- | ---------------------------- |
| GET    | `/budgets`                  | List budgets with progress   |
| POST   | `/budgets`                  | Create budget                |
| GET    | `/reports/trial-balance`    | Trial balance report         |
| GET    | `/reports/balance-sheet`    | Balance sheet                |
| GET    | `/reports/profit-loss`      | Profit & loss statement      |
| GET    | `/reports/general-ledger`   | General ledger               |

---

## 🧪 Key Design Decisions

1. **Raw SQL over ORM** — All database queries use parameterized raw SQL via `pg` for full control over joins, transactions, and lateral subqueries. No Prisma/Sequelize/TypeORM.

2. **Double-entry accounting** — Every financial event (bill confirmation, payment) creates balanced journal entries with debit/credit lines that always sum to zero.

3. **Dynamic budget tracking** — Budget "achieved" amounts are computed in real time by aggregating confirmed vendor bill lines, rather than storing a running total. This ensures consistency without sync issues.

4. **Zod schema validation** — All incoming API requests are validated at the middleware layer using Zod schemas before reaching controllers.

5. **JWT dual-token auth** — Short-lived access tokens + long-lived refresh tokens for secure session management.

6. **Component-per-module architecture** — Each business domain (Contacts, Products, Vendor Bills, etc.) has its own self-contained React component with list, detail, and form views.

---

## 👥 Team

Built by **Team Pari658** for the Odoo Gandhinagar '26 hackathon.

---

## 📄 License

This project is private and not licensed for redistribution.
