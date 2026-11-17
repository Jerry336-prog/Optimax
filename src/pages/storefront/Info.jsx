import { Link } from "react-router-dom";
import { collections } from "../../lib/collections";
export default function Info({ kind }) {
  if (kind === "categories")
    return (
      <section className="container page">
        <p className="eyebrow">EXPLORE OPTIMAX</p>
        <h1>Smarter in every way.</h1>
        <div className="collection-grid">
          {collections.map((c) => (
            <Link
              className="collection-card"
              key={c.slug}
              to={`/shop?category=${c.slug}`}
            >
              <div className="collection-image">
                <img src={`/product ${c.image}.jpg`} alt={c.name} />
              </div>
              <h2>{c.name}</h2>
              <p>{c.label} ↗</p>
            </Link>
          ))}
        </div>
      </section>
    );
  const content = {
    privacy: [
      "Your privacy matters.",
      "Account information is used to support your shopping experience and orders.",
      "A complete business-approved privacy policy will be provided before the store opens for orders.",
    ],
  }[kind];
  return (
    <section className="container page info-page">
      <p className="eyebrow">OPTIMAX RESOURCES</p>
      <h1>{content[0]}</h1>
      <p className="page-intro">{content[1]}</p>
      <div className="panel">
        <p>{content[2]}</p>
        <Link className="button secondary" to="/shop">
          Explore the collection ↗
        </Link>
      </div>
    </section>
  );
}
