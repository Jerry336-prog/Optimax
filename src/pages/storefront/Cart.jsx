import Skeleton from "../../components/ui/Skeleton";
import { Link } from "react-router-dom";
import { ShoppingBag, Trash2 } from "lucide-react";
import { useShop } from "../../store/shop";
import { currency, productImage } from "../../services/catalog";
export default function Cart() {
  const { cart, quantity, cartSyncing } = useShop();
  if (cartSyncing)
    return (
      <section className="container page">
        <h1>Shopping bag.</h1>
        <Skeleton variant="cart" label="Loading your bag…" />
      </section>
    );
  return (
    <section className="container page">
      <p className="eyebrow">YOUR NEXT UPGRADE</p>
      <h1>Shopping bag.</h1>
      {!cart.length ? (
        <div className="empty-state">
          <ShoppingBag size={36} />
          <h2>A little room for possibility.</h2>
          <p>
            Your bag is empty. Discover something that makes everyday life
            better.
          </p>
          <Link className="button primary" to="/shop">
            Explore the collection
          </Link>
        </div>
      ) : (
        <div className="cart-layout">
          <div>
            {cart.map((item) => (
              <article className="cart-item" key={item.id}>
                <img src={productImage(item)} alt={item.name} />
                <div>
                  <Link to={`/product/${item.id}`}>{item.name}</Link>
                  <p>{currency(item.price)}</p>
                  <label>
                    Quantity{" "}
                    <input
                      type="number"
                      aria-label={`Quantity for ${item.name}`}
                      min="1"
                      max={item.stock}
                      value={item.quantity}
                      onChange={(e) =>
                        quantity(
                          item.id,
                          Math.max(1, Number(e.target.value) || 1),
                        )
                      }
                    />
                  </label>
                </div>
                <button
                  className="icon-button"
                  aria-label={`Remove ${item.name}`}
                  onClick={() => quantity(item.id, 0)}
                >
                  <Trash2 size={18} />
                </button>
              </article>
            ))}
          </div>
          <aside className="panel">
            <h2>Order summary</h2>
            <div className="spec">
              <span>Subtotal</span>
              <strong>
                {currency(cart.reduce((s, i) => s + i.price * i.quantity, 0))}
              </strong>
            </div>
            <p>
              Current prices and stock are rechecked at checkout. Delivery fees
              are arranged separately.
            </p>
            <Link className="button primary" to="/checkout">
              Continue to checkout
            </Link>
          </aside>
        </div>
      )}
    </section>
  );
}
