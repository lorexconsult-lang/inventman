import { randomBytes } from "node:crypto";
import { chromium } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
const ref = process.env.SUPABASE_PROJECT_REF,
  key =
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY,
  publishable = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (
  !ref ||
  !key ||
  !publishable ||
  process.env.CONFIRM_DEVELOPMENT_PROJECT !== `DEVELOPMENT:${ref}` ||
  process.env.NODE_ENV === "production"
)
  throw new Error("Development verification environment is incomplete");
const url = `https://${ref}.supabase.co`,
  retryFetch = async (input, init) => {
    let lastError;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        const response = await fetch(input, init);
        if (response.status < 500) return response;
        lastError = new Error(`Hosted development response ${response.status}`);
      } catch (error) {
        lastError = error;
      }
      await new Promise((resolve) => setTimeout(resolve, 400 * 2 ** attempt));
    }
    throw lastError;
  },
  admin = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: retryFetch },
  }),
  suffix = `${Date.now()}-${randomBytes(3).toString("hex")}`,
  password = `Gate-${randomBytes(24).toString("base64url")}!9`,
  users = [],
  orgs = [];
let browser;
const ok = (condition, label) => {
  if (!condition) throw new Error(`FAILED: ${label}`);
  console.log(`${label}: PASS`);
};
const client = () =>
  createClient(url, publishable, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: retryFetch },
  });
async function rpc(c, name, args) {
  const { data, error } = await c.rpc(name, args);
  if (error) throw error;
  return data;
}
async function provision(label) {
  const email = `phase3-${label}-${suffix}@example.test`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { phase3_e2e: true, run: suffix },
  });
  if (error) throw error;
  users.push(data.user.id);
  const c = client();
  const login = await c.auth.signInWithPassword({ email, password });
  if (login.error) throw login.error;
  return { email, c, id: data.user.id };
}
async function cleanup() {
  for (const id of orgs) {
    const { error } = await admin.rpc(
      "purge_ephemeral_procurement_verification",
      { target_organization_id: id },
    );
    if (error)
      console.error(`cleanup organization failed: ${error.code ?? "unknown"}`);
  }
  for (const id of users) {
    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) console.error(`cleanup user failed: ${error.code ?? "unknown"}`);
  }
}
try {
  const owner = await provision("owner"),
    approver = await provision("approver"),
    restricted = await provision("restricted"),
    foreign = await provision("foreign");
  const org = await rpc(owner.c, "create_organization", {
    organization_name: "Phase 3 E2E",
    organization_slug: `phase3-e2e-${suffix}`,
    country_code: "GB",
    currency_code: "GBP",
    organization_timezone: "Europe/London",
  });
  orgs.push(org);
  const foreignOrg = await rpc(foreign.c, "create_organization", {
    organization_name: "Phase 3 E2E Foreign",
    organization_slug: `phase3-e2e-foreign-${suffix}`,
    country_code: "GB",
    currency_code: "GBP",
    organization_timezone: "Europe/London",
  });
  orgs.push(foreignOrg);
  const business = (
      await admin
        .from("businesses")
        .select("id")
        .eq("organization_id", org)
        .single()
    ).data.id,
    unit = (
      await admin
        .from("units_of_measure")
        .select("id")
        .eq("organization_id", org)
        .eq("name", "Piece")
        .single()
    ).data.id;
  const branchA = crypto.randomUUID(),
    branchB = crypto.randomUUID(),
    warehouseA = crypto.randomUUID(),
    warehouseB = crypto.randomUUID();
  let e;
  ({ error: e } = await owner.c.from("branches").insert([
    {
      id: branchA,
      organization_id: org,
      business_id: business,
      name: "E2E North",
      code: "E2EN",
      status: "active",
      timezone: "Europe/London",
      created_by: owner.id,
    },
    {
      id: branchB,
      organization_id: org,
      business_id: business,
      name: "E2E South",
      code: "E2ES",
      status: "active",
      timezone: "Europe/London",
      created_by: owner.id,
    },
  ]));
  if (e) throw e;
  ({ error: e } = await owner.c.from("warehouses").insert([
    {
      id: warehouseA,
      organization_id: org,
      business_id: business,
      branch_id: branchA,
      name: "E2E North Main",
      code: "E2EN-M",
      status: "active",
      warehouse_type: "MAIN",
      created_by: owner.id,
    },
    {
      id: warehouseB,
      organization_id: org,
      business_id: business,
      branch_id: branchB,
      name: "E2E South Main",
      code: "E2ES-M",
      status: "active",
      warehouse_type: "MAIN",
      created_by: owner.id,
    },
  ]));
  if (e) throw e;
  const locationA = (
    await admin
      .from("storage_locations")
      .select("id")
      .eq("warehouse_id", warehouseA)
      .eq("location_type", "ROOT")
      .single()
  ).data.id;
  const product = await rpc(owner.c, "create_simple_product", {
    target_organization_id: org,
    target_business_id: business,
    product_name: "Procurement E2E Item",
    target_product_type: "STOCKED_PRODUCT",
    target_category_id: null,
    target_brand_id: null,
    target_tax_profile_id: null,
    target_unit_id: unit,
    target_sku: `P3-${suffix}`,
    target_barcode: "",
    target_price_list_id: null,
    target_price: null,
    target_reference_cost: null,
    target_reorder_point: 5,
    target_track_inventory: true,
    target_idempotency_key: crypto.randomUUID(),
  });
  const variant = (
      await admin
        .from("product_variants")
        .select("id")
        .eq("product_id", product)
        .single()
    ).data.id,
    packaging = (
      await admin
        .from("product_variant_packaging")
        .select("id")
        .eq("product_variant_id", variant)
        .eq("is_base_unit", true)
        .single()
    ).data.id;
  const supplier1 = await rpc(owner.c, "create_supplier", {
    target_organization_id: org,
    target_code: "E2E-S1",
    target_type: "DISTRIBUTOR",
    target_legal_name: "E2E Supplier One",
    target_trading_name: "",
    target_email: "one@example.test",
    target_phone: "",
    target_currency: "GBP",
    target_payment_terms: "30 days",
    target_notes: "E2E",
  });
  const supplier2 = await rpc(owner.c, "create_supplier", {
    target_organization_id: org,
    target_code: "E2E-S2",
    target_type: "WHOLESALER",
    target_legal_name: "E2E Supplier Two",
    target_trading_name: "",
    target_email: "two@example.test",
    target_phone: "",
    target_currency: "GBP",
    target_payment_terms: "14 days",
    target_notes: "E2E",
  });
  ok(supplier1 && supplier2, "2. Create supplier");
  ({ error: e } = await admin
    .from("supplier_contacts")
    .insert({
      organization_id: org,
      supplier_id: supplier1,
      name: "Procurement Contact",
      email: "contact@example.test",
      is_primary: true,
      is_procurement: true,
    }));
  if (e) throw e;
  await rpc(owner.c, "add_supplier_product", {
    target_organization_id: org,
    target_supplier_id: supplier1,
    target_variant_id: variant,
    target_packaging_id: packaging,
    target_supplier_sku: "SUP-P3",
    target_description: "Supplier E2E item",
    target_minimum: 1,
    target_multiple: 1,
    target_lead_days: 3,
    target_preferred: true,
  });
  ok(true, "3. Add supplier contact/product relationship");
  const requisition = await rpc(owner.c, "create_purchase_requisition", {
    target_organization_id: org,
    target_business_id: business,
    target_branch_id: branchA,
    target_required_by: new Date(Date.now() + 604800000)
      .toISOString()
      .slice(0, 10),
    target_priority: "HIGH",
    target_department: "Operations",
    target_justification: "E2E restock",
    target_lines: [
      {
        product_variant_id: variant,
        packaging_id: packaging,
        quantity: 10,
        estimated_unit_cost: 10,
      },
    ],
  });
  ok(requisition, "4. Create purchase requisition");
  const policy = crypto.randomUUID();
  ({ error: e } = await admin
    .from("approval_policies")
    .insert({
      id: policy,
      organization_id: org,
      name: "E2E Requisition",
      document_type: "REQUISITION",
      branch_id: branchA,
      minimum_amount: 0,
      currency: "GBP",
      prohibit_self_approval: true,
      created_by: owner.id,
    }));
  if (e) throw e;
  ({ error: e } = await admin
    .from("approval_steps")
    .insert({
      organization_id: org,
      policy_id: policy,
      step_order: 1,
      permission_code: "procurement.requisition_approve",
    }));
  if (e) throw e;
  const approval = await rpc(owner.c, "submit_purchase_requisition", {
    target_organization_id: org,
    target_requisition_id: requisition,
    target_idempotency_key: crypto.randomUUID(),
  });
  ok(approval, "5. Submit requisition");
  const ownerRole = (
    await admin
      .from("roles")
      .select("id")
      .eq("organization_id", org)
      .eq("name", "Owner")
      .single()
  ).data.id;
  for (const u of [approver, restricted]) {
    const membership = (
      await admin
        .from("organization_members")
        .insert({
          organization_id: org,
          user_id: u.id,
          status: "active",
          joined_at: new Date().toISOString(),
        })
        .select("id")
        .single()
    ).data.id;
    u.membership = membership;
  }
  ({ error: e } = await admin
    .from("member_roles")
    .insert({
      organization_id: org,
      membership_id: approver.membership,
      role_id: ownerRole,
    }));
  if (e) throw e;
  await rpc(approver.c, "act_on_approval", {
    target_organization_id: org,
    target_approval_request_id: approval,
    target_action: "APPROVE",
    target_comments: "E2E approval",
  });
  ok(
    (
      await admin
        .from("purchase_requisitions")
        .select("status")
        .eq("id", requisition)
        .single()
    ).data.status === "APPROVED",
    "6. Approve requisition",
  );
  const rfq = await rpc(owner.c, "create_rfq", {
    target_organization_id: org,
    target_business_id: business,
    target_requisition_id: requisition,
    target_branch_id: branchA,
    target_location_id: locationA,
    target_required_date: new Date(Date.now() + 604800000)
      .toISOString()
      .slice(0, 10),
    target_deadline: new Date(Date.now() + 86400000).toISOString(),
    target_terms: "E2E terms",
    target_notes: "",
    target_supplier_ids: [supplier1, supplier2],
    target_lines: [
      {
        product_variant_id: variant,
        packaging_id: packaging,
        quantity: 10,
        requisition_line_id: "",
      },
    ],
  });
  await rpc(owner.c, "issue_rfq", {
    target_organization_id: org,
    target_rfq_id: rfq,
  });
  ok(rfq, "7. Create RFQ");
  const rfqLine = (
    await admin.from("rfq_lines").select("id").eq("rfq_id", rfq).single()
  ).data.id;
  const quote1 = await rpc(owner.c, "record_supplier_quotation", {
    target_organization_id: org,
    target_rfq_id: rfq,
    target_supplier_id: supplier1,
    target_quote_number: "Q-ONE",
    target_quote_date: new Date().toISOString().slice(0, 10),
    target_expiry_date: null,
    target_currency: "GBP",
    target_exchange_rate: 1,
    target_delivery_days: 3,
    target_payment_terms: "30 days",
    target_shipping_terms: "Delivered",
    target_discount: 0,
    target_tax: 0,
    target_freight: 0,
    target_notes: "",
    target_lines: [
      {
        rfq_line_id: rfqLine,
        quantity: 10,
        unit_price: 10,
        discount: 0,
        tax: 0,
        expected_delivery_date: "",
        is_alternative: false,
      },
    ],
  });
  const quote2 = await rpc(owner.c, "record_supplier_quotation", {
    target_organization_id: org,
    target_rfq_id: rfq,
    target_supplier_id: supplier2,
    target_quote_number: "Q-TWO",
    target_quote_date: new Date().toISOString().slice(0, 10),
    target_expiry_date: null,
    target_currency: "GBP",
    target_exchange_rate: 1,
    target_delivery_days: 6,
    target_payment_terms: "14 days",
    target_shipping_terms: "Delivered",
    target_discount: 0,
    target_tax: 0,
    target_freight: 0,
    target_notes: "",
    target_lines: [
      {
        rfq_line_id: rfqLine,
        quantity: 10,
        unit_price: 11,
        discount: 0,
        tax: 0,
        expected_delivery_date: "",
        is_alternative: false,
      },
    ],
  });
  ok(quote1 && quote2, "8. Record at least two supplier quotations");
  const quotes = (
    await owner.c
      .from("supplier_quotations")
      .select("id,total")
      .eq("rfq_id", rfq)
      .order("total")
  ).data;
  ok(
    quotes.length === 2 && Number(quotes[0].total) < Number(quotes[1].total),
    "9. Compare quotations",
  );
  const quoteLine = (
    await admin
      .from("supplier_quotation_lines")
      .select("id")
      .eq("quotation_id", quote1)
      .single()
  ).data.id;
  await rpc(owner.c, "award_quotation", {
    target_organization_id: org,
    target_quotation_id: quote1,
    target_awards: [{ quotation_line_id: quoteLine, quantity: 10 }],
  });
  ok(
    (
      await admin
        .from("request_for_quotations")
        .select("status")
        .eq("id", rfq)
        .single()
    ).data.status === "AWARDED",
    "10. Award/select supplier",
  );
  const po = await rpc(owner.c, "create_purchase_order", {
    target_organization_id: org,
    target_business_id: business,
    target_supplier_id: supplier1,
    target_branch_id: branchA,
    target_warehouse_id: warehouseA,
    target_location_id: locationA,
    target_order_date: new Date().toISOString().slice(0, 10),
    target_expected_date: new Date(Date.now() + 259200000)
      .toISOString()
      .slice(0, 10),
    target_currency: "GBP",
    target_exchange_rate: 1,
    target_payment_terms: "30 days",
    target_notes: "E2E PO",
    target_lines: [
      {
        product_variant_id: variant,
        packaging_id: packaging,
        quantity: 10,
        unit_price: 10,
        discount: 0,
        tax: 0,
        supplier_sku: "SUP-P3",
      },
    ],
  });
  ok(po, "11. Create Purchase Order");
  await rpc(owner.c, "approve_purchase_order", {
    target_organization_id: org,
    target_purchase_order_id: po,
    target_idempotency_key: crypto.randomUUID(),
  });
  ok(
    (await admin.from("purchase_orders").select("status").eq("id", po).single())
      .data.status === "APPROVED",
    "12. Submit/approve Purchase Order",
  );
  const poLine = (
      await admin
        .from("purchase_order_lines")
        .select("id")
        .eq("purchase_order_id", po)
        .single()
    ).data.id,
    receiptKey = crypto.randomUUID();
  const partial = await rpc(owner.c, "post_goods_receipt", {
    target_organization_id: org,
    target_purchase_order_id: po,
    target_supplier_delivery_note: "DN-PART",
    target_received_at: new Date().toISOString(),
    target_notes: "Partial",
    target_idempotency_key: receiptKey,
    target_allow_override: false,
    target_override_reason: "",
    target_lines: [
      {
        purchase_order_line_id: poLine,
        delivered_quantity: 4,
        accepted_quantity: 4,
        rejected_quantity: 0,
        damaged_quantity: 0,
      },
    ],
  });
  ok(partial, "13. Receive a partial delivery");
  const tx = (
    await admin
      .from("inventory_transactions")
      .select("id,transaction_type")
      .eq("id", partial.inventory_transaction_id)
      .single()
  ).data;
  ok(
    tx.transaction_type === "PURCHASE_RECEIPT",
    "14. Verify PURCHASE_RECEIPT posted through existing Inventory Ledger",
  );
  let balance = (
    await admin
      .from("inventory_balances")
      .select("on_hand_base_quantity,inventory_value,average_unit_cost")
      .eq("organization_id", org)
      .eq("product_variant_id", variant)
      .eq("storage_location_id", locationA)
      .single()
  ).data;
  ok(
    Number(balance.on_hand_base_quantity) === 4 &&
      Number(balance.inventory_value) === 40 &&
      Number(balance.average_unit_cost) === 10,
    "15. Verify physical inventory and valuation increased correctly",
  );
  const replay = await rpc(owner.c, "post_goods_receipt", {
    target_organization_id: org,
    target_purchase_order_id: po,
    target_supplier_delivery_note: "DN-PART",
    target_received_at: new Date().toISOString(),
    target_notes: "Partial",
    target_idempotency_key: receiptKey,
    target_allow_override: false,
    target_override_reason: "",
    target_lines: [
      {
        purchase_order_line_id: poLine,
        delivered_quantity: 4,
        accepted_quantity: 4,
        rejected_quantity: 0,
        damaged_quantity: 0,
      },
    ],
  });
  ok(
    replay.replayed === true &&
      (
        await admin
          .from("goods_receipts")
          .select("id", { count: "exact", head: true })
          .eq("purchase_order_id", po)
      ).count === 1,
    "GRN idempotency and no duplicate stock posting",
  );
  const remainder = await rpc(owner.c, "post_goods_receipt", {
    target_organization_id: org,
    target_purchase_order_id: po,
    target_supplier_delivery_note: "DN-FINAL",
    target_received_at: new Date().toISOString(),
    target_notes: "Remainder",
    target_idempotency_key: crypto.randomUUID(),
    target_allow_override: false,
    target_override_reason: "",
    target_lines: [
      {
        purchase_order_line_id: poLine,
        delivered_quantity: 6,
        accepted_quantity: 6,
        rejected_quantity: 0,
        damaged_quantity: 0,
      },
    ],
  });
  ok(remainder, "16. Receive remaining delivery");
  ok(
    (await admin.from("purchase_orders").select("status").eq("id", po).single())
      .data.status === "FULLY_RECEIVED",
    "17. Purchase Order fully received",
  );
  const invoice = await rpc(owner.c, "record_supplier_invoice", {
    target_organization_id: org,
    target_supplier_id: supplier1,
    target_invoice_number: "INV-E2E",
    target_invoice_date: new Date().toISOString().slice(0, 10),
    target_due_date: new Date(Date.now() + 2592000000)
      .toISOString()
      .slice(0, 10),
    target_currency: "GBP",
    target_exchange_rate: 1,
    target_subtotal: 100,
    target_discount: 0,
    target_tax: 0,
    target_freight: 0,
    target_total: 100,
    target_notes: "",
    target_po_ids: [po],
    target_grn_ids: [partial.goods_receipt_id],
  });
  ok(invoice, "18. Record supplier invoice");
  const inv = (
      await admin
        .from("supplier_invoices")
        .select("match_status")
        .eq("id", invoice)
        .single()
    ).data,
    link = (
      await admin
        .from("supplier_invoice_links")
        .select("supplier_invoice_id")
        .eq("supplier_invoice_id", invoice)
        .single()
    ).data;
  ok(
    inv.match_status === "MATCHED" && link,
    "19. Verify PO ↔ GRN ↔ Invoice matching",
  );
  const duplicate = await owner.c.rpc("record_supplier_invoice", {
    target_organization_id: org,
    target_supplier_id: supplier1,
    target_invoice_number: "INV-E2E",
    target_invoice_date: new Date().toISOString().slice(0, 10),
    target_due_date: null,
    target_currency: "GBP",
    target_exchange_rate: 1,
    target_subtotal: 100,
    target_discount: 0,
    target_tax: 0,
    target_freight: 0,
    target_total: 100,
    target_notes: "",
    target_po_ids: [po],
    target_grn_ids: [partial.goods_receipt_id],
  });
  ok(
    duplicate.error?.code === "23505",
    "Supplier invoice duplicate protection",
  );
  const returnResult = await rpc(owner.c, "post_purchase_return", {
    target_organization_id: org,
    target_business_id: business,
    target_supplier_id: supplier1,
    target_po_id: po,
    target_grn_id: partial.goods_receipt_id,
    target_branch_id: branchA,
    target_location_id: locationA,
    target_reason: "DEFECTIVE",
    target_notes: "E2E return",
    target_idempotency_key: crypto.randomUUID(),
    target_lines: [
      {
        product_variant_id: variant,
        packaging_id: packaging,
        quantity: 2,
        unit_cost_base: 10,
        goods_receipt_line_id: "",
      },
    ],
  });
  ok(returnResult.purchase_return_id, "20. Create Purchase Return");
  balance = (
    await admin
      .from("inventory_balances")
      .select("on_hand_base_quantity,inventory_value")
      .eq("organization_id", org)
      .eq("product_variant_id", variant)
      .eq("storage_location_id", locationA)
      .single()
  ).data;
  const returnTx = (
    await admin
      .from("inventory_transactions")
      .select("transaction_type")
      .eq("id", returnResult.inventory_transaction_id)
      .single()
  ).data;
  ok(
    Number(balance.on_hand_base_quantity) === 8 &&
      Number(balance.inventory_value) === 80 &&
      returnTx.transaction_type === "PURCHASE_RETURN",
    "21. Verify PURCHASE_RETURN reduces inventory correctly",
  );
  const restrictedRole = crypto.randomUUID();
  ({ error: e } = await admin
    .from("roles")
    .insert({
      id: restrictedRole,
      organization_id: org,
      name: "E2E Restricted Procurement",
    }));
  if (e) throw e;
  const perms = (
    await admin
      .from("permissions")
      .select("id")
      .in("code", [
        "procurement.po_view",
        "procurement.po_create",
        "procurement.requisition_view",
      ])
  ).data;
  ({ error: e } = await admin
    .from("role_permissions")
    .insert(
      perms.map((p) => ({
        organization_id: org,
        role_id: restrictedRole,
        permission_id: p.id,
      })),
    ));
  if (e) throw e;
  ({ error: e } = await admin
    .from("member_roles")
    .insert({
      organization_id: org,
      membership_id: restricted.membership,
      role_id: restrictedRole,
    }));
  if (e) throw e;
  ({ error: e } = await admin
    .from("member_branch_access")
    .insert({
      organization_id: org,
      membership_id: restricted.membership,
      branch_id: branchA,
    }));
  if (e) throw e;
  const deniedApproval = await restricted.c.rpc("act_on_approval", {
    target_organization_id: org,
    target_approval_request_id: approval,
    target_action: "APPROVE",
    target_comments: "unauthorized",
  });
  const deniedBranch = await restricted.c.rpc("create_purchase_order", {
    target_organization_id: org,
    target_business_id: business,
    target_supplier_id: supplier1,
    target_branch_id: branchB,
    target_warehouse_id: warehouseB,
    target_location_id: (
      await admin
        .from("storage_locations")
        .select("id")
        .eq("warehouse_id", warehouseB)
        .eq("location_type", "ROOT")
        .single()
    ).data.id,
    target_order_date: new Date().toISOString().slice(0, 10),
    target_expected_date: null,
    target_currency: "GBP",
    target_exchange_rate: 1,
    target_payment_terms: "",
    target_notes: "",
    target_lines: [
      {
        product_variant_id: variant,
        packaging_id: packaging,
        quantity: 1,
        unit_price: 1,
      },
    ],
  });
  const foreignRead = await restricted.c
    .from("purchase_orders")
    .select("id")
    .eq("organization_id", foreignOrg);
  ok(
    deniedApproval.error && deniedBranch.error && foreignRead.data.length === 0,
    "22. Restricted approval, branch tampering and cross-tenant access denied",
  );
  ok(
    (
      await admin
        .from("inventory_settings")
        .select("costing_method")
        .eq("organization_id", org)
        .single()
    ).data.costing_method === "WEIGHTED_AVERAGE" &&
      Number(balance.inventory_value) === 80,
    "WAC integration follows organization setting",
  );
  browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  const browserErrors = [];
  page.on("console", (m) => {
    if (m.type() === "error") browserErrors.push(`console:${m.text()}`);
  });
  page.on("pageerror", (err) => browserErrors.push(`page:${err.message}`));
  page.on("response", (res) => {
    if (
      res.status() >= 500 ||
      ([401, 403].includes(res.status()) && res.url().includes("/dashboard"))
    )
      browserErrors.push(`http:${res.status()} ${res.url()}`);
  });
  await page.goto("http://localhost:3100/auth/login");
  await page.getByLabel("Email address").fill(owner.email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/dashboard(?:$|\?)/, { timeout: 60_000 });
  ok(true, "1. Owner login");
  for (const path of [
    "/dashboard/procurement",
    "/dashboard/procurement/suppliers",
    "/dashboard/procurement/requisitions",
    "/dashboard/procurement/rfqs",
    "/dashboard/procurement/purchase-orders",
    "/dashboard/procurement/receipts",
    "/dashboard/procurement/invoices",
    "/dashboard/procurement/returns",
    "/dashboard/procurement/reports",
  ]) {
    await page.goto(`http://localhost:3100${path}`);
    await page.waitForTimeout(250);
    const failed = await page
      .getByRole("heading", { name: "Something went wrong" })
      .isVisible()
      .catch(() => false);
    if (failed)
      throw new Error(
        `Procurement page failed at ${path}: ${browserErrors.join(" | ")}`,
      );
    await page.locator("h1:visible").first().waitFor();
  }
  ok(
    browserErrors.length === 0,
    "Browser console, hydration and authorized HTTP health",
  );
  await context.close();
  console.log("AUTHENTICATED PROCUREMENT WORKFLOW: PASS");
} finally {
  if (browser) await browser.close();
  await cleanup();
  console.log("temporary hosted users and organizations cleaned: PASS");
}
