import { useBusiness } from "../../hooks/useBusiness";
import { useState } from "react";
import { paymentFunction } from "../../services/payments";
import { requireBackend, resultOf, backendError } from "../../lib/supabase";
export default function PayOrder({ order, refresh }) {
  const { business, loading, error } = useBusiness();
  const closed = loading || !!error || business.store_open === false;
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [uncertain, setUncertain] = useState(false);
  async function pay() {
    if (closed || busy) return;
    setBusy(true);
    setMessage("");
    try {
      const result = await paymentFunction("paystack-init", {
        order_id: order.id,
      });
      if (result.paid) {
        refresh();
        return;
      }
      const url = new URL(result.authorization_url);
      if (url.protocol !== "https:" || url.hostname !== "checkout.paystack.com")
        throw new Error(
          "An invalid checkout URL was returned. Please contact the store.",
        );
      location.assign(url.href);
    } catch (error) {
      setUncertain(true);
      setMessage(`${backendError(error)} If a checkout already opened, verify its status before starting another payment.`);
    } finally {
      setBusy(false);
    }
  }
  async function verify() {
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      let pending = order.payment_sessions?.find(
        (s) => s.status === "pending",
      );
      if (!pending) pending = resultOf(await requireBackend().from("payment_sessions").select("reference").eq("order_id", order.id).eq("status", "pending").maybeSingle());
      if (!pending)
        throw new Error(
          "No pending payment was found. Refresh your order first.",
        );
      const result = await paymentFunction("paystack-verify", {
        reference: pending.reference,
      });
      setMessage(
        result.status === "paid"
          ? "Payment confirmed."
          : result.status === "failed"
            ? "Payment failed. You can try again or cancel a pending order."
            : "Payment is still pending. No payment has been confirmed yet. Check again shortly.",
      );
      if (result.status !== "pending") { setUncertain(false); refresh(); }
    } catch (error) {
      setMessage(backendError(error));
    } finally {
      setBusy(false);
    }
  }
  if (
    order.status === "cancelled" ||
    order.payment_status === "paid" ||
    order.payment_status === "refunded" ||
    Number(order.total) <= 0
  )
    return null;
  return (
    <div className="checkout-notice">
      <h3>{closed ? "Payments are paused while the store is closed" : "Pay securely with Paystack"}</h3>
      <p>
        Pay the product total shown above. Delivery charges are arranged
        separately with the store. A pending payment must be verified before an
        order can be cancelled.
      </p>
      <div className="inline-actions">
        <button className="button primary" disabled={busy || closed} onClick={pay}>
          {busy
            ? "Please wait…"
            : order.payment_status === "pending"
              ? "Continue Paystack payment"
              : "Pay product total"}
        </button>
        {(order.payment_status === "pending" || uncertain) && (
          <button className="button secondary" disabled={busy} onClick={verify}>
            Verify payment
          </button>
        )}
      </div>
      <p role="status">{message}</p>
    </div>
  );
}
