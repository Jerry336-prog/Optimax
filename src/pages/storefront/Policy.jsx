import { ArrowUpRight, Package, RotateCcw, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { storePolicies } from "../../config/storePolicies";
import { useBusiness } from "../../hooks/useBusiness";

export default function Policy({ kind }) {
  const business = useBusiness((state) => state.business);
  const policy = storePolicies[kind];
  const privacy = kind === "privacy";
  const Icon = privacy ? ShieldCheck : kind === "returns" ? RotateCcw : Package;
  const whatsapp = String(business.whatsapp || "").replace(/\D/g, "");
  return (
    <section className="container page info-page policy-page">
      <p className="eyebrow">SHOPPING WITH OPTIMAX</p>
      <Icon size={30} className="policy-icon" aria-hidden="true" />
      <h1>{policy.title}</h1>
      <p className="page-intro">{policy.intro}</p>
      {policy.updated && <p className="editor-help">Last updated: {policy.updated}</p>}
      <div className="policy-sections">
        {policy.sections.map(([title, content]) => (
          <article className="panel" key={title}>
            <h2>{title}</h2>
            <p>{content}</p>
          </article>
        ))}
        <aside className="panel">
          <h2>Talk to our team</h2>
          <p>{privacy ? "Contact Optimax with a question or request about your personal information." : "Have your order reference ready so we can help with the right purchase."}</p>
          <div className="inline-actions">
            <Link className="button primary" to="/contact">Contact Optimax <ArrowUpRight size={16} aria-hidden="true" /></Link>
            {privacy && business.email && <a className="button secondary" href={`mailto:${business.email}?subject=Privacy%20request`}>Email a privacy request <ArrowUpRight size={16} aria-hidden="true" /></a>}
            {whatsapp && <a className="button secondary" href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`Hello Optimax, I have a question about your ${privacy ? "privacy" : kind === "returns" ? "return" : "shipping"} policy.`)}`} target="_blank" rel="noreferrer">Chat on WhatsApp <ArrowUpRight size={16} aria-hidden="true" /></a>}
          </div>
          {privacy && <p className="policy-source"><a className="text-link" href="https://ndpc.gov.ng/wp-content/uploads/2024/03/Nigeria_Data_Protection_Act_2023.pdf" target="_blank" rel="noreferrer">Nigeria Data Protection Act — official source <ArrowUpRight size={16} aria-hidden="true" /></a></p>}
          <nav className="policy-links" aria-label="Related shopping information">
            <Link className="text-link" to="/account/orders">Your orders</Link>
            <Link className="text-link" to="/tracking">Track an order</Link>
            <Link className="text-link" to={policy.related}>{policy.relatedLabel}</Link>
          </nav>
        </aside>
      </div>
    </section>
  );
}
