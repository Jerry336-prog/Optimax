import { useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useBusiness } from "../hooks/useBusiness";
export default function StoreSettings() {
  useEffect(() => {
    let active = true;
    let pending = false;
    async function load() {
      if (pending) return;
      pending = true;
      try {
        if (!supabase) throw new Error("Store connection unavailable.");
        const { data, error } = await supabase.from("site_settings").select("*").eq("id", "store").single();
        if (error || !data) throw error || new Error("Store settings unavailable.");
        if (active) useBusiness.setState(s => ({ business: { ...s.business, ...data }, loading: false, error: null }));
      } catch {
        if (active) useBusiness.setState({ loading: false, error: "We couldn’t check store availability. Please try again shortly." });
      } finally { pending = false; }
    }
    load();
    const timer = setInterval(load, 15000);
    window.addEventListener("focus", load);
    const channel = supabase?.channel("store-availability").on("postgres_changes", { event: "UPDATE", schema: "public", table: "site_settings", filter: "id=eq.store" }, load).subscribe();
    return () => {
      active = false;
      clearInterval(timer);
      window.removeEventListener("focus", load);
      if (channel) supabase.removeChannel(channel);
    };
  }, []);
  return null;
}
