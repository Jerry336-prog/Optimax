import Skeleton from "../../components/ui/Skeleton";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, PackageOpen } from "lucide-react";
import { getProducts } from "../../services/catalog";
import ProductCard from "../../components/product/ProductCard";
import { collections } from "../../lib/collections";
export default function Shop() {
  const [params, setParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState("newest");
  const search = params.get("search") || "";
  const category = params.get("category") || "";
  useEffect(() => {
    let active = true;
    getProducts().then((result) => {
      if (active) {
        setProducts(result.data);
        setError(result.error);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);
  const update = (key, value) =>
    setParams((p) => {
      value ? p.set(key, value) : p.delete(key);
      return p;
    });
  const filtered = products
    .filter(
      (p) =>
        (!category || p.category === category) &&
        `${p.name} ${p.description || ""}`
          .toLowerCase()
          .includes(search.toLowerCase()),
    )
    .sort((a, b) =>
      sort === "low"
        ? a.price - b.price
        : sort === "high"
          ? b.price - a.price
          : 0,
    );
  return (
    <section className="container page">
      <p className="eyebrow">THE OPTIMAX COLLECTION</p>
      <h1>Find your upgrade.</h1>
      <p className="page-intro">
        Thoughtful technology for a smarter, more connected life.
      </p>
      <div className="catalog-toolbar">
        <label className="search-input">
          <Search size={18} />
          <input
            aria-label="Search the collection"
            placeholder="Search cameras, locks, and more…"
            value={search}
            onChange={(e) => update("search", e.target.value)}
          />
        </label>
        <select
          aria-label="Sort products"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="newest">Newest arrivals</option>
          <option value="low">Price: low to high</option>
          <option value="high">Price: high to low</option>
        </select>
      </div>
      <div className="filter-tabs">
        <button
          className={!category ? "selected" : ""}
          onClick={() => update("category", "")}
        >
          All products
        </button>
        {collections.map((c) => (
          <button
            key={c.slug}
            className={category === c.slug ? "selected" : ""}
            onClick={() => update("category", c.slug)}
          >
            {c.name}
          </button>
        ))}
      </div>
      {loading ? (
        <Skeleton
          variant="products"
          count={8}
          label="Loading the collection…"
        />
      ) : error ? (
        <div className="empty-state">
          <PackageOpen size={36} />
          <h2>Something good is on its way.</h2>
          <p>{error}</p>
          <button
            className="button secondary"
            onClick={() => window.location.reload()}
          >
            Try again
          </button>
        </div>
      ) : filtered.length ? (
        <>
          <p className="result-count">{filtered.length} products</p>
          <div className="product-grid">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </>
      ) : (
        <div className="empty-state">
          <Search size={32} />
          <h2>No products found.</h2>
          <p>Try another search or explore a different collection.</p>
        </div>
      )}
    </section>
  );
}
