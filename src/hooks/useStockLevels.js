import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useSession } from "../store/session";
// Refresh stock without resetting forms or replacing the page with a loader.
export function useStockLevels() {
  const userId = useSession((state) => state.user?.id);
  const [snapshot, setSnapshot] = useState({});
  useEffect(() => {
    if (!supabase) return;
    let active = true;
    let pending = false;
    async function refresh() {
      if (pending || document.hidden) return;
      pending = true;
      const { data, error } = await supabase.from("products").select("id,stock");
      if (active && !error) setSnapshot({ userId, stocks: Object.fromEntries(data.map(product => [product.id, product.stock])) });
      pending = false;
    }
    function update(event) {
      const { id, stock } = event.detail;
      setSnapshot(current => ({ userId, stocks: { ...(current.userId === userId ? current.stocks : {}), [id]: stock } }));
    }
    window.addEventListener("optimax-stock-changed", update);
    refresh();
    const interval = setInterval(refresh, 15000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => { active = false; window.removeEventListener("optimax-stock-changed", update); clearInterval(interval); window.removeEventListener("focus", refresh); document.removeEventListener("visibilitychange", refresh); };
  }, [userId]);
  return snapshot.userId === userId ? snapshot.stocks || {} : {};
}
