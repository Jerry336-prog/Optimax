import FeaturedProducts from "../../components/product/FeaturedProducts";
import VisitStore from "../../components/ui/VisitStore";
import CollectionGallery from "../../components/ui/CollectionGallery";
import ShoppingFAQ from "../../components/ui/ShoppingFAQ";
import { collections } from "../../lib/collections";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  ShieldCheck,
  Sun,
  Truck,
  Headphones,
} from "lucide-react";

export default function Home() {
  return (
    <>
      <section className="hero container">
        <div className="hero-copy">
          <div className="pill">
            <span /> THE NEXT CHAPTER OF SMART LIVING
          </div>
          <h1>
            Life, upgraded.
            <br />
            Simply <em>smarter.</em>
          </h1>
          <p>
            Discover technology that looks after your world.
            <br className="desktop-break" /> Smart security, connected homes,
            and solar solutions.
            <br className="desktop-break" /> All in one thoughtfully curated
            collection.
          </p>
          <div className="hero-buttons">
            <Link className="button primary" to="/shop">
              Explore the collection <ArrowUpRight size={19} />
            </Link>
            <Link className="text-link" to="/about">
              Meet Optimax <ArrowRight size={17} />
            </Link>
          </div>
          <div className="hero-footnote">
            <span className="mini-line" /> DESIGNED FOR YOUR PEACE OF MIND
          </div>
        </div>
        <div className="hero-visual">
          <div className="orb" />
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <span className="visual-index">01 / SMART SECURITY</span>
          <div className="hero-image">
            <img
              src="/product 7.jpg"
              alt="Solar-powered outdoor smart camera with solar panel"
            />
          </div>
          <div className="floating-label">
            <span className="status-dot" />
            <div>
              Always a step ahead.<small>Solar-powered smart security</small>
            </div>
            <ArrowUpRight size={18} />
          </div>
          <span className="vertical-text">INTELLIGENCE MEETS EVERYDAY</span>
          <div className="visual-bottom">
            <span>SMARTER BY DESIGN</span>
            <span>OPTIMAX COLLECTION — 2026</span>
          </div>
        </div>
      </section>
      <div className="trust-strip container">
        <span>
          <ShieldCheck /> Security, thoughtfully selected
        </span>
        <span>
          <Sun /> Smarter energy solutions
        </span>
        <span>
          <Truck /> Delivery support
        </span>
        <span>
          <Headphones /> Real people. Expert guidance.
        </span>
      </div>
      <section className="section container">
        <div className="section-heading">
          <div>
            <p className="eyebrow">FIND YOUR EVERYDAY UPGRADE</p>
            <h2>A world of possibilities.</h2>
          </div>
          <Link className="text-link" to="/shop">
            Explore all products <ArrowUpRight size={18} />
          </Link>
        </div>
        <div className="collection-grid">
          {collections.map(({ name, slug, label, image, Icon }, i) => (
            <Link
              className="collection-card"
              to={`/shop?category=${slug}`}
              key={slug}
            >
              <div className="collection-top">
                <span>0{i + 1}</span>
                <Icon size={19} />
              </div>
              <div className="collection-image">
                <img src={image} alt={name} loading="lazy" />
              </div>
              <div className="collection-bottom">
                <div>
                  <h3>{name}</h3>
                  <p>{label}</p>
                </div>
                <span className="circle-arrow">
                  <ArrowUpRight size={18} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
      <FeaturedProducts />
      <section className="editorial container">
        <div className="editorial-photo">
          <img
            src="/optimax_home.jpeg"
            alt="An Optimax solar security camera from our product collection"
            loading="lazy"
          />
          <span>REAL PRODUCTS. REAL POSSIBILITIES.</span>
        </div>
        <div className="editorial-copy">
          <p className="eyebrow">MORE THAN JUST TECHNOLOGY</p>
          <h2>
            A little more peace.
            <br />A lot more possibility.
          </h2>
          <p>
            From keeping an eye on what matters to making the most of the sun,
            find practical technology that fits your life.
          </p>
          <Link className="button secondary" to="/shop">
            Find your upgrade <ArrowUpRight size={18} />
          </Link>
        </div>
      </section>
      <CollectionGallery />
      <VisitStore />
      <ShoppingFAQ />
      <section className="closing container">
        <p className="eyebrow">LET’S MAKE YOUR SPACE SMARTER</p>
        <h2>
          Good technology.
          <br />
          <span>Even better living.</span>
        </h2>
        <Link className="text-link" to="/contact">
          Talk to the Optimax team <ArrowUpRight size={20} />
        </Link>
      </section>
    </>
  );
}
