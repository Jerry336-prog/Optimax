import { useState } from "react";
import { useSession } from "../store/session";
import { useShop } from "../store/shop";
import { useSaved, updateSaved } from "../store/saved";
import { toggleSaved } from "../services/account";
import { backendError } from "../lib/supabase";
export function useWishlist(product) {
  const user = useSession((s) => s.user);
  const local = useShop((s) => s.wishlist);
  const toggleWish = useShop((s) => s.toggleWish);
  const remote = useSaved();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function toggle() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      if (user) {
        const saved = await toggleSaved(product.id, user.id);
        updateSaved(user.id, product.id, saved);
      } else toggleWish(product);
    } catch (error) {
      setError(backendError(error));
    } finally {
      setBusy(false);
    }
  }
  return {
    saved: user
      ? remote.owner === user.id && remote.ids.includes(product.id)
      : local.some((p) => p.id === product.id),
    toggle,
    busy: busy || !!(user && (remote.loading || remote.owner !== user.id)),
    error,
  };
}
