-- Phase 9: finance and accounting foundation. The GL is derived exclusively from posted journals.
create table public.accounting_settings (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  base_currency text not null check(base_currency ~ '^[A-Z]{3}$'), fiscal_year_start_month smallint not null default 1 check(fiscal_year_start_month between 1 and 12),
  accounting_method text not null default 'ACCRUAL' check(accounting_method in('ACCRUAL','CASH')),
  activation_date date, status text not null default 'DRAFT' check(status in('DRAFT','ACTIVE')),
  closed_period_policy text not null default 'BLOCK' check(closed_period_policy in('BLOCK','NEXT_OPEN_PERIOD')),
  retained_earnings_account_id uuid, current_period_id uuid, updated_by uuid references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.gl_accounts (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  account_code text not null, name text not null, account_type text not null check(account_type in('ASSET','LIABILITY','EQUITY','REVENUE','EXPENSE')),
  parent_account_id uuid, normal_balance text not null check(normal_balance in('DEBIT','CREDIT')), currency_restriction text check(currency_restriction is null or currency_restriction ~ '^[A-Z]{3}$'),
  control_type text check(control_type is null or control_type in('AR','AP','INVENTORY','OUTPUT_TAX','INPUT_TAX','RETAINED_EARNINGS')),
  is_system boolean not null default false, is_active boolean not null default true, allow_manual_posting boolean not null default true,
  description text, created_by uuid not null references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(organization_id,id), unique(organization_id,account_code), foreign key(organization_id,parent_account_id) references public.gl_accounts(organization_id,id),
  check(parent_account_id is null or parent_account_id <> id), check(control_type is null or not allow_manual_posting)
);
alter table public.accounting_settings add constraint accounting_settings_retained_fk foreign key(organization_id,retained_earnings_account_id) references public.gl_accounts(organization_id,id);

create table public.accounting_periods (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null, start_date date not null, end_date date not null, status text not null default 'OPEN' check(status in('OPEN','SOFT_CLOSED','CLOSED','LOCKED')),
  closed_by uuid references auth.users(id), closed_at timestamptz, created_at timestamptz not null default now(), unique(organization_id,id), unique(organization_id,start_date,end_date), check(start_date<=end_date)
);
alter table public.accounting_settings add constraint accounting_settings_period_fk foreign key(organization_id,current_period_id) references public.accounting_periods(organization_id,id);

create table public.account_mappings (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
 mapping_key text not null check(mapping_key in('SALE_REVENUE','SALE_RETURNS','SALE_COGS','INVENTORY_ASSET','CUSTOMER_AR','SUPPLIER_AP','CASH_PAYMENT','CARD_PAYMENT','INPUT_TAX','OUTPUT_TAX','ROUNDING','BANK_FEES','OPENING_EQUITY')),
 gl_account_id uuid not null, branch_id uuid, product_category_id uuid, payment_account_id uuid, priority smallint not null default 0,
 created_by uuid not null references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(organization_id,id),
 foreign key(organization_id,gl_account_id) references public.gl_accounts(organization_id,id), foreign key(organization_id,branch_id) references public.branches(organization_id,id),
 foreign key(organization_id,product_category_id) references public.product_categories(organization_id,id), foreign key(organization_id,payment_account_id) references public.payment_accounts(organization_id,id)
);
create unique index account_mappings_scope_key on public.account_mappings(organization_id,mapping_key,coalesce(branch_id,'00000000-0000-0000-0000-000000000000'),coalesce(product_category_id,'00000000-0000-0000-0000-000000000000'),coalesce(payment_account_id,'00000000-0000-0000-0000-000000000000'));

create table public.accounting_events (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
 source_module text not null, source_type text not null, source_id uuid not null, posting_version integer not null default 1 check(posting_version>0), event_date date not null,
 payload jsonb not null default '{}', status text not null default 'PENDING' check(status in('NOT_REQUIRED','PENDING','POSTED','FAILED','REVERSED')),
 journal_id uuid, error_code text, attempts integer not null default 0, created_at timestamptz not null default now(), processed_at timestamptz,
 unique(organization_id,id), unique(organization_id,source_module,source_type,source_id,posting_version)
);

create table public.journal_entries (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
 journal_number text not null, journal_date date not null, period_id uuid not null, source_module text not null, source_type text not null, source_id uuid,
 description text not null, status text not null default 'DRAFT' check(status in('DRAFT','PENDING_APPROVAL','POSTED','REVERSED','VOID')),
 posting_version integer not null default 1, reversal_of_id uuid, reversal_reason text, approval_request_id uuid,
 created_by uuid not null references auth.users(id), posted_by uuid references auth.users(id), posted_at timestamptz, created_at timestamptz not null default now(),
 unique(organization_id,id), unique(organization_id,journal_number), foreign key(organization_id,period_id) references public.accounting_periods(organization_id,id),
 foreign key(organization_id,reversal_of_id) references public.journal_entries(organization_id,id), foreign key(organization_id,approval_request_id) references public.approval_requests(organization_id,id),
 check((status='POSTED' and posted_by is not null and posted_at is not null) or status<>'POSTED')
);
alter table public.accounting_events add constraint accounting_events_journal_fk foreign key(organization_id,journal_id) references public.journal_entries(organization_id,id);
create unique index journal_source_once on public.journal_entries(organization_id,source_module,source_type,source_id,posting_version) where source_id is not null and status<>'VOID';

create table public.journal_lines (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, journal_id uuid not null, line_number integer not null check(line_number>0),
 account_id uuid not null, debit numeric(24,4) not null default 0 check(debit>=0), credit numeric(24,4) not null default 0 check(credit>=0),
 currency text not null check(currency~'^[A-Z]{3}$'), exchange_rate_snapshot numeric(24,10) not null check(exchange_rate_snapshot>0),
 base_debit numeric(24,4) not null default 0 check(base_debit>=0), base_credit numeric(24,4) not null default 0 check(base_credit>=0),
 branch_id uuid, customer_id uuid, supplier_id uuid, product_id uuid, description text, created_at timestamptz not null default now(),
 unique(organization_id,id), unique(journal_id,line_number), check((debit>0 and credit=0) or (credit>0 and debit=0)),
 foreign key(organization_id,journal_id) references public.journal_entries(organization_id,id) on delete cascade, foreign key(organization_id,account_id) references public.gl_accounts(organization_id,id),
 foreign key(organization_id,branch_id) references public.branches(organization_id,id), foreign key(organization_id,customer_id) references public.customers(organization_id,id),
 foreign key(organization_id,supplier_id) references public.suppliers(organization_id,id), foreign key(organization_id,product_id) references public.products(organization_id,id)
);

create table public.expenses (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, branch_id uuid not null,
 expense_number text not null, expense_date date not null, payee text not null, expense_account_id uuid not null, amount numeric(20,4) not null check(amount>0), tax_amount numeric(20,4) not null default 0 check(tax_amount>=0),
 currency text not null check(currency~'^[A-Z]{3}$'), exchange_rate_snapshot numeric(24,10) not null default 1 check(exchange_rate_snapshot>0), payment_account_id uuid,
 payment_terms text not null default 'PAID' check(payment_terms in('PAID','CREDIT')), reference text, description text not null,
 status text not null default 'DRAFT' check(status in('DRAFT','SUBMITTED','PENDING_APPROVAL','APPROVED','POSTED','REJECTED','REVERSED')),
 approval_request_id uuid, journal_id uuid, submitted_by uuid references auth.users(id), approved_by uuid references auth.users(id), posted_at timestamptz,
 created_by uuid not null references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(organization_id,id), unique(organization_id,expense_number),
 foreign key(organization_id,branch_id) references public.branches(organization_id,id), foreign key(organization_id,expense_account_id) references public.gl_accounts(organization_id,id),
 foreign key(organization_id,payment_account_id) references public.payment_accounts(organization_id,id), foreign key(organization_id,approval_request_id) references public.approval_requests(organization_id,id), foreign key(organization_id,journal_id) references public.journal_entries(organization_id,id)
);
create table public.expense_documents (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, expense_id uuid not null,
 document_type text not null check(document_type in('RECEIPT','INVOICE','SUPPORTING_DOCUMENT')), storage_path text not null, file_name text not null, mime_type text not null,
 uploaded_by uuid not null references auth.users(id), created_at timestamptz not null default now(), unique(organization_id,id), foreign key(organization_id,expense_id) references public.expenses(organization_id,id) on delete cascade,
 check(storage_path like organization_id::text || '/%')
);

create table public.bank_transfers (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, branch_id uuid,
 transfer_number text not null, transfer_date date not null, source_payment_account_id uuid not null, destination_payment_account_id uuid not null,
 amount numeric(20,4) not null check(amount>0), currency text not null check(currency~'^[A-Z]{3}$'), exchange_rate_snapshot numeric(24,10) not null default 1 check(exchange_rate_snapshot>0),
 fee_amount numeric(20,4) not null default 0 check(fee_amount>=0), reference text, status text not null default 'DRAFT' check(status in('DRAFT','POSTED','REVERSED')), journal_id uuid,
 created_by uuid not null references auth.users(id), posted_at timestamptz, created_at timestamptz not null default now(), unique(organization_id,id), unique(organization_id,transfer_number),
 check(source_payment_account_id<>destination_payment_account_id), foreign key(organization_id,branch_id) references public.branches(organization_id,id),
 foreign key(organization_id,source_payment_account_id) references public.payment_accounts(organization_id,id), foreign key(organization_id,destination_payment_account_id) references public.payment_accounts(organization_id,id),
 foreign key(organization_id,journal_id) references public.journal_entries(organization_id,id)
);

create table public.bank_statement_imports (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, payment_account_id uuid not null,
 file_name text not null, column_mapping jsonb not null, imported_by uuid not null references auth.users(id), imported_at timestamptz not null default now(), unique(organization_id,id),
 foreign key(organization_id,payment_account_id) references public.payment_accounts(organization_id,id)
);
create table public.bank_statement_lines (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, import_id uuid not null, payment_account_id uuid not null,
 transaction_date date not null, amount numeric(20,4) not null check(amount<>0), reference text, description text not null, status text not null default 'UNMATCHED' check(status in('UNMATCHED','MATCHED','EXCLUDED','REVIEW')),
 matched_source_type text, matched_source_id uuid, matched_by uuid references auth.users(id), matched_at timestamptz, created_at timestamptz not null default now(), unique(organization_id,id),
 foreign key(organization_id,import_id) references public.bank_statement_imports(organization_id,id) on delete cascade, foreign key(organization_id,payment_account_id) references public.payment_accounts(organization_id,id)
);

create index journal_entries_date_idx on public.journal_entries(organization_id,journal_date,status);
create index journal_lines_account_idx on public.journal_lines(organization_id,account_id,journal_id);
create index accounting_events_pending_idx on public.accounting_events(organization_id,status,event_date) where status in('PENDING','FAILED');
create index expenses_status_idx on public.expenses(organization_id,status,expense_date desc);
create index bank_statement_unmatched_idx on public.bank_statement_lines(organization_id,payment_account_id,status,transaction_date);

comment on table public.accounting_events is 'Transactional accounting outbox and posting status boundary.';
comment on table public.journal_entries is 'Posted entries are immutable; corrections use linked reversals.';
comment on table public.bank_statement_lines is 'User-confirmed manual reconciliation; suggestions are deterministic only.';
