import Skeleton from "../../components/ui/Skeleton";
import { Link } from "react-router-dom";
import { useShop } from "../../store/shop";
import { useQuery } from "../../hooks/useQuery";
import { productsQuery, currency, productImage } from "../../services/catalog";
export default function Compare() {
  const { comparison, compare } = useShop();
  const query = useQuery(productsQuery);
  const products = comparison
    .map((p) => query.data?.find((i) => i.id === p.id))
    .filter(Boolean);
  const keys = [
    ...new Set(products.flatMap((p) => Object.keys(p.specifications || {}))),
  ];
  return (
    <section className="container page">
      <p className="eyebrow">SIDE BY SIDE</p>
      <h1>Find your best fit.</h1>
      {query.loading ? (
        <Skeleton variant="comparison" label="Loading product comparison…" />
      ) : query.error ? (
        <p role="alert">{query.error}</p>
      ) : !products.length ? (
        <div className="empty-state">
          <h2>Choose up to three products.</h2>
          <p>Open a product and select “Compare this product” to start.</p>
          <Link className="button primary" to="/shop">
            Explore products
          </Link>
        </div>
      ) : (
        <div className="comparison-scroll">
          <table className="comparison-table">
            <thead>
              <tr>
                <th>Product</th>
                {products.map((p) => (
                  <th key={p.id}>
                    <img src={productImage(p)} alt={p.name} />
                    <Link to={`/product/${p.id}`}>{p.name}</Link>
                    <button className="text-link" onClick={() => compare(p)}>
                      Remove
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["Price", (p) => currency(p.price)],
                [
                  "Availability",
                  (p) => (p.stock > 0 ? "In stock" : "Sold out"),
                ],
                ["Collection", (p) => p.category],
                ...keys.map((k) => [
                  k,
                  (p) => String(p.specifications?.[k] ?? "—"),
                ]),
              ].map(([label, value]) => (
                <tr key={label}>
                  <th>{label}</th>
                  {products.map((p) => (
                    <td key={p.id}>{value(p)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
