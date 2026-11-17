import { requireBackend, resultOf } from "../lib/supabase";
export async function accountData(key) {
  const [kind, userId] = key.split(":");
  if (kind === "orders")
    return resultOf(
      await requireBackend()
        .from("orders")
        .select("*, order_items(*), tracking_events(*)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
    );
  return resultOf(
    await requireBackend()
      .from(kind)
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
  );
}
export async function saveAddress(values, id, userId) {
  const query = id
    ? requireBackend()
        .from("addresses")
        .update(values)
        .eq("id", id)
        .eq("user_id", userId)
    : requireBackend()
        .from("addresses")
        .insert({ ...values, user_id: userId });
  return resultOf(await query.select().single());
}
export async function loadSaved(key) {
  const [kind, userId] = key.split(":");
  return resultOf(
    await requireBackend()
      .from("saved_products")
      .select("product:products(*)")
      .eq("user_id", userId)
      .eq("kind", kind)
      .order("created_at", { ascending: false }),
  )
    .map((row) => row.product)
    .filter(Boolean);
}
export async function isSaved(productId, userId) {
  return (
    resultOf(
      await requireBackend()
        .from("saved_products")
        .select("product_id")
        .eq("user_id", userId)
        .eq("product_id", productId)
        .eq("kind", "wishlist"),
    ).length > 0
  );
}
export async function toggleSaved(productId, userId) {
  const saved = await isSaved(productId, userId);
  if (saved)
    resultOf(
      await requireBackend()
        .from("saved_products")
        .delete()
        .eq("user_id", userId)
        .eq("product_id", productId)
        .eq("kind", "wishlist"),
    );
  else
    resultOf(
      await requireBackend()
        .from("saved_products")
        .insert({ user_id: userId, product_id: productId, kind: "wishlist" }),
    );
  return !saved;
}
export async function recordView(productId, userId) {
  resultOf(
    await requireBackend().from("saved_products").upsert(
      {
        user_id: userId,
        product_id: productId,
        kind: "recently-viewed",
        created_at: new Date().toISOString(),
      },
      { onConflict: "user_id,product_id,kind" },
    ),
  );
}

export async function removeSaved(productId, userId) {
  resultOf(
    await requireBackend()
      .from("saved_products")
      .delete()
      .eq("user_id", userId)
      .eq("product_id", productId)
      .eq("kind", "wishlist"),
  );
}
