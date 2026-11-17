import { useBusiness } from "../../hooks/useBusiness";
import Skeleton from "../../components/ui/Skeleton";
import { useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useShop } from "../../store/shop";
import { useSession } from "../../store/session";
import { accountData } from "../../services/account";
import { productsQuery, currency } from "../../services/catalog";
import { useQuery } from "../../hooks/useQuery";
import { requireBackend, resultOf, backendError } from "../../lib/supabase";
export default function Checkout() {
  const { business, loading: settingsLoading, error: settingsError } = useBusiness();
  const orderingPaused = settingsLoading || !!settingsError || business.store_open === false;
  const user = useSession((s) => s.user);
  const { cart, clearCart, cartSyncing, cartOwner } = useShop();
  const addresses = useQuery(accountData, `addresses:${user.id}`);
  const catalog = useQuery(productsQuery);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const fingerprint = JSON.stringify(
    cart.map((p) => ({ id: p.id, quantity: p.quantity })),
  );
  const request = useRef(null);
  const requestKey = useMemo(() => {
    try {
      const saved = JSON.parse(
        sessionStorage.getItem("optimax-checkout-request") || "null",
      );
      if (saved?.fingerprint === fingerprint && saved.userId === user.id)
        return saved.key;
    } catch {
      /* new request */
    }
    const key = crypto.randomUUID();
    sessionStorage.setItem(
      "optimax-checkout-request",
      JSON.stringify({ key, fingerprint, userId: user.id }),
    );
    return key;
  }, [fingerprint, user.id]);
  async function submit(event) {
    event.preventDefault();
    if (request.current) return;
    if (orderingPaused) {
      setMessage("Orders are paused while the store is closed. Your bag is saved for later.");
      return;
    }
    request.current = true;
    setBusy(true);
    setMessage("");
    const fields = new FormData(event.currentTarget);
    try {
      const id = resultOf(
        await requireBackend().rpc("place_order", {
          p_items: cart.map((p) => ({ id: p.id, quantity: p.quantity })),
          p_address: fields.get("address"),
          p_request_key: requestKey,
          p_coupon: fields.get("coupon").trim(),
        }),
      );
      clearCart();
      sessionStorage.removeItem("optimax-checkout-request");
      navigate(`/account/orders/${id}?placed=1`, { replace: true });
    } catch (error) {
      setMessage(backendError(error));
    } finally {
      request.current = false;
      setBusy(false);
    }
  }
  const current = cart.map((item) => ({
    ...item,
    live: catalog.data?.find((p) => p.id === item.id),
  }));
  const invalid = current.some(
    (p) => !p.live || p.quantity > p.live.stock || p.quantity < 1,
  );
  const total = current.reduce(
    (s, p) => s + (p.live?.price || 0) * p.quantity,
    0,
  );
  if (cartSyncing || cartOwner !== user.id)
    return (
      <section className="container page">
        <h1>Checkout.</h1>
        <Skeleton variant="checkout" label="Loading checkout…" />
      </section>
    );
  return (
    <section className="container page">
      <p className="eyebrow">ONE STEP CLOSER</p>
      <h1>Request your order.</h1>
      {orderingPaused && <div className="checkout-notice" role="status"><h3>Ordering is currently paused</h3><p>{settingsError || (settingsLoading ? "Checking store availability…" : business.closure_reason)}</p><p>You can review your bag and delivery details. Place your order when the store reopens.</p></div>}
      {!cart.length ? (
        <div className="empty-state">
          <h2>Your bag is empty.</h2>
          <Link className="button primary" to="/shop">
            Explore products
          </Link>
        </div>
      ) : addresses.loading || catalog.loading ? (
        <Skeleton variant="checkout" label="Checking your bag and addresses…" />
      ) : addresses.error || catalog.error ? (
        <div className="empty-state">
          <p role="alert">{addresses.error || catalog.error}</p>
          <button
            className="button secondary"
            onClick={() => {
              addresses.refresh();
              catalog.refresh();
            }}
          >
            Try again
          </button>
        </div>
      ) : (
        <form className="cart-layout" onSubmit={submit}>
          <div className="panel">
            <h2>Where should it go?</h2>
            {!addresses.data.length ? (
              <>
                <p>Add a delivery address before placing your order.</p>
                <Link className="button secondary" to="/account/addresses">
                  Add an address
                </Link>
              </>
            ) : (
              <label className="field-label">
                Delivery address
                <select name="address" required>
                  {addresses.data.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.label} — {a.address_line}, {a.city}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className="field-label">
              Coupon code (optional)
              <input
                name="coupon"
                maxLength={32}
                placeholder="Enter your code"
              />
            </label>
            <div className="checkout-notice">
              <h3>Payment & delivery</h3>
              <p>
                This sends a real order request to Optimax and reserves the
                products. No payment is collected here. After the order is
                created, you can pay its product total securely with Paystack.
                The store will contact you to confirm delivery fees. You can
                cancel a pending order from My Orders.
              </p>
            </div>
            <label className="check-label">
              <input type="checkbox" required />I understand that the Paystack
              product payment excludes separately arranged delivery fees.
            </label>
          </div>
          <aside className="panel">
            <h2>Your order</h2>
            {current.map((p) => (
              <div className="spec" key={p.id}>
                <span>
                  {p.name} × {p.quantity}
                </span>
                <span>
                  {p.live ? currency(p.live.price * p.quantity) : "Unavailable"}
                </span>
              </div>
            ))}
            <div className="spec">
              <strong>Product subtotal</strong>
              <strong>{currency(total)}</strong>
            </div>
            <p>
              Any valid coupon discount is calculated securely when the order is
              created. Delivery is arranged separately.
            </p>
            {invalid && (
              <p role="alert">
                Your bag contains an unavailable item or a quantity above
                current stock. Update your bag before continuing.
              </p>
            )}
            <p role="alert">{message}</p>
            <button
              className="button primary"
              disabled={orderingPaused || busy || invalid || !addresses.data.length}
            >
              {orderingPaused ? "Ordering paused" : busy ? "Placing order…" : "Place order request"}
            </button>
            <Link className="text-link" to="/cart">
              Edit bag
            </Link>
          </aside>
        </form>
      )}
    </section>
  );
}
