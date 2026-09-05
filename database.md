-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email character varying NOT NULL UNIQUE,
  password_hash text NOT NULL,
  role USER-DEFINED NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  login_id character varying,
  CONSTRAINT users_pkey PRIMARY KEY (id)
);
CREATE TABLE public.contacts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  name character varying NOT NULL,
  type USER-DEFINED NOT NULL,
  email character varying,
  mobile character varying,
  city character varying,
  state character varying,
  pincode character varying,
  profile_image_url text,
  is_archived boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT contacts_pkey PRIMARY KEY (id),
  CONSTRAINT contacts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.products (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL,
  type USER-DEFINED NOT NULL,
  sales_price numeric NOT NULL CHECK (sales_price >= 0::numeric),
  cost_price numeric NOT NULL CHECK (cost_price >= 0::numeric),
  category character varying,
  image_url text,
  is_archived boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT products_pkey PRIMARY KEY (id)
);
CREATE TABLE public.chart_of_accounts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL UNIQUE,
  type USER-DEFINED NOT NULL,
  report_group USER-DEFINED NOT NULL,
  is_archived boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT chart_of_accounts_pkey PRIMARY KEY (id)
);
CREATE TABLE public.journals (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL,
  type USER-DEFINED NOT NULL,
  default_debit_account_id uuid,
  default_credit_account_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT journals_pkey PRIMARY KEY (id),
  CONSTRAINT journals_default_debit_account_id_fkey FOREIGN KEY (default_debit_account_id) REFERENCES public.chart_of_accounts(id),
  CONSTRAINT journals_default_credit_account_id_fkey FOREIGN KEY (default_credit_account_id) REFERENCES public.chart_of_accounts(id)
);
CREATE TABLE public.tax_rates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL,
  rate_percent numeric NOT NULL CHECK (rate_percent >= 0::numeric),
  linked_account_id uuid,
  CONSTRAINT tax_rates_pkey PRIMARY KEY (id),
  CONSTRAINT tax_rates_linked_account_id_fkey FOREIGN KEY (linked_account_id) REFERENCES public.chart_of_accounts(id)
);
CREATE TABLE public.analytic_accounts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL,
  type USER-DEFINED NOT NULL,
  CONSTRAINT analytic_accounts_pkey PRIMARY KEY (id)
);
CREATE TABLE public.budgets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL,
  analytic_account_id uuid NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  committed_amount numeric NOT NULL CHECK (committed_amount >= 0::numeric),
  responsible_contact_id uuid,
  status character varying NOT NULL DEFAULT 'draft'::character varying CHECK (status::text = ANY (ARRAY['draft'::character varying, 'confirmed'::character varying]::text[])),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT budgets_pkey PRIMARY KEY (id),
  CONSTRAINT budgets_analytic_account_id_fkey FOREIGN KEY (analytic_account_id) REFERENCES public.analytic_accounts(id),
  CONSTRAINT budgets_responsible_contact_id_fkey FOREIGN KEY (responsible_contact_id) REFERENCES public.contacts(id)
);
CREATE TABLE public.journal_entries (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  number character varying NOT NULL UNIQUE,
  journal_id uuid NOT NULL,
  entry_date date NOT NULL,
  reference character varying,
  status USER-DEFINED NOT NULL DEFAULT 'draft'::je_status,
  source_type character varying NOT NULL,
  source_id uuid NOT NULL,
  is_reversal_of uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT journal_entries_pkey PRIMARY KEY (id),
  CONSTRAINT journal_entries_journal_id_fkey FOREIGN KEY (journal_id) REFERENCES public.journals(id),
  CONSTRAINT journal_entries_is_reversal_of_fkey FOREIGN KEY (is_reversal_of) REFERENCES public.journal_entries(id)
);
CREATE TABLE public.journal_entry_lines (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  journal_entry_id uuid NOT NULL,
  account_id uuid NOT NULL,
  partner_id uuid,
  analytic_account_id uuid,
  debit numeric NOT NULL DEFAULT 0 CHECK (debit >= 0::numeric),
  credit numeric NOT NULL DEFAULT 0 CHECK (credit >= 0::numeric),
  CONSTRAINT journal_entry_lines_pkey PRIMARY KEY (id),
  CONSTRAINT journal_entry_lines_journal_entry_id_fkey FOREIGN KEY (journal_entry_id) REFERENCES public.journal_entries(id),
  CONSTRAINT journal_entry_lines_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.chart_of_accounts(id),
  CONSTRAINT journal_entry_lines_partner_id_fkey FOREIGN KEY (partner_id) REFERENCES public.contacts(id),
  CONSTRAINT journal_entry_lines_analytic_account_id_fkey FOREIGN KEY (analytic_account_id) REFERENCES public.analytic_accounts(id)
);
CREATE TABLE public.purchase_orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  number character varying NOT NULL UNIQUE,
  vendor_id uuid NOT NULL,
  status USER-DEFINED NOT NULL DEFAULT 'draft'::po_status,
  order_date date NOT NULL DEFAULT CURRENT_DATE,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT purchase_orders_pkey PRIMARY KEY (id),
  CONSTRAINT purchase_orders_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.contacts(id),
  CONSTRAINT purchase_orders_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);
CREATE TABLE public.purchase_order_lines (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  purchase_order_id uuid NOT NULL,
  product_id uuid NOT NULL,
  analytic_account_id uuid,
  quantity numeric NOT NULL CHECK (quantity > 0::numeric),
  unit_price numeric NOT NULL CHECK (unit_price >= 0::numeric),
  CONSTRAINT purchase_order_lines_pkey PRIMARY KEY (id),
  CONSTRAINT purchase_order_lines_purchase_order_id_fkey FOREIGN KEY (purchase_order_id) REFERENCES public.purchase_orders(id),
  CONSTRAINT purchase_order_lines_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id),
  CONSTRAINT purchase_order_lines_analytic_account_id_fkey FOREIGN KEY (analytic_account_id) REFERENCES public.analytic_accounts(id)
);
CREATE TABLE public.vendor_bills (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  number character varying NOT NULL UNIQUE,
  bill_reference character varying,
  purchase_order_id uuid,
  vendor_id uuid NOT NULL,
  invoice_date date NOT NULL,
  due_date date NOT NULL,
  total_amount numeric NOT NULL DEFAULT 0 CHECK (total_amount >= 0::numeric),
  amount_paid numeric NOT NULL DEFAULT 0 CHECK (amount_paid >= 0::numeric),
  status USER-DEFINED NOT NULL DEFAULT 'unpaid'::payment_status,
  journal_entry_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT vendor_bills_pkey PRIMARY KEY (id),
  CONSTRAINT vendor_bills_purchase_order_id_fkey FOREIGN KEY (purchase_order_id) REFERENCES public.purchase_orders(id),
  CONSTRAINT vendor_bills_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.contacts(id),
  CONSTRAINT vendor_bills_journal_entry_id_fkey FOREIGN KEY (journal_entry_id) REFERENCES public.journal_entries(id)
);
CREATE TABLE public.vendor_bill_lines (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  vendor_bill_id uuid NOT NULL,
  product_id uuid NOT NULL,
  account_id uuid NOT NULL,
  analytic_account_id uuid,
  quantity numeric NOT NULL CHECK (quantity > 0::numeric),
  unit_price numeric NOT NULL CHECK (unit_price >= 0::numeric),
  CONSTRAINT vendor_bill_lines_pkey PRIMARY KEY (id),
  CONSTRAINT vendor_bill_lines_vendor_bill_id_fkey FOREIGN KEY (vendor_bill_id) REFERENCES public.vendor_bills(id),
  CONSTRAINT vendor_bill_lines_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id),
  CONSTRAINT vendor_bill_lines_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.chart_of_accounts(id),
  CONSTRAINT vendor_bill_lines_analytic_account_id_fkey FOREIGN KEY (analytic_account_id) REFERENCES public.analytic_accounts(id)
);
CREATE TABLE public.sales_orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  number character varying NOT NULL UNIQUE,
  customer_id uuid NOT NULL,
  status USER-DEFINED NOT NULL DEFAULT 'draft'::so_status,
  order_date date NOT NULL DEFAULT CURRENT_DATE,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT sales_orders_pkey PRIMARY KEY (id),
  CONSTRAINT sales_orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.contacts(id),
  CONSTRAINT sales_orders_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);
CREATE TABLE public.sales_order_lines (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sales_order_id uuid NOT NULL,
  product_id uuid NOT NULL,
  analytic_account_id uuid,
  quantity numeric NOT NULL CHECK (quantity > 0::numeric),
  unit_price numeric NOT NULL CHECK (unit_price >= 0::numeric),
  tax_rate_id uuid,
  CONSTRAINT sales_order_lines_pkey PRIMARY KEY (id),
  CONSTRAINT sales_order_lines_sales_order_id_fkey FOREIGN KEY (sales_order_id) REFERENCES public.sales_orders(id),
  CONSTRAINT sales_order_lines_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id),
  CONSTRAINT sales_order_lines_analytic_account_id_fkey FOREIGN KEY (analytic_account_id) REFERENCES public.analytic_accounts(id),
  CONSTRAINT sales_order_lines_tax_rate_id_fkey FOREIGN KEY (tax_rate_id) REFERENCES public.tax_rates(id)
);
CREATE TABLE public.customer_invoices (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  number character varying NOT NULL UNIQUE,
  sales_order_id uuid,
  customer_id uuid NOT NULL,
  invoice_date date NOT NULL,
  due_date date NOT NULL,
  total_amount numeric NOT NULL DEFAULT 0 CHECK (total_amount >= 0::numeric),
  amount_paid numeric NOT NULL DEFAULT 0 CHECK (amount_paid >= 0::numeric),
  status USER-DEFINED NOT NULL DEFAULT 'unpaid'::payment_status,
  journal_entry_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT customer_invoices_pkey PRIMARY KEY (id),
  CONSTRAINT customer_invoices_sales_order_id_fkey FOREIGN KEY (sales_order_id) REFERENCES public.sales_orders(id),
  CONSTRAINT customer_invoices_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.contacts(id),
  CONSTRAINT customer_invoices_journal_entry_id_fkey FOREIGN KEY (journal_entry_id) REFERENCES public.journal_entries(id)
);
CREATE TABLE public.customer_invoice_lines (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  customer_invoice_id uuid NOT NULL,
  product_id uuid NOT NULL,
  account_id uuid NOT NULL,
  analytic_account_id uuid,
  quantity numeric NOT NULL CHECK (quantity > 0::numeric),
  unit_price numeric NOT NULL CHECK (unit_price >= 0::numeric),
  tax_rate_id uuid,
  CONSTRAINT customer_invoice_lines_pkey PRIMARY KEY (id),
  CONSTRAINT customer_invoice_lines_customer_invoice_id_fkey FOREIGN KEY (customer_invoice_id) REFERENCES public.customer_invoices(id),
  CONSTRAINT customer_invoice_lines_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id),
  CONSTRAINT customer_invoice_lines_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.chart_of_accounts(id),
  CONSTRAINT customer_invoice_lines_analytic_account_id_fkey FOREIGN KEY (analytic_account_id) REFERENCES public.analytic_accounts(id),
  CONSTRAINT customer_invoice_lines_tax_rate_id_fkey FOREIGN KEY (tax_rate_id) REFERENCES public.tax_rates(id)
);
CREATE TABLE public.payments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  direction USER-DEFINED NOT NULL,
  method USER-DEFINED NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0::numeric),
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  status USER-DEFINED NOT NULL DEFAULT 'draft'::payment_workflow_status,
  note text,
  vendor_bill_id uuid,
  customer_invoice_id uuid,
  journal_entry_id uuid,
  recorded_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT payments_pkey PRIMARY KEY (id),
  CONSTRAINT payments_vendor_bill_id_fkey FOREIGN KEY (vendor_bill_id) REFERENCES public.vendor_bills(id),
  CONSTRAINT payments_customer_invoice_id_fkey FOREIGN KEY (customer_invoice_id) REFERENCES public.customer_invoices(id),
  CONSTRAINT payments_journal_entry_id_fkey FOREIGN KEY (journal_entry_id) REFERENCES public.journal_entries(id),
  CONSTRAINT payments_recorded_by_fkey FOREIGN KEY (recorded_by) REFERENCES public.users(id)
);