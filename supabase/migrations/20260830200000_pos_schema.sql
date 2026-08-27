create table public.pos_settings (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  require_customer boolean not null default false,
  allow_walk_in boolean not null default true,
  require_open_session boolean not null default true,
  allow_discounts boolean not null default true,
  discount_threshold_percent numeric(9,4) not null default 10 check(discount_threshold_percent between 0 and 100),
  cash_variance_tolerance numeric(20,4) not null default 0 check(cash_variance_tolerance >= 0),
  hold_expiration_minutes integer not null default 1440 check(hold_expiration_minutes between 5 and 10080),
  return_policy text,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

create table public.pos_terminals (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null, branch_id uuid not null,
  terminal_code text not null, name text not null, default_warehouse_id uuid not null,
  default_storage_location_id uuid not null, default_customer_id uuid, default_cash_account_id uuid not null,
  receipt_width text not null default '80MM' check(receipt_width in('58MM','80MM','A4')),
  receipt_footer text, status text not null default 'ACTIVE' check(status in('ACTIVE','INACTIVE')),
  created_by uuid not null references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(organization_id,id), unique(organization_id,terminal_code),
  foreign key(organization_id,branch_id) references public.branches(organization_id,id),
  foreign key(organization_id,default_warehouse_id) references public.warehouses(organization_id,id),
  foreign key(organization_id,default_storage_location_id) references public.storage_locations(organization_id,id),
  foreign key(organization_id,default_customer_id) references public.customers(organization_id,id),
  foreign key(organization_id,default_cash_account_id) references public.payment_accounts(organization_id,id)
);

create table public.pos_sessions (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null, branch_id uuid not null, terminal_id uuid not null,
  cashier_user_id uuid not null references auth.users(id), session_number text not null, opened_at timestamptz not null default now(),
  closed_at timestamptz, opening_float numeric(20,4) not null check(opening_float>=0), expected_cash numeric(20,4),
  counted_cash numeric(20,4), variance numeric(20,4), status text not null default 'OPEN' check(status in('OPEN','CLOSING','CLOSED','REVIEW_REQUIRED')),
  opening_notes text, closing_notes text, variance_reason text, approved_by uuid references auth.users(id), created_at timestamptz not null default now(),
  unique(organization_id,id), unique(organization_id,session_number),
  foreign key(organization_id,branch_id) references public.branches(organization_id,id),
  foreign key(organization_id,terminal_id) references public.pos_terminals(organization_id,id)
);
create unique index pos_one_open_session_per_terminal on public.pos_sessions(terminal_id) where status in('OPEN','CLOSING');
create index pos_sessions_cashier_idx on public.pos_sessions(organization_id,cashier_user_id,status,opened_at desc);

create table public.pos_held_carts (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null, branch_id uuid not null, terminal_id uuid not null,
  session_id uuid not null, cashier_user_id uuid not null references auth.users(id), customer_id uuid, cart jsonb not null,
  notes text, status text not null default 'HELD' check(status in('HELD','RESUMED','ABANDONED','COMPLETED')),
  held_at timestamptz not null default now(), expires_at timestamptz not null, updated_at timestamptz not null default now(),
  unique(organization_id,id), foreign key(organization_id,terminal_id) references public.pos_terminals(organization_id,id),
  foreign key(organization_id,session_id) references public.pos_sessions(organization_id,id),
  foreign key(organization_id,customer_id) references public.customers(organization_id,id),
  foreign key(organization_id,branch_id) references public.branches(organization_id,id)
);
create index pos_held_open_idx on public.pos_held_carts(organization_id,terminal_id,status,held_at desc);

create table public.pos_sales (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null, branch_id uuid not null, terminal_id uuid not null,
  session_id uuid not null, cashier_user_id uuid not null references auth.users(id), receipt_number text not null,
  customer_id uuid not null, sales_order_id uuid not null, fulfilment_id uuid not null, customer_invoice_id uuid not null,
  inventory_transaction_id uuid not null, currency text not null, subtotal numeric(20,4) not null, discount numeric(20,4) not null default 0,
  tax numeric(20,4) not null default 0, total numeric(20,4) not null, cash_tendered numeric(20,4), change_due numeric(20,4) not null default 0,
  status text not null default 'COMPLETED' check(status in('COMPLETED','VOIDED','RETURNED','PARTIALLY_RETURNED')),
  idempotency_key uuid not null, request_hash text not null, completed_at timestamptz not null default now(), voided_at timestamptz,
  unique(organization_id,id), unique(organization_id,receipt_number), unique(organization_id,idempotency_key),
  foreign key(organization_id,branch_id) references public.branches(organization_id,id),
  foreign key(organization_id,terminal_id) references public.pos_terminals(organization_id,id),
  foreign key(organization_id,session_id) references public.pos_sessions(organization_id,id),
  foreign key(organization_id,customer_id) references public.customers(organization_id,id),
  foreign key(organization_id,sales_order_id) references public.sales_orders(organization_id,id),
  foreign key(organization_id,fulfilment_id) references public.sales_fulfillments(organization_id,id),
  foreign key(organization_id,customer_invoice_id) references public.customer_invoices(organization_id,id),
  foreign key(organization_id,inventory_transaction_id) references public.inventory_transactions(organization_id,id)
);
create index pos_sales_lookup_idx on public.pos_sales(organization_id,branch_id,completed_at desc,receipt_number);

create table public.pos_sale_settlements (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null, pos_sale_id uuid not null,
  settlement_type text not null check(settlement_type in('PAYMENT','UNAPPLIED_PAYMENT','CREDIT_NOTE','CUSTOMER_CREDIT')),
  payment_id uuid, source_id uuid, payment_method_id uuid, amount numeric(20,4) not null check(amount>0),
  tendered_amount numeric(20,4), change_amount numeric(20,4) not null default 0, external_reference text,
  created_at timestamptz not null default now(), unique(organization_id,id),
  foreign key(organization_id,pos_sale_id) references public.pos_sales(organization_id,id) on delete cascade,
  foreign key(organization_id,payment_id) references public.payments(organization_id,id),
  foreign key(organization_id,payment_method_id) references public.payment_methods(organization_id,id)
);

create table public.pos_cash_events (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null, branch_id uuid not null, terminal_id uuid not null,
  session_id uuid not null, event_type text not null check(event_type in('OPENING_FLOAT','CASH_SALE','CASH_REFUND','CASH_DROP','CASH_IN','CASH_OUT','CLOSING_COUNT','ADJUSTMENT','REVERSAL')),
  amount numeric(20,4) not null check(amount>0), direction text not null check(direction in('IN','OUT','NEUTRAL')),
  source_type text, source_id uuid, reason text, actor_id uuid not null references auth.users(id), created_at timestamptz not null default now(),
  unique(organization_id,id), foreign key(organization_id,branch_id) references public.branches(organization_id,id),
  foreign key(organization_id,terminal_id) references public.pos_terminals(organization_id,id),
  foreign key(organization_id,session_id) references public.pos_sessions(organization_id,id)
);
create index pos_cash_session_idx on public.pos_cash_events(organization_id,session_id,created_at);

create table public.pos_receipt_reprints (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null, pos_sale_id uuid not null,
 reprinted_by uuid not null references auth.users(id), reprinted_at timestamptz not null default now(), reason text,
 foreign key(organization_id,pos_sale_id) references public.pos_sales(organization_id,id)
);

create index if not exists product_barcodes_lookup_idx on public.product_barcodes(organization_id,barcode);
