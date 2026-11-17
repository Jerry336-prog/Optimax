import Skeleton from "../ui/Skeleton";
import { Link } from "react-router-dom";
import { useQuery } from "../../hooks/useQuery";
import { productsQuery } from "../../services/catalog";
import ProductCard from "./ProductCard";
export default function FeaturedProducts() {
  const query = useQuery(productsQuery);
  return (
    <section className="section container">
      <div className="section-heading">
        <div>
          <p className="eyebrow">YOUR NEXT EVERYDAY UPGRADE</p>
          <h2>From the collection.</h2>
        </div>
        <Link className="text-link" to="/shop">
          Shop all products ↗
        </Link>
      </div>
      {query.loading ? (
        <Skeleton variant="products" count={4} label="Loading products…" />
      ) : query.error ? (
        <p role="alert">{query.error}</p>
      ) : !query.data.length ? (
        <p className="page-intro">
          The collection is being prepared. Check back soon for available
          products.
        </p>
      ) : (
        <div className="product-grid">
          {query.data.slice(0, 4).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}
