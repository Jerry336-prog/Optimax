import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  Fingerprint,
  Lightbulb,
  MessagesSquare,
} from "lucide-react";
import VisitStore from "../../components/ui/VisitStore";
import CollectionGallery from "../../components/ui/CollectionGallery";
const values = [
  {
    Icon: Lightbulb,
    title: "Useful comes first.",
    text: "A clearer picture. A simpler way to unlock your door. A better use of solar energy. We focus on technology with a practical role in everyday life.",
  },
  {
    Icon: Fingerprint,
    title: "Your space is personal.",
    text: "A family home, a small business, and a growing workspace have different needs. Start with what matters to you, then find the products that fit.",
  },
  {
    Icon: MessagesSquare,
    title: "Keep it understandable.",
    text: "Features should help you make a decision. We aim for clear product information, useful comparisons, and conversations without the unnecessary jargon.",
  },
];
export default function About() {
  return (
    <>
      <section className="container brand-hero">
        <div>
          <p className="eyebrow">OUR STORY / THE OPTIMAX WAY</p>
          <h1>
            A smarter space.
            <br />
            <span>A more human approach.</span>
          </h1>
        </div>
        <p className="brand-lead">
          Technology does its best work when it makes everyday life feel a
          little easier. That is the idea behind Optimax.
        </p>
      </section>
      <section className="container story-banner">
        <img
          src="/optimax_home.jpeg"
          alt="Solar-powered smart security equipment from the Optimax collection"
        />
        <div>
          <span>THOUGHTFUL TECHNOLOGY. EVERYDAY POSSIBILITIES.</span>
          <span>OPTIMAX RESOURCES <ArrowUpRight size={16} aria-hidden="true" className="inline-icon" /></span>
        </div>
      </section>
      <section className="container story-intro">
        <p className="eyebrow">LESS COMPLICATED. MORE CONSIDERED.</p>
        <div>
          <h2>
            Not just another gadget.
            <br />
            Something that belongs in your life.
          </h2>
          <p>
            There is plenty of technology to choose from. The real question is
            what works for you. Optimax brings cameras, smart locks, home
            equipment, and solar solutions together in one place, so you can
            explore with a clearer sense of what you need.
          </p>
          <p>
            Whether you are thinking about your front door, your business
            premises, or a more energy-conscious setup, start with the everyday
            problem. We will help make the product choices easier to understand.
          </p>
          <Link className="text-link" to="/shop">
            Discover the collection <ArrowUpRight size={18} />
          </Link>
        </div>
      </section>
      <section className="values-section container">
        <div className="section-heading">
          <div>
            <p className="eyebrow">WHAT SHAPES THE EXPERIENCE</p>
            <h2>
              Simple principles.
              <br />
              Better everyday choices.
            </h2>
          </div>
        </div>
        <div className="values-grid">
          {values.map(({ Icon, title, text }, index) => (
            <article className="value-card" key={title}>
              <div>
                <Icon size={24} />
                <span>0{index + 1}</span>
              </div>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>
      <CollectionGallery />
      <VisitStore />
      <section className="closing container">
        <p className="eyebrow">LET’S START WITH YOUR SPACE</p>
        <h2>
          Tell us what matters.
          <br />
          <span>We’ll take it from there.</span>
        </h2>
        <Link className="button primary" to="/contact">
          Meet your next upgrade <ArrowUpRight size={18} />
        </Link>
      </section>
    </>
  );
}
