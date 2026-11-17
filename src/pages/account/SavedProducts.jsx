import Skeleton from "../../components/ui/Skeleton";
import { useSaved, updateSaved } from "../../store/saved";
import { useLocation, Link } from "react-router-dom";
import { useState } from "react";
import { useSession } from "../../store/session";
import { useShop } from "../../store/shop";
import { useQuery } from "../../hooks/useQuery";
import { loadSaved, removeSaved } from "../../services/account";
import { backendError } from "../../lib/supabase";
import ProductCard from "../../components/product/ProductCard";
async function savedQuery(key) {
  return key.split(":")[1] === "guest" ? [] : loadSaved(key);
}
export default function SavedProducts({
  embedded = false,
  kind: requestedKind,
}) {
  const { pathname } = useLocation();
  const kind =
    requestedKind ||
    (pathname.includes("recently") ? "recently-viewed" : "wishlist");
  const user = useSession((s) => s.user);
  const local = useShop((s) =>
    kind === "wishlist" ? s.wishlist : s.recentlyViewed,
  );
  const remove = useShop((s) => s.toggleWish);
  const revision = useSaved((s) => s.revision);
  const query = useQuery(
    savedQuery,
    `${kind}:${user?.id || "guest"}:${revision}`,
  );
  const [message, setMessage] = useState("");
  const products = user ? query.data : local;
  async function unsave(product) {
    try {
      if (user) {
        await removeSaved(product.id, user.id);
        updateSaved(user.id, product.id, false);
        query.refresh();
      } else remove(product);
    } catch (error) {
      setMessage(backendError(error));
    }
  }
  return (
    <section className={embedded ? "drawer-view" : "container page"}>
      {!embedded && (
        <>
          <p className="eyebrow">YOUR PERSONAL COLLECTION</p>
          <h1>{kind === "wishlist" ? "Your wishlist." : "Recently viewed."}</h1>
        </>
      )}
      <p className="page-intro">
        {user
          ? "Saved to your Optimax account."
          : "Saved on this device. Sign in to save future discoveries to your account."}
      </p>
      <p role="status">{message}</p>
      {user && query.loading ? (
        <Skeleton
          variant="products"
          count={embedded ? 4 : 8}
          label="Loading saved products…"
        />
      ) : query.error ? (
        <p role="alert">{query.error}</p>
      ) : products?.length ? (
        <div className="product-grid">
          {products.map((product) => (
            <div key={product.id}>
              <ProductCard product={product} />
              {kind === "wishlist" && (
                <button className="text-link" onClick={() => unsave(product)}>
                  Remove from wishlist
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h2>
            {kind === "wishlist"
              ? "Keep your favourites close."
              : "Your discoveries will appear here."}
          </h2>
          <Link className="button primary" to="/shop">
            Explore products
          </Link>
        </div>
      )}
    </section>
  );
}
