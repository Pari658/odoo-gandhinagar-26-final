# Urban Furniture — Accounting & ERP System

An end-to-end, double-entry accounting platform designed for **Urban Furniture**. The system handles the complete operational cycle from core master data setup to procurement, sales, automated general ledger posting, budget tracking, and financial statement generation.

---

## 1. Project Overview

The Urban Furniture Accounting System replaces manual, disconnected spreadsheets with an automated, transaction-driven bookkeeping engine. Instead of treating sales orders and vendor receipts as flat records, every confirmed business event automatically creates balanced double-entry journal items in the general ledger.

### Key Capabilities
* **Double-Entry Bookkeeping:** Automatically posts balanced debits and credits ($\sum \text{Debits} = \sum \text{Credits}$) upon invoice and payment confirmation.
* **Procure-to-Pay (P2P):** Vendor Purchase Order $\rightarrow$ Vendor Bill conversion $\rightarrow$ Cash/Bank settlement.
* **Order-to-Cash (O2C):** Customer Sales Order $\rightarrow$ Tax Invoice generation $\rightarrow$ Cash/Bank reconciliation.
* **Analytic Budgeting:** Tracks planned project/department spending caps against real operational expenses.
* **Automated Financial Reporting:** Dynamic, real-time generation of Balance Sheet, Profit & Loss (P&L), and Budget reports.
* **Role-Based Access Control (RBAC):** Dedicated views for business owners (Admin), operational accountants, and customer/vendor portal contacts.

---

## 2. Primary Actors & Permissions

| Role | Access Scope | Key Responsibilities |
| :--- | :--- | :--- |
| **Admin (Business Owner)** | Full System Access | Creates, modifies, and archives master data; records transactions; views full financial and stock reports. |
| **Invoicing User (Accountant)** | Operational Access | Creates master data, generates POs and SOs, issues bills/invoices, registers payments, and audits reports. |
| **Contact (Customer / Vendor)** | Restricted Portal | Self-service access restricted exclusively to viewing their own invoices/bills and registering payments. |
| **System Engine** | Automated Background Logic | Validates data, calculates sales tax, creates balanced ledger items, and computes aggregated financial statements. |

---

## 3. System Architecture & Workflows

### End-to-End Workflow Diagram
