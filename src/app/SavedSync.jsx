import { useEffect, useState } from "react";
import { useSession } from "../store/session";
import { useShop } from "../store/shop";
import { useSaved } from "../store/saved";
import { requireBackend, resultOf, backendError } from "../lib/supabase";
export default function SavedSync() {
  const userId = useSession((s) => s.user?.id);
  const [retry, setRetry] = useState(0);
  const error = useSaved((s) => s.error);
  useEffect(() => {
    useSaved.setState({
      owner: userId || null,
      ids: [],
      loading: !!userId,
      error: null,
    });
    if (!userId) return;
    let active = true;
    const { wishlist, recentlyViewed } = useShop.getState();
    const ids = [...new Set([...wishlist, ...recentlyViewed].map((p) => p.id))];
    async function merge() {
      try {
        if (ids.length) {
          const valid = resultOf(
            await requireBackend()
              .from("products")
              .select("id")
              .in("id", ids)
              .eq("active", true),
          );
          const allowed = new Set(valid.map((p) => p.id));
          const rows = [
            ...wishlist
              .filter((p) => allowed.has(p.id))
              .map((p) => ({
                user_id: userId,
                product_id: p.id,
                kind: "wishlist",
              })),
            ...recentlyViewed
              .filter((p) => allowed.has(p.id))
              .map((p) => ({
                user_id: userId,
                product_id: p.id,
                kind: "recently-viewed",
              })),
          ];
          if (rows.length)
            resultOf(
              await requireBackend().from("saved_products").upsert(rows, {
                onConflict: "user_id,product_id,kind",
                ignoreDuplicates: true,
              }),
            );
          if (active) useShop.setState({ wishlist: [], recentlyViewed: [] });
        }
        const saved = resultOf(
          await requireBackend()
            .from("saved_products")
            .select("product_id")
            .eq("user_id", userId)
            .eq("kind", "wishlist"),
        );
        if (active)
          useSaved.setState((s) => ({
            owner: userId,
            ids: saved.map((p) => p.product_id),
            loading: false,
            error: null,
            revision: s.revision + 1,
          }));
      } catch (error) {
        if (active)
          useSaved.setState({ loading: false, error: backendError(error) });
      }
    }
    merge();
    return () => {
      active = false;
    };
  }, [userId, retry]);
  return error ? (
    <div className="sync-warning" role="status">
      Your saved products could not sync: {error}{" "}
      <button className="text-link" onClick={() => setRetry((v) => v + 1)}>
        Retry
      </button>
    </div>
  ) : null;
}
