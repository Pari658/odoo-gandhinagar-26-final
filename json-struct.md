# Urban Furniture Accounting System — API Contract

Every endpoint follows the **same envelope**, the **same casing** (camelCase, matching the DB's snake_case 1:1), and the **same error shape**. This is what lets the frontend swap only the URL/method per feature and reuse one fetch wrapper for everything.

---

## 0. Universal Rules

### Base URL
```
/api/v1
```

### Success envelope (every 2xx response looks like this)
```json
{
  "success": true,
  "data": { },
  "error": null
}
```
`data` is an object for single-record responses, or an array (wrapped, see List below) for collections.

### Error envelope (every 4xx/5xx response looks like this)
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
`field` is present only for validation errors on a specific input; omitted otherwise.

### List envelope (any `GET` returning multiple rows)
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

### Standard error codes
| Code | Meaning |
|---|---|
| `VALIDATION_ERROR` | A field failed validation (missing, wrong type, out of range) |
| `NOT_FOUND` | Resource ID doesn't exist |
| `UNAUTHORIZED` | Not logged in |
| `FORBIDDEN` | Logged in, but role doesn't permit this action |
| `CONFLICT` | e.g. trying to confirm an already-confirmed record |
| `UNBALANCED_ENTRY` | Journal entry debit/credit totals don't match on Post |

### Auth
Every request after login sends:
```
Authorization: Bearer <jwt>
```

### Field casing convention
JSON uses `camelCase`. It maps 1:1 to the database's `snake_case` columns (e.g. `totalAmount` ↔ `total_amount`, `analyticAccountId` ↔ `analytic_account_id`). Never mix casings within a payload.

### IDs
All `id` fields are UUID strings. All foreign keys are named `<entity>Id` (e.g. `vendorId`, `analyticAccountId`).

### Money
All monetary fields are JSON numbers with 2 decimal places (e.g. `6000.00`), never strings.

### Dates
All dates are ISO 8601 strings: `"2026-09-05"` for dates, `"2026-09-05T10:30:00Z"` for timestamps.

---

## 1. Auth

### `POST /auth/login`
**Request**
```json
{
  "email": "accountant@urbanfurniture.com",
  "password": "••••••••"
}
```
**Response**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOi...",
    "user": {
      "id": "u-001",
      "email": "accountant@urbanfurniture.com",
      "role": "accountant"
    }
  },
  "error": null
}
```

### `GET /auth/me`
**Response**
```json
{
  "success": true,
  "data": { "id": "u-001", "email": "accountant@urbanfurniture.com", "role": "accountant" },
  "error": null
}
```

---

## 2. Master Data

### `POST /contacts`
**Request**
```json
{
  "name": "Rahul Sharma",
  "type": "vendor",
  "email": "rahul@azurefurniture.com",
  "mobile": "9876543210",
  "city": "Anand",
  "state": "Gujarat",
  "pincode": "388001",
  "profileImageUrl": null
}
```
**Response**
```json
{
  "success": true,
  "data": {
    "id": "c-101",
    "name": "Rahul Sharma",
    "type": "vendor",
    "email": "rahul@azurefurniture.com",
    "mobile": "9876543210",
    "city": "Anand",
    "state": "Gujarat",
    "pincode": "388001",
    "profileImageUrl": null,
    "isArchived": false,
    "createdAt": "2026-09-05T10:30:00Z"
  },
  "error": null
}
```

### `GET /contacts?type=vendor&page=1`
**Response**
```json
{
  "success": true,
  "data": {
    "items": [
      { "id": "c-101", "name": "Rahul Sharma", "type": "vendor", "isArchived": false }
    ],
    "page": 1,
    "pageSize": 20,
    "totalCount": 1
  },
  "error": null
}
```

### `POST /products`
**Request**
```json
{
  "name": "Office Chair",
  "type": "goods",
  "salesPrice": 3500.00,
  "costPrice": 2200.00,
  "category": "Seating",
  "imageUrl": null
}
```
**Response** — same shape plus `"id"`, `"isArchived": false`, `"createdAt"`.

### `POST /accounts` (Chart of Accounts)
**Request**
```json
{
  "name": "Sales Income A/c",
  "type": "income",
  "reportGroup": "profit_and_loss"
}
```
**Response** — same shape plus `"id"`, `"isArchived": false`.

### `POST /journals`
**Request**
```json
{
  "name": "Purchase",
  "type": "purchase",
  "defaultDebitAccountId": "acc-purchase-expense",
  "defaultCreditAccountId": "acc-creditors"
}
```

### `POST /tax-rates`
**Request**
```json
{
  "name": "GST 18%",
  "ratePercent": 18.00,
  "linkedAccountId": "acc-gst-payable"
}
```

### `POST /analytic-accounts`
**Request**
```json
{
  "name": "Office Furniture Line",
  "type": "income"
}
```

### `GET /analytic-accounts/:id/budgets`
Powers the nested "All Budgets where this Analytic Account is used" list on the Analytics Form.
**Response**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "b-001",
        "name": "January 2026",
        "periodStart": "2026-01-01",
        "periodEnd": "2026-01-31",
        "committedAmount": 200000.00,
        "achievedAmount": 10000.00
      }
    ],
    "page": 1, "pageSize": 20, "totalCount": 1
  },
  "error": null
}
```

---

## 3. Budgets

### `POST /budgets`
**Request**
```json
{
  "name": "Project 1",
  "analyticAccountId": "aa-001",
  "periodStart": "2026-01-01",
  "periodEnd": "2026-01-31",
  "committedAmount": 200000.00,
  "responsibleContactId": "c-050"
}
```
**Response**
```json
{
  "success": true,
  "data": {
    "id": "b-001",
    "name": "Project 1",
    "analyticAccountId": "aa-001",
    "periodStart": "2026-01-01",
    "periodEnd": "2026-01-31",
    "committedAmount": 200000.00,
    "responsibleContactId": "c-050",
    "status": "draft"
  },
  "error": null
}
```

### `POST /budgets/:id/confirm`
**Request:** empty body `{}`

**Response** — status flips to `confirmed`, and the Achieved fields now appear (they're absent/null while draft, per the mockup's "only visible for Confirmed Budget" rule):
```json
{
  "success": true,
  "data": {
    "id": "b-001",
    "name": "Project 1",
    "status": "confirmed",
    "committedAmount": 200000.00,
    "achievedAmount": 10000.00,
    "achievedPercent": 5.00,
    "amountToAchieve": 190000.00
  },
  "error": null
}
```

---

## 4. Purchase Flow

### `POST /purchase-orders`
**Request**
```json
{
  "vendorId": "c-101",
  "orderDate": "2026-09-05",
  "lines": [
    {
      "productId": "p-201",
      "analyticAccountId": "aa-001",
      "quantity": 3,
      "unitPrice": 2000.00
    }
  ]
}
```
**Response**
```json
{
  "success": true,
  "data": {
    "id": "po-001",
    "number": "PO0001",
    "vendorId": "c-101",
    "status": "draft",
    "orderDate": "2026-09-05",
    "lines": [
      {
        "id": "pol-001",
        "productId": "p-201",
        "productName": "Table",
        "analyticAccountId": "aa-001",
        "quantity": 3,
        "unitPrice": 2000.00,
        "total": 6000.00
      }
    ],
    "total": 6000.00
  },
  "error": null
}
```

### `POST /purchase-orders/:id/confirm`
**Request:** `{}`
**Response** — may include a non-blocking `warning` field, per the "Exceeds Approved Budget" mockup:
```json
{
  "success": true,
  "data": { "id": "po-001", "status": "confirmed" },
  "warning": {
    "code": "BUDGET_EXCEEDED",
    "message": "The entered amount is higher than the remaining budget for this analytic account. Consider adjusting the value or revising the budget."
  },
  "error": null
}
```
*(`warning` is a sibling of `data`/`error`, present only when relevant — the frontend shows it as a dismissible non-blocking banner, never blocks the confirm action itself.)*

### `POST /purchase-orders/:id/create-bill`
Fetches Product/Price/Quantity from the PO automatically.
**Request**
```json
{ "billDate": "2026-09-06", "dueDate": "2026-09-20", "billReference": "ABC-26-001" }
```
**Response**
```json
{
  "success": true,
  "data": {
    "id": "vb-001",
    "number": "Bill/2026/0001",
    "purchaseOrderId": "po-001",
    "vendorId": "c-101",
    "billReference": "ABC-26-001",
    "invoiceDate": "2026-09-06",
    "dueDate": "2026-09-20",
    "status": "unpaid",
    "totalAmount": 6000.00,
    "amountPaid": 0.00,
    "lines": [
      {
        "id": "vbl-001",
        "productId": "p-201",
        "productName": "Table",
        "accountId": "acc-purchase-expense",
        "analyticAccountId": "aa-001",
        "quantity": 3,
        "unitPrice": 2000.00,
        "total": 6000.00
      }
    ]
  },
  "error": null
}
```

### `POST /vendor-bills` (fresh bill, no PO)
Same request/response shape as above, but `purchaseOrderId: null` and `lines` supplied directly in the request instead of fetched.

### `POST /vendor-bills/:id/confirm`
**Request:** `{}`
**Response** — this is the point a Journal Entry gets created:
```json
{
  "success": true,
  "data": {
    "id": "vb-001",
    "status": "unpaid",
    "journalEntryId": "je-101"
  },
  "error": null
}
```

---

## 5. Sales Flow

### `POST /sales-orders`
**Request**
```json
{
  "customerId": "c-201",
  "orderDate": "2026-09-05",
  "lines": [
    {
      "productId": "p-201",
      "analyticAccountId": "aa-001",
      "quantity": 5,
      "unitPrice": 3500.00,
      "taxRateId": "tax-gst18"
    }
  ]
}
```
**Response** — mirrors Purchase Order shape, with `number: "SO0001"` and each line carrying `taxRateId` + a computed `taxAmount`.

### `POST /sales-orders/:id/create-invoice`
**Request**
```json
{ "invoiceDate": "2026-09-06", "dueDate": "2026-09-20" }
```
**Response**
```json
{
  "success": true,
  "data": {
    "id": "ci-001",
    "number": "Inv/2026/001",
    "salesOrderId": "so-001",
    "customerId": "c-201",
    "invoiceDate": "2026-09-06",
    "dueDate": "2026-09-20",
    "status": "unpaid",
    "totalAmount": 18375.00,
    "amountPaid": 0.00,
    "lines": [
      {
        "id": "cil-001",
        "productId": "p-201",
        "productName": "Office Chair",
        "accountId": "acc-sales-income",
        "analyticAccountId": "aa-001",
        "quantity": 5,
        "unitPrice": 3500.00,
        "taxRateId": "tax-gst18",
        "taxAmount": 3150.00,
        "total": 17500.00
      }
    ]
  },
  "error": null
}
```

### `POST /customer-invoices/:id/confirm`
Same shape as Vendor Bill confirm — returns `journalEntryId`.

---

## 6. Payments

### `POST /payments`
Triggered by the "Pay" button on a Bill or Invoice — `amount` and `partnerId` are pre-filled by the frontend from the source document, but still sent explicitly.
**Request**
```json
{
  "direction": "outbound",
  "vendorBillId": "vb-001",
  "customerInvoiceId": null,
  "partnerId": "c-101",
  "amount": 6000.00,
  "method": "bank",
  "paymentDate": "2026-09-10",
  "note": "Paid in full via NEFT"
}
```
**Response**
```json
{
  "success": true,
  "data": {
    "id": "pay-001",
    "direction": "outbound",
    "vendorBillId": "vb-001",
    "amount": 6000.00,
    "method": "bank",
    "status": "draft",
    "note": "Paid in full via NEFT"
  },
  "error": null
}
```

### `POST /payments/:id/confirm`
**Request:** `{}`
**Response** — journal entry now created, and the source Bill/Invoice status recalculates:
```json
{
  "success": true,
  "data": {
    "id": "pay-001",
    "status": "confirmed",
    "journalEntryId": "je-102",
    "vendorBill": { "id": "vb-001", "status": "paid", "amountPaid": 6000.00 }
  },
  "error": null
}
```

### `POST /payments/:id/cancel`
**Response**
```json
{ "success": true, "data": { "id": "pay-001", "status": "cancelled" }, "error": null }
```

---

## 7. Journal Entries (manual ledger)

### `GET /journal-entries?status=posted`
**Response**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "je-101",
        "number": "Bill/2026/0001",
        "entryDate": "2026-09-01",
        "partnerName": "Mr. Rahul",
        "journalName": "Purchases",
        "total": 30000.00,
        "status": "posted"
      }
    ],
    "page": 1, "pageSize": 20, "totalCount": 1
  },
  "error": null
}
```

### `POST /journal-entries`
**Request**
```json
{
  "entryDate": "2026-09-05",
  "journalId": "j-bank",
  "lines": [
    { "accountId": "acc-asset", "partnerId": "c-101", "debit": 10000.00, "credit": 0 },
    { "accountId": "acc-bank", "partnerId": null, "debit": 0, "credit": 10000.00 }
  ]
}
```
**Response** — created as `status: "draft"`, same shape plus `"id"` and `"number"` (server-generated).

### `POST /journal-entries/:id/post`
**Request:** `{}`
**Response (success)**
```json
{ "success": true, "data": { "id": "je-105", "status": "posted" }, "error": null }
```
**Response (unbalanced — rejected)**
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "UNBALANCED_ENTRY",
    "message": "Total debit (10000.00) does not equal total credit (9500.00)"
  }
}
```

---

## 8. Reports

### `GET /reports/balance-sheet?year=2026`
**Response**
```json
{
  "success": true,
  "data": {
    "year": 2026,
    "assets": [
      { "accountName": "Bank", "balance": 45000.00 },
      { "accountName": "Cash", "balance": 12000.00 },
      { "accountName": "Debtors", "balance": 18375.00 }
    ],
    "liabilities": [
      { "accountName": "Capital", "balance": 50000.00 },
      { "accountName": "Creditors", "balance": 25375.00 }
    ],
    "totalAssets": 75375.00,
    "totalLiabilities": 75375.00
  },
  "error": null
}
```

### `GET /reports/profit-and-loss?year=2026`
**Response**
```json
{
  "success": true,
  "data": {
    "year": 2026,
    "income": [ { "accountName": "Income from Sales", "amount": 10000.00 } ],
    "totalIncome": 10000.00,
    "expenses": [
      { "accountName": "Purchase Expense", "amount": 6000.00 },
      { "accountName": "Other Expense", "amount": 1000.00 }
    ],
    "totalExpenses": 7000.00,
    "netIncome": 3000.00
  },
  "error": null
}
```

### `GET /reports/budget-progress`
**Response**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "budgetId": "b-001",
        "budgetName": "Project 1",
        "analyticAccountName": "Project 1",
        "analyticType": "income",
        "committedAmount": 200000.00,
        "achievedAmount": 21000.00,
        "achievedPercent": 10.50,
        "amountToAchieve": 179000.00
      }
    ]
  },
  "error": null
}
```

---

## 9. Contact Portal

### `GET /portal/invoices`
Scoped server-side to the logged-in Contact's own `customerId` — the frontend never passes a customer filter itself.
**Response**
```json
{
  "success": true,
  "data": {
    "items": [
      { "id": "ci-001", "number": "Inv/2026/001", "totalAmount": 18375.00, "amountPaid": 0, "status": "unpaid", "dueDate": "2026-09-20" }
    ],
    "page": 1, "pageSize": 20, "totalCount": 1
  },
  "error": null
}
```

### `GET /portal/bills`
Same shape, scoped to `vendorId`.

---

## Why this makes the frontend a one-line swap

Because every endpoint returns `{ success, data, error }` with the same field-casing rules, a single fetch wrapper handles all of them:

```javascript
async function apiRequest(method, path, body) {
  const res = await fetch(`/api/v1${path}`, {
    method,
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
    body: body ? JSON.stringify(body) : undefined
  });
  const json = await res.json();
  if (!json.success) throw new ApiError(json.error);
  return json.data;
}

// Every feature becomes just:
apiRequest("POST", "/purchase-orders", payload);
apiRequest("POST", `/vendor-bills/${id}/confirm`);
apiRequest("GET", "/reports/balance-sheet?year=2026");
```
No per-endpoint response parsing, no inconsistent field names to remap, no special-casing errors — only the path, method, and body change per feature.