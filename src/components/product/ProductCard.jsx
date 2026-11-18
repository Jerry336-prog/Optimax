import { Link } from "react-router-dom";
import { Heart, ArrowUpRight } from "lucide-react";
import { currency, productImage } from "../../services/catalog";
import { useWishlist } from "../../hooks/useWishlist";
export default function ProductCard({ product }) {
  const wish = useWishlist(product);
  return (
    <article className="product-card">
      <div className="product-picture">
        <Link to={`/product/${product.id}`}>
          <img src={productImage(product)} alt={product.name} loading="lazy" />
        </Link>
        <button
          className="icon-button wish"
          aria-label={`Save ${product.name}`}
          aria-pressed={wish.saved}
          disabled={wish.busy}
          onClick={wish.toggle}
        >
          <Heart size={18} />
        </button>
        <span className="product-tag">
          {product.stock > 0 ? `${product.stock} available` : "Sold out"}
        </span>
      </div>
      <p className="eyebrow">{product.category?.replaceAll("-", " ")}{product.specifications?.["Listing type"] === "Demo product" && <span className="demo-product-label"> · Demo</span>}</p>
      <Link className="product-title" to={`/product/${product.id}`}>
        {product.name}
        <ArrowUpRight size={18} />
      </Link>
      <p>{currency(product.price)}</p>
      {wish.error && <p role="alert">{wish.error}</p>}
    </article>
  );
}
