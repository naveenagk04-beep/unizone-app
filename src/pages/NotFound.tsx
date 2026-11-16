import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Compass } from "lucide-react";
import { Link } from "react-router";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-5">
      <div className="pointer-events-none absolute inset-0 uz-aurora" />
      <div className="pointer-events-none absolute inset-0 uz-grid-lines opacity-50" />
      <div className="relative flex flex-col items-center text-center">
        <Logo size="lg" />
        <span className="mt-8 flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Compass className="size-6" />
        </span>
        <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
          404 · off campus
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">
          This page isn't on the map
        </h1>
        <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
          The link may be outdated. Head back to your dashboard or the UniZone home
          page to find your way.
        </p>
        <div className="mt-6 flex gap-2">
          <Button asChild className="gap-2 rounded-xl">
            <Link to="/dashboard">
              <ArrowLeft className="size-4" /> Dashboard
            </Link>
          </Button>
          <Button asChild variant="outline" className="rounded-xl bg-white/70">
            <Link to="/">Home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
