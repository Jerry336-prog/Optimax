// Prints table health only. Never print environment values or access keys.
const url = process.env.VITE_SUPABASE_URL;
const key =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY;
if (!url || !key) {
  console.error("Missing Supabase URL or public key.");
  process.exitCode = 1;
} else {
  const tables = [
    "products",
    "profiles",
    "addresses",
    "orders",
    "order_items",
    "saved_products",
    "carts",
    "notifications",
    "tracking_events",
    "coupons",
    "enquiries",
    "reviews",
    "site_settings",
    "payment_sessions",
    "account_role_events",
  ];
  let ready = true;
  for (const table of tables) {
    try {
      const response = await fetch(`${url}/rest/v1/${table}?select=${table === "site_settings" ? "store_open,closure_reason,whatsapp" : table === "profiles" ? "avatar_url" : "*"}&limit=0`, {
        headers: { apikey: key },
        signal: AbortSignal.timeout(15000),
      });
      const body = await response.json();
      const expectedProtected = [
        "profiles",
        "addresses",
        "orders",
        "order_items",
        "saved_products",
        "carts",
        "notifications",
        "tracking_events",
        "coupons",
        "enquiries",
        "payment_sessions",
        "account_role_events",
      ].includes(table);
      const okay =
        response.ok ||
        (expectedProtected && response.status === 401 && body.code === "42501");
      if (!okay) ready = false;
      console.log(
        `${okay ? "OK" : "NOT READY"} ${table}: ${response.status}${body.code ? ` (${body.code})` : ""}`,
      );
    } catch {
      ready = false;
      console.log(`NOT READY ${table}: connection failed`);
    }
  }
  if (!ready) {
    console.log(
      "Apply supabase/schema.sql in the Supabase SQL Editor.",
    );
    process.exitCode = 1;
  }
}
