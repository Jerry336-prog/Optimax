import { useEffect, useState } from "react";
import { useShop } from "../store/shop";
import { useSession } from "../store/session";
import { requireBackend, resultOf, backendError } from "../lib/supabase";
export default function CartSync() {
  const user = useSession((s) => s.user);
  const loading = useSession((s) => s.loading);
  const cart = useShop((s) => s.cart);
  const [ready, setReady] = useState(null);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (loading) return;
    let active = true;
    setReady(null);
    setError("");
    useShop.getState().setCartSyncing(true);
    if (!user) {
      if (useShop.getState().cartOwner) useShop.getState().setCart([], null);
      useShop.getState().setCartSyncing(false);
      return;
    }
    const { cart: local, cartOwner, cartDirty } = useShop.getState();
    const guest = cartOwner === null ? local : [];
    if (cartOwner && cartOwner !== user.id)
      useShop.getState().setCart([], user.id);
    async function load() {
      try {
        const saved = resultOf(
          await requireBackend()
            .from("carts")
            .select("items")
            .eq("user_id", user.id)
            .maybeSingle(),
        );
        const items = new Map(
          (cartOwner === user.id && cartDirty ? local : saved?.items || []).map(
            (i) => [i.id, i.quantity],
          ),
        );
        for (const item of guest)
          items.set(item.id, Math.max(items.get(item.id) || 0, item.quantity));
        const ids = [...items.keys()];
        const products = ids.length
          ? resultOf(
              await requireBackend()
                .from("products")
                .select("*")
                .in("id", ids)
                .eq("active", true),
            )
          : [];
        const merged = products
          .filter((p) => p.stock > 0)
          .map((p) => ({
            ...p,
            quantity: Math.min(
              Math.max(1, Number(items.get(p.id)) || 1),
              p.stock,
            ),
          }));
        if (active) {
          useShop
            .getState()
            .setCart(merged, user.id, guest.length > 0 || cartDirty);
          useShop.getState().setCartSyncing(false);
          setReady(user.id);
        }
      } catch (error) {
        if (active) setError(backendError(error));
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [user, loading, retry]);
  useEffect(() => {
    if (!user || ready !== user.id) return;
    let active = true;
    const timer = setTimeout(async () => {
      try {
        resultOf(
          await requireBackend()
            .from("carts")
            .upsert({
              user_id: user.id,
              items: cart.map((p) => ({ id: p.id, quantity: p.quantity })),
              updated_at: new Date().toISOString(),
            }),
        );
        if (active) {
          setError("");
          if (useShop.getState().cart === cart)
            useShop.getState().markCartClean();
        }
      } catch (error) {
        if (active) setError(backendError(error));
      }
    }, 600);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [cart, ready, user]);
  return error ? (
    <div className="sync-warning" role="status">
      Your bag could not sync: {error}{" "}
      <button className="text-link" onClick={() => setRetry((v) => v + 1)}>
        Retry
      </button>
    </div>
  ) : null;
}
