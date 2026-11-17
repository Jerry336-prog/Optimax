import Avatar from "../ui/Avatar";
import { useSession } from "../../store/session";
import { pageLoadingVariant } from "../../lib/loading";
import { PageSkeleton } from "../ui/Skeleton";
import { accountRoute, accountTitles } from "../../lib/accountNavigation";
import Account from "../../pages/account/Account";
import { useBusiness } from "../../hooks/useBusiness";
import { useEffect, useState, Suspense } from "react";
import {
  Link,
  NavLink,
  Outlet,
  useNavigate,
  useLocation,
  useSearchParams,
} from "react-router-dom";
import {
  Store,
  MessageCircle,
  Search,
  ShoppingBag,
  Sun,
  Moon,
  Menu,
  X,
  ArrowUpRight,
} from "lucide-react";
import { useShop } from "../../store/shop";
export default function Layout() {
  const { user, profile, photoError } = useSession();
  const { business, loading, error } = useBusiness();
  const unavailable = loading || !!error || business.store_open === false;
  const { cart, theme, toggleTheme } = useShop();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const shopPage = /^\/(shop|search)\/?$/.test(location.pathname);
  const [params, setParams] = useSearchParams();
  const directAccount = accountRoute(location.pathname);
  const requested = params.get("account");
  const accountView =
    requested === "open"
      ? "menu"
      : Object.hasOwn(accountTitles, requested)
        ? requested
        : directAccount?.view;
  const accountOpen = !!accountView;
  const orderId = params.get("order") || directAccount?.orderId;
  function selectAccount(view, extras = {}) {
    setOpen(false);
    setParams((current) => {
      current.set("account", view === "menu" ? "open" : view);
      current.delete("order");
      current.delete("address");
      for (const [key, value] of Object.entries(extras))
        if (value) current.set(key, value);
      return current;
    });
  }
  function openAccount() {
    selectAccount("menu");
  }
  function closeAccount() {
    if (directAccount) navigate("/", { replace: true });
    else
      setParams(
        (current) => {
          current.delete("account");
          current.delete("order");
          current.delete("address");
          return current;
        },
        { replace: true },
      );
  }

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  return (
    <>
      {business.store_open === false ? (
        <div className="announcement closure-banner" role="status">
          <strong>Store temporarily closed</strong>
          <span className="closure-banner-message">{business.closure_reason}</span>
          {/^[0-9]{8,15}$/.test(business.whatsapp || "") && <a href={`https://wa.me/${business.whatsapp}?text=${encodeURIComponent("Hello Optimax, I need assistance while the store is closed.")}`} target="_blank" rel="noreferrer"><MessageCircle size={15} /> Chat with our team ↗</a>}
        </div>
      ) : (
        <div className="announcement">Smarter spaces. Better living.{" "}<span>Discover the Optimax collection <ArrowUpRight size={12} /></span></div>
      )}
      <header>
        <div className="nav-wrap">
          <Link className="logo" to="/" aria-label="Optimax home">
            <span className="logo-mark">
              O<span />
            </span>
            OPTIMAX<span className="logo-dot">®</span>
          </Link>
          <nav
            className={open ? "nav-links open" : "nav-links"}
            aria-label="Main navigation"
            onClick={() => setOpen(false)}
          >
            <NavLink to="/" end>
              Home
            </NavLink>
            <NavLink to="/shop">Shop all</NavLink>
            <NavLink to="/about">Our story</NavLink>
            <NavLink to="/contact">Contact</NavLink>
            <button
              className="mobile-account nav-account-trigger"
              aria-haspopup="dialog"
              aria-controls="account-drawer"
              onClick={openAccount}
            >
              Your account
            </button>
          </nav>
          <div className="nav-actions">
            <button
              className="icon-button"
              aria-label="Search products"
              onClick={() => navigate("/shop?search=")}
            >
              <Search size={19} />
            </button>
            <button
              className="icon-button"
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              onClick={toggleTheme}
            >
              {theme === "dark" ? <Sun size={19} /> : <Moon size={19} />}
            </button>
            <button
              className="icon-button account-trigger"
              aria-label="Your account"
              aria-haspopup="dialog"
              aria-expanded={accountOpen}
              aria-controls="account-drawer"
              onClick={openAccount}
            >
              <Avatar profile={profile} user={user} size={29} decorative />
            </button>
            <Link
              className="icon-button cart-icon"
              aria-label="Shopping bag"
              to="/cart"
            >
              <ShoppingBag size={19} />
              {cart.length > 0 && (
                <b>{cart.reduce((s, i) => s + i.quantity, 0)}</b>
              )}
            </Link>
            <button
              className="icon-button mobile-menu"
              aria-label="Toggle navigation"
              onClick={() => setOpen(!open)}
            >
              {open ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </header>
      <main>
        {photoError && <div className="auth-feedback error auth-notice container" role="alert"><span>Your account is ready, but your photo could not upload: {photoError}</span><button className="text-link" onClick={() => selectAccount("profile")}>Update profile photo</button></div>}
        {location.state?.authNotice && <div className="auth-feedback success auth-notice container" role="status">
          <span>{location.state.authNotice}</span>
          <button className="icon-button" aria-label="Dismiss account message" onClick={() => { const state = { ...location.state }; delete state.authNotice; navigate(location.pathname + location.search + location.hash, { replace: true, state }); }}><X size={18} /></button>
        </div>}
        <Suspense
          fallback={
            <PageSkeleton variant={pageLoadingVariant(location.pathname)} />
          }
        >
          {unavailable && shopPage ? loading ? <PageSkeleton /> : (
            <section className="store-closed container" aria-labelledby="store-closed-title">
              <div className="store-closed-icon"><Store size={36} /></div>
              <p className="eyebrow">OPTIMAX · {error ? "PLEASE CHECK BACK" : "TEMPORARILY CLOSED"}</p>
              <h1 id="store-closed-title">{error ? "We couldn’t connect." : "We’ll be back soon."}</h1>
              <p className="store-closed-reason">{error || business.closure_reason}</p>
              <div className="inline-actions">
                {/^[0-9]{8,15}$/.test(business.whatsapp || "") && <a className="button primary" href={`https://wa.me/${business.whatsapp}?text=${encodeURIComponent("Hello Optimax, I need urgent assistance while the store is closed.")}`} target="_blank" rel="noreferrer"><MessageCircle size={18} /> Chat with our team</a>}
                <button className="button secondary" onClick={openAccount}>Your account</button>
              </div>
              <small>Your orders, saved addresses and profile are still available in your account.</small>
            </section>
          ) : <Outlet />}
        </Suspense>
      </main>
      <Account
        open={accountOpen}
        onClose={closeAccount}
        view={accountView || "menu"}
        onSelect={selectAccount}
        orderId={orderId}
        addressView={params.get("address")}
      />
      <footer>
        <div className="footer-top">
          <div>
            <Link className="logo" to="/">
              OPTIMAX<span className="logo-dot">®</span>
            </Link>
            <p>
              Thoughtful technology.
              <br />
              Extraordinary everyday living.
            </p>
          </div>
          <div>
            <h4>Explore</h4>
            <Link to="/shop">All products</Link>
            <Link to="/categories">Our collections</Link>
            <Link to="/wishlist">Your wishlist</Link>
          </div>
          <div>
            <h4>Here to help</h4>
            <Link to="/account/orders">Your orders</Link>
            <Link to="/tracking">Track an order</Link>
            <Link to="/contact">Contact us</Link>
          </div>
          <div className="footer-contact">
            <h4>Visit & connect</h4>
            <p>
              {business.address}
              <br />
              {business.area}
            </p>
            <p>{business.phone}</p>
            <a href={`mailto:${business.email}`}>{business.email} ↗</a>
            <span className="sample-note">Sample contact details</span>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Optimax Resources.</span>
          <span>Smart devices. Human possibilities.</span>
          <Link to="/privacy">Privacy policy</Link>
        </div>
      </footer>
    </>
  );
}
