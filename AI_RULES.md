# AI_RULES.md — Design & Implementation Constraints (Urban Furniture ERP)

> **IMPORTANT FOR ALL AI ASSISTANTS & DEVELOPERS:**  
> These rules are strict design and UI/UX guidelines for building the **Urban Furniture Accounting System**.  
> Every component, page, layout, and style produced must strictly comply with the design tokens, typography rules, color palettes, spacing conventions, and UI component standards specified in this document.

---

## 1. Core Tech Stack & Framework Rules

* **Stack:** **PERN Stack** (PostgreSQL, Express, React with Vite, Node.js).
* **Language:** **JavaScript ONLY** (No TypeScript).
* **Styling & UI Libraries:** **Tailwind CSS**, **Shadcn UI** (Radix UI primitives), and **Aceternity UI** (for subtle micro-interactions, spotlights, grid backgrounds, and hero animations).
* **Icons:** `lucide-react` strictly.
* **Theme Identity:** **Warm Timber & Sand Birch ERP**. Dual-theme support (**Light** and **Dark**). **Light Theme is the DEFAULT theme**.

---

## 2. Typography Standards

| Role | Font Family | Tailwind Class / CSS | Usage |
| :--- | :--- | :--- | :--- |
| **Headings & Display** | `Space Grotesk` | `font-heading` (`font-['Space_Grotesk']`) | All `h1`, `h2`, `h3`, `h4`, section titles, card headers |
| **Body & UI Text** | `Inter` / `Plus Jakarta Sans` | `font-sans` | Paragraphs, labels, button text, tooltips, navigation |
| **Financial / Numbers** | `JetBrains Mono` | `font-mono tabular-nums` | Table amounts, debit/credit values, currency, invoices, codes |

### Typography Rules
* Page titles (`h1`): `font-heading font-bold text-2xl sm:text-3xl text-[#2C221E] dark:text-[#F5EFE6] tracking-tight`.
* Section titles (`h2`): `font-heading font-bold text-lg sm:text-xl text-[#2C221E] dark:text-[#F5EFE6]`.
* Financial data: `font-mono tabular-nums text-right` for exact numeric alignment.

---

## 3. Strict Color Palette (Woody & Warm Timber Tokens)

### Theme Baseline Rules
* **Default Theme:** **Light Mode** (`html class="light"` or `theme="light"`).
* **Visual Palette:** Clean Warm Birch Sand (`#FAF6EE`), Golden Teak Wood (`#B45309`), Odoo Deep Plum (`#714B67`), and Dark Espresso (`#2C221E`).

### Light Theme (Default — Warm Birch Sand & Teak Wood)
```css
--bg-primary: #FAF6EE;        /* Warm Sand Birch Cream Background */
--bg-card: #FFFFFF;           /* Pure Warm White Cards */
--bg-subtle: #F3ECE0;         /* Warm Sand Hover Fill */
--border-color: #E6DFD5;      /* Soft Timber Border */
--border-subtle: #EFE8DD;     /* Inner Row Dividers */

--text-primary: #2C221E;      /* Dark Espresso - Primary Headings & Body */
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

### Dark Theme (Deep Roasted Walnut & Ebony)
```css
--bg-primary: #120E0C;        /* Deep Roasted Walnut Background */
--bg-card: #1C1613;           /* Dark Cedar / Ebony Card Panel */
--bg-subtle: #29211D;         /* Dark Hover Fill */
--border-color: #382D27;      /* Dark Wood Border */

--text-primary: #F5EFE6;      /* Warm Parchment White */
--text-secondary: #A89B91;    /* Muted Timber */
--text-muted: #73655B;
```

---

## 4. Component Design Constraints

### Cards & Containers
* **Border Radius:** `rounded-xl` (`12px`) for cards; `rounded-2xl` (`16px`) for main dashboard containers; `rounded-lg` (`8px`) for inputs and inner controls.
* **Borders:** Explicit `border border-[#E6DFD5] dark:border-[#382D27]` on all cards, tables, and modals.
* **Shadows:** Soft warm shadow `shadow-sm shadow-[#B45309]/5 dark:shadow-none`.
* **Background:** `bg-white dark:bg-[#1C1613]`.

### Buttons & Interactive Controls
* **Primary Teak Button:** `bg-[#B45309] hover:bg-[#92400E] text-white font-medium rounded-lg px-4 py-2 text-sm transition-all shadow-sm`.
* **Odoo Purple Button:** `bg-[#714B67] hover:bg-[#593950] text-white font-medium rounded-lg px-4 py-2 text-sm transition-all shadow-sm`.
* **Outline Button:** `border border-[#E6DFD5] dark:border-[#382D27] bg-white dark:bg-[#1C1613] hover:bg-[#FAF6EE] dark:hover:bg-[#29211D] text-[#2C221E] dark:text-[#F5EFE6] rounded-lg px-4 py-2 text-sm`.

---

## 5. Accounting UI & Double-Entry Ledger Rules

1. **Debit / Credit Balance Check:**
   - Tables displaying Journal Items must clearly separate `Debit` and `Credit` into two distinct columns.
   - Always display totals at the bottom of ledger entries verifying that `Total Debits == Total Credits`.
2. **Currency Formatting:**
   - Format all monetary amounts with standard currency symbol (`$`, `₹`, or `€`) with 2 decimal places (e.g., `$1,250.00`).
   - Use `font-mono tabular-nums text-right`.
3. **Master Data Workflows:**
   - Maintain clear transactional links (Purchase Order $\rightarrow$ Vendor Bill $\rightarrow$ Payment; Sales Order $\rightarrow$ Customer Invoice $\rightarrow$ Payment).
