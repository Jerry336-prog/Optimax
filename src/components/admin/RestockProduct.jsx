import { useState } from "react";
import { requireBackend, resultOf, backendError } from "../../lib/supabase";
export default function RestockProduct({ product, onRestock }) {
  const [quantity, setQuantity] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    const amount = Number(quantity);
    if (!Number.isSafeInteger(amount) || amount < 1) { setMessage("Enter a positive whole number of units."); return; }
    setBusy(true); setMessage("");
    try {
      const stock = resultOf(await requireBackend().rpc("add_product_stock", { p_product: product.id, p_quantity: amount }));
      onRestock(product.id, stock);
      setQuantity(""); setMessage(`Added ${amount} units. ${stock} now available.`);
    } catch (error) { setMessage(backendError(error)); }
    finally { setBusy(false); }
  }
  return <form className="restock-form" onSubmit={submit} aria-label={`Restock ${product.name}`}>
    <label>Units to add<input aria-label={`Units to add for ${product.name}`} type="number" min="1" max="2147483647" step="1" required value={quantity} onChange={event => setQuantity(event.target.value)} disabled={busy} placeholder="e.g. 20" /></label>
    <button className="button secondary" disabled={busy}>{busy ? "Adding…" : "Add stock"}</button>
    {message && <p role="status">{message}</p>}
  </form>;
}
