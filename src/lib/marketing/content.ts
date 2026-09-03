export type MarketingPage = {
  slug: string;
  name: string;
  title: string;
  description: string;
  eyebrow: string;
  intro: string;
  problem: string;
  answer: string;
  workflows: string[];
  benefits: string[];
  related: string[];
  faq: Array<{ question: string; answer: string }>;
};

export const featurePages: MarketingPage[] = [
  {
    slug: "inventory-management",
    name: "Inventory management",
    title: "Inventory Management Software | Inventman",
    description: "Track stock balances, warehouses, transfers, counts, valuation and movement history with Inventman.",
    eyebrow: "Inventory management",
    intro: "Know what is available, where it is held and how every stock change happened.",
    problem: "Disconnected stock sheets make losses, shortages and valuation differences difficult to explain. Teams need one current record without losing the history behind each balance.",
    answer: "Inventman connects products, warehouses, storage locations, receipts, sales, transfers, counts and adjustments in one inventory workflow.",
    workflows: ["Set up products, variants, packaging and barcodes", "Receive and place stock into controlled locations", "Transfer, reserve, count and adjust stock with a traceable reason", "Review availability, movement history, low stock and valuation"],
    benefits: ["Fewer unexplained stock differences", "Clear warehouse and location accountability", "A reliable operational view for purchasing and sales"],
    related: ["multi-branch-management", "purchase-management", "point-of-sale"],
    faq: [{ question: "What is inventory management software?", answer: "Inventory management software records products, stock locations and quantity changes so a business can understand what it owns, where it is and why balances changed." }, { question: "Can Inventman support FIFO and weighted-average costing?", answer: "Yes. Inventman supports FIFO and weighted-average inventory valuation according to the organization’s configured costing method." }],
  },
  {
    slug: "point-of-sale", name: "Point of sale", title: "POS and Inventory Software | Inventman", description: "Connect cashier sales, payments, receipts and stock movement in one controlled point-of-sale workflow.", eyebrow: "Point of sale", intro: "Serve customers quickly while keeping sales, payment and stock records connected.", problem: "A checkout that is separate from inventory creates delayed balances, uncertain cash totals and difficult reconciliation.", answer: "Inventman POS connects provisioned terminals, cashier sessions, product search, payments, receipts and inventory movements.", workflows: ["Open and control cashier sessions", "Scan or search the product catalogue", "Take supported payment methods and issue receipts", "Close sessions and review sales activity"], benefits: ["Immediate operational stock updates", "Clear cashier and terminal accountability", "Connected sales and settlement records"], related: ["offline-pos", "inventory-management", "sales-invoicing"], faq: [{ question: "What is POS inventory software?", answer: "POS inventory software records a sale and its related stock movement together, giving teams a more current view of products sold and quantities available." }, { question: "Does Inventman include receipts and split payments?", answer: "Yes. The POS supports receipts and configured split-payment workflows." }],
  },
  {
    slug: "sales-invoicing", name: "Sales and invoicing", title: "Sales and Invoicing Software | Inventman", description: "Manage customers, quotations, orders, fulfilment, invoices, returns, payments and receivables.", eyebrow: "Sales and invoicing", intro: "Follow a customer commitment from quotation through fulfilment, invoice and collection.", problem: "When orders, stock fulfilment and payments live in separate records, teams struggle to answer what is owed and what has been delivered.", answer: "Inventman links customer records, quotations, sales orders, reservations, fulfilment, invoices, returns, credit notes and receipts.", workflows: ["Prepare quotations and convert accepted work", "Reserve and fulfil available inventory", "Issue invoices and allocate customer payments", "Manage returns, credits and receivable balances"], benefits: ["Clear order and fulfilment status", "Better receivables visibility", "A connected customer and inventory history"], related: ["inventory-management", "point-of-sale", "financial-reporting"], faq: [{ question: "Can Inventman manage customer invoices and payments?", answer: "Yes. Inventman records customer invoices, receipts, allocations, outstanding balances and related credit activity." }],
  },
  {
    slug: "purchase-management", name: "Purchase management", title: "Purchase Management Software | Inventman", description: "Control requisitions, approvals, supplier quotations, purchase orders, receiving and invoice matching.", eyebrow: "Purchase management", intro: "Buy with a clear path from internal demand to received and matched goods.", problem: "Informal buying makes approvals, expected deliveries, supplier commitments and invoice differences hard to track.", answer: "Inventman provides connected requisition, approval, quotation, purchase order, goods receipt, supplier invoice and return workflows.", workflows: ["Raise and approve purchase requisitions", "Compare supplier quotations", "Issue purchase orders and track deliveries", "Receive goods and review supplier invoice matching"], benefits: ["Stronger buying accountability", "Earlier visibility of overdue orders", "A clearer link between purchases, stock and payables"], related: ["supplier-management", "inventory-management", "financial-reporting"], faq: [{ question: "Can Inventman manage purchase approvals?", answer: "Yes. Purchasing workflows can use configured approval policies and retain the resulting decision history." }],
  },
  {
    slug: "supplier-management", name: "Supplier management", title: "Supplier Management Software | Inventman", description: "Keep supplier records, quotations, orders, invoices, payments, advances and statements connected.", eyebrow: "Supplier management", intro: "Understand each supplier relationship from sourcing through payment.", problem: "Supplier conversations, orders and payment records often become fragmented, making balances and performance difficult to verify.", answer: "Inventman keeps supplier details alongside sourcing, purchase orders, invoices, payments, advances, returns and statements.", workflows: ["Maintain supplier and commercial details", "Connect quotations to purchasing decisions", "Track invoices, payments and unapplied advances", "Review supplier statements and return history"], benefits: ["Faster supplier account review", "Clearer payable and advance balances", "Less dependence on disconnected spreadsheets"], related: ["purchase-management", "financial-reporting", "inventory-management"], faq: [{ question: "Can Inventman manage suppliers and payables?", answer: "Yes. Supplier records connect to purchasing, invoices, payments, advances and outstanding payable balances." }],
  },
  {
    slug: "expense-management", name: "Expense management", title: "Business Expense Management Software | Inventman", description: "Record, approve and post operating expenses into a connected financial workflow.", eyebrow: "Expense management", intro: "Make day-to-day spending visible and accountable.", problem: "Unstructured expense records hide cash leakage and weaken the accuracy of profitability reporting.", answer: "Inventman records business expenses with branch, account, approval and posting context so they can feed financial reporting.", workflows: ["Capture expense date, amount and business context", "Route controlled expenses for approval", "Post approved expenses to configured accounts", "Review pending and posted activity"], benefits: ["Better spending visibility", "Clear approval responsibility", "More complete operating profit information"], related: ["financial-reporting", "multi-branch-management", "sales-invoicing"], faq: [{ question: "Can Inventman track expenses and profitability?", answer: "Yes. Posted expenses contribute to the financial records used to review operating results and profitability." }],
  },
  {
    slug: "financial-reporting", name: "Financial reporting", title: "Business Profitability and Financial Reporting | Inventman", description: "Connect operational activity to journals, ledgers, reconciliations and management financial reports.", eyebrow: "Financial reporting", intro: "See how stock, sales, payments and expenses affect business performance.", problem: "Sales totals alone do not explain margin, cash movement, liabilities or the cost of inventory sold.", answer: "Inventman connects supported operational events to controlled journals and management reports including the General Ledger, Trial Balance, Profit and Loss and Balance Sheet.", workflows: ["Configure accounts and activate the accounting boundary", "Review automatically connected and manual journals", "Reconcile operational control balances", "Read management financial reports and export data"], benefits: ["A clearer path from operations to financial results", "Visible reconciliation exceptions", "More informed profitability review"], related: ["sales-invoicing", "expense-management", "inventory-management"], faq: [{ question: "How can I track business profit with Inventman?", answer: "Inventman brings supported revenue, inventory cost and operating expense activity into management financial reports. It does not claim statutory filing or tax certification." }],
  },
  {
    slug: "multi-branch-management", name: "Multi-branch management", title: "Multi-Branch Inventory Management | Inventman", description: "Control branch stock, warehouses, staff access and operating activity from one business workspace.", eyebrow: "Multi-branch management", intro: "Give each location operational clarity without losing the business-wide view.", problem: "Growing businesses often lose visibility when each branch keeps separate stock sheets, users and transaction records.", answer: "Inventman models branches, warehouses, storage locations and branch-scoped staff access inside one organization.", workflows: ["Create operating branches and warehouses", "Assign staff access to relevant locations", "Track stock and transactions by branch", "Move inventory through controlled transfers"], benefits: ["Business-wide visibility with local responsibility", "Reduced cross-branch access risk", "Consistent operating records across locations"], related: ["inventory-management", "point-of-sale", "financial-reporting"], faq: [{ question: "How does a business manage multiple branches?", answer: "Inventman keeps branches within one organization while allowing warehouse, stock and staff access to remain branch-aware." }],
  },
  {
    slug: "offline-pos", name: "Offline POS", title: "Offline-Supported POS Software | Inventman", description: "Continue supported cash sales on provisioned POS devices during temporary connectivity interruptions.", eyebrow: "Offline-supported POS", intro: "Keep a controlled checkout path available when the connection briefly drops.", problem: "An internet interruption can stop checkout or encourage untracked manual sales that later create stock and cash differences.", answer: "Provisioned Inventman POS devices can queue supported offline cash sales within a time-limited operating window and synchronize safely when connectivity returns.", workflows: ["Provision an authorized POS device while online", "Cache the bounded catalogue and operating context", "Record supported offline cash sales", "Reconnect and replay queued transactions idempotently"], benefits: ["More resilient checkout continuity", "Controlled rather than informal offline records", "Safe replay without duplicate sales"], related: ["point-of-sale", "inventory-management", "multi-branch-management"], faq: [{ question: "Can Inventman work without internet?", answer: "Only the supported offline POS cash-sale flow works during a temporary interruption on a previously provisioned device. The wider Inventman workspace remains online-first." }],
  },
];

export const industryPages: MarketingPage[] = [
  ["retail", "Retail stores", "Inventory Software for Retail Stores | Inventman", "Connect retail stock, checkout, purchasing, staff activity and profitability across one or more stores.", "Keep products, store activity and sales performance in one operating view.", "Retail teams can lose margin through uncertain stock, inconsistent pricing records, untracked adjustments and disconnected checkout data.", ["Manage products, variants, barcodes and prices", "Receive, transfer and count store inventory", "Sell through controlled POS sessions", "Review sales, payments, expenses and results"]],
  ["supermarkets", "Supermarkets", "Inventory Software for Supermarkets | Inventman", "Manage high-volume product catalogues, purchasing, branch stock, POS activity and profitability.", "Coordinate fast-moving stock and checkout without losing purchasing and branch control.", "Large catalogues, frequent receiving and busy checkouts make spreadsheet stock records age quickly and hide shrinkage.", ["Organize SKUs, packaging, barcodes and pricing", "Control supplier orders and goods receiving", "Track branch and storage-location availability", "Connect cashier sales to stock and settlement records"]],
  ["restaurants", "Restaurants and lounges", "Inventory Software for Restaurants and Lounges | Inventman", "Track ingredient and stocked-item purchasing, sales, expenses, staff access and operating performance.", "Bring purchasing, stocked items, selling and expenses into a clearer daily record.", "Hospitality operators often struggle to connect purchased stock, items sold, operating expenses and cash accountability.", ["Manage stocked products and configured recipe items", "Buy from suppliers and receive into controlled locations", "Use POS for supported sales workflows", "Review expenses and management profitability"]],
  ["hotels", "Hotels and hospitality", "Inventory Management Software for Hotels | Inventman", "Control hospitality stock, purchasing, outlets, staff permissions, expenses and business reporting.", "Coordinate inventory-based hotel operations across stores, outlets and teams.", "Multiple operating areas can create fragmented purchasing, storeroom balances and responsibility for stock movement.", ["Structure branches, warehouses and storage areas", "Control purchasing, receiving and supplier invoices", "Assign team roles and branch access", "Review stock, expenses and financial reports"]],
  ["pharmacies", "Pharmacies and health retail", "Inventory Software for Pharmacies | Inventman", "Manage batch-aware and expiry-aware retail inventory, purchasing, POS and branch visibility.", "Improve visibility over controlled, batch-aware and perishable retail stock.", "Health retail teams need precise product and stock records, but Inventman does not replace clinical, dispensing or regulatory systems.", ["Configure batch-controlled and perishable products", "Record purchases, receipts and storage locations", "Monitor inventory and expiry-related product data", "Connect supported retail sales and payments"]],
  ["electronics", "Electronics and gadget stores", "Inventory Software for Electronics Stores | Inventman", "Track serialized products, purchasing, branch inventory, sales, payments and margins.", "Keep high-value and serialized stock accountable from receipt to sale.", "High-value devices and accessories require better traceability than a simple quantity spreadsheet can provide.", ["Configure products, variants and serialized items", "Receive stock into the correct branch and warehouse", "Sell through orders, invoices or POS", "Review stock movement, payments and profitability"]],
  ["wholesale-distribution", "Wholesale and distribution", "Wholesale Inventory Management Software | Inventman", "Coordinate supplier purchasing, warehouses, customer orders, fulfilment, receivables and branch stock.", "Connect buying, warehousing, fulfilment and collection across a distribution operation.", "Wholesalers need to coordinate larger orders, multiple storage points, supplier commitments and customer balances.", ["Purchase and receive goods from suppliers", "Manage warehouses, transfers and availability", "Process customer orders and fulfilment", "Track invoices, payments, receivables and payables"]],
].map(([slug, name, title, description, intro, problem, workflows]) => ({
  slug: slug as string,
  name: name as string,
  title: title as string,
  description: description as string,
  eyebrow: "Industry use case",
  intro: intro as string,
  problem: problem as string,
  answer: `Inventman gives ${String(name).toLowerCase()} a connected operating record for the supported inventory, purchasing, sales, payment, expense and reporting workflows they use.`,
  workflows: workflows as string[],
  benefits: ["Clearer stock and transaction accountability", "Connected purchasing and sales records", "Business-wide performance visibility"],
  related: ["inventory-management", "point-of-sale", "financial-reporting"],
  faq: [{ question: `How can Inventman help ${String(name).toLowerCase()}?`, answer: `Inventman connects supported stock, purchasing, sales, payments, expenses and team controls for ${String(name).toLowerCase()}. It does not claim industry-specific regulatory or specialist functionality.` }],
}));

export const resourcePages = [
  {
    slug: "inventory-management-guide-small-business",
    title: "Inventory Management Guide for Small Businesses",
    description: "A practical guide to products, stock movements, counts, reorder decisions and inventory accountability.",
    updated: "2026-09-03",
    sections: [
      ["What inventory management means", "Inventory management is the discipline of knowing what a business holds, where it is, how it changed and when it needs attention. A useful system preserves both the current balance and the movement history behind it."],
      ["Build a dependable stock foundation", "Start with consistent product names, units, variants, packaging and barcodes. Define branches, warehouses and storage locations before entering opening stock, so every quantity has a clear home."],
      ["Record movements when they happen", "Purchases, sales, transfers, returns, adjustments and counts should update through their proper workflow. Delayed batch entry creates gaps between physical stock and the system."],
      ["Use counts to investigate, not overwrite", "A stock count should identify a variance and create a traceable correction. Keep reasons, approvers and movement history so recurring loss patterns can be addressed."],
      ["Turn visibility into action", "Review low stock, unavailable quantities, overdue purchasing and slow-moving inventory regularly. Reorder decisions should consider demand, lead time and existing commitments rather than a single quantity alone."],
    ],
    relatedFeature: "inventory-management",
  },
  {
    slug: "prevent-stock-loss",
    title: "How to Prevent Stock Loss in a Growing Business",
    description: "Practical controls for reducing unexplained stock loss across receiving, storage, transfers, sales and counts.",
    updated: "2026-09-03",
    sections: [
      ["Make responsibility visible", "Give receiving, transfer, adjustment and selling activities an identified user and location. Shared accounts and undocumented hand-offs make losses harder to investigate."],
      ["Separate physical locations", "Model warehouses, shop floors, damaged stock and returns accurately. A single combined balance can hide stock that exists but is not sellable."],
      ["Control adjustments", "Require a reason for stock corrections and review unusual frequency or value. Adjustments should explain a physical event rather than become a routine shortcut."],
      ["Count by risk", "Count valuable, fast-moving or historically inaccurate items more often. Smaller cycle counts are usually easier to investigate than infrequent full counts."],
      ["Connect checkout and inventory", "When sales and stock records are separate, missed entries create apparent loss. A connected POS and inventory workflow reduces that reconciliation gap."],
    ],
    relatedFeature: "inventory-management",
  },
  {
    slug: "manage-inventory-multiple-branches",
    title: "How to Manage Inventory Across Multiple Branches",
    description: "A practical framework for branch stock visibility, warehouse responsibility, transfers and staff access.",
    updated: "2026-09-03",
    sections: [
      ["Keep one organization-wide product language", "Use consistent products, variants, units and barcodes so branch comparisons describe the same items."],
      ["Preserve local stock responsibility", "Record balances by branch, warehouse and storage location. Staff should see and change only the locations their work requires."],
      ["Treat transfers as two-sided workflows", "A dispatch is not the same as a receipt. Track in-transit quantities, destination confirmation and discrepancies instead of subtracting and adding informally."],
      ["Compare availability, not only on-hand", "Reserved stock may be physically present but unavailable for a new order. Branch decisions should distinguish on-hand, reserved and available quantities."],
      ["Review performance in context", "Combine branch sales, stock, expenses and operational exceptions to understand where follow-up is needed without encouraging misleading league tables."],
    ],
    relatedFeature: "multi-branch-management",
  },
] as const;

export const publicRoutePaths = [
  "/", "/features", ...featurePages.map((page) => `/features/${page.slug}`),
  "/industries", ...industryPages.map((page) => `/industries/${page.slug}`),
  "/pricing", "/security", "/about", "/contact", "/support", "/resources",
  ...resourcePages.map((page) => `/resources/${page.slug}`), "/privacy", "/terms",
];

