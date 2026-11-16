import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { ROLE_LABELS, ROLE_SHORT, timeAgo } from "@/lib/format";
import { Avatar } from "@/components/shared";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useMutation, useQuery } from "convex/react";
import { motion } from "framer-motion";
import {
  Bell,
  BookOpen,
  Bookmark,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Coffee,
  Compass,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Shield,
  Sparkles,
  Timer,
  UserRound,
  Users,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, Navigate, NavLink, useLocation, useNavigate } from "react-router";
import { toast } from "sonner";

const PORTAL_ROLES = [
  "student",
  "faculty",
  "hod",
  "admin",
  "canteen_staff",
  "event_coordinator",
] as const;
type PortalRole = (typeof PORTAL_ROLES)[number];

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  roles: PortalRole[];
};

type NavGroup = { label: string; items: NavItem[] };

const ALL: PortalRole[] = [...PORTAL_ROLES];
const ACADEMIC: PortalRole[] = ["student", "faculty", "hod", "admin"];

const NAV: NavGroup[] = [
  {
    label: "Workspace",
    items: [
      { label: "Overview", href: "/dashboard", icon: LayoutDashboard, roles: ALL },
      { label: "Academics", href: "/academics", icon: GraduationCap, roles: ACADEMIC },
      { label: "E-Library", href: "/library", icon: BookOpen, roles: ACADEMIC },
      { label: "Study Hub", href: "/study", icon: Sparkles, roles: ACADEMIC },
      { label: "Focus & habits", href: "/productivity", icon: Timer, roles: ACADEMIC },
      { label: "My workspace", href: "/workspace", icon: Bookmark, roles: [...ACADEMIC, "event_coordinator"] },
    ],
  },
  {
    label: "Campus",
    items: [
      { label: "OD & Leave", href: "/requests", icon: ClipboardCheck, roles: ["student"] },
      { label: "Approvals", href: "/review", icon: CheckCircle2, roles: ["faculty", "hod", "admin"] },
      { label: "Canteen", href: "/canteen", icon: UtensilsCrossed, roles: ["student", "canteen_staff", "admin"] },
      { label: "Events", href: "/events", icon: CalendarDays, roles: [...ACADEMIC, "event_coordinator"] },
      { label: "Lost & Found", href: "/lost-found", icon: Search, roles: ACADEMIC },
      { label: "Student Connect", href: "/connect", icon: Users, roles: [...ACADEMIC, "event_coordinator"] },
    ],
  },
  {
    label: "Account",
    items: [
      { label: "Notifications", href: "/notifications", icon: Bell, roles: ALL },
      { label: "Admin console", href: "/admin", icon: Shield, roles: ["admin"] },
      { label: "Profile", href: "/profile", icon: UserRound, roles: ALL },
    ],
  },
];

const ROLE_CHOICES: { role: PortalRole; blurb: string; icon: LucideIcon }[] = [
  { role: "student", blurb: "Academics, study hub, OD & leave, canteen and campus life.", icon: GraduationCap },
  { role: "faculty", blurb: "Class reviews, attendance, assignments and announcements.", icon: BookOpen },
  { role: "hod", blurb: "Department approvals, analytics and oversight.", icon: Users },
  { role: "admin", blurb: "Users, roles, policies, moderation and audit.", icon: Shield },
  { role: "canteen_staff", blurb: "Live order board, tokens and menu availability.", icon: Coffee },
  { role: "event_coordinator", blurb: "Publish events, manage registrations and updates.", icon: CalendarDays },
];

function SidebarNav({
  role,
  queueCount,
  unread,
  onNavigate,
}: {
  role: PortalRole;
  queueCount: number;
  unread: number;
  onNavigate?: () => void;
}) {
  return (
    <nav className="uz-scrollbar flex-1 overflow-y-auto px-3 pb-4">
      {NAV.map((group) => {
        const items = group.items.filter((item) => item.roles.includes(role));
        if (!items.length) return null;
        return (
          <div key={group.label} className="mb-5">
            <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/70">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {items.map((item) => {
                const badge =
                  item.href === "/review" && queueCount > 0
                    ? queueCount
                    : item.href === "/notifications" && unread > 0
                      ? unread
                      : null;
                return (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      cn(
                        "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition",
                        isActive
                          ? "bg-gradient-to-r from-indigo-50 to-violet-50 text-indigo-700 shadow-[inset_0_0_0_1px_rgba(99,102,241,0.16)]"
                          : "text-slate-600 hover:bg-muted/80 hover:text-foreground",
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span
                          className={cn(
                            "flex size-7 items-center justify-center rounded-lg transition",
                            isActive
                              ? "bg-white/80 text-indigo-600 shadow-[0_1px_2px_rgba(16,24,40,0.06)]"
                              : "text-slate-400 group-hover:text-slate-600",
                          )}
                        >
                          <item.icon className="size-[15px]" />
                        </span>
                        <span className="flex-1">{item.label}</span>
                        {badge !== null && (
                          <span className="flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                            {badge}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        );
      })}
    </nav>
  );
}

function RoleOnboarding({ onChoose }: { onChoose: (role: PortalRole) => Promise<void> }) {
  const [busy, setBusy] = useState<PortalRole | null>(null);
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 uz-aurora" />
      <div className="pointer-events-none absolute inset-0 uz-grid-lines opacity-60" />
      <div className="relative mx-auto flex w-full max-w-5xl flex-col items-center px-5 py-12 sm:py-16">
        <Logo size="lg" />
        <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
          Welcome to your campus
        </p>
        <h1 className="mt-2 max-w-2xl text-center font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Choose the portal you want to explore
        </h1>
        <p className="mt-3 max-w-xl text-center text-sm leading-6 text-muted-foreground">
          UniZone is one app with six role-based portals. Pick one to set up your
          demo account — every screen, approval and permission responds to your role.
        </p>
        <div className="mt-8 grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ROLE_CHOICES.map((choice) => (
            <button
              key={choice.role}
              type="button"
              disabled={busy !== null}
              onClick={async () => {
                setBusy(choice.role);
                try {
                  await onChoose(choice.role);
                } finally {
                  setBusy(null);
                }
              }}
              className="uz-card uz-card-hover group flex flex-col items-start gap-3 p-5 text-left disabled:opacity-60"
            >
              <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white">
                <choice.icon className="size-5" />
              </span>
              <span className="font-display text-sm font-semibold">{ROLE_LABELS[choice.role]}</span>
              <span className="text-xs leading-5 text-muted-foreground">{choice.blurb}</span>
              <span className="mt-auto pt-2 text-[11px] font-semibold text-primary">
                {busy === choice.role ? "Setting up…" : "Enter portal →"}
              </span>
            </button>
          ))}
        </div>
        <p className="mt-8 flex items-center gap-2 rounded-full border border-border/70 bg-card/70 px-4 py-2 text-[11px] text-muted-foreground">
          <Compass className="size-3.5 text-primary" />
          Demo environment — you can switch portals later from your account menu.
        </p>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { user, isLoading, isAuthenticated, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const ensureSeed = useMutation(api.seed.ensureSeed);
  const setInitialRole = useMutation(api.profile.setInitialRole);
  const previewRole = useMutation(api.profile.previewRole);
  const markRead = useMutation(api.notifications.markRead);
  const [mobileOpen, setMobileOpen] = useState(false);
  const seeded = useRef<string | null>(null);

  const role = (user?.role ?? null) as PortalRole | null;
  const isStaff = role === "faculty" || role === "hod" || role === "admin";

  const queue = useQuery(api.requests.queue, isStaff ? {} : "skip");
  const unread = useQuery(api.notifications.unreadCount, user ? {} : "skip");
  const notifications = useQuery(api.notifications.list, user && role ? {} : "skip");

  useEffect(() => {
    if (!user || !user.role) return;
    const key = `${user._id}:${user.role}`;
    if (seeded.current === key) return;
    seeded.current = key;
    ensureSeed().catch((error) => {
      console.warn("Seed skipped:", error instanceof Error ? error.message : error);
    });
  }, [ensureSeed, user]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Logo size="md" showWordmark={false} />
          <p className="text-xs text-muted-foreground">Opening UniZone…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Logo size="md" />
      </div>
    );
  }

  if (user.status === "disabled") {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="uz-card max-w-md p-8 text-center">
          <Logo size="md" className="justify-center" />
          <h1 className="mt-6 font-display text-xl font-bold">This account is disabled</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            An administrator has disabled access for this account. Contact the campus
            office if you believe this is a mistake.
          </p>
          <Button className="mt-5 w-full" onClick={() => signOut()}>
            Sign out
          </Button>
        </div>
      </div>
    );
  }

  if (!role) {
    return (
      <RoleOnboarding
        onChoose={async (chosen) => {
          try {
            await setInitialRole({ role: chosen });
            toast.success(`${ROLE_LABELS[chosen]} portal ready`, {
              description: "Seeding your campus data and dashboards.",
            });
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Could not set your portal");
          }
        }}
      />
    );
  }

  const currentSection =
    NAV.flatMap((g) => g.items).find((item) => item.href === location.pathname)?.label ??
    "UniZone";

  const portalItems = ROLE_CHOICES.filter((c) => c.role !== role);

  return (
    <div className="min-h-screen lg:flex">
      <aside className="sticky top-0 hidden h-screen w-[264px] shrink-0 flex-col border-r border-border/70 bg-card/80 backdrop-blur-xl lg:flex">
        <div className="flex h-[72px] items-center px-5">
          <Link to="/dashboard" aria-label="UniZone dashboard">
            <Logo size="md" />
          </Link>
        </div>
        <div className="mx-4 mb-4 flex items-center gap-2 rounded-xl border border-border/70 bg-gradient-to-r from-indigo-50/80 to-violet-50/60 px-3 py-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-white text-indigo-600 shadow-sm">
            <Shield className="size-3.5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-[11px] font-semibold text-indigo-900">
              {ROLE_SHORT[role]}
            </p>
            <p className="truncate text-[10px] text-indigo-700/60">
              {user.department ?? "Campus"} · {user.name ?? "Signed in"}
            </p>
          </div>
        </div>
        <SidebarNav role={role} queueCount={queue?.length ?? 0} unread={unread ?? 0} />
        <div className="border-t border-border/60 p-4">
          <div className="rounded-xl bg-muted/50 p-3">
            <p className="text-[11px] font-semibold text-foreground">Your campus. All in one zone.</p>
            <p className="mt-1 text-[10px] leading-4 text-muted-foreground">
              Vidyanova Institute of Technology · Demo workspace
            </p>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-[64px] items-center gap-3 border-b border-border/70 bg-background/85 px-4 backdrop-blur-xl sm:px-6">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex w-[290px] flex-col p-0">
              <SheetHeader className="flex h-[72px] flex-row items-center px-5">
                <SheetTitle className="sr-only">UniZone navigation</SheetTitle>
                <Logo size="md" />
              </SheetHeader>
              <div className="mx-4 mb-3 rounded-xl bg-muted/60 px-3 py-2 text-[11px] text-muted-foreground">
                {ROLE_SHORT[role]} · {user.name}
              </div>
              <SidebarNav
                role={role}
                queueCount={queue?.length ?? 0}
                unread={unread ?? 0}
                onNavigate={() => setMobileOpen(false)}
              />
            </SheetContent>
          </Sheet>

          <div className="hidden min-w-0 items-center gap-2 text-[12px] text-muted-foreground sm:flex">
            <span className="font-medium text-foreground">UniZone</span>
            <span className="text-border">/</span>
            <span className="truncate">{currentSection}</span>
          </div>

          <div className="ml-auto flex items-center gap-1.5">
            <Link
              to="/study"
              className="hidden items-center gap-2 rounded-full border border-indigo-200/70 bg-indigo-50/70 px-3 py-1.5 text-[11px] font-semibold text-indigo-700 transition hover:bg-indigo-100 md:flex"
            >
              <Sparkles className="size-3.5" />
              Ask Study Hub
            </Link>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
                  <Bell className="size-[18px]" />
                  {(unread ?? 0) > 0 && (
                    <span className="absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                      {unread && unread > 9 ? "9+" : unread}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-[350px] p-0">
                <div className="flex items-center justify-between border-b px-4 py-3">
                  <p className="text-sm font-semibold">Notifications</p>
                  <Link to="/notifications" className="text-[11px] font-medium text-primary">
                    View all
                  </Link>
                </div>
                <div className="max-h-[320px] overflow-y-auto">
                  {(notifications ?? []).slice(0, 5).map((n) => (
                    <button
                      key={n._id}
                      type="button"
                      onClick={() => {
                        if (!n.read) markRead({ notificationId: n._id });
                        navigate(n.link);
                      }}
                      className="flex w-full gap-3 border-b border-border/50 px-4 py-3 text-left transition hover:bg-muted/50"
                    >
                      <span
                        className={cn(
                          "mt-1.5 size-1.5 shrink-0 rounded-full",
                          n.read ? "bg-border" : "bg-primary",
                        )}
                      />
                      <span className="min-w-0">
                        <span className="block truncate text-xs font-semibold">{n.title}</span>
                        <span className="mt-0.5 line-clamp-2 block text-[11px] leading-4 text-muted-foreground">
                          {n.body}
                        </span>
                        <span className="mt-1 block text-[10px] text-muted-foreground/70">
                          {timeAgo(n.createdAt)}
                        </span>
                      </span>
                    </button>
                  ))}
                  {(notifications ?? []).length === 0 && (
                    <p className="px-4 py-8 text-center text-xs text-muted-foreground">
                      You're all caught up.
                    </p>
                  )}
                </div>
              </PopoverContent>
            </Popover>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="ml-1 flex items-center gap-2 rounded-full border border-border/70 bg-card py-1 pl-1 pr-2.5 transition hover:bg-muted/60"
                  aria-label="Account menu"
                >
                  <Avatar name={user.name} className="size-7 text-[10px]" />
                  <span className="hidden max-w-[110px] truncate text-xs font-medium sm:block">
                    {user.name ?? "Account"}
                  </span>
                  <ChevronDown className="size-3.5 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel className="pb-1">
                  <span className="block text-sm font-semibold">{user.name ?? "Campus member"}</span>
                  <span className="block truncate text-[11px] font-normal text-muted-foreground">
                    {user.email ?? ROLE_LABELS[role]}
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/profile")}>
                  <UserRound className="mr-2 size-4" />
                  Profile & account
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/notifications")}>
                  <Bell className="mr-2 size-4" />
                  Notifications
                </DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Compass className="mr-2 size-4" />
                    Preview another portal
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-56">
                    <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Demo role preview
                    </DropdownMenuLabel>
                    {portalItems.map((choice) => (
                      <DropdownMenuItem
                        key={choice.role}
                        onClick={async () => {
                          try {
                            await previewRole({ role: choice.role });
                            navigate("/dashboard");
                            toast.success(`Now viewing the ${ROLE_LABELS[choice.role]} portal`);
                          } catch (error) {
                            toast.error(
                              error instanceof Error ? error.message : "Could not switch portal",
                            );
                          }
                        }}
                      >
                        <choice.icon className="mr-2 size-4" />
                        {ROLE_LABELS[choice.role]}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-rose-600 focus:text-rose-600"
                  onClick={async () => {
                    await signOut();
                    navigate("/");
                  }}
                >
                  <LogOut className="mr-2 size-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24, ease: "easeOut" }}
          className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8"
        >
          {children}
        </motion.main>

        <footer className="border-t border-border/60 px-6 py-4 text-center text-[10px] text-muted-foreground">
          UniZone · Your Campus. All in One Zone. · Demo data, simulated payments.
        </footer>
      </div>
    </div>
  );
}
