import Avatar from "../../components/ui/Avatar";
import Skeleton from "../../components/ui/Skeleton";
import { useEffect, useRef, useState, lazy, Suspense } from "react";
import { Link, useLocation } from "react-router-dom";
import { accountRoute, accountTitles } from "../../lib/accountNavigation";
import {
  ArrowLeft,
  Bell,
  Package,
  MapPin,
  Heart,
  Clock,
  UserRound,
  X,
  ChevronRight,
  LogOut,
  ArrowUpRight,
  ShieldCheck,
} from "lucide-react";
import { useSession } from "../../store/session";
import { requireBackend, resultOf, backendError } from "../../lib/supabase";
const ProtectedPage = lazy(() => import("./ProtectedPage"));
const OrderDetails = lazy(() => import("./OrderDetails"));
const SavedProducts = lazy(() => import("./SavedProducts"));
const links = [
  {
    name: "My orders",
    description: "Purchases, delivery updates & order history",
    path: "/account/orders",
    Icon: Package,
  },
  {
    name: "Saved addresses",
    description: "Your delivery details, ready when you are",
    path: "/account/addresses",
    Icon: MapPin,
  },
  {
    name: "Notifications",
    description: "The latest on your orders and account",
    path: "/account/notifications",
    Icon: Bell,
  },
  {
    name: "Profile settings",
    description: "Your personal information & preferences",
    path: "/account/profile",
    Icon: UserRound,
  },
  {
    name: "Wishlist",
    description: "Keep your next upgrades close",
    path: "/wishlist",
    Icon: Heart,
  },
  {
    name: "Recently viewed",
    description: "Pick up where you left off",
    path: "/recently-viewed",
    Icon: Clock,
  },
];
export default function Account({
  open,
  onClose,
  view = "menu",
  onSelect,
  orderId,
  addressView,
}) {
  const location = useLocation();
  const body = useRef(null);
  const titleRef = useRef(null);
  const previousView = useRef("menu");
  const { user, profile, loading } = useSession();
  const dialog = useRef(null);
  const closeTimer = useRef(null);
  const [closing, setClosing] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const element = dialog.current;
    if (!open) {
      element.close();
      return;
    }
    setClosing(false);
    setMessage("");
    element.showModal();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      clearTimeout(closeTimer.current);
      document.body.style.overflow = previous;
      element.close();
    };
  }, [open]);
  function close() {
    if (closing) return;
    setClosing(true);
    closeTimer.current = setTimeout(onClose, 180);
  }
  async function signOut() {
    setBusy(true);
    setMessage("");
    try {
      resultOf(await requireBackend().auth.signOut());
      close();
    } catch (error) {
      setMessage(backendError(error));
    } finally {
      setBusy(false);
    }
  }
  function navigateInside(path) {
    const target = accountRoute(path);
    if (target)
      onSelect(target.view, target.orderId ? { order: target.orderId } : {});
  }
  function back() {
    if (view === "addresses" && addressView) onSelect("addresses");
    else onSelect(view === "order" ? "orders" : "menu");
  }
  useEffect(() => {
    if (!open) return;
    body.current?.scrollTo({ top: 0 });
    if (view !== "menu") titleRef.current?.focus();
    else if (previousView.current !== "menu")
      body.current
        ?.querySelector(`[data-account-view="${previousView.current}"]`)
        ?.focus();
    previousView.current = view;
  }, [view, addressView, orderId, open]);
  const title =
    view === "addresses" && addressView
      ? addressView === "new"
        ? "Add an address"
        : "Edit address"
      : accountTitles[view] || accountTitles.menu;
  const skeletonVariant =
    view === "menu"
      ? "account-menu"
      : view === "profile"
        ? "profile"
        : view === "order"
          ? "order"
          : ["wishlist", "recently-viewed"].includes(view)
            ? "products"
            : addressView
              ? "address-form"
              : "records";
  const pending = (
    <div className="drawer-view">
      <Skeleton
        variant={skeletonVariant}
        count={4}
        label="Loading account content…"
      />
    </div>
  );
  const name =
    profile?.full_name?.trim() ||
    user?.user_metadata?.full_name?.trim() ||
    "Welcome to Optimax";
  return (
    <dialog
      ref={dialog}
      id="account-drawer"
      className={`account-drawer${closing ? " is-closing" : ""}`}
      aria-labelledby="account-drawer-title"
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <div className="account-drawer-panel">
        <header className="account-drawer-header">
          <div className="drawer-heading-group">
            {view !== "menu" && (
              <button
                className="icon-button drawer-back"
                aria-label={
                  view === "order"
                    ? "Back to orders"
                    : view === "addresses" && addressView
                      ? "Back to addresses"
                      : "Back to account menu"
                }
                onClick={back}
              >
                <ArrowLeft size={20} />
              </button>
            )}
            <div>
              <p className="eyebrow">
                {view === "menu" ? "MADE FOR YOU" : "YOUR OPTIMAX"}
              </p>
              <h2 id="account-drawer-title" ref={titleRef} tabIndex={-1}>
                {title}
                <span>.</span>
              </h2>
            </div>
          </div>
          <button
            className="icon-button"
            aria-label="Close your account"
            onClick={close}
            autoFocus
          >
            <X size={22} />
          </button>
        </header>
        <div className="account-drawer-body" ref={body}>
          <Suspense fallback={pending}>
            {loading ? (
              pending
            ) : view === "menu" ? (
              <>
                <div className="drawer-identity">
                  <Avatar profile={profile} user={user} name={user ? name : ""} size={58} className="drawer-avatar" decorative />
                  <div>
                    <h3>{user ? name : "A smarter everyday starts here."}</h3>
                    <p>
                      {user
                        ? user.email
                        : "Sign in to keep your orders and favourites together."}
                    </p>
                    <span className="drawer-member-label">
                      {user ? "YOUR PERSONAL ACCOUNT" : "WELCOME TO OPTIMAX"}
                    </span>
                  </div>
                </div>
                {!loading && !user && (
                  <div className="drawer-auth">
                    <Link className="button primary" to="/login">
                      Sign in <ArrowUpRight size={16} />
                    </Link>
                    <Link className="text-link" to="/register">
                      Create an account ↗
                    </Link>
                  </div>
                )}
                <nav className="drawer-navigation" aria-label="Your account">
                  {links.map(({ name, description, path, Icon }) => (
                    <button
                      type="button"
                      data-account-view={accountRoute(path)?.view}
                      onClick={() => navigateInside(path)}
                      key={path}
                    >
                      <span className="drawer-link-icon">
                        <Icon size={20} />
                      </span>
                      <span>
                        <strong>{name}</strong>
                        <small>{description}</small>
                      </span>
                      <ChevronRight size={17} />
                    </button>
                  ))}
                </nav>
                {profile?.role === "admin" && (
                  <Link className="drawer-admin-link" to="/admin">
                    <ShieldCheck size={18} />
                    Manage your store <ArrowUpRight size={16} />
                  </Link>
                )}
              </>
            ) : !user && !["wishlist", "recently-viewed"].includes(view) ? (
              <div className="drawer-signin">
                <UserRound size={34} />
                <h3>Make yourself at home.</h3>
                <p>
                  Sign in to manage your{" "}
                  {view === "order" ? "orders" : title.toLowerCase()}.
                </p>
                <Link
                  className="button primary"
                  to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`}
                >
                  Sign in to continue <ArrowUpRight size={16} />
                </Link>
              </div>
            ) : view === "order" ? (
              <OrderDetails
                embedded
                orderId={orderId}
                onNavigate={navigateInside}
              />
            ) : ["wishlist", "recently-viewed"].includes(view) ? (
              <SavedProducts key={view} embedded kind={view} />
            ) : (
              <ProtectedPage
                key={view}
                kind={view}
                embedded
                onNavigate={navigateInside}
                addressView={addressView}
                onAddressViewChange={(value) =>
                  onSelect("addresses", value ? { address: value } : {})
                }
              />
            )}
          </Suspense>
          <p className="drawer-feedback" role="status">
            {message}
          </p>
        </div>
        <div className="account-drawer-footer">
          {view === "menu" && (
            <Link className="drawer-help" to="/contact">
              <span>
                Need a little guidance?<strong>We’re here to help.</strong>
              </span>
              <ArrowUpRight size={19} />
            </Link>
          )}
          {view === "menu" && user && (
            <button
              className="drawer-signout"
              disabled={busy}
              onClick={signOut}
            >
              <LogOut size={18} />
              {busy ? "Please wait…" : "Sign out"}
              <ChevronRight size={16} />
            </button>
          )}
          {view === "menu" ? (
            <p>Thoughtful technology. Your everyday, upgraded.</p>
          ) : (
            <button
              className="text-link drawer-menu-return"
              onClick={() => onSelect("menu")}
            >
              <UserRound size={14} />
              Back to account menu
            </button>
          )}
        </div>
      </div>
    </dialog>
  );
}
