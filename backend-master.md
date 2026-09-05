# Master Backend Prompt — Urban Furniture Accounting System

**Purpose:** Paste this at the top of every AI coding session (or hand it to every teammate) before writing any backend code. It locks all 4 members to the same schema, same API shapes, same naming, and same business rules — so four people's modules merge without conflicts or rework.

Assumed stack: **Node.js + Express + PostgreSQL** (adjust the stack line if your team picked something else — everything below this is stack-agnostic in spirit).

---

```
You are working on the backend for the "Urban Furniture Accounting System" —
a hackathon project. Four different people are building different modules of
this same backend in parallel, so your #1 priority is CONSISTENCY with the
shared contract below, even over your own stylistic preferences. Do not
invent new field names, new response shapes, new status values, or new
endpoints that deviate from what's specified here — if something is
genuinely missing from this spec, flag it explicitly instead of guessing.

## Stack
- Node.js + Express
- PostgreSQL (raw SQL or a query builder — no ORM-specific magic that hides
  the schema; every teammate must be able to read the query and see the
  real table/column names)
- Authentication via JWT (Authorization: Bearer <token> header)

## Database schema — source of truth
The full schema (19 tables, all columns, types, constraints, and the
balance-enforcement trigger) is defined in `Urban_Furniture_DB_Architecture.md`.
Rules that MUST be respected in every query/endpoint you write:

1. Every table uses UUID primary keys (`gen_random_uuid()`), never
   auto-increment integers.
2. Money fields are always `NUMERIC(14,2)` in the DB and JSON numbers
   (never strings) in the API — never use JS `Number`/floats for
   intermediate calculations involving money; use a decimal-safe library
   or keep arithmetic in the DB via SQL.
3. `journal_entries.status` and `journal_entry_lines` are the single source
   of truth for all financial reports. NEVER write a report query that
   reads totals from `vendor_bills.total_amount` or `customer_invoices.total_amount`
   directly — always aggregate from `journal_entry_lines` joined to
   `journal_entries WHERE status = 'posted'`.
4. A Journal Entry's debit/credit lines must balance before its status can
   become `posted`. This is enforced by a DB constraint trigger — do NOT
   attempt to "fix" or "round" imbalances in application code. If a Post
   request would be unbalanced, return the `UNBALANCED_ENTRY` error
   (see below) and let the DB trigger be the final authority.
5. `vendor_bills.purchase_order_id` and `customer_invoices.sales_order_id`
   are nullable — always handle the "created fresh, no originating order"
   case, never assume an order exists.
6. Draft-status records (Budgets, Payments, Journal Entries) must NOT
   create or update any ledger/journal_entry rows until explicitly
   confirmed/posted. Never post side effects on create — only on the
   confirm/post action.
7. Contact-role users must NEVER be able to query another contact's data.
   Every /portal/* endpoint must filter by the contact_id resolved from
   the authenticated user's JWT — never accept a contact/customer/vendor
   ID from the request body or query string for portal endpoints.

## API contract — source of truth
The full request/response shape for every endpoint is defined in
`Urban_Furniture_API_Contract.md`. Rules that MUST be respected in every
endpoint you write, with zero exceptions:

1. EVERY response — success or failure — uses this exact envelope:
   { "success": boolean, "data": object|array|null, "error": object|null }
   Never return a bare object, a bare array, or a differently-shaped error.

2. All list endpoints wrap results as:
   { "items": [...], "page": number, "pageSize": number, "totalCount": number }
   inside `data` — never return a raw array as `data` directly.

3. All JSON field names are camelCase, and map 1:1 to the DB's snake_case
   columns (totalAmount <-> total_amount). Do not abbreviate, do not rename,
   do not add prefixes. If the DB column is `analytic_account_id`, the JSON
   field is `analyticAccountId` — never `analyticId` or `aaId`.

4. All foreign key fields in JSON are named `<entity>Id`
   (vendorId, customerId, analyticAccountId, journalEntryId, etc.)

5. Error responses always use one of these exact `error.code` values —
   do not invent new codes without checking with the team first:
   VALIDATION_ERROR, NOT_FOUND, UNAUTHORIZED, FORBIDDEN, CONFLICT,
   UNBALANCED_ENTRY

6. Dates are ISO 8601 strings ("2026-09-05"), timestamps include time
   ("2026-09-05T10:30:00Z"). Never return a DB driver's native Date object
   or a Unix timestamp integer.

7. Non-blocking warnings (e.g. budget-exceeded on PO confirm) go in a
   top-level `warning` key, a sibling of `data`/`error` — never inside
   `data`, and never used to block the action itself.

8. Money values in JSON are always numbers with exactly 2 decimal places
   (6000.00, not 6000 or "6000.00").

## Role & permission matrix — enforce on every route, not just in the UI
| Role       | Master Data        | Transactions              | Reports | Portal |
|------------|---------------------|----------------------------|---------|--------|
| admin      | create/edit/archive | create/confirm/post/pay    | view    | n/a    |
| accountant | create/edit         | create/confirm/post/pay    | view    | n/a    |
| contact    | none                | none                       | none    | own invoices/bills + pay only |

Every route handler must check `req.user.role` against this table BEFORE
touching the database — return `FORBIDDEN` if the role doesn't match,
regardless of whether the request body "looks" valid.

## Naming conventions (apply everywhere: routes, functions, variables)
- REST routes: plural nouns, kebab-case: /purchase-orders, /vendor-bills,
  /analytic-accounts
- Route params: :id (never :vendorId, :billId, etc. — always just :id)
- Controller functions: verbNoun — createPurchaseOrder, confirmVendorBill,
  postJournalEntry
- Files: one file per resource — purchaseOrders.controller.js,
  purchaseOrders.routes.js, purchaseOrders.service.js (or your team's
  equivalent split) — do not mix two resources in one file.

## Definition of done for any endpoint you write
Before considering an endpoint complete, confirm ALL of the following:
[ ] Response matches the exact envelope shape from the API contract doc
[ ] All field names are camelCase and match the contract doc exactly
[ ] Role check happens before any DB write
[ ] Money math uses NUMERIC-safe operations, not floating point
[ ] Draft vs Posted/Confirmed state is respected (no premature ledger writes)
[ ] Errors return one of the 6 standard error codes, never a raw stack trace
[ ] If this endpoint touches the ledger, it goes through the shared
    journal-entry-creation function — never write journal_entry_lines
    inline in a controller (this is the #1 way four people's modules
    produce inconsistent ledgers)

## What to do if something is ambiguous
If a request doesn't fit anything in the DB architecture doc or the API
contract doc, STOP and state the ambiguity explicitly rather than
inventing a new field/table/status silently. Four people guessing
differently on the same gap is worse than one person asking.
```

---

## How to use this with your team of 4

1. Paste the block above as the system/first message in every AI coding session (Claude Code, Cursor, ChatGPT, whatever each person uses).
2. Attach or paste in `Urban_Furniture_DB_Architecture.md` and `Urban_Furniture_API_Contract.md` alongside it — the master prompt references them by name.
3. Assign each person a **vertical slice by module**, not by layer — e.g. Person A owns Purchase (POs + Vendor Bills), Person B owns Sales (SOs + Invoices), Person C owns Payments + Journal Entries + Reports, Person D owns Master Data + Auth + Budgets. This avoids two people editing the same files/tables simultaneously.
4. The one shared piece everyone must literally reuse, not reimplement — put this in a single shared module (e.g. `services/ledger.service.js`) on day one before anyone starts their vertical slice: **the function that creates a Journal Entry + its lines from a Bill/Invoice/Payment.** This is called out explicitly in the "Definition of Done" checklist because it's the single most common place four people's code silently diverges — if everyone writes their own version, you'll get four different journal-entry shapes and no report will add up correctly across modules.