import { requireBackend, resultOf, backendError } from "../lib/supabase";
export async function productsQuery() {
  return resultOf(
    await requireBackend()
      .from("products")
      .select("*")
      .eq("active", true)
      .order("created_at", { ascending: false }),
  );
}
export async function getProducts() {
  try {
    return { data: await productsQuery(), error: null };
  } catch (error) {
    return { data: [], error: backendError(error) };
  }
}
export async function productQuery(id) {
  return resultOf(
    await requireBackend()
      .from("products")
      .select("*")
      .eq("id", id)
      .eq("active", true)
      .single(),
  );
}
export const currency = (value) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  }).format(value);
export const productImage = (product) =>
  product.images?.[0] || "/product 7.jpg";
export function safeMediaUrl(value) {
  try {
    const url = new URL(value, window.location.origin);
    return ["https:", "http:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}
