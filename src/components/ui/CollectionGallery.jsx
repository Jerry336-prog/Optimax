import { useRef, useState } from "react";
import { ArrowUpRight, X } from "lucide-react";
const photographs = [
  {
    image: "/product 10.jpg",
    title: "A clearer view of your world.",
    category: "SMART SECURITY",
    alt: "Solar camera kit with a separate solar panel and accessories",
  },
  {
    image: "/product 18.jpg",
    title: "Make an entrance. Effortlessly.",
    category: "SMART ACCESS",
    alt: "Smart door lock and its included installation accessories",
  },
  {
    image: "/product 8.jpg",
    title: "Small details. Big possibilities.",
    category: "EVERYDAY TECHNOLOGY",
    alt: "White outdoor camera and solar panel kit displayed together",
  },
];
export default function CollectionGallery() {
  const dialog = useRef(null);
  const [selected, setSelected] = useState(photographs[0]);
  function openPhoto(photo) {
    setSelected(photo);
    dialog.current.showModal();
  }
  return (
    <section
      className="section container gallery-section"
      aria-labelledby="gallery-heading"
    >
      <div className="section-heading">
        <div>
          <p className="eyebrow">REAL PRODUCTS, UP CLOSE</p>
          <h2 id="gallery-heading">Get to know your next upgrade.</h2>
        </div>
        <p className="section-description">
          A closer look at the cameras, locks, and useful details that make a
          smarter space.
        </p>
      </div>
      <div className="photo-grid">
        {photographs.map((photo) => (
          <button
            className="photo-card"
            key={photo.image}
            onClick={() => openPhoto(photo)}
            aria-label={`Enlarge photo: ${photo.title}`}
          >
            <div className="gallery-photo">
              <img src={photo.image} alt={photo.alt} loading="lazy" />
              <span className="photo-expand">
                <ArrowUpRight size={20} />
              </span>
            </div>
            <span className="eyebrow">{photo.category}</span>
            <h3>{photo.title}</h3>
          </button>
        ))}
      </div>
      <dialog
        ref={dialog}
        className="gallery-dialog"
        aria-label="Product photograph"
      >
        <button
          className="icon-button dialog-close"
          onClick={() => dialog.current.close()}
          aria-label="Close photograph"
        >
          <X />
        </button>
        <img src={selected.image} alt={selected.alt} />
        <p>{selected.title}</p>
      </dialog>
    </section>
  );
}
