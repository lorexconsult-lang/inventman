-- Phase 3: supplier, procurement, approvals, receiving and AP foundation.
create table public.procurement_settings (
 organization_id uuid primary key references public.organizations(id) on delete cascade,
 over_delivery_policy text not null default 'DISALLOW' check(over_delivery_policy in ('DISALLOW','ALLOW_WITH_TOLERANCE','AUTHORIZED_OVERRIDE')),
 over_delivery_tolerance_percent numeric(9,4) not null default 0 check(over_delivery_tolerance_percent between 0 and 100),
 require_po_approval boolean not null default true,
 require_inspection boolean not null default true,
 updated_at timestamptz not null default now(), updated_by uuid references auth.users(id)
);

create table public.suppliers (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
 supplier_code text not null, supplier_type text not null default 'OTHER' check(supplier_type in ('MANUFACTURER','DISTRIBUTOR','WHOLESALER','IMPORTER','SERVICE_PROVIDER','OTHER')),
 legal_name text not null, trading_name text, email text, phone text, alternate_phone text, website text, tax_number text, registration_number text,
 default_currency text not null check(default_currency ~ '^[A-Z]{3}$'), default_payment_terms text, credit_limit numeric(20,4) not null default 0 check(credit_limit>=0), lead_time_days integer not null default 0 check(lead_time_days>=0), notes text,
 status text not null default 'ACTIVE' check(status in ('ACTIVE','INACTIVE','BLOCKED','ARCHIVED')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid not null references auth.users(id),
 unique(organization_id,id), unique(organization_id,supplier_code)
);
create table public.supplier_addresses (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null, supplier_id uuid not null, address_type text not null check(address_type in ('BILLING','DELIVERY','WAREHOUSE','HEAD_OFFICE','OTHER')),
 line_1 text not null, line_2 text, city text, state_region text, postal_code text, country_code text not null check(country_code ~ '^[A-Z]{2}$'), is_primary boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 foreign key(organization_id,supplier_id) references public.suppliers(organization_id,id) on delete cascade
);
create table public.supplier_contacts (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null, supplier_id uuid not null, name text not null, title text, email text, phone text, whatsapp text, notes text,
 is_primary boolean not null default false, is_procurement boolean not null default false, is_finance boolean not null default false, status text not null default 'ACTIVE' check(status in ('ACTIVE','INACTIVE')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), foreign key(organization_id,supplier_id) references public.suppliers(organization_id,id) on delete cascade
);
create table public.supplier_documents (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null, supplier_id uuid not null, document_type text not null check(document_type in ('AGREEMENT','QUOTATION','INVOICE','CERTIFICATION','TAX','PRICE_LIST','DELIVERY','OTHER')),
 file_name text not null, storage_path text not null, media_type text not null, size_bytes bigint not null check(size_bytes between 1 and 20971520), notes text, created_at timestamptz not null default now(), created_by uuid not null references auth.users(id),
 foreign key(organization_id,supplier_id) references public.suppliers(organization_id,id) on delete restrict, unique(organization_id,storage_path)
);
create table public.supplier_products (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null, supplier_id uuid not null, product_variant_id uuid not null, supplier_sku text, supplier_description text, preferred_packaging_id uuid,
 minimum_order_quantity numeric(24,6) not null default 1 check(minimum_order_quantity>0), order_multiple numeric(24,6) not null default 1 check(order_multiple>0), lead_time_days integer not null default 0 check(lead_time_days>=0), last_quoted_price numeric(24,8), is_preferred boolean not null default false, is_active boolean not null default true,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 foreign key(organization_id,supplier_id) references public.suppliers(organization_id,id) on delete restrict,
 foreign key(organization_id,product_variant_id) references public.product_variants(organization_id,id) on delete restrict,
 foreign key(organization_id,preferred_packaging_id) references public.product_variant_packaging(organization_id,id) on delete restrict,
 unique(organization_id,supplier_id,product_variant_id)
);
create table public.supplier_price_history (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null, supplier_id uuid not null, product_variant_id uuid not null, packaging_id uuid not null,
 quoted_price numeric(24,8) not null check(quoted_price>=0), effective_date date not null, currency text not null check(currency ~ '^[A-Z]{3}$'), exchange_rate numeric(24,10) not null check(exchange_rate>0), base_currency text not null check(base_currency ~ '^[A-Z]{3}$'), base_currency_price numeric(24,8) not null check(base_currency_price>=0), source_quotation_id uuid, created_at timestamptz not null default now(),
 foreign key(organization_id,supplier_id) references public.suppliers(organization_id,id), foreign key(organization_id,product_variant_id) references public.product_variants(organization_id,id), foreign key(organization_id,packaging_id) references public.product_variant_packaging(organization_id,id)
);

create table public.approval_policies (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, name text not null, document_type text not null,
 branch_id uuid, minimum_amount numeric(20,4) not null default 0, currency text not null, prohibit_self_approval boolean not null default true, is_active boolean not null default true,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), created_by uuid not null references auth.users(id), unique(organization_id,id),
 foreign key(organization_id,branch_id) references public.branches(organization_id,id)
);
create table public.approval_steps (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null, policy_id uuid not null, step_order integer not null check(step_order>0), permission_code text not null, approvals_required integer not null default 1 check(approvals_required>0),
 foreign key(organization_id,policy_id) references public.approval_policies(organization_id,id) on delete cascade, unique(policy_id,step_order)
);
create table public.approval_requests (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null, policy_id uuid, document_type text not null, document_id uuid not null, branch_id uuid, amount numeric(20,4) not null, currency text not null,
 requester_id uuid not null references auth.users(id), current_step integer not null default 1, status text not null default 'PENDING' check(status in ('PENDING','APPROVED','REJECTED','RETURNED','CANCELLED')),
 document_hash text not null, submitted_at timestamptz not null default now(), finalized_at timestamptz, unique(organization_id,id), unique(organization_id,document_type,document_id,status),
 foreign key(organization_id,policy_id) references public.approval_policies(organization_id,id), foreign key(organization_id,branch_id) references public.branches(organization_id,id)
);
create table public.approval_actions (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null, approval_request_id uuid not null, step_order integer not null, actor_id uuid not null references auth.users(id), action text not null check(action in ('APPROVE','REJECT','RETURN_FOR_CHANGES','CANCEL')), comments text, acted_at timestamptz not null default now(),
 foreign key(organization_id,approval_request_id) references public.approval_requests(organization_id,id) on delete restrict, unique(approval_request_id,step_order,actor_id)
);

create table public.purchase_requisitions (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null, business_id uuid not null, requisition_number text not null, requesting_branch_id uuid not null, requesting_user_id uuid not null references auth.users(id), department text, required_by_date date, priority text not null default 'NORMAL' check(priority in ('LOW','NORMAL','HIGH','URGENT')), justification text,
 status text not null default 'DRAFT' check(status in ('DRAFT','SUBMITTED','PENDING_APPROVAL','APPROVED','PARTIALLY_SOURCED','FULLY_SOURCED','REJECTED','CANCELLED','CLOSED')), submitted_at timestamptz, approved_at timestamptz, rejected_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(organization_id,id), unique(organization_id,requisition_number), foreign key(organization_id,business_id) references public.businesses(organization_id,id), foreign key(organization_id,requesting_branch_id) references public.branches(organization_id,id)
);
create table public.purchase_requisition_lines (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null, requisition_id uuid not null, product_variant_id uuid not null, packaging_id uuid not null, requested_quantity numeric(24,6) not null check(requested_quantity>0), conversion_snapshot numeric(24,8) not null check(conversion_snapshot>0), requested_base_quantity numeric(24,6) not null check(requested_base_quantity>0), estimated_unit_cost numeric(24,8), notes text,
 unique(organization_id,id), foreign key(organization_id,requisition_id) references public.purchase_requisitions(organization_id,id) on delete cascade, foreign key(organization_id,product_variant_id) references public.product_variants(organization_id,id), foreign key(organization_id,packaging_id) references public.product_variant_packaging(organization_id,id)
);

create table public.request_for_quotations (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null, business_id uuid not null, rfq_number text not null, requisition_id uuid, branch_id uuid not null, delivery_location_id uuid not null, required_delivery_date date, response_deadline timestamptz, terms text, notes text,
 status text not null default 'DRAFT' check(status in ('DRAFT','ISSUED','RESPONSES_PENDING','RESPONSES_RECEIVED','EVALUATION','AWARDED','CANCELLED','CLOSED')), created_by uuid not null references auth.users(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(organization_id,id), unique(organization_id,rfq_number), foreign key(organization_id,business_id) references public.businesses(organization_id,id), foreign key(organization_id,requisition_id) references public.purchase_requisitions(organization_id,id), foreign key(organization_id,branch_id) references public.branches(organization_id,id), foreign key(organization_id,delivery_location_id) references public.storage_locations(organization_id,id)
);
create table public.rfq_lines (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null, rfq_id uuid not null, requisition_line_id uuid, product_variant_id uuid not null, packaging_id uuid not null, requested_quantity numeric(24,6) not null check(requested_quantity>0), conversion_snapshot numeric(24,8) not null check(conversion_snapshot>0), product_description_snapshot text not null,
 unique(organization_id,id), foreign key(organization_id,rfq_id) references public.request_for_quotations(organization_id,id) on delete cascade, foreign key(organization_id,product_variant_id) references public.product_variants(organization_id,id), foreign key(organization_id,packaging_id) references public.product_variant_packaging(organization_id,id)
);
create table public.rfq_suppliers (
 organization_id uuid not null, rfq_id uuid not null, supplier_id uuid not null, status text not null default 'INVITED' check(status in ('INVITED','RESPONDED','DECLINED','AWARDED')),
 primary key(rfq_id,supplier_id), foreign key(organization_id,rfq_id) references public.request_for_quotations(organization_id,id) on delete cascade, foreign key(organization_id,supplier_id) references public.suppliers(organization_id,id)
);
create table public.supplier_quotations (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null, rfq_id uuid not null, supplier_id uuid not null, quote_number text not null, quote_date date not null, expiry_date date, currency text not null, exchange_rate numeric(24,10) not null check(exchange_rate>0), base_currency text not null, delivery_period_days integer, payment_terms text, shipping_terms text, subtotal numeric(20,4) not null, discount numeric(20,4) not null default 0, tax numeric(20,4) not null default 0, freight numeric(20,4) not null default 0, total numeric(20,4) not null, notes text, attachment_path text, status text not null default 'RECORDED' check(status in ('RECORDED','SELECTED','REJECTED','EXPIRED')), created_by uuid not null references auth.users(id), created_at timestamptz not null default now(),
 unique(organization_id,id), unique(organization_id,supplier_id,quote_number), foreign key(organization_id,rfq_id) references public.request_for_quotations(organization_id,id), foreign key(organization_id,supplier_id) references public.suppliers(organization_id,id)
);
create table public.supplier_quotation_lines (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null, quotation_id uuid not null, rfq_line_id uuid, product_variant_id uuid not null, packaging_id uuid not null, offered_quantity numeric(24,6) not null check(offered_quantity>0), conversion_snapshot numeric(24,8) not null check(conversion_snapshot>0), unit_price numeric(24,8) not null check(unit_price>=0), discount numeric(20,4) not null default 0, tax numeric(20,4) not null default 0, line_total numeric(20,4) not null, expected_delivery_date date, is_alternative boolean not null default false, awarded_quantity numeric(24,6) not null default 0 check(awarded_quantity>=0),
 foreign key(organization_id,quotation_id) references public.supplier_quotations(organization_id,id) on delete cascade, foreign key(organization_id,product_variant_id) references public.product_variants(organization_id,id), foreign key(organization_id,packaging_id) references public.product_variant_packaging(organization_id,id)
);

create table public.purchase_orders (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null, business_id uuid not null, purchase_order_number text not null, supplier_id uuid not null, originating_requisition_id uuid, originating_rfq_id uuid, originating_quotation_id uuid, branch_id uuid not null, receiving_warehouse_id uuid not null, receiving_location_id uuid not null,
 order_date date not null, expected_delivery_date date, currency text not null, exchange_rate numeric(24,10) not null check(exchange_rate>0), base_currency text not null, subtotal numeric(20,4) not null, discount numeric(20,4) not null default 0, tax numeric(20,4) not null default 0, freight numeric(20,4) not null default 0, other_cost numeric(20,4) not null default 0, total numeric(20,4) not null, base_currency_total numeric(20,4) not null,
 payment_terms text, status text not null default 'DRAFT' check(status in ('DRAFT','PENDING_APPROVAL','APPROVED','SENT','PARTIALLY_RECEIVED','FULLY_RECEIVED','CLOSED','CANCELLED')), revision integer not null default 1, supplier_name_snapshot text not null, supplier_code_snapshot text not null, supplier_terms_snapshot text, notes text, created_by uuid not null references auth.users(id), approved_by uuid references auth.users(id), approved_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(organization_id,id), unique(organization_id,purchase_order_number), foreign key(organization_id,business_id) references public.businesses(organization_id,id), foreign key(organization_id,supplier_id) references public.suppliers(organization_id,id), foreign key(organization_id,originating_requisition_id) references public.purchase_requisitions(organization_id,id), foreign key(organization_id,originating_rfq_id) references public.request_for_quotations(organization_id,id), foreign key(organization_id,originating_quotation_id) references public.supplier_quotations(organization_id,id), foreign key(organization_id,branch_id) references public.branches(organization_id,id), foreign key(organization_id,receiving_warehouse_id) references public.warehouses(organization_id,id), foreign key(organization_id,receiving_location_id) references public.storage_locations(organization_id,id)
);
create table public.purchase_order_lines (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null, purchase_order_id uuid not null, product_variant_id uuid not null, packaging_id uuid not null, product_description_snapshot text not null, supplier_item_code_snapshot text, ordered_quantity numeric(24,6) not null check(ordered_quantity>0), conversion_snapshot numeric(24,8) not null check(conversion_snapshot>0), ordered_base_quantity numeric(24,6) not null check(ordered_base_quantity>0), unit_price numeric(24,8) not null check(unit_price>=0), discount numeric(20,4) not null default 0, tax numeric(20,4) not null default 0, line_total numeric(20,4) not null, accepted_base_quantity numeric(24,6) not null default 0, rejected_base_quantity numeric(24,6) not null default 0,
 unique(organization_id,id), foreign key(organization_id,purchase_order_id) references public.purchase_orders(organization_id,id) on delete cascade, foreign key(organization_id,product_variant_id) references public.product_variants(organization_id,id), foreign key(organization_id,packaging_id) references public.product_variant_packaging(organization_id,id)
);

create table public.goods_receipts (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null, business_id uuid not null, grn_number text not null, purchase_order_id uuid not null, supplier_id uuid not null, branch_id uuid not null, warehouse_id uuid not null, storage_location_id uuid not null, supplier_delivery_note text, received_at timestamptz not null, received_by uuid not null references auth.users(id), status text not null default 'DRAFT' check(status in ('DRAFT','INSPECTED','POSTED','VOID')), notes text, idempotency_key uuid not null, inventory_transaction_id uuid, created_at timestamptz not null default now(), posted_at timestamptz,
 unique(organization_id,id), unique(organization_id,grn_number), unique(organization_id,idempotency_key), foreign key(organization_id,business_id) references public.businesses(organization_id,id), foreign key(organization_id,purchase_order_id) references public.purchase_orders(organization_id,id), foreign key(organization_id,supplier_id) references public.suppliers(organization_id,id), foreign key(organization_id,branch_id) references public.branches(organization_id,id), foreign key(organization_id,warehouse_id) references public.warehouses(organization_id,id), foreign key(organization_id,storage_location_id) references public.storage_locations(organization_id,id), foreign key(organization_id,inventory_transaction_id) references public.inventory_transactions(organization_id,id)
);
create table public.goods_receipt_lines (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null, goods_receipt_id uuid not null, purchase_order_line_id uuid not null, product_variant_id uuid not null, packaging_id uuid not null, ordered_quantity_snapshot numeric(24,6) not null, previously_accepted_base_quantity numeric(24,6) not null, delivered_quantity numeric(24,6) not null check(delivered_quantity>=0), accepted_quantity numeric(24,6) not null check(accepted_quantity>=0), rejected_quantity numeric(24,6) not null default 0 check(rejected_quantity>=0), damaged_quantity numeric(24,6) not null default 0 check(damaged_quantity>=0), conversion_snapshot numeric(24,8) not null, accepted_base_quantity numeric(24,6) not null, inspection_status text not null check(inspection_status in ('ACCEPTED','PARTIALLY_ACCEPTED','REJECTED')), rejection_reason text, damage_reason text, notes text, unit_purchase_cost_base numeric(24,8) not null, allocated_landed_cost_base numeric(28,8) not null default 0, inventory_unit_cost_base numeric(24,8) not null,
 unique(organization_id,id), foreign key(organization_id,goods_receipt_id) references public.goods_receipts(organization_id,id) on delete cascade, foreign key(organization_id,purchase_order_line_id) references public.purchase_order_lines(organization_id,id), foreign key(organization_id,product_variant_id) references public.product_variants(organization_id,id), foreign key(organization_id,packaging_id) references public.product_variant_packaging(organization_id,id), check(accepted_quantity+rejected_quantity<=delivered_quantity)
);
create table public.landed_costs (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null, purchase_order_id uuid, goods_receipt_id uuid, cost_type text not null check(cost_type in ('FREIGHT','SHIPPING','INSURANCE','CUSTOMS_DUTY','CLEARING','HANDLING','PORT_CHARGES','OTHER')), description text, currency text not null, exchange_rate numeric(24,10) not null check(exchange_rate>0), amount numeric(20,4) not null check(amount>=0), base_currency_amount numeric(20,4) not null check(base_currency_amount>=0), allocation_method text not null check(allocation_method in ('BY_VALUE','BY_QUANTITY','BY_WEIGHT','MANUAL')), is_acquisition_cost boolean not null default true, created_at timestamptz not null default now(), created_by uuid not null references auth.users(id), foreign key(organization_id,purchase_order_id) references public.purchase_orders(organization_id,id), foreign key(organization_id,goods_receipt_id) references public.goods_receipts(organization_id,id), check(purchase_order_id is not null or goods_receipt_id is not null)
);
create table public.landed_cost_allocations (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null, landed_cost_id uuid not null, goods_receipt_line_id uuid not null, allocated_amount_base numeric(28,8) not null check(allocated_amount_base>=0), created_at timestamptz not null default now(), foreign key(landed_cost_id) references public.landed_costs(id) on delete cascade, foreign key(organization_id,goods_receipt_line_id) references public.goods_receipt_lines(organization_id,id), unique(landed_cost_id,goods_receipt_line_id)
);

create table public.supplier_invoices (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null, supplier_id uuid not null, invoice_number text not null, invoice_date date not null, due_date date, currency text not null, exchange_rate numeric(24,10) not null check(exchange_rate>0), base_currency text not null, subtotal numeric(20,4) not null, discount numeric(20,4) not null default 0, tax numeric(20,4) not null default 0, freight_charges numeric(20,4) not null default 0, total numeric(20,4) not null, base_currency_total numeric(20,4) not null, amount_paid_base numeric(20,4) not null default 0, status text not null default 'DRAFT' check(status in ('DRAFT','REVIEW','APPROVED','PARTIALLY_PAID','PAID','DISPUTED','VOID')), match_status text not null default 'UNMATCHED' check(match_status in ('UNMATCHED','MATCHED','QUANTITY_VARIANCE','PRICE_VARIANCE','TOTAL_VARIANCE')), attachment_path text, notes text, created_by uuid not null references auth.users(id), approved_by uuid references auth.users(id), approved_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(organization_id,id), unique(organization_id,supplier_id,invoice_number), foreign key(organization_id,supplier_id) references public.suppliers(organization_id,id)
);
create table public.supplier_invoice_lines (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null, supplier_invoice_id uuid not null, purchase_order_line_id uuid, goods_receipt_line_id uuid, description text not null, product_variant_id uuid, quantity numeric(24,6) not null check(quantity>0), unit_price numeric(24,8) not null check(unit_price>=0), discount numeric(20,4) not null default 0, tax numeric(20,4) not null default 0, line_total numeric(20,4) not null, match_variance_base numeric(20,4) not null default 0, foreign key(organization_id,supplier_invoice_id) references public.supplier_invoices(organization_id,id) on delete cascade, foreign key(organization_id,purchase_order_line_id) references public.purchase_order_lines(organization_id,id), foreign key(organization_id,goods_receipt_line_id) references public.goods_receipt_lines(organization_id,id), foreign key(organization_id,product_variant_id) references public.product_variants(organization_id,id)
);
create table public.supplier_invoice_links (organization_id uuid not null, supplier_invoice_id uuid not null, purchase_order_id uuid, goods_receipt_id uuid, primary key(supplier_invoice_id,purchase_order_id,goods_receipt_id), foreign key(organization_id,supplier_invoice_id) references public.supplier_invoices(organization_id,id) on delete cascade, foreign key(organization_id,purchase_order_id) references public.purchase_orders(organization_id,id), foreign key(organization_id,goods_receipt_id) references public.goods_receipts(organization_id,id));
create table public.supplier_credits (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null, supplier_id uuid not null, supplier_invoice_id uuid, purchase_return_id uuid, credit_number text not null, credit_date date not null, reason text not null, currency text not null, exchange_rate numeric(24,10) not null, amount numeric(20,4) not null check(amount>0), base_currency_amount numeric(20,4) not null check(base_currency_amount>0), status text not null default 'APPROVED' check(status in ('DRAFT','APPROVED','VOID')), created_at timestamptz not null default now(), unique(organization_id,id), unique(organization_id,supplier_id,credit_number), foreign key(organization_id,supplier_id) references public.suppliers(organization_id,id), foreign key(organization_id,supplier_invoice_id) references public.supplier_invoices(organization_id,id)
);
create table public.purchase_returns (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null, business_id uuid not null, return_number text not null, supplier_id uuid not null, purchase_order_id uuid, goods_receipt_id uuid, branch_id uuid not null, storage_location_id uuid not null, return_date timestamptz not null, supplier_return_reference text, reason text not null check(reason in ('DEFECTIVE','INCORRECT_GOODS','EXCESS_DELIVERY','EXPIRED','QUALITY_FAILURE','OTHER')), notes text, status text not null default 'DRAFT' check(status in ('DRAFT','APPROVED','POSTED','CANCELLED')), idempotency_key uuid not null, inventory_transaction_id uuid, created_by uuid not null references auth.users(id), created_at timestamptz not null default now(), posted_at timestamptz, unique(organization_id,id), unique(organization_id,return_number), unique(organization_id,idempotency_key), foreign key(organization_id,business_id) references public.businesses(organization_id,id), foreign key(organization_id,supplier_id) references public.suppliers(organization_id,id), foreign key(organization_id,purchase_order_id) references public.purchase_orders(organization_id,id), foreign key(organization_id,goods_receipt_id) references public.goods_receipts(organization_id,id), foreign key(organization_id,branch_id) references public.branches(organization_id,id), foreign key(organization_id,storage_location_id) references public.storage_locations(organization_id,id), foreign key(organization_id,inventory_transaction_id) references public.inventory_transactions(organization_id,id)
);
create table public.purchase_return_lines (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null, purchase_return_id uuid not null, goods_receipt_line_id uuid, product_variant_id uuid not null, packaging_id uuid not null, quantity numeric(24,6) not null check(quantity>0), conversion_snapshot numeric(24,8) not null check(conversion_snapshot>0), base_quantity numeric(24,6) not null check(base_quantity>0), unit_cost_base numeric(24,8) not null check(unit_cost_base>=0), foreign key(organization_id,purchase_return_id) references public.purchase_returns(organization_id,id) on delete cascade, foreign key(organization_id,goods_receipt_line_id) references public.goods_receipt_lines(organization_id,id), foreign key(organization_id,product_variant_id) references public.product_variants(organization_id,id), foreign key(organization_id,packaging_id) references public.product_variant_packaging(organization_id,id)
);
alter table public.supplier_credits add constraint supplier_credits_purchase_return_fk foreign key(organization_id,purchase_return_id) references public.purchase_returns(organization_id,id);

create table public.procurement_activity (
 id bigint generated always as identity primary key, organization_id uuid not null references public.organizations(id) on delete cascade, document_type text not null, document_id uuid not null, action text not null, actor_id uuid references auth.users(id), details jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);

create index suppliers_search_idx on public.suppliers(organization_id,status,legal_name,supplier_code);
create index supplier_products_variant_idx on public.supplier_products(organization_id,product_variant_id,is_active);
create index supplier_price_history_lookup_idx on public.supplier_price_history(organization_id,product_variant_id,supplier_id,effective_date desc);
create index requisitions_status_idx on public.purchase_requisitions(organization_id,requesting_branch_id,status,created_at desc);
create index approval_pending_idx on public.approval_requests(organization_id,status,branch_id,submitted_at);
create index rfq_status_idx on public.request_for_quotations(organization_id,branch_id,status,response_deadline);
create index quotations_compare_idx on public.supplier_quotations(organization_id,rfq_id,status,total);
create index purchase_orders_status_idx on public.purchase_orders(organization_id,branch_id,status,expected_delivery_date);
create index po_lines_outstanding_idx on public.purchase_order_lines(organization_id,purchase_order_id,product_variant_id) where accepted_base_quantity<ordered_base_quantity;
create index goods_receipts_po_idx on public.goods_receipts(organization_id,purchase_order_id,received_at desc);
create index supplier_invoices_due_idx on public.supplier_invoices(organization_id,supplier_id,status,due_date);
create index purchase_returns_supplier_idx on public.purchase_returns(organization_id,supplier_id,return_date desc);
create index procurement_activity_document_idx on public.procurement_activity(organization_id,document_type,document_id,created_at desc);

create view public.supplier_payables with(security_invoker=true) as
select i.organization_id,i.supplier_id,sum(case when i.status not in ('VOID','DRAFT') then i.base_currency_total-i.amount_paid_base else 0 end)-coalesce((select sum(c.base_currency_amount) from public.supplier_credits c where c.organization_id=i.organization_id and c.supplier_id=i.supplier_id and c.status='APPROVED'),0) outstanding_base
from public.supplier_invoices i group by i.organization_id,i.supplier_id;

create view public.purchase_order_outstanding with(security_invoker=true) as
select l.*,l.ordered_base_quantity-l.accepted_base_quantity outstanding_base_quantity from public.purchase_order_lines l where l.accepted_base_quantity<l.ordered_base_quantity;
