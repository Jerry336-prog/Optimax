import { PageSkeleton } from "./components/ui/Skeleton";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useLocation,
} from "react-router-dom";
import { useEffect, lazy, Suspense } from "react";
import Layout from "./components/layout/Layout";
import Home from "./pages/storefront/Home";
import RequireAuth from "./components/ui/RequireAuth";
import BackendSession from "./app/BackendSession";
import CartSync from "./app/CartSync";
import SavedSync from "./app/SavedSync";
import StoreSettings from "./app/StoreSettings";
import NotificationBridge from "./app/NotificationBridge";
import ErrorBoundary from "./app/ErrorBoundary";
const PaymentReturn = lazy(() => import("./pages/storefront/PaymentReturn"));
const Shop = lazy(() => import("./pages/storefront/Shop"));
const Product = lazy(() => import("./pages/storefront/Product"));
const Cart = lazy(() => import("./pages/storefront/Cart"));
const Checkout = lazy(() => import("./pages/storefront/Checkout"));
const Compare = lazy(() => import("./pages/storefront/Compare"));
const Tracking = lazy(() => import("./pages/storefront/Tracking"));
const Info = lazy(() => import("./pages/storefront/Info"));
const Auth = lazy(() => import("./pages/auth/Auth"));
const Admin = lazy(() => import("./pages/admin/Admin"));
const About = lazy(() => import("./pages/storefront/About"));
const Contact = lazy(() => import("./pages/storefront/Contact"));
function ScrollReset() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}
export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <BackendSession />
        <StoreSettings />
        <CartSync />
        <SavedSync />
        <ScrollReset />
        <NotificationBridge />
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="shop" element={<Shop />} />
            <Route path="search" element={<Shop />} />
            <Route path="product/:id" element={<Product />} />
            <Route path="compare" element={<Compare />} />
            <Route path="cart" element={<Cart />} />
            <Route
              path="checkout"
              element={
                <RequireAuth>
                  <Checkout />
                </RequireAuth>
              }
            />
            <Route
              path="payment/return"
              element={
                <RequireAuth>
                  <PaymentReturn />
                </RequireAuth>
              }
            />
            <Route
              path="tracking"
              element={
                <RequireAuth>
                  <Tracking />
                </RequireAuth>
              }
            />
            <Route path="account" element={<Home />} />
            {["login", "register", "forgot-password", "reset-password"].map(
              (path) => (
                <Route key={path} path={path} element={<Auth />} />
              ),
            )}
            {["wishlist", "recently-viewed"].map((path) => (
              <Route key={path} path={path} element={<Home />} />
            ))}
            {["orders", "addresses", "profile", "notifications"].map((kind) => (
              <Route key={kind} path={`account/${kind}`} element={<Home />} />
            ))}
            <Route path="account/orders/:id" element={<Home />} />
            <Route
              path="admin"
              element={
                <RequireAuth admin>
                  <Suspense fallback={<PageSkeleton variant="admin" />}>
                    <Admin />
                  </Suspense>
                </RequireAuth>
              }
            />
            <Route path="about" element={<About />} />
            <Route path="contact" element={<Contact />} />
            {["categories", "privacy"].map((kind) => (
              <Route key={kind} path={kind} element={<Info kind={kind} />} />
            ))}
            <Route
              path="*"
              element={
                <section className="container page empty-state">
                  <h1>Page not found.</h1>
                  <Link className="button primary" to="/">
                    Back home
                  </Link>
                </section>
              }
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
