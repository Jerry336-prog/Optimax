import Skeleton from "../../components/ui/Skeleton";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Heart, ShoppingBag, ArrowLeftRight, Rotate3d } from "lucide-react";
import { useQuery } from "../../hooks/useQuery";
import { useWishlist } from "../../hooks/useWishlist";
import { currency, productQuery, productImage } from "../../services/catalog";
import { backendError } from "../../lib/supabase";
import { recordView } from "../../services/account";
import { useSession } from "../../store/session";
import { useShop } from "../../store/shop";
import { useBusiness } from "../../hooks/useBusiness";
import ProductReviews from "../../components/product/ProductReviews";
function ProductContent({ product }) {
  const { user, loading: authLoading } = useSession();
  const { addToCart, view, compare, comparison, cartSyncing, cartOwner } =
    useShop();
  const business = useBusiness((s) => s.business);
  const wish = useWishlist(product);
  const [added, setAdded] = useState(false);
  const [image, setImage] = useState(productImage(product));
  const [frame, setFrame] = useState(0);
  const [spin, setSpin] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    if (authLoading) return;
    if (!user) view(product);
    if (user)
      recordView(product.id, user.id).catch((error) =>
        setMessage(backendError(error)),
      );
  }, [product, user, view, authLoading]);
  const spinImages = product.spin_images || [];
  return (
    <>
      <div className="product-detail">
        <div>
          <div className="detail-image">
            <img
              src={spin ? spinImages[frame] : image}
              alt={`${product.name}${spin ? ` — angle ${frame + 1}` : ""}`}
            />
          </div>
          {spin ? (
            <label className="field-label">
              Rotate product · {frame + 1} / {spinImages.length}
              <input
                aria-label="360 degree product angle"
                type="range"
                min="0"
                max={spinImages.length - 1}
                value={frame}
                onChange={(e) => setFrame(Number(e.target.value))}
              />
            </label>
          ) : (
            <div className="image-thumbnails">
              {(product.images?.length
                ? product.images
                : [productImage(product)]
              ).map((src, i) => (
                <button
                  key={src + i}
                  aria-label={`View product image ${i + 1}`}
                  aria-pressed={image === src}
                  onClick={() => setImage(src)}
                >
                  <img src={src} alt="" />
                </button>
              ))}
            </div>
          )}
          {spinImages.length > 1 && (
            <button className="button secondary" onClick={() => setSpin(!spin)}>
              <Rotate3d size={17} />
              {spin ? "Show gallery" : "Explore 360° view"}
            </button>
          )}
        </div>
        <div>
          <p className="eyebrow">{product.category.replaceAll("-", " ")}</p>
          <h1>{product.name}</h1>
          <h2>{currency(product.price)}</h2>
          <p className="preserve-lines">{product.description}</p>
          <p className="stock-label">
            {product.stock > 0
              ? `${product.stock} available`
              : "Currently sold out"}
          </p>
          <div className="hero-buttons">
            <button
              className="button primary"
              disabled={
                !product.stock || cartSyncing || (user && cartOwner !== user.id)
              }
              onClick={() => {
                addToCart(product);
                setAdded(true);
              }}
            >
              <ShoppingBag size={18} />
              {added ? "Added to bag" : "Add to bag"}
            </button>
            <button
              className="icon-button"
              aria-label="Save to wishlist"
              aria-pressed={wish.saved}
              disabled={wish.busy}
              onClick={wish.toggle}
            >
              <Heart />
            </button>
          </div>
          <div className="product-links">
            <button className="text-link" onClick={() => compare(product)}>
              <ArrowLeftRight size={15} />
              {comparison.some((p) => p.id === product.id)
                ? "Remove from comparison"
                : "Compare this product"}
            </button>
            <Link className="text-link" to="/compare">
              View comparison ↗
            </Link>
            {business.whatsapp && (
              <a
                className="button secondary"
                href={`https://wa.me/${business.whatsapp}?text=${encodeURIComponent(`Hello Optimax, I’m interested in ${product.name} (${location.origin}/product/${product.id}). Please confirm availability and delivery.`)}`}
                target="_blank"
                rel="noreferrer"
              >
                Ask / order on WhatsApp ↗
              </a>
            )}
          </div>
          <p role="status">{wish.error || message}</p>
          <h3>Product specifications</h3>
          <dl>
            {Object.entries(product.specifications || {}).map(
              ([key, value]) => (
                <div className="spec" key={key}>
                  <dt>{key}</dt>
                  <dd>{String(value)}</dd>
                </div>
              ),
            )}
          </dl>
        </div>
      </div>
      <ProductReviews productId={product.id} />
    </>
  );
}
export default function Product() {
  const { id } = useParams();
  const query = useQuery(productQuery, id);
  return (
    <section className="container page">
      <Link className="text-link" to="/shop">
        ← Back to collection
      </Link>
      {query.loading ? (
        <Skeleton variant="product" label="Loading product details…" />
      ) : query.error ? (
        <div className="empty-state">
          <h1>Product details</h1>
          <p role="alert">{query.error}</p>
          <button className="button secondary" onClick={query.refresh}>
            Try again
          </button>
        </div>
      ) : (
        <ProductContent key={id} product={query.data} />
      )}
    </section>
  );
}
