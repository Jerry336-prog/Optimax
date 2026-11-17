import { pageLoadingVariant } from "./lib/loading";
import ErrorBoundary from "./app/ErrorBoundary";
import { StrictMode, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import "./styles/globals.css";
import { PageSkeleton } from "./components/ui/Skeleton";
const App = lazy(() => import("./App.jsx"));

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ErrorBoundary>
      <Suspense
        fallback={
          <PageSkeleton shell variant={pageLoadingVariant(location.pathname)} />
        }
      >
        <App />
      </Suspense>
    </ErrorBoundary>
  </StrictMode>,
);
