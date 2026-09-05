# AI_RULES.md — Urban Furniture Accounting System Master Specification

> **IMPORTANT FOR ALL AI ASSISTANTS & DEVELOPERS:**  
> These rules are strict UI/UX, Frontend, Backend, API Contract, and Database Architecture guidelines for building the **Urban Furniture Accounting System**.  
> Every component, page, endpoint, route handler, and query produced MUST strictly comply with the guidelines, tokens, schema rules, and contracts specified in this document.

---

## 1. Core Tech Stack Rules

* **Stack:** **PERN Stack** (PostgreSQL, Express, React with Vite, Node.js).
* **Language:** **JavaScript ONLY** (Strictly NO TypeScript).
* **Frontend Libraries:** **Tailwind CSS**, **Shadcn UI** (Radix UI primitives), and **Aceternity UI** (for subtle micro-interactions, spotlights, grid backgrounds, and hero animations).
* **Icons:** `lucide-react` strictly.
* **Authentication:** JWT via `Authorization: Bearer <token>` header.
* **Theme Identity:** **Warm Timber & Sand Birch ERP**. Dual-theme support (**Light** and **Dark**). **Light Theme is the DEFAULT theme**.

---

## 2. Frontend UI / UX & Design System Constraints

### Typography Standards

| Role | Font Family | Tailwind Class / CSS | Usage |
| :--- | :--- | :--- | :--- |
| **Headings & Display** | `Space Grotesk` | `font-heading` (`font-['Space_Grotesk']`) | All `h1`, `h2`, `h3`, `h4`, section titles, card headers |
| **Body & UI Text** | `Inter` / `Plus Jakarta Sans` | `font-sans` | Paragraphs, labels, button text, tooltips, navigation |
| **Financial / Numbers** | `JetBrains Mono` | `font-mono tabular-nums` | Table amounts, debit/credit values, currency, invoices, codes |

### Strict Color Palette (Hex Tokens)

#### Light Theme (DEFAULT — Warm Birch Sand & Teak Wood)
```css
--bg-primary: #FAF6EE;        /* Warm Sand Birch Cream Background */
--bg-card: #FFFFFF;           /* Pure Warm White Cards */
--bg-subtle: #F3ECE0;         /* Warm Sand Hover Fill */
--border-color: #E6DFD5;      /* Soft Timber Border */
--border-subtle: #EFE8DD;     /* Inner Row Dividers */

--text-primary: #2C221E;      /* Dark Espresso - Primary Text */
--text-secondary: #6B5E55;    /* Warm Taupe - Subtitles, Table Headers */
--text-muted: #9E9085;        /* Muted Earth */

--brand-primary: #714B67;     /* Odoo Deep Plum / Purple */
--brand-primary-hover: #593950;
--brand-wood: #B45309;        /* Warm Amber Teak Accent */
--brand-wood-hover: #92400E;

--status-success: #15803D;    /* Forest Green (Paid / Posted) */
--status-success-bg: #F0FDF4; 
--status-warning: #D97706;    /* Amber Teak (Pending / Draft) */
--status-warning-bg: #FFFBEB; 
--status-danger: #B91C1C;     /* Crimson Red (Overdue / Cancelled) */
--status-danger-bg: #FEF2F2;  
```

#### Dark Theme (Deep Roasted Walnut & Ebony)
```css
--bg-primary: #120E0C;        /* Deep Roasted Walnut Background */
--bg-card: #1C1613;           /* Dark Cedar / Ebony Card Panel */
--bg-subtle: #29211D;         /* Dark Hover Fill */
--border-color: #382D27;      /* Dark Wood Border */

--text-primary: #F5EFE6;      /* Warm Parchment White */
--text-secondary: #A89B91;    /* Muted Timber */
--text-muted: #73655B;
```

### Component Formatting Rules
* **Border Radius:** `rounded-xl` (`12px`) for cards; `rounded-2xl` (`16px`) for main containers; `rounded-lg` (`8px`) for buttons and inputs.
* **Borders:** Explicit `border border-[#E6DFD5] dark:border-[#382D27]` on all cards and tables.
* **Shadows:** Soft warm shadow `shadow-sm shadow-[#B45309]/5 dark:shadow-none`.
* **Primary Teak Button:** `bg-[#B45309] hover:bg-[#92400E] text-white font-medium rounded-lg px-4 py-2 text-sm transition-all shadow-sm`.
* **Odoo Purple Button:** `bg-[#714B67] hover:bg-[#593950] text-white font-medium rounded-lg px-4 py-2 text-sm transition-all shadow-sm`.

---

## 3. Database Schema & Architecture Rules

Source of Truth: `Urban_Furniture_DB_Architecture.md` (19 tables).

1. **UUID Primary Keys:** Every table uses UUID primary keys (`gen_random_uuid()`), NEVER auto-increment integers.
2. **Precision Money:** Money fields are always `NUMERIC(14,2)` in PostgreSQL and JSON numbers (never strings) in API payloads. Never use JS `Number`/floats for intermediate financial calculations; use decimal-safe math or SQL aggregations.
3. **Ledger as Single Source of Truth:** `journal_entries.status` and `journal_entry_lines` are the single source of truth for all financial reports. NEVER write a report query reading totals directly from `vendor_bills` or `customer_invoices` — always aggregate from `journal_entry_lines` joined to `journal_entries WHERE status = 'posted'`.
4. **Double-Entry Balance Enforcement:** A Journal Entry's debit/credit lines must balance before its status can become `posted` ($\sum \text{Debits} = \sum \text{Credits}$). Enforced by a DB constraint trigger. If an entry is unbalanced, return the `UNBALANCED_ENTRY` error.
5. **Nullable Originating Orders:** `vendor_bills.purchase_order_id` and `customer_invoices.sales_order_id` are nullable. Always handle fresh bills/invoices created without an originating PO/SO.
6. **Side-Effect Isolation on Drafts:** Draft-status records (Budgets, Payments, Journal Entries) must NOT create or update any ledger rows until explicitly confirmed/posted.
7. **Contact Portal Security:** Contact-role users must NEVER be able to query another contact's data. All `/portal/*` endpoints must filter by the `contact_id` resolved from the JWT token.

---

## 4. API Contract & Response Envelopes

Source of Truth: `Urban_Furniture_API_Contract.md`. Base URL: `/api/v1`.

### Universal Success Envelope (Every 2xx Response)
```json
{
  "success": true,
  "data": { },
  "error": null
}
```

### Universal Error Envelope (Every 4xx / 5xx Response)
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "amountPaid cannot exceed totalAmount",
    "field": "amountPaid"
  }
}
```

### Universal List Envelope (Any `GET` Returning Multiple Rows)
```json
{
  "success": true,
  "data": {
    "items": [ ],
    "page": 1,
    "pageSize": 20,
    "totalCount": 47
  },
  "error": null
}
```

### Standard Error Codes
| Code | Meaning |
| :--- | :--- |
| `VALIDATION_ERROR` | Field failed validation (missing, wrong type, out of range) |
| `NOT_FOUND` | Resource ID does not exist |
| `UNAUTHORIZED` | Not authenticated / invalid JWT |
| `FORBIDDEN` | Authenticated, but role does not permit this action |
| `CONFLICT` | State conflict (e.g., trying to confirm an already confirmed record) |
| `UNBALANCED_ENTRY` | Journal entry debit/credit totals do not balance on Post |

### API Field & Type Formatting Rules
1. **camelCase Casing:** JSON uses `camelCase`, mapping 1:1 to DB `snake_case` columns (`totalAmount` $\leftrightarrow$ `total_amount`, `analyticAccountId` $\leftrightarrow$ `analytic_account_id`).
2. **Foreign Keys:** Named `<entity>Id` (`vendorId`, `customerId`, `journalEntryId`).
3. **Money Formatting:** JSON numbers with exactly 2 decimal places (`6000.00`, never `"6000.00"` or `6000`).
4. **Date Formatting:** ISO 8601 strings (`"2026-09-05"` for dates, `"2026-09-05T10:30:00Z"` for timestamps).
5. **Non-Blocking Warnings:** Warnings (e.g. budget exceeded on PO confirm) go into a top-level `warning` sibling object of `data`/`error`.

---

## 5. Role & Permission Matrix

Enforce on every route before reaching the database:

| Role | Master Data | Transactions | Reports | Portal |
| :--- | :--- | :--- | :--- | :--- |
| **admin** | create / edit / archive | create / confirm / post / pay | view | n/a |
| **accountant** | create / edit | create / confirm / post / pay | view | n/a |
| **contact** | none | none | none | own invoices/bills + pay only |

---

## 6. Naming & File Conventions

* **REST Routes:** Plural nouns, kebab-case (`/purchase-orders`, `/vendor-bills`, `/analytic-accounts`).
* **Route Params:** `:id` (always `:id`, never `:vendorId` or `:billId`).
* **Controller Functions:** `verbNoun` (`createPurchaseOrder`, `confirmVendorBill`, `postJournalEntry`).
* **File Structure:** One file per resource (`purchaseOrders.controller.js`, `purchaseOrders.routes.js`, `purchaseOrders.service.js`).
* **Shared Ledger Service:** ALL ledger/journal entry creations MUST pass through a single shared helper function (e.g., `services/ledger.service.js`). Never write `journal_entry_lines` inline in controllers.

---

## 7. Definition of Done Checklist

Before considering any endpoint or page complete:
- [ ] Response matches the exact `{ success, data, error }` envelope shape.
- [ ] All JSON fields use `camelCase` matching DB `snake_case` 1:1.
- [ ] Role check happens before any DB operation.
- [ ] Money calculations use NUMERIC-safe operations, not floating point.
- [ ] Draft vs Posted/Confirmed state is strictly enforced (no premature ledger writes).
- [ ] Errors return one of the 6 standard error codes.
- [ ] All ledger operations pass through the shared `ledger.service.js` helper.
