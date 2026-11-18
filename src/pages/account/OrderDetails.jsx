import { ArrowLeft } from "lucide-react";
import Skeleton from "../../components/ui/Skeleton";
import AccountNav from "../../components/ui/AccountNav";
import PayOrder from "../../components/product/PayOrder";
import { useParams } from "react-router-dom";
import { requireBackend, resultOf } from "../../lib/supabase";
import { useQuery } from "../../hooks/useQuery";
import { useSession } from "../../store/session";
import { currency } from "../../services/catalog";
async function orderQuery(key) {
  const [id, userId] = key.split(":");
  return resultOf(
    await requireBackend()
      .from("orders")
      .select("*,order_items(*),tracking_events(*),payment_sessions(*)")
      .eq("id", id)
      .eq("user_id", userId)
      .single(),
  );
}
export default function OrderDetails({
  embedded = false,
  orderId,
  onNavigate,
}) {
  const params = useParams();
  const id = orderId || params.id;
  const user = useSession((s) => s.user);
  const {
    data: order,
    loading,
    error,
    refresh,
  } = useQuery(orderQuery, `${id}:${user.id}`);
  return (
    <section className={embedded ? "drawer-view" : "container page"}>
      {!embedded && (
        <>
          <AccountNav
            onNavigate={onNavigate}
            className="text-link"
            to="/account/orders"
          >
            <ArrowLeft size={16} aria-hidden="true" className="inline-icon" /> All orders
          </AccountNav>
          <h1 className="spaced-title">Your order.</h1>
        </>
      )}
      {loading ? (
        <Skeleton variant="order" label="Loading your order…" />
      ) : error ? (
        <p role="alert">{error}</p>
      ) : (
        <div className="cart-layout">
          <div className="panel">
            <p className="eyebrow">ORDER {order.id}</p>
            <h2>{order.status}</h2>
            {order.order_items.map((item) => (
              <div className="inventory-row" key={item.id}>
                <div>
                  <strong>{item.product_name || "Product"}</strong>
                  <p>
                    {item.quantity} × {currency(item.unit_price)}
                  </p>
                </div>
                <strong>{currency(item.unit_price * item.quantity)}</strong>
              </div>
            ))}
            <div className="spec">
              <span>Discount</span>
              <span>{currency(order.discount)}</span>
            </div>
            <div className="spec">
              <strong>Product total</strong>
              <strong>{currency(order.total)}</strong>
            </div>
            <p>
              Payment: {order.payment_status}. Delivery fees and payment
              arrangements are confirmed directly by the store.
            </p>
            <PayOrder order={order} refresh={refresh} />
            <h3>Delivery address</h3>
            <p>
              {order.address_snapshot.recipient}
              <br />
              {order.address_snapshot.address_line}
              <br />
              {order.address_snapshot.city}, {order.address_snapshot.state}
              <br />
              {order.address_snapshot.phone}
            </p>
          </div>
          <aside className="panel">
            <h2>Delivery timeline</h2>
            {order.tracking_number && (
              <p>Tracking reference: {order.tracking_number}</p>
            )}
            <ol className="timeline">
              {[...order.tracking_events]
                .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
                .map((event) => (
                  <li key={event.id}>
                    <strong>{event.status}</strong>
                    <p>{event.note}</p>
                    <small>{new Date(event.created_at).toLocaleString()}</small>
                  </li>
                ))}
            </ol>
            <button className="button secondary" onClick={refresh}>
              Refresh updates
            </button>
          </aside>
        </div>
      )}
    </section>
  );
}
