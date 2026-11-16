import '@vly-ai/integrations';
import { Toaster } from "@/components/ui/sonner";
import { RequireAuth } from "@/components/RequireAuth";
import { AppShell } from "@/components/AppShell";
import { VlyToolbar } from "../vly-toolbar-readonly.tsx";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import React, { StrictMode, useEffect, lazy, Suspense, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes, useLocation } from "react-router";
import "./index.css";

const Landing = lazy(() => import("./pages/Landing.tsx"));
const AuthPage = lazy(() => import("./pages/Auth.tsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.tsx"));
const Academics = lazy(() => import("./pages/Academics.tsx"));
const Library = lazy(() => import("./pages/Library.tsx"));
const StudyHub = lazy(() => import("./pages/StudyHub.tsx"));
const Productivity = lazy(() => import("./pages/Productivity.tsx"));
const Workspace = lazy(() => import("./pages/Workspace.tsx"));
const Requests = lazy(() => import("./pages/Requests.tsx"));
const RequestDetail = lazy(() => import("./pages/RequestDetail.tsx"));
const Review = lazy(() => import("./pages/Review.tsx"));
const Canteen = lazy(() => import("./pages/Canteen.tsx"));
const Events = lazy(() => import("./pages/Events.tsx"));
const LostFound = lazy(() => import("./pages/LostFound.tsx"));
const Connect = lazy(() => import("./pages/Connect.tsx"));
const Admin = lazy(() => import("./pages/Admin.tsx"));
const Notifications = lazy(() => import("./pages/Notifications.tsx"));
const Profile = lazy(() => import("./pages/Profile.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));

function RouteLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-muted-foreground">Loading...</div>
    </div>
  );
}

/** Silent error boundary — if VlyToolbar crashes it renders nothing instead of
 *  crashing the whole app (e.g. hook errors in the browser runtime). */
class ToolbarErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(err: Error) {
    console.warn("[VlyToolbar] Caught error, toolbar disabled:", err.message);
  }
  render() {
    return this.state.hasError ? null : this.props.children;
  }
}

/** Hard guard so runtime errors never leave the preview as a blank page. */
class RootErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; message: string; stack: string }
> {
  state = { hasError: false, message: "", stack: "" };
  static getDerivedStateFromError(error: Error) {
    return {
      hasError: true,
      message: error.message || "Unknown runtime error",
      stack: error.stack || "",
    };
  }
  componentDidCatch(err: Error) {
    console.error("[Preview] Root crash:", err);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-6">
          <div className="max-w-lg text-center">
            <p className="text-sm font-semibold">Preview runtime error</p>
            <p className="mt-2 text-xs text-muted-foreground break-words">
              {this.state.message}
            </p>
            {this.state.stack && (
              <pre className="mt-3 text-left text-[10px] leading-4 text-muted-foreground/80 max-h-40 overflow-auto rounded border border-border/60 p-2">
                {this.state.stack}
              </pre>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

function RouteSyncer() {
  const location = useLocation();
  useEffect(() => {
    window.parent.postMessage(
      { type: "iframe-route-change", path: location.pathname },
      "*",
    );
  }, [location.pathname]);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data?.type === "navigate") {
        if (event.data.direction === "back") window.history.back();
        if (event.data.direction === "forward") window.history.forward();
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return null;
}

function Protected({ children }: { children: ReactNode }) {
  return (
    <RequireAuth redirectImmediately>
      <AppShell>{children}</AppShell>
    </RequireAuth>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RootErrorBoundary>
      <ToolbarErrorBoundary>
        <VlyToolbar />
      </ToolbarErrorBoundary>
      <ConvexAuthProvider client={convex}>
        <BrowserRouter>
          <RouteSyncer />
          <Suspense fallback={<RouteLoading />}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/auth" element={<AuthPage redirectAfterAuth="/dashboard" />} />
              <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
              <Route path="/academics" element={<Protected><Academics /></Protected>} />
              <Route path="/library" element={<Protected><Library /></Protected>} />
              <Route path="/study" element={<Protected><StudyHub /></Protected>} />
              <Route path="/productivity" element={<Protected><Productivity /></Protected>} />
              <Route path="/workspace" element={<Protected><Workspace /></Protected>} />
              <Route path="/requests" element={<Protected><Requests /></Protected>} />
              <Route path="/requests/:id" element={<Protected><RequestDetail /></Protected>} />
              <Route path="/review" element={<Protected><Review /></Protected>} />
              <Route path="/canteen" element={<Protected><Canteen /></Protected>} />
              <Route path="/events" element={<Protected><Events /></Protected>} />
              <Route path="/lost-found" element={<Protected><LostFound /></Protected>} />
              <Route path="/connect" element={<Protected><Connect /></Protected>} />
              <Route path="/admin" element={<Protected><Admin /></Protected>} />
              <Route path="/notifications" element={<Protected><Notifications /></Protected>} />
              <Route path="/profile" element={<Protected><Profile /></Protected>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
        <Toaster />
      </ConvexAuthProvider>
    </RootErrorBoundary>
  </StrictMode>,
);
