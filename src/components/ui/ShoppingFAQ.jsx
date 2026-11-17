import { Link } from "react-router-dom";
const questions = [
  [
    "Which camera is right for my space?",
    "Start with where it will be used, the area you want to cover, and the available power and network connection. Check each product’s specifications, or ask us to help compare suitable options.",
  ],
  [
    "What should I check before choosing a smart lock?",
    "Check your door material, thickness, lock dimensions, and preferred access method. Compatibility varies by model, so confirm these details before you order.",
  ],
  [
    "Can I ask about delivery before ordering?",
    "Yes. Share your location and the products you are interested in so delivery availability, charges, and timing can be confirmed before you commit.",
  ],
  [
    "How do I follow an existing order?",
    "Open My Orders in your account to see available order information. Delivery updates will be shown there when the tracking service is connected.",
  ],
];
export default function ShoppingFAQ() {
  return (
    <section className="faq-section container">
      <div>
        <p className="eyebrow">A LITTLE CLARITY GOES A LONG WAY</p>
        <h2>
          Good questions.
          <br />
          Helpful answers.
        </h2>
        <p>
          Choosing technology should feel straightforward. Here is a useful
          place to start.
        </p>
        <Link className="text-link" to="/contact">
          Still have a question? Let’s talk ↗
        </Link>
      </div>
      <div className="faq-list">
        {questions.map(([question, answer]) => (
          <details key={question}>
            <summary>
              {question}
              <span aria-hidden="true">+</span>
            </summary>
            <p>{answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
