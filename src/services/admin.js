export { uploadImages } from "./media";
import { requireBackend, resultOf } from "../lib/supabase";
async function allRows(table, select = "*") {
  const rows = [];
  for (let offset = 0; ; offset += 500) {
    const data = resultOf(
      await requireBackend()
        .from(table)
        .select(select)
        .order("created_at", { ascending: false })
        .range(offset, offset + 499),
    );
    rows.push(...data);
    if (data.length < 500) return rows;
  }
}
export async function adminQuery() {
  const [products, orders, profiles, reviews, enquiries, settings, invoices] =
    await Promise.all([
      allRows("products"),
      allRows("orders", "*,order_items(*)"),
      allRows("profiles"),
      allRows("reviews", "*,product:products(name)"),
      allRows("enquiries"),
      requireBackend()
        .from("site_settings")
        .select("*")
        .eq("id", "store")
        .single()
        .then(resultOf),
      allRows("invoices"),
    ]);
  return { products, orders, profiles, reviews, enquiries, settings, invoices };
}
