import { imageCredits } from "../../config/imageCredits";
import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { collections } from "../../lib/collections";
export default function Info({ kind }) {
  if (kind === "image-credits") return <section className="container page"><p className="eyebrow">IMAGE CREDITS</p><h1>Product photography.</h1><p className="page-intro">Additional representative images used in our demo catalog. Images are displayed as Wikimedia-provided resized versions; no other edits were made.</p><div className="account-records">{imageCredits.map(image => <article className="panel" key={image.file}><h2>{image.name}</h2><p>Photo by {image.author} · <a className="text-link" href={image.licenseUrl} target="_blank" rel="noreferrer">{image.license}</a></p><a className="text-link" href={image.source} target="_blank" rel="noreferrer">Original image and license <ArrowUpRight size={16} aria-hidden="true" /></a></article>)}</div></section>;
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
          Explore the collection <ArrowUpRight size={16} aria-hidden="true" className="inline-icon" />
        </Link>
      </div>
    </section>
  );
}
