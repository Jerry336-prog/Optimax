import { ArrowUpRight } from "lucide-react";
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
                <img src={c.image} alt={c.name} />
              </div>
              <h2>{c.name}</h2>
              <p>{c.label} <ArrowUpRight size={16} aria-hidden="true" className="inline-icon" /></p>
            </Link>
          ))}
        </div>
      </section>
    );
  return null;
}
