import { useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Clock3, Phone, ArrowUpRight, Copy, Check } from "lucide-react";
import { useBusiness } from "../../hooks/useBusiness";
export default function VisitStore({ contactPage = false }) {
  const business = useBusiness((s) => s.business);
  const [copyState, setCopyState] = useState("");
  async function copyAddress() {
    try {
      await navigator.clipboard.writeText(
        `${business.address}, ${business.area}`,
      );
      setCopyState("Address copied");
    } catch {
      setCopyState("Could not copy. Please select the address above.");
    }
  }
  return (
    <section className="visit-store container" aria-labelledby="visit-heading">
      <div className="visit-photo">
        <img
          src="/optimax_home.jpeg"
          alt="Optimax solar camera and accessories on display"
          loading="lazy"
        />
        <span className="photo-caption">
          A closer look at the Optimax collection
        </span>
      </div>
      <div className="visit-copy">
        <p className="eyebrow">ONLINE CONVENIENCE. A PERSONAL CONNECTION.</p>
        <h2 id="visit-heading">
          Come curious.
          <br />
          Leave a little smarter.
        </h2>
        <p>
          Some decisions are easier with a conversation. Take a closer look at
          the products, ask questions, and find the right fit for your space.
        </p>
        <div className="visit-details">
          <div>
            <MapPin size={19} />
            <p>
              <strong>Find the shop</strong>
              {business.address}
              <br />
              {business.area}
            </p>
          </div>
          <div>
            <Clock3 size={19} />
            <p>
              <strong>Opening hours</strong>
              {business.hours}
            </p>
          </div>
          <div>
            <Phone size={19} />
            <p>
              <strong>Talk to us</strong>
              {business.phone}
            </p>
          </div>
        </div>
        <div className="visit-actions">
          {contactPage ? (
            <a className="button primary" href="#message">
              Ask about your visit <ArrowUpRight size={17} />
            </a>
          ) : (
            <Link className="button primary" to="/contact">
              Plan your visit <ArrowUpRight size={17} />
            </Link>
          )}
          <button className="text-link" onClick={copyAddress}>
            {copyState === "Address copied" ? (
              <Check size={15} />
            ) : (
              <Copy size={15} />
            )}
            Copy address
          </button>
        </div>
        <p className="sample-note">{business.note}</p>
        <p className="copy-status" role="status">
          {copyState}
        </p>
      </div>
    </section>
  );
}
