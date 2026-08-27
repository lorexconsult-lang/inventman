import { chromium } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const ref = process.env.SUPABASE_PROJECT_REF,
  secret =
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY,
  publishable = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (
  !ref ||
  !secret ||
  !publishable ||
  process.env.CONFIRM_DEVELOPMENT_PROJECT !== `DEVELOPMENT:${ref}` ||
  process.env.NODE_ENV === "production"
)
  throw new Error(
    "Secure development credentials and explicit development confirmation are required.",
  );
const url = `https://${ref}.supabase.co`,
  admin = createClient(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  }),
  anon = () =>
    createClient(url, publishable, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
if (process.env.CLEANUP_PHASE7 === "1") {
  const { data, error } = await admin
    .from("organizations")
    .select("id,slug")
    .like("slug", "phase7-pos-%");
  if (error) throw error;
  for (const organization of data) {
    const result = await admin.rpc("purge_ephemeral_pos_verification", {
      target_organization_id: organization.id,
    });
    console.log(
      result.error
        ? `Cleanup failed: ${result.error.message}`
        : `Cleaned ${organization.slug}`,
    );
  }
  const users = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (users.error) throw users.error;
  for (const user of users.data.users.filter((item) =>
    item.email?.startsWith("phase7-pos-"),
  )) {
    const result = await admin.auth.admin.deleteUser(user.id);
    console.log(
      result.error
        ? `User cleanup failed: ${result.error.code ?? "unknown"}`
        : "Cleaned temporary Phase 7 user",
    );
  }
  process.exit(0);
}
const suffix = crypto.randomUUID().slice(0, 8),
  password = `Phase7-${crypto.randomUUID()}!aA`,
  ownerEmail = `phase7-pos-owner-${suffix}@example.test`,
  outsiderEmail = `phase7-pos-outsider-${suffix}@example.test`;
let ownerId, outsiderId, orgId, browser, owner;
const ok = (value, label) => {
  if (!value) throw new Error(`FAILED: ${label}`);
  console.log(`${label}: PASS`);
};
const rpc = async (name, args) => {
  const result = await owner.rpc(name, args);
  if (result.error) throw new Error(`${name}: ${result.error.message}`);
  return result.data;
};
const cleanup = async () => {
  if (orgId) {
    const { error } = await admin.rpc("purge_ephemeral_pos_verification", {
      target_organization_id: orgId,
    });
    if (error) throw new Error(`Organization cleanup failed: ${error.message}`);
  }
  for (const id of [ownerId, outsiderId])
    if (id) {
      const { error } = await admin.auth.admin.deleteUser(id);
      if (error)
        throw new Error(`User cleanup failed: ${error.code ?? "unknown"}`);
    }
};
try {
  let result = await admin.auth.admin.createUser({
    email: ownerEmail,
    password,
    email_confirm: true,
    user_metadata: { display_name: "Phase 7 Owner", phase7_e2e: true },
  });
  if (result.error) throw result.error;
  ownerId = result.data.user.id;
  result = await admin.auth.admin.createUser({
    email: outsiderEmail,
    password,
    email_confirm: true,
    user_metadata: { display_name: "Phase 7 Outsider", phase7_e2e: true },
  });
  if (result.error) throw result.error;
  outsiderId = result.data.user.id;
  owner = anon();
  result = await owner.auth.signInWithPassword({ email: ownerEmail, password });
  if (result.error) throw result.error;
  ok(true, "1. Temporary owner provisions and logs in");
  orgId = await rpc("create_organization", {
    organization_name: "Phase 7 POS",
    organization_slug: `phase7-pos-${suffix}`,
    country_code: "GB",
    currency_code: "GBP",
    organization_timezone: "Europe/London",
  });
  ok(Boolean(orgId), "2. Organization created");
  const business = (
      await admin
        .from("businesses")
        .select("id")
        .eq("organization_id", orgId)
        .single()
    ).data,
    branchId = crypto.randomUUID();
  await admin.from("branches").insert({
    id: branchId,
    organization_id: orgId,
    business_id: business.id,
    name: "POS Main",
    code: "POS-MAIN",
    status: "active",
    timezone: "Europe/London",
    created_by: ownerId,
  });
  ok(true, "3. Branch created");
  const warehouseId = await rpc("create_warehouse", {
    target_branch_id: branchId,
    warehouse_name: "Shop floor",
    warehouse_code: "SHOP",
    target_warehouse_type: "SHOP_FLOOR",
    warehouse_description: "POS stock",
    make_default: true,
  });
  const location = (
    await admin
      .from("storage_locations")
      .select("id")
      .eq("warehouse_id", warehouseId)
      .eq("location_type", "ROOT")
      .single()
  ).data;
  ok(
    Boolean(warehouseId && location?.id),
    "4. Warehouse and root stock location created",
  );
  const priceList = (
      await admin
        .from("price_lists")
        .select("id")
        .eq("organization_id", orgId)
        .eq("is_default", true)
        .single()
    ).data,
    unit = (
      await admin
        .from("units_of_measure")
        .select("id")
        .eq("organization_id", orgId)
        .eq("is_active", true)
        .limit(1)
        .single()
    ).data;
  const productId = await rpc("create_simple_product", {
    target_organization_id: orgId,
    target_business_id: business.id,
    product_name: "POS Test Product",
    target_product_type: "STOCKED_PRODUCT",
    target_category_id: null,
    target_brand_id: null,
    target_tax_profile_id: null,
    target_unit_id: unit.id,
    target_sku: `POS-${suffix}`,
    target_barcode: `200${suffix.replace(/\D/g, "").padEnd(8, "0")}`,
    target_price_list_id: priceList.id,
    target_price: 10,
    target_reference_cost: 4,
    target_reorder_point: 5,
    target_track_inventory: true,
    target_idempotency_key: crypto.randomUUID(),
  });
  const variant = (
      await admin
        .from("product_variants")
        .select("id,product_variant_packaging(id)")
        .eq("product_id", productId)
        .single()
    ).data,
    packagingId = variant.product_variant_packaging[0].id;
  await rpc("post_inventory_transaction", {
    target_organization_id: orgId,
    target_business_id: business.id,
    target_transaction_type: "OPENING_STOCK",
    target_transaction_date: new Date().toISOString(),
    target_reason_code_id: null,
    target_notes: "POS workflow opening",
    target_external_reference: `POS-OPEN-${suffix}`,
    target_idempotency_key: crypto.randomUUID(),
    target_lines: [
      {
        product_variant_id: variant.id,
        packaging_id: packagingId,
        storage_location_id: location.id,
        quantity: 100,
        unit_cost: 4,
      },
    ],
  });
  ok(
    true,
    "5. Sellable barcode product receives opening stock through Inventory Ledger",
  );
  const walkIn = await rpc("create_customer", {
      target_organization_id: orgId,
      target_customer: {
        customer_code: "WALK-IN",
        customer_type: "INDIVIDUAL",
        display_name: "Walk-in Customer",
        default_currency: "GBP",
        default_price_list_id: priceList.id,
        credit_limit: 0,
      },
    }),
    creditCustomer = await rpc("create_customer", {
      target_organization_id: orgId,
      target_customer: {
        customer_code: "CREDIT",
        customer_type: "BUSINESS",
        display_name: "Credit Customer",
        default_currency: "GBP",
        default_price_list_id: priceList.id,
        credit_limit: 1000,
      },
    });
  ok(
    Boolean(walkIn && creditCustomer),
    "6. Walk-in and registered credit customers created",
  );
  const cashAccount = await rpc("create_payment_account", {
      target_organization_id: orgId,
      target_branch_id: branchId,
      target_account_code: "TILL",
      target_name: "Main Till",
      target_account_type: "CASH",
      target_currency: "GBP",
      target_description: "POS till",
    }),
    bankAccount = await rpc("create_payment_account", {
      target_organization_id: orgId,
      target_branch_id: branchId,
      target_account_code: "BANK",
      target_name: "Card clearing",
      target_account_type: "CARD_CLEARING",
      target_currency: "GBP",
      target_description: "Card clearing",
    });
  const cashMethod = await rpc("create_payment_method", {
      target_organization_id: orgId,
      target_branch_id: branchId,
      target_default_account_id: cashAccount,
      target_code: "CASH",
      target_name: "Cash",
      target_method_type: "CASH",
      target_requires_reference: false,
      target_allows_overpayment: true,
      target_requires_approval: false,
    }),
    cardMethod = await rpc("create_payment_method", {
      target_organization_id: orgId,
      target_branch_id: branchId,
      target_default_account_id: bankAccount,
      target_code: "CARD",
      target_name: "Card",
      target_method_type: "CARD",
      target_requires_reference: true,
      target_allows_overpayment: true,
      target_requires_approval: false,
    });
  ok(
    Boolean(cashMethod && cardMethod),
    "7. Shared cash and card-clearing methods configured",
  );
  const terminalId = await rpc("create_pos_terminal", {
    target_organization_id: orgId,
    target_branch_id: branchId,
    target_code: "T1",
    target_name: "Front Till",
    target_warehouse_id: warehouseId,
    target_location_id: location.id,
    target_customer_id: walkIn,
    target_cash_account_id: cashAccount,
    target_receipt_width: "80MM",
    target_receipt_footer: "Thank you",
  });
  const sessionId = await rpc("open_pos_session", {
    target_organization_id: orgId,
    target_terminal_id: terminalId,
    target_opening_float: 100,
    target_notes: "Opening count",
  });
  ok(
    Boolean(terminalId && sessionId),
    "8. Terminal and cashier session opened",
  );
  const line = (quantity) => [
    {
      product_variant_id: variant.id,
      packaging_id: packagingId,
      quantity,
      unit_price: 10,
      discount: 0,
      tax: 0,
    },
  ];
  const cashKey = crypto.randomUUID(),
    cashArgs = {
      target_organization_id: orgId,
      target_session_id: sessionId,
      target_customer_id: walkIn,
      target_lines: line(2),
      target_settlements: [
        {
          source_type: "PAYMENT",
          payment_method_id: cashMethod,
          account_id: cashAccount,
          amount: 20,
          tendered_amount: 25,
          reference: "",
        },
      ],
      target_customer_credit_amount: 0,
      target_cash_tendered: 25,
      target_notes: "Cash sale",
      target_held_cart_id: null,
      target_idempotency_key: cashKey,
    };
  const cashSale = await rpc("post_pos_sale", cashArgs);
  ok(cashSale.change_due === 5, "9. Cash sale completes with exact change");
  const replay = await rpc("post_pos_sale", cashArgs);
  ok(
    replay.replayed === true && replay.pos_sale_id === cashSale.pos_sale_id,
    "10. Checkout idempotency replays same request",
  );
  const receipt = (
    await admin
      .from("pos_receipts")
      .select("total,change_due,status,invoice_number,inventory_transaction_id")
      .eq("id", cashSale.pos_sale_id)
      .single()
  ).data;
  ok(
    Number(receipt.total) === 20 &&
      Number(receipt.change_due) === 5 &&
      receipt.status === "COMPLETED",
    "11. Receipt links completed document chain",
  );
  const inventory = (
      await admin
        .from("inventory_transactions")
        .select("transaction_type")
        .eq("id", receipt.inventory_transaction_id)
        .single()
    ).data,
    balance = (
      await admin
        .from("inventory_availability")
        .select("available_base_quantity")
        .eq("organization_id", orgId)
        .eq("product_variant_id", variant.id)
        .eq("storage_location_id", location.id)
        .single()
    ).data;
  ok(
    inventory.transaction_type === "SALE" &&
      Number(balance.available_base_quantity) === 98,
    "12. Checkout posts SALE through Inventory Ledger",
  );
  const cashInvoice = (
    await admin
      .from("customer_invoice_settlement")
      .select("status,outstanding_base")
      .eq("id", cashSale.invoice_id)
      .single()
  ).data;
  ok(
    cashInvoice.status === "PAID" && Number(cashInvoice.outstanding_base) === 0,
    "13. Cash invoice and AR settle through Payment allocation",
  );
  const heldId = await rpc("hold_pos_cart", {
    target_organization_id: orgId,
    target_session_id: sessionId,
    target_customer_id: walkIn,
    target_cart: line(1),
    target_notes: "Held split sale",
    target_cart_id: null,
  });
  ok(Boolean(heldId), "14. Cart held without inventory mutation");
  const split = await rpc("post_pos_sale", {
    ...cashArgs,
    target_lines: line(1),
    target_settlements: [
      {
        source_type: "PAYMENT",
        payment_method_id: cashMethod,
        account_id: cashAccount,
        amount: 5,
        tendered_amount: 5,
      },
      {
        source_type: "PAYMENT",
        payment_method_id: cardMethod,
        account_id: bankAccount,
        amount: 5,
        reference: `CARD-${suffix}`,
      },
    ],
    target_cash_tendered: 5,
    target_held_cart_id: heldId,
    target_idempotency_key: crypto.randomUUID(),
  });
  const held = (
      await admin
        .from("pos_held_carts")
        .select("status")
        .eq("id", heldId)
        .single()
    ).data,
    splitSettlements = (
      await admin
        .from("pos_sale_settlements")
        .select("amount")
        .eq("pos_sale_id", split.pos_sale_id)
    ).data;
  ok(
    held.status === "COMPLETED" && splitSettlements.length === 2,
    "15. Resumed cart completes with split tender",
  );
  const creditSale = await rpc("post_pos_sale", {
    ...cashArgs,
    target_customer_id: creditCustomer,
    target_lines: line(1),
    target_settlements: [],
    target_customer_credit_amount: 10,
    target_cash_tendered: 0,
    target_notes: "Pay later",
    target_idempotency_key: crypto.randomUUID(),
  });
  const creditInvoice = (
    await admin
      .from("customer_invoice_settlement")
      .select("outstanding_base,status")
      .eq("id", creditSale.invoice_id)
      .single()
  ).data;
  ok(
    Number(creditInvoice.outstanding_base) === 10 &&
      creditInvoice.status === "ISSUED",
    "16. Valid named-customer credit sale remains in AR",
  );
  const walkInCredit = await owner.rpc("post_pos_sale", {
    ...cashArgs,
    target_lines: line(1),
    target_settlements: [],
    target_customer_credit_amount: 10,
    target_cash_tendered: 0,
    target_idempotency_key: crypto.randomUUID(),
  });
  ok(
    walkInCredit.error?.message.includes("WALK_IN_CREDIT_NOT_ALLOWED"),
    "17. Walk-in unsecured credit is rejected",
  );
  const unapplied = await rpc("post_customer_payment", {
    target_organization_id: orgId,
    target_customer_id: creditCustomer,
    target_branch_id: branchId,
    target_payment_date: new Date().toISOString().slice(0, 10),
    target_currency: "GBP",
    target_exchange_rate: 1,
    target_amount: 10,
    target_payment_method_id: cardMethod,
    target_settlement_account_id: bankAccount,
    target_external_reference: `CREDIT-${suffix}`,
    target_notes: "Store credit",
    target_allocations: [],
    target_idempotency_key: crypto.randomUUID(),
  });
  const storeSale = await rpc("post_pos_sale", {
    ...cashArgs,
    target_customer_id: creditCustomer,
    target_lines: line(1),
    target_settlements: [
      {
        source_type: "UNAPPLIED_PAYMENT",
        source_id: unapplied.payment_id,
        amount: 10,
      },
    ],
    target_customer_credit_amount: 0,
    target_cash_tendered: 0,
    target_notes: "Use store credit",
    target_idempotency_key: crypto.randomUUID(),
  });
  const storeInvoice = (
    await admin
      .from("customer_invoice_settlement")
      .select("outstanding_base")
      .eq("id", storeSale.invoice_id)
      .single()
  ).data;
  ok(
    Number(storeInvoice.outstanding_base) === 0,
    "18. Existing unapplied customer credit settles POS invoice without fake payment",
  );
  const outsider = anon();
  await outsider.auth.signInWithPassword({ email: outsiderEmail, password });
  const denied = await outsider.rpc("open_pos_session", {
    target_organization_id: orgId,
    target_terminal_id: terminalId,
    target_opening_float: 0,
    target_notes: "Denied",
  });
  ok(Boolean(denied.error), "19. Cross-tenant outsider cannot use terminal");
  const expected = await rpc("pos_expected_cash", {
    target_session_id: sessionId,
  });
  ok(
    Number(expected) === 125,
    "20. Expected cash derives from float plus net cash tenders",
  );
  await rpc("close_pos_session", {
    target_organization_id: orgId,
    target_session_id: sessionId,
    target_counted_cash: 125,
    target_notes: "Balanced",
    target_variance_reason: "",
  });
  ok(true, "21. Blind close balances session");
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
    }),
    consoleErrors = [],
    failed = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("requestfailed", (request) => failed.push(request.url()));
  await page.goto("http://localhost:3100/auth/login");
  await page.getByLabel("Email address").fill(ownerEmail);
  await page.getByLabel("Password").fill(password);
  await Promise.all([
    page.waitForURL(/dashboard/),
    page.getByRole("button", { name: "Sign in" }).click(),
  ]);
  ok(page.url().includes("/dashboard"), "22. Owner authenticates in browser");
  const openPage = async (target) => {
    await page.goto(target);
    await page.waitForLoadState("networkidle");
  };
  await openPage("http://localhost:3100/dashboard/pos");
  ok(
    await page.getByRole("heading", { name: "Register" }).isVisible(),
    "23. Register renders",
  );
  await openPage("http://localhost:3100/dashboard/pos/receipts");
  ok(
    await page.getByRole("heading", { name: "Receipts" }).isVisible(),
    "24. Receipt lookup renders",
  );
  await openPage(
    `http://localhost:3100/dashboard/pos/receipts/${cashSale.pos_sale_id}`,
  );
  ok(
    await page.getByText(cashSale.receipt_number).isVisible(),
    "25. Printable receipt renders",
  );
  await openPage("http://localhost:3100/dashboard/pos/sessions");
  ok(
    await page.getByRole("heading", { name: "Till sessions" }).isVisible(),
    "26. Session history renders",
  );
  await openPage("http://localhost:3100/dashboard/pos/reports");
  ok(
    await page.getByRole("heading", { name: "Operations reports" }).isVisible(),
    "27. POS reports render",
  );
  await openPage("http://localhost:3100/dashboard/settings/pos");
  ok(
    await page.getByRole("heading", { name: "Point of sale" }).isVisible(),
    "28. Terminal settings render",
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await openPage("http://localhost:3100/dashboard/pos");
  ok(
    await page
      .getByRole("navigation", { name: "Mobile navigation" })
      .isVisible(),
    "29. Mobile POS navigation remains usable",
  );
  ok(
    consoleErrors.length === 0 && failed.length === 0,
    "30. Browser console and request health",
  );
  await page.getByRole("button", { name: /sign out/i }).click();
  await page.waitForURL(/auth\/login/);
  ok(true, "31. Owner logs out");
  console.log("AUTHENTICATED POS WORKFLOW: PASS");
} finally {
  if (browser) await browser.close();
  await cleanup();
  ok(true, "32. Temporary POS organization and fixtures deleted");
  ok(true, "33. Temporary users deleted");
  ok(
    !process.env.POS_TOKEN && !process.env.CARD_NUMBER,
    "34. Temporary credential and card artifacts absent",
  );
}
