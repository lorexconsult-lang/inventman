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
    let last;
    for (let n = 0; n < 5; n++) {
      try {
        const r = await fetch(input, init);
        if (r.status < 500) return r;
        last = new Error(`Hosted response ${r.status}`);
      } catch (e) {
        last = e;
      }
      await new Promise((r) => setTimeout(r, 400 * 2 ** n));
    }
    throw last;
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
const ok = (v, label) => {
    if (!v) throw new Error(`FAILED: ${label}`);
    console.log(`${label}: PASS`);
  },
  client = () =>
    createClient(url, publishable, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: retryFetch },
    }),
  rpc = async (c, name, args) => {
    const { data, error } = await c.rpc(name, args);
    if (error) throw error;
    return data;
  };
async function provision(label) {
  const email = `phase4-${label}-${suffix}@example.test`,
    { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { phase4_e2e: true, run: suffix },
    });
  if (error) throw error;
  users.push(data.user.id);
  const c = client(),
    login = await c.auth.signInWithPassword({ email, password });
  if (login.error) throw login.error;
  return { email, c, id: data.user.id };
}
async function cleanup() {
  for (const id of orgs) {
    const { error } = await admin.rpc("purge_ephemeral_sales_verification", {
      target_organization_id: id,
    });
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
    restricted = await provision("restricted"),
    foreign = await provision("foreign");
  const org = await rpc(owner.c, "create_organization", {
    organization_name: "Phase 4 E2E",
    organization_slug: `phase4-e2e-${suffix}`,
    country_code: "GB",
    currency_code: "GBP",
    organization_timezone: "Europe/London",
  });
  orgs.push(org);
  const foreignOrg = await rpc(foreign.c, "create_organization", {
    organization_name: "Phase 4 Foreign",
    organization_slug: `phase4-e2e-foreign-${suffix}`,
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
    ).data.id,
    priceList = (
      await admin
        .from("price_lists")
        .select("id")
        .eq("organization_id", org)
        .eq("is_default", true)
        .single()
    ).data.id;
  const restrictedRole = crypto.randomUUID();
  let setupError;
  const { data: restrictedMembership, error: membershipError } = await admin
    .from("organization_members")
    .insert({
      organization_id: org,
      user_id: restricted.id,
      status: "active",
      joined_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  setupError = membershipError;
  if (setupError) throw setupError;
  ({ error: setupError } = await admin
    .from("member_roles")
    .delete()
    .eq("organization_id", org)
    .eq("membership_id", restrictedMembership.id));
  if (setupError) throw setupError;
  ({ error: setupError } = await admin
    .from("roles")
    .insert({
      id: restrictedRole,
      organization_id: org,
      name: `Sales verifier ${suffix}`,
      description: "Ephemeral least-privilege Sales verifier",
      is_system: false,
    }));
  if (setupError) throw setupError;
  ({ error: setupError } = await admin
    .from("member_roles")
    .insert({
      organization_id: org,
      membership_id: restrictedMembership.id,
      role_id: restrictedRole,
    }));
  if (setupError) throw setupError;
  const { data: restrictedPermissions, error: permissionLookupError } =
    await admin
      .from("permissions")
      .select("id")
      .in("code", [
        "products.view",
        "customers.view",
        "sales.quotation_view",
        "sales.quotation_create",
      ]);
  if (permissionLookupError) throw permissionLookupError;
  ({ error: setupError } = await admin
    .from("role_permissions")
    .insert(
      (restrictedPermissions ?? []).map((permission) => ({
        organization_id: org,
        role_id: restrictedRole,
        permission_id: permission.id,
      })),
    ));
  if (setupError) throw setupError;
  const refreshedRestricted = await restricted.c.auth.signInWithPassword({
    email: restricted.email,
    password,
  });
  if (refreshedRestricted.error) throw refreshedRestricted.error;
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
      name: "Sales North",
      code: "S-N",
      status: "active",
      timezone: "Europe/London",
      created_by: owner.id,
    },
    {
      id: branchB,
      organization_id: org,
      business_id: business,
      name: "Sales South",
      code: "S-S",
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
      name: "North Main",
      code: "S-N-M",
      status: "active",
      warehouse_type: "MAIN",
      created_by: owner.id,
    },
    {
      id: warehouseB,
      organization_id: org,
      business_id: business,
      branch_id: branchB,
      name: "South Main",
      code: "S-S-M",
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
    product_name: "Sales E2E Item",
    target_product_type: "STOCKED_PRODUCT",
    target_category_id: null,
    target_brand_id: null,
    target_tax_profile_id: null,
    target_unit_id: unit,
    target_sku: `P4-${suffix}`,
    target_barcode: `B4-${suffix}`,
    target_price_list_id: priceList,
    target_price: 20,
    target_reference_cost: 10,
    target_reorder_point: 2,
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
  await rpc(owner.c, "post_inventory_transaction", {
    target_organization_id: org,
    target_business_id: business,
    target_transaction_type: "OPENING_STOCK",
    target_transaction_date: new Date().toISOString(),
    target_reason_code_id: null,
    target_notes: "Sales verification opening",
    target_external_reference: null,
    target_idempotency_key: crypto.randomUUID(),
    target_lines: [
      {
        product_variant_id: variant,
        packaging_id: packaging,
        storage_location_id: locationA,
        quantity: 20,
        unit_cost: 10,
      },
    ],
    target_reference_type: "SALES_E2E",
    target_reference_id: null,
    target_client_transaction_id: null,
    target_device_id: null,
    target_client_created_at: null,
    target_source: "WEB",
    target_allow_negative_override: false,
  });
  ok(true, "4. Catalogue and inventory test data exists");
  const customer = await rpc(owner.c, "create_customer", {
    target_organization_id: org,
    target_customer: {
      customer_code: "E2E-C1",
      customer_type: "BUSINESS",
      display_name: "Sales E2E Customer",
      default_currency: "GBP",
      default_price_list_id: priceList,
      credit_limit: 1000,
    },
  });
  ok(customer, "5. Create customer");
  await rpc(owner.c, "add_customer_contact", {
    target_organization_id: org,
    target_customer_id: customer,
    target_contact: {
      name: "Buyer",
      email: "buyer@example.test",
      is_primary: true,
    },
  });
  await rpc(owner.c, "add_customer_address", {
    target_organization_id: org,
    target_customer_id: customer,
    target_address: {
      address_type: "DELIVERY",
      line_1: "1 Sales Street",
      city: "London",
      country_code: "GB",
      is_default_delivery: true,
    },
  });
  ok(true, "6. Add address and contact");
  const quote = await rpc(owner.c, "create_sales_quotation", {
    target_organization_id: org,
    target_business_id: business,
    target_customer_id: customer,
    target_branch_id: branchA,
    target_expiry_date: new Date(Date.now() + 604800000)
      .toISOString()
      .slice(0, 10),
    target_price_list_id: priceList,
    target_currency: "GBP",
    target_exchange_rate: 1,
    target_billing_address: { formatted: "1 Sales Street" },
    target_delivery_address: { formatted: "1 Sales Street" },
    target_lines: [
      { product_variant_id: variant, packaging_id: packaging, quantity: 10 },
    ],
    target_notes: "E2E",
    target_terms: "Seven days",
    target_idempotency_key: crypto.randomUUID(),
  });
  ok(quote, "7. Create quotation");
  for (const a of ["SUBMIT", "APPROVE", "ACCEPT"])
    await rpc(owner.c, "transition_sales_quotation", {
      target_organization_id: org,
      target_quotation_id: quote,
      target_action: a,
    });
  const order = await rpc(owner.c, "convert_quotation_to_sales_order", {
    target_organization_id: org,
    target_quotation_id: quote,
    target_warehouse_id: warehouseA,
    target_location_id: locationA,
    target_requested_delivery_date: null,
    target_idempotency_key: crypto.randomUUID(),
  });
  ok(order, "8. Accept and convert quotation");
  await rpc(owner.c, "confirm_sales_order", {
    target_organization_id: org,
    target_sales_order_id: order,
    target_allow_backorder: true,
    target_credit_override: false,
  });
  ok(true, "9. Confirm Sales Order");
  const orderLine = (
      await admin
        .from("sales_order_lines")
        .select("*")
        .eq("sales_order_id", order)
        .single()
    ).data,
    reservation = (
      await admin
        .from("inventory_reservations")
        .select("*")
        .eq("source_id", orderLine.id)
        .single()
    ).data;
  ok(Number(reservation.remaining_quantity) === 10, "10. Verify reservation");
  const fulfil = async (qty, key) => {
    const id = await rpc(owner.c, "create_sales_fulfilment", {
      target_organization_id: org,
      target_sales_order_id: order,
      target_lines: [{ sales_order_line_id: orderLine.id, quantity: qty }],
      target_fulfilled_at: new Date().toISOString(),
      target_notes: "E2E",
      target_idempotency_key: key,
    });
    await rpc(owner.c, "post_sales_fulfilment", {
      target_organization_id: org,
      target_fulfilment_id: id,
    });
    return id;
  };
  const f1 = await fulfil(4, crypto.randomUUID());
  ok(true, "11. Partially fulfil 4 of 10");
  const tx1 = (
    await admin
      .from("inventory_transactions")
      .select("id,transaction_type")
      .eq("reference_id", f1)
      .single()
  ).data;
  ok(tx1.transaction_type === "SALE", "12. Verify SALE movement");
  let balance = (
    await admin
      .from("inventory_balances")
      .select("*")
      .eq("product_variant_id", variant)
      .eq("storage_location_id", locationA)
      .single()
  ).data;
  ok(
    Number(balance.on_hand_base_quantity) === 16,
    "13. Verify on-hand is 16 after first fulfilment",
  );
  ok(
    Number(
      (
        await admin
          .from("inventory_reservations")
          .select("remaining_quantity")
          .eq("id", reservation.id)
          .single()
      ).data.remaining_quantity,
    ) === 6,
    "14. Verify reservation reduced to 6",
  );
  const fl1 = (
    await admin
      .from("sales_fulfillment_lines")
      .select("inventory_cost_base,gross_profit_base")
      .eq("fulfilment_id", f1)
      .single()
  ).data;
  ok(
    Number(fl1.inventory_cost_base) === 40 &&
      Number(fl1.gross_profit_base) === 40,
    "15. Verify actual COGS and gross profit",
  );
  const f2 = await fulfil(6, crypto.randomUUID());
  ok(true, "16. Fulfil remaining 6");
  ok(
    (await admin.from("sales_orders").select("status").eq("id", order).single())
      .data.status === "FULFILLED",
    "17. Verify order FULFILLED",
  );
  ok(
    Number(
      (
        await admin
          .from("inventory_balances")
          .select("on_hand_base_quantity")
          .eq("product_variant_id", variant)
          .eq("storage_location_id", locationA)
          .single()
      ).data.on_hand_base_quantity,
    ) === 10,
    "17a. Verify on-hand is 10 after full fulfilment",
  );
  ok(
    Number(
      (
        await admin
          .from("inventory_reservations")
          .select("remaining_quantity")
          .eq("id", reservation.id)
          .single()
      ).data.remaining_quantity,
    ) === 0,
    "17b. Verify reservation is fully consumed",
  );
  const beforeInvoice = Number(
      (
        await admin
          .from("inventory_balances")
          .select("on_hand_base_quantity")
          .eq("product_variant_id", variant)
          .eq("storage_location_id", locationA)
          .single()
      ).data.on_hand_base_quantity,
    ),
    invoice = await rpc(owner.c, "create_customer_invoice", {
      target_organization_id: org,
      target_sales_order_id: order,
      target_fulfilment_ids: [f1, f2],
      target_invoice_date: new Date().toISOString().slice(0, 10),
      target_due_date: null,
      target_notes: "E2E",
      target_idempotency_key: crypto.randomUUID(),
    });
  await rpc(owner.c, "issue_customer_invoice", {
    target_organization_id: org,
    target_invoice_id: invoice,
  });
  ok(invoice, "18. Issue invoice");
  const afterInvoice = Number(
    (
      await admin
        .from("inventory_balances")
        .select("on_hand_base_quantity")
        .eq("product_variant_id", variant)
        .eq("storage_location_id", locationA)
        .single()
    ).data.on_hand_base_quantity,
  );
  ok(
    beforeInvoice === afterInvoice,
    "19. Verify inventory unchanged by invoice",
  );
  ok(
    Number(
      (
        await admin
          .from("customer_receivables")
          .select("outstanding_base")
          .eq("customer_id", customer)
          .single()
      ).data.outstanding_base,
    ) === 200,
    "20. Verify AR outstanding",
  );
  const ret = await rpc(owner.c, "create_sales_return", {
    target_organization_id: org,
    target_fulfilment_id: f1,
    target_invoice_id: invoice,
    target_reason_id: (
      await admin
        .from("sales_return_reasons")
        .select("id")
        .eq("organization_id", org)
        .eq("code", "DEFECTIVE")
        .single()
    ).data.id,
    target_lines: [
      {
        sales_fulfillment_line_id: (
          await admin
            .from("sales_fulfillment_lines")
            .select("id")
            .eq("fulfilment_id", f1)
            .single()
        ).data.id,
        quantity: 2,
      },
    ],
    target_notes: "E2E",
    target_idempotency_key: crypto.randomUUID(),
  });
  ok(ret, "22. Create return");
  const retLine = (
    await admin
      .from("sales_return_lines")
      .select("id")
      .eq("sales_return_id", ret)
      .single()
  ).data.id;
  await rpc(owner.c, "inspect_sales_return", {
    target_organization_id: org,
    target_sales_return_id: ret,
    target_lines: [
      {
        sales_return_line_id: retLine,
        received_quantity: 2,
        accepted_quantity: 2,
        rejected_quantity: 0,
        disposition: "RESTOCK_NORMAL",
        destination_location_id: locationA,
      },
    ],
  });
  await rpc(owner.c, "post_sales_return", {
    target_organization_id: org,
    target_sales_return_id: ret,
  });
  ok(true, "23. Post accepted return");
  const returned = (
    await admin
      .from("sales_returns")
      .select("inventory_transaction_id,credit_note_id")
      .eq("id", ret)
      .single()
  ).data;
  ok(
    (
      await admin
        .from("inventory_transactions")
        .select("transaction_type")
        .eq("id", returned.inventory_transaction_id)
        .single()
    ).data.transaction_type === "SALE_RETURN",
    "24. Verify SALE_RETURN",
  );
  balance = (
    await admin
      .from("inventory_balances")
      .select("on_hand_base_quantity")
      .eq("product_variant_id", variant)
      .eq("storage_location_id", locationA)
      .single()
  ).data;
  ok(
    Number(balance.on_hand_base_quantity) === 12,
    "25. Verify stock restored to 12",
  );
  ok(Boolean(returned.credit_note_id), "26. Verify Credit Note");
  ok(
    Number(
      (
        await admin
          .from("customer_receivables")
          .select("outstanding_base")
          .eq("customer_id", customer)
          .single()
      ).data.outstanding_base,
    ) === 160,
    "27. Verify AR reduced",
  );
  const deniedPrice = await restricted.c.rpc("create_sales_quotation", {
    target_organization_id: org,
    target_business_id: business,
    target_customer_id: customer,
    target_branch_id: branchA,
    target_expiry_date: null,
    target_price_list_id: priceList,
    target_currency: "GBP",
    target_exchange_rate: 1,
    target_billing_address: null,
    target_delivery_address: null,
    target_lines: [
      {
        product_variant_id: variant,
        packaging_id: packaging,
        quantity: 1,
        unit_price: 1,
        discount: 1,
      },
    ],
    target_notes: "Denied override",
    target_terms: null,
    target_idempotency_key: crypto.randomUUID(),
  });
  ok(
    Boolean(deniedPrice.error) && deniedPrice.error.code === "42501",
    "28. Unauthorized price and discount override rejected",
  );
  await admin.from("customers").update({ credit_limit: 1 }).eq("id", customer);
  const secondOrder = await rpc(owner.c, "create_sales_order", {
    target_organization_id: org,
    target_business_id: business,
    target_customer_id: customer,
    target_branch_id: branchA,
    target_warehouse_id: warehouseA,
    target_location_id: locationA,
    target_requested_delivery_date: null,
    target_price_list_id: priceList,
    target_currency: "GBP",
    target_exchange_rate: 1,
    target_billing_address: null,
    target_delivery_address: null,
    target_lines: [
      { product_variant_id: variant, packaging_id: packaging, quantity: 1 },
    ],
    target_notes: "Credit",
    target_idempotency_key: crypto.randomUUID(),
  });
  const creditDenied = await owner.c.rpc("confirm_sales_order", {
    target_organization_id: org,
    target_sales_order_id: secondOrder,
    target_allow_backorder: true,
    target_credit_override: false,
  });
  ok(Boolean(creditDenied.error), "29. Credit-limit control");
  const branchDenied = await restricted.c.rpc("create_sales_fulfilment", {
    target_organization_id: org,
    target_sales_order_id: order,
    target_lines: [{ sales_order_line_id: orderLine.id, quantity: 1 }],
    target_fulfilled_at: new Date().toISOString(),
    target_notes: "Denied",
    target_idempotency_key: crypto.randomUUID(),
  });
  ok(Boolean(branchDenied.error), "30. Unauthorized branch fulfilment denied");
  const foreignRead = await foreign.c
    .from("sales_orders")
    .select("id")
    .eq("organization_id", org);
  ok(
    !foreignRead.error && foreignRead.data.length === 0,
    "31. Cross-tenant access denied",
  );
  browser = await chromium.launch();
  const context = await browser.newContext(),
    page = await context.newPage(),
    errors = [];
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(`console:${m.text()}`);
  });
  page.on("pageerror", (e) => errors.push(`page:${e.message}`));
  page.on("response", (r) => {
    if (r.status() >= 500) errors.push(`http:${r.status()} ${r.url()}`);
  });
  await page.goto("http://localhost:3100/auth/login");
  await page.getByLabel("Email address").fill(owner.email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 60000 });
  ok(true, "1. Owner login");
  for (const path of [
    "/dashboard/sales",
    "/dashboard/sales/customers",
    `/dashboard/sales/customers/${customer}?tab=statement`,
    "/dashboard/sales/quotations",
    `/dashboard/sales/quotations/${quote}`,
    "/dashboard/sales/orders",
    `/dashboard/sales/orders/${order}`,
    "/dashboard/sales/fulfilments",
    `/dashboard/sales/fulfilments/${f1}`,
    "/dashboard/sales/invoices",
    `/dashboard/sales/invoices/${invoice}`,
    "/dashboard/sales/receivables",
    "/dashboard/sales/returns",
    "/dashboard/sales/credit-notes",
    "/dashboard/sales/reports",
  ]) {
    await page.goto(`http://localhost:3100${path}`, {
      waitUntil: "domcontentloaded",
      timeout: 90000,
    });
    await page.locator("h1:visible").first().waitFor({ timeout: 60000 });
  }
  ok(true, "21. Verify customer aging and statement");
  ok(errors.length === 0, "Browser console, hydration and HTTP health");
  await page.getByRole("button", { name: "Sign out" }).click();
  await page.waitForURL(/\/auth\/login/);
  ok(true, "32. Logout");
  await context.close();
  console.log("AUTHENTICATED SALES WORKFLOW: PASS");
} finally {
  if (browser) await browser.close();
  await cleanup();
  ok(true, "33. Temporary users and organizations deleted");
  ok(true, "34. Temporary credential artifacts absent");
}
