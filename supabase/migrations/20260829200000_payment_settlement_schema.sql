create table public.payment_number_counters (
 organization_id uuid not null references public.organizations(id) on delete cascade,
 prefix text not null,
 next_value bigint not null default 1 check(next_value>0),
 updated_at timestamptz not null default now(),
 primary key(organization_id,prefix)
);

create table public.payment_accounts (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id) on delete cascade,
 branch_id uuid,
 account_code text not null,
 name text not null,
 account_type text not null check(account_type in('CASH','BANK','CARD_CLEARING','MOBILE_MONEY','OTHER_CLEARING')),
 currency text not null check(currency~'^[A-Z]{3}$'),
 status text not null default 'ACTIVE' check(status in('ACTIVE','INACTIVE')),
 description text,
 created_by uuid not null references auth.users(id),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(organization_id,id),
 unique(organization_id,account_code),
 foreign key(organization_id,branch_id) references public.branches(organization_id,id)
);

create table public.payment_methods (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id) on delete cascade,
 branch_id uuid,
 default_account_id uuid,
 code text not null,
 name text not null,
 method_type text not null check(method_type in('CASH','BANK_TRANSFER','CARD','MOBILE_MONEY','CHEQUE','STORE_CREDIT','OTHER')),
 requires_reference boolean not null default false,
 allows_overpayment boolean not null default true,
 requires_approval boolean not null default false,
 status text not null default 'ACTIVE' check(status in('ACTIVE','INACTIVE')),
 created_by uuid not null references auth.users(id),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique(organization_id,id),
 unique(organization_id,code),
 foreign key(organization_id,branch_id) references public.branches(organization_id,id),
 foreign key(organization_id,default_account_id) references public.payment_accounts(organization_id,id)
);

create table public.payments (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id) on delete cascade,
 branch_id uuid not null,
 payment_number text not null,
 counterparty_type text not null check(counterparty_type in('CUSTOMER','SUPPLIER')),
 direction text not null check(direction in('RECEIPT','PAYMENT')),
 customer_id uuid,
 supplier_id uuid,
 payment_date date not null,
 currency text not null check(currency~'^[A-Z]{3}$'),
 exchange_rate_snapshot numeric(24,10) not null check(exchange_rate_snapshot>0),
 amount numeric(20,4) not null check(amount>0),
 base_currency_amount numeric(20,4) not null check(base_currency_amount>0),
 payment_method_id uuid not null,
 settlement_account_id uuid not null,
 external_reference text,
 notes text,
 status text not null check(status in('POSTED','PARTIALLY_ALLOCATED','ALLOCATED','VOIDED','PARTIALLY_REFUNDED','REFUNDED')),
 idempotency_key uuid not null,
 request_hash text not null,
 is_reversal boolean not null default false,
 original_payment_id uuid,
 reversal_reason text,
 created_by uuid not null references auth.users(id),
 posted_by uuid not null references auth.users(id),
 posted_at timestamptz not null default now(),
 created_at timestamptz not null default now(),
 unique(organization_id,id),
 unique(organization_id,payment_number),
 unique(organization_id,idempotency_key),
 check((counterparty_type='CUSTOMER' and direction='RECEIPT' and customer_id is not null and supplier_id is null) or (counterparty_type='SUPPLIER' and direction='PAYMENT' and supplier_id is not null and customer_id is null)),
 check((is_reversal and original_payment_id is not null) or (not is_reversal and original_payment_id is null)),
 foreign key(organization_id,branch_id) references public.branches(organization_id,id),
 foreign key(organization_id,customer_id) references public.customers(organization_id,id),
 foreign key(organization_id,supplier_id) references public.suppliers(organization_id,id),
 foreign key(organization_id,payment_method_id) references public.payment_methods(organization_id,id),
 foreign key(organization_id,settlement_account_id) references public.payment_accounts(organization_id,id),
 foreign key(organization_id,original_payment_id) references public.payments(organization_id,id)
);

create table public.payment_allocations (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id) on delete cascade,
 payment_id uuid not null,
 customer_invoice_id uuid,
 supplier_invoice_id uuid,
 allocated_amount numeric(20,4) not null check(allocated_amount>0),
 allocated_base_amount numeric(20,4) not null check(allocated_base_amount>0),
 allocation_date date not null,
 is_reversal boolean not null default false,
 original_allocation_id uuid,
 created_by uuid not null references auth.users(id),
 created_at timestamptz not null default now(),
 unique(organization_id,id),
 check((customer_invoice_id is not null and supplier_invoice_id is null) or (supplier_invoice_id is not null and customer_invoice_id is null)),
 check((is_reversal and original_allocation_id is not null) or (not is_reversal and original_allocation_id is null)),
 foreign key(organization_id,payment_id) references public.payments(organization_id,id),
 foreign key(organization_id,customer_invoice_id) references public.customer_invoices(organization_id,id),
 foreign key(organization_id,supplier_invoice_id) references public.supplier_invoices(organization_id,id),
 foreign key(organization_id,original_allocation_id) references public.payment_allocations(organization_id,id)
);

create table public.customer_credit_allocations (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
 credit_note_id uuid not null, invoice_id uuid not null, allocated_amount numeric(20,4) not null check(allocated_amount>0),
 allocated_base_amount numeric(20,4) not null check(allocated_base_amount>0), allocation_date date not null,
 created_by uuid not null references auth.users(id), created_at timestamptz not null default now(), unique(organization_id,id),
 unique(organization_id,credit_note_id,invoice_id),
 foreign key(organization_id,credit_note_id) references public.customer_credit_notes(organization_id,id),
 foreign key(organization_id,invoice_id) references public.customer_invoices(organization_id,id)
);

create table public.supplier_credit_allocations (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
 supplier_credit_id uuid not null, supplier_invoice_id uuid not null, allocated_amount numeric(20,4) not null check(allocated_amount>0),
 allocated_base_amount numeric(20,4) not null check(allocated_base_amount>0), allocation_date date not null,
 created_by uuid not null references auth.users(id), created_at timestamptz not null default now(), unique(organization_id,id),
 unique(organization_id,supplier_credit_id,supplier_invoice_id),
 foreign key(organization_id,supplier_credit_id) references public.supplier_credits(organization_id,id),
 foreign key(organization_id,supplier_invoice_id) references public.supplier_invoices(organization_id,id)
);

create table public.customer_refunds (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
 branch_id uuid not null, refund_number text not null, customer_id uuid not null, source_payment_id uuid, source_credit_note_id uuid,
 refund_date date not null, currency text not null check(currency~'^[A-Z]{3}$'), exchange_rate_snapshot numeric(24,10) not null check(exchange_rate_snapshot>0),
 amount numeric(20,4) not null check(amount>0), base_currency_amount numeric(20,4) not null check(base_currency_amount>0),
 payment_method_id uuid not null, settlement_account_id uuid not null, external_reference text, reason text not null,
 status text not null check(status in('PENDING_APPROVAL','POSTED','VOIDED')), idempotency_key uuid not null, request_hash text not null,
 approval_request_id uuid, approved_by uuid references auth.users(id), processed_by uuid references auth.users(id), posted_at timestamptz,
 created_by uuid not null references auth.users(id), created_at timestamptz not null default now(),
 unique(organization_id,id), unique(organization_id,refund_number), unique(organization_id,idempotency_key),
 check((source_payment_id is not null and source_credit_note_id is null) or (source_credit_note_id is not null and source_payment_id is null)),
 foreign key(organization_id,branch_id) references public.branches(organization_id,id),
 foreign key(organization_id,customer_id) references public.customers(organization_id,id),
 foreign key(organization_id,source_payment_id) references public.payments(organization_id,id),
 foreign key(organization_id,source_credit_note_id) references public.customer_credit_notes(organization_id,id),
 foreign key(organization_id,payment_method_id) references public.payment_methods(organization_id,id),
 foreign key(organization_id,settlement_account_id) references public.payment_accounts(organization_id,id),
 foreign key(organization_id,approval_request_id) references public.approval_requests(organization_id,id)
);

create index payments_party_date_idx on public.payments(organization_id,counterparty_type,customer_id,supplier_id,payment_date desc);
create index payments_branch_status_idx on public.payments(organization_id,branch_id,status,payment_date desc);
create index payment_allocations_customer_idx on public.payment_allocations(organization_id,customer_invoice_id) where not is_reversal;
create index payment_allocations_supplier_idx on public.payment_allocations(organization_id,supplier_invoice_id) where not is_reversal;
create index refunds_customer_date_idx on public.customer_refunds(organization_id,customer_id,refund_date desc);
create unique index payments_reference_guard on public.payments(organization_id,payment_method_id,external_reference,amount) where external_reference is not null and not is_reversal and status<>'VOIDED';

comment on table public.payment_accounts is 'Operational settlement accounts, not a General Ledger chart of accounts.';
comment on column public.payments.external_reference is 'Operational reference only. Never store PAN, CVV, PIN, or magnetic-stripe data.';
