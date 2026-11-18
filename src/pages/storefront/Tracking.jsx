import { normalizeOrderReference, validOrderReference } from "../../lib/orderReference";
import { requireBackend, resultOf, backendError } from "../../lib/supabase";
import { useSession } from "../../store/session";
import { ArrowUpRight } from "lucide-react";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
export default function Tracking() {
  const user = useSession(s => s.user);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    const reference = normalizeOrderReference(new FormData(event.currentTarget).get("order"));
    if (!validOrderReference(reference)) {
      setMessage("Enter an order reference in the format OPT-YYYYMMDD-000001.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const order=resultOf(await requireBackend().from("orders").select("id").eq("order_ref",reference).eq("user_id",user.id).maybeSingle());
      if (!order) throw new Error("No order matches that reference in your account.");
      navigate(`/account/orders/${order.id}`);
    } catch (error) { setMessage(backendError(error)); }
    finally { setBusy(false); }
  }
  return (
    <section className="container page info-page">
      <p className="eyebrow">FROM OUR STORE TO YOUR DOOR</p>
      <h1>Follow your delivery.</h1>
      <p className="page-intro">
        Enter your full order reference to view its latest status. You can only
        access orders placed from your account.
      </p>
      <form className="panel admin-form" onSubmit={submit}>
        <label>
          Order reference
          <input name="order" required placeholder="OPT-YYYYMMDD-000001" autoCapitalize="characters" />
        </label>
        <button className="button primary" disabled={busy}>{busy ? "Finding your order…" : "Track order"}</button>
        <p role="alert">{message}</p>
        <Link className="text-link" to="/account/orders">
          Find your orders <ArrowUpRight size={16} aria-hidden="true" className="inline-icon" />
        </Link>
      </form>
    </section>
  );
}
