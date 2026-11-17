function Block({ className = "" }) {
  return <div className={`sk-block ${className}`} />;
}
function Lines() {
  return (
    <div className="sk-lines">
      <Block className="sk-line sk-wide" />
      <Block className="sk-line sk-medium" />
      <Block className="sk-line sk-short" />
    </div>
  );
}
function Record() {
  return (
    <div className="sk-record">
      <div className="sk-row">
        <Block className="sk-icon" />
        <Lines />
      </div>
      <Block className="sk-line sk-wide" />
      <Block className="sk-line sk-medium" />
    </div>
  );
}
export default function Skeleton({
  variant = "records",
  count = 3,
  label = "Loading content…",
}) {
  let content;
  if (variant === "products")
    content = (
      <div className="product-grid">
        {Array.from({ length: count }, (_, i) => (
          <div className="sk-product" key={i}>
            <Block className="sk-product-image" />
            <Block className="sk-line sk-short" />
            <Block className="sk-line sk-wide" />
            <Block className="sk-line sk-medium" />
          </div>
        ))}
      </div>
    );
  else if (variant === "account-menu")
    content = (
      <>
        <div className="sk-row sk-identity">
          <Block className="sk-avatar" />
          <Lines />
        </div>
        <div className="sk-menu">
          {Array.from({ length: 6 }, (_, i) => (
            <div className="sk-row" key={i}>
              <Block className="sk-icon" />
              <Lines />
              <Block className="sk-chevron" />
            </div>
          ))}
        </div>
      </>
    );
  else if (variant === "profile" || variant === "address-form")
    content = (
      <div className="sk-form">
        {Array.from({ length: variant === "profile" ? 3 : 6 }, (_, i) => (
          <div className="sk-field" key={i}>
            <Block className="sk-line sk-short" />
            <Block className="sk-input" />
          </div>
        ))}
        <Block className="sk-button" />
      </div>
    );
  else if (variant === "product")
    content = (
      <div className="product-detail">
        <Block className="sk-detail-image" />
        <div className="sk-detail-copy">
          <Block className="sk-line sk-short" />
          <Block className="sk-heading" />
          <Block className="sk-heading sk-medium" />
          <Lines />
          <Lines />
          <Block className="sk-button" />
          {Array.from({ length: 4 }, (_, i) => (
            <div className="sk-spec" key={i}>
              <Block className="sk-line sk-short" />
              <Block className="sk-line sk-medium" />
            </div>
          ))}
        </div>
      </div>
    );
  else if (variant === "cart" || variant === "checkout" || variant === "order")
    content = (
      <div className="cart-layout">
        <div className="sk-stack">
          {Array.from({ length: variant === "checkout" ? 2 : 3 }, (_, i) => (
            <Record key={i} />
          ))}
        </div>
        <div className="sk-record sk-summary">
          <Block className="sk-heading" />
          <Lines />
          <Lines />
          <Block className="sk-button" />
        </div>
      </div>
    );
  else if (variant === "home")
    content = (
      <>
        <div className="hero sk-home-hero">
          <div className="sk-home-copy">
            <Block className="sk-line sk-short" />
            <Block className="sk-hero-heading" />
            <Block className="sk-hero-heading sk-medium" />
            <Lines />
            <Block className="sk-button" />
          </div>
          <Block className="sk-hero-image" />
        </div>
        <div className="trust-strip">
          {Array.from({ length: 4 }, (_, i) => (
            <Block className="sk-line sk-short" key={i} />
          ))}
        </div>
      </>
    );
  else if (variant === "comparison")
    content = (
      <div className="sk-comparison">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i}>
            <Block className="sk-product-image" />
            <Lines />
            {Array.from({ length: 4 }, (_, j) => (
              <Block className="sk-input" key={j} />
            ))}
          </div>
        ))}
      </div>
    );
  else if (variant === "admin")
    content = (
      <>
        <div className="account-grid">
          {Array.from({ length: 6 }, (_, i) => (
            <Record key={i} />
          ))}
        </div>
        <div className="sk-stack">
          <Record />
          <Record />
        </div>
      </>
    );
  else
    content = (
      <div className="sk-stack">
        {Array.from({ length: count }, (_, i) => (
          <Record key={i} />
        ))}
      </div>
    );
  return (
    <div
      className={`loading-skeleton sk-${variant}`}
      role="status"
      aria-busy="true"
    >
      <span className="visually-hidden">{label}</span>
      <div aria-hidden="true">{content}</div>
    </div>
  );
}
export function PageSkeleton({ variant = "page", shell = false }) {
  return (
    <>
      {shell && (
        <div className="sk-shell-header" aria-hidden="true">
          <Block className="sk-logo" />
          <div className="sk-row">
            <Block className="sk-line" />
            <Block className="sk-line" />
            <Block className="sk-icon" />
          </div>
        </div>
      )}
      <section
        className={`container ${variant === "home" ? "sk-home-page" : "page"} skeleton-page`}
      >
        {variant !== "home" && (
          <div className="sk-page-title" aria-hidden="true">
            <Block className="sk-line sk-short" />
            <Block className="sk-heading" />
            <Block className="sk-line sk-medium" />
          </div>
        )}
        <Skeleton
          variant={variant}
          count={variant === "products" ? 8 : 3}
          label="Loading page…"
        />
      </section>
    </>
  );
}
