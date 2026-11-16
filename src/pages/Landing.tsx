import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import {
  ArrowRight,
  BadgeCheck,
  BellRing,
  BookOpen,
  Bot,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Coffee,
  GraduationCap,
  LayoutDashboard,
  LibraryBig,
  MessageSquareText,
  Search,
  ShieldCheck,
  Sparkles,
  Timer,
  TrendingUp,
  Users,
  UtensilsCrossed,
  Workflow,
} from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router";

const fadeUp = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.5, ease: "easeOut" as const },
};

const MODULES = [
  { icon: LayoutDashboard, title: "Smart dashboard", body: "One role-aware home for classes, deadlines, requests and campus news.", tone: "indigo" },
  { icon: GraduationCap, title: "Academics", body: "Attendance, marks, results, assignments, exams and the academic calendar.", tone: "violet" },
  { icon: LibraryBig, title: "E-Library", body: "Unit-wise notes, papers, videos and restricted faculty material with access control.", tone: "sky" },
  { icon: Sparkles, title: "AI Learning Hub", body: "Grounded doubt solving, study plans and practice tests built from your syllabus.", tone: "violet" },
  { icon: Timer, title: "Focus & habits", body: "Pomodoro with refresh recovery, goals, habits and weekly productivity stats.", tone: "amber" },
  { icon: ClipboardCheck, title: "OD & leave", body: "Policy-driven approvals with a real timeline, return-and-resubmit and permission letters.", tone: "indigo" },
  { icon: UtensilsCrossed, title: "Canteen", body: "Live menu, cart, simulated payment, digital token and a real-time staff order board.", tone: "amber" },
  { icon: CalendarDays, title: "Events", body: "Symposiums, workshops and hackathons with capacity-safe registration and reminders.", tone: "sky" },
  { icon: Search, title: "Lost & found", body: "Private claim verification, staff-only contact details and resolution tracking.", tone: "emerald" },
  { icon: Users, title: "Student Connect", body: "Opt-in profiles, study buddies, hackathon teams and verified opportunities.", tone: "indigo" },
  { icon: BellRing, title: "Notifications", body: "One fan-out for approvals, orders, deadlines, events and claim updates.", tone: "violet" },
  { icon: ShieldCheck, title: "Admin console", body: "Users, roles, policies, moderation, lost & found cases and an audit trail.", tone: "emerald" },
];

const ROLES = [
  { icon: GraduationCap, name: "Students", line: "Everything academic and campus life, in one login." },
  { icon: BookOpen, name: "Faculty", line: "Review queues, attendance, assignments and announcements." },
  { icon: ShieldCheck, name: "HODs", line: "Department approvals, scope-aware reports and oversight." },
  { icon: Workflow, name: "Admins", line: "Roles, policies, moderation, audit and institution setup." },
  { icon: Coffee, name: "Canteen staff", line: "Live tokens, order status and menu availability." },
  { icon: CalendarDays, name: "Event coordinators", line: "Publish events, manage seats and registrations." },
];

const FLOW = [
  { title: "Student submits", body: "Form prefilled from profile, supporting document attached, first reviewer resolved by policy.", icon: ClipboardCheck },
  { title: "Faculty reviews", body: "Approve, reject, return for changes or forward to the HOD — remarks required where policy says so.", icon: BookOpen },
  { title: "HOD decides", body: "Scope-checked approval, audit entry and a notification to the student.", icon: ShieldCheck },
  { title: "Student receives", body: "Timeline, status, approved dates — and a downloadable permission letter for OD.", icon: BadgeCheck },
];

function DashboardPreview() {
  return (
    <div className="relative mx-auto w-full max-w-[540px]">
      <div className="pointer-events-none absolute -right-6 -top-8 size-40 rounded-full bg-gradient-to-br from-violet-400/30 to-cyan-300/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-10 -left-8 size-48 rounded-full bg-gradient-to-br from-indigo-400/25 to-fuchsia-300/20 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut", delay: 0.15 }}
        className="uz-card relative overflow-hidden rounded-[26px] p-5 sm:p-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Good morning, Aditi</p>
            <p className="mt-1 font-display text-lg font-bold tracking-tight">Your campus at a glance</p>
          </div>
          <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white">
            <Sparkles className="size-4" />
          </span>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2.5">
          {[
            { label: "Attendance", value: "91%", hint: "+3% this month" },
            { label: "Focus this week", value: "7h 15m", hint: "12 sessions" },
            { label: "Open tasks", value: "4", hint: "2 due soon" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-border/70 bg-muted/30 p-3">
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
              <p className="mt-1 font-display text-base font-bold">{s.value}</p>
              <p className="text-[9px] text-muted-foreground/80">{s.hint}</p>
            </div>
          ))}
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-xl border border-border/70 p-3.5">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold">Today · Wednesday</p>
              <span className="text-[9px] text-muted-foreground">5 classes</span>
            </div>
            <div className="mt-2.5 space-y-2">
              {[
                { time: "08:45", name: "Database Management", room: "C-201", tone: "bg-indigo-500" },
                { time: "09:45", name: "Operating Systems", room: "C-204", tone: "bg-violet-500" },
                { time: "11:00", name: "DSA", room: "Lab 3", tone: "bg-sky-500" },
              ].map((c) => (
                <div key={c.time} className="flex items-center gap-2.5">
                  <span className={`h-7 w-1 rounded-full ${c.tone}`} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[10px] font-medium">{c.name}</p>
                    <p className="text-[9px] text-muted-foreground">{c.time} · {c.room}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-border/70 p-3.5">
            <p className="text-[11px] font-semibold">Attendance</p>
            <div className="mt-3 flex items-center justify-center">
              <div
                className="flex size-[76px] items-center justify-center rounded-full"
                style={{ background: "conic-gradient(#6366f1 0deg 328deg, #e8eaf3 328deg 360deg)" }}
              >
                <div className="flex size-[60px] flex-col items-center justify-center rounded-full bg-white">
                  <span className="font-display text-lg font-bold leading-none">91%</span>
                  <span className="text-[8px] text-muted-foreground">overall</span>
                </div>
              </div>
            </div>
            <p className="mt-2.5 text-center text-[9px] text-emerald-600">Above the 85% requirement</p>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2.5 rounded-xl border border-indigo-100 bg-indigo-50/60 p-3">
          <span className="flex size-7 items-center justify-center rounded-lg bg-white text-indigo-600 shadow-sm">
            <CheckCircle2 className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold text-indigo-900">OD request approved</p>
            <p className="truncate text-[9px] text-indigo-700/70">Inter-college debate · 04 Nov · permission letter ready</p>
          </div>
          <ArrowRight className="size-3.5 text-indigo-500" />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="uz-float absolute -right-2 top-[38%] hidden w-[190px] rounded-2xl border border-border/80 bg-white/95 p-3 shadow-[0_18px_40px_-18px_rgba(30,27,75,0.35)] backdrop-blur sm:block"
      >
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <UtensilsCrossed className="size-3.5" />
          </span>
          <p className="text-[10px] font-semibold">Token #38 ready</p>
        </div>
        <p className="mt-1.5 text-[9px] leading-4 text-muted-foreground">Veg Biryani + Masala Dosa · collect at counter 2.</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.65, duration: 0.5 }}
        className="uz-float-slow absolute -left-5 bottom-[6%] hidden w-[200px] rounded-2xl border border-border/80 bg-white/95 p-3 shadow-[0_18px_40px_-18px_rgba(30,27,75,0.35)] backdrop-blur sm:block"
      >
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-semibold">Study plan · DBMS</p>
          <span className="rounded-full bg-indigo-50 px-1.5 py-0.5 text-[8px] font-semibold text-indigo-600">AI</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full w-[46%] rounded-full bg-gradient-to-r from-indigo-500 to-violet-500" />
        </div>
        <p className="mt-1.5 text-[9px] text-muted-foreground">5 of 11 topics · exam in 9 days</p>
      </motion.div>
    </div>
  );
}

export default function Landing() {
  const { isAuthenticated } = useAuth();
  const primaryHref = isAuthenticated ? "/dashboard" : "/auth";

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] w-full max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link to="/" aria-label="UniZone home">
            <Logo size="md" />
          </Link>
          <nav className="hidden items-center gap-7 text-[13px] font-medium text-muted-foreground md:flex">
            <a href="#modules" className="transition hover:text-foreground">Modules</a>
            <a href="#workflow" className="transition hover:text-foreground">Approvals</a>
            <a href="#study" className="transition hover:text-foreground">Study Hub</a>
            <a href="#roles" className="transition hover:text-foreground">Roles</a>
          </nav>
          <div className="flex items-center gap-2">
            {!isAuthenticated && (
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link to="/auth">Sign in</Link>
              </Button>
            )}
            <Button asChild size="sm" className="gap-1.5">
              <Link to={primaryHref}>
                {isAuthenticated ? "Open dashboard" : "Get started"}
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 uz-aurora" />
          <div className="pointer-events-none absolute inset-0 uz-grid-lines opacity-70" />
          <div className="relative mx-auto grid w-full max-w-7xl gap-12 px-5 py-14 sm:px-8 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:gap-8 lg:py-24">
            <div>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/70 px-3 py-1.5 text-[11px] font-medium text-primary shadow-sm backdrop-blur"
              >
                <span className="flex size-4 items-center justify-center rounded-full bg-primary/10">
                  <Sparkles className="size-2.5" />
                </span>
                One login · six portals · every campus workflow
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.05 }}
                className="mt-6 font-display text-[2.6rem] font-extrabold leading-[1.04] tracking-[-0.045em] sm:text-[3.4rem] lg:text-[3.75rem]"
              >
                Your campus.
                <br />
                <span className="uz-gradient-text">All in one zone.</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.12 }}
                className="mt-5 max-w-xl text-[15px] leading-7 text-muted-foreground sm:text-base"
              >
                UniZone connects academics, approvals, the library, AI study tools,
                canteen, events and campus life into one coherent product — with the
                right access for every role, from day one.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.2 }}
                className="mt-7 flex flex-wrap items-center gap-3"
              >
                <Button asChild size="lg" className="gap-2 rounded-xl px-6">
                  <Link to={primaryHref}>
                    {isAuthenticated ? "Go to your dashboard" : "Enter UniZone"}
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-xl border-border/80 bg-white/70 px-5">
                  <a href="#modules">Explore the modules</a>
                </Button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.35 }}
                className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] text-muted-foreground"
              >
                <span className="flex items-center gap-1.5"><CheckCircle2 className="size-3.5 text-emerald-500" /> Role-checked on every call</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="size-3.5 text-emerald-500" /> Real-time updates</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="size-3.5 text-emerald-500" /> Audit trail</span>
              </motion.div>
            </div>

            <DashboardPreview />
          </div>

          <div className="relative mx-auto w-full max-w-7xl px-5 pb-12 sm:px-8">
            <div className="grid grid-cols-2 gap-3 rounded-2xl border border-border/70 bg-white/60 p-4 backdrop-blur sm:grid-cols-4 sm:p-5">
              {[
                { value: "12", label: "integrated modules" },
                { value: "6", label: "role-based portals" },
                { value: "1", label: "shared design system" },
                { value: "0", label: "disconnected demos" },
              ].map((s) => (
                <div key={s.label} className="px-2 text-center sm:text-left">
                  <p className="font-display text-2xl font-bold tracking-tight">{s.value}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="modules" className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 lg:py-24">
          <motion.div {...fadeUp} className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">One product, not a pile of demos</p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-[2.1rem]">
              Twelve modules that actually talk to each other
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              A deadline feeds the dashboard and calendar. An OD approval can credit
              attendance. A canteen token updates live for staff and student. The
              same data, the same design language, the same permissions.
            </p>
          </motion.div>
          <div className="mt-9 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {MODULES.map((module, i) => (
              <motion.div
                key={module.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.4, delay: (i % 3) * 0.06 }}
                className="uz-card uz-card-hover group p-5"
              >
                <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-50 to-violet-50 text-indigo-600 ring-1 ring-indigo-100/70">
                  <module.icon className="size-[18px]" />
                </span>
                <h3 className="mt-4 font-display text-[0.95rem] font-semibold">{module.title}</h3>
                <p className="mt-1.5 text-xs leading-5 text-muted-foreground">{module.body}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <section id="workflow" className="border-y border-border/60 bg-white/50">
          <div className="mx-auto grid w-full max-w-7xl gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:py-24">
            <div>
              <motion.div {...fadeUp}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">The hard part, done properly</p>
                <h2 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-[2.1rem]">
                  OD & leave is a policy engine, not two forms
                </h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  Submissions resolve a reviewer from a configurable policy. Every
                  transition is guard-checked, versioned, audited and notified.
                  Students never approve their own request; reviewers never act outside
                  their department.
                </p>
              </motion.div>
              <div className="mt-7 space-y-4">
                {FLOW.map((step, i) => (
                  <motion.div
                    key={step.title}
                    initial={{ opacity: 0, x: -12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.08 }}
                    className="flex gap-3.5"
                  >
                    <div className="flex flex-col items-center">
                      <span className="flex size-9 items-center justify-center rounded-xl border border-indigo-100 bg-white text-indigo-600 shadow-sm">
                        <step.icon className="size-4" />
                      </span>
                      {i < FLOW.length - 1 && <span className="mt-1 h-full w-px bg-gradient-to-b from-indigo-200 to-transparent" />}
                    </div>
                    <div className="pb-1">
                      <p className="text-sm font-semibold">{step.title}</p>
                      <p className="mt-0.5 max-w-md text-xs leading-5 text-muted-foreground">{step.body}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55 }}
              className="uz-card relative overflow-hidden p-0"
            >
              <div className="flex items-center justify-between border-b border-border/60 bg-muted/30 px-5 py-3.5">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-rose-300" />
                  <span className="size-2 rounded-full bg-amber-300" />
                  <span className="size-2 rounded-full bg-emerald-300" />
                </div>
                <span className="text-[10px] font-medium text-muted-foreground">OD-2026-001042 · review details</span>
              </div>
              <div className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-700">With HOD</span>
                    <h3 className="mt-2 font-display text-lg font-semibold">National Hackathon Finals</h3>
                    <p className="mt-1 text-xs text-muted-foreground">Priya Sharma · 22CSE041 · CSE 3A</p>
                  </div>
                  <div className="rounded-xl border border-border/70 bg-muted/30 px-3 py-2 text-right">
                    <p className="text-[10px] text-muted-foreground">Dates</p>
                    <p className="text-xs font-semibold">18–19 Nov 2026</p>
                  </div>
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <div className="rounded-xl border border-border/70 p-3">
                    <p className="text-[10px] text-muted-foreground">Organising institution</p>
                    <p className="mt-0.5 text-xs font-medium">IIT Bombay · Techfest</p>
                  </div>
                  <div className="rounded-xl border border-border/70 p-3">
                    <p className="text-[10px] text-muted-foreground">Supporting document</p>
                    <p className="mt-0.5 text-xs font-medium">techfest-invitation.pdf</p>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-border/70 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Approval timeline</p>
                  <div className="mt-3 space-y-3">
                    {[
                      ["Submitted", "Student · Priya Sharma", "17 Nov, 9:12 AM", true],
                      ["Assigned to class faculty", "Policy · OD default", "17 Nov, 9:12 AM", true],
                      ["Forwarded to HOD", "Dr. Ananya Rao · “Team selection verified.”", "17 Nov, 2:40 PM", true],
                      ["Awaiting HOD decision", "Dr. Ananya Rao", "Due before 18 Nov", false],
                    ].map(([title, who, when, done]) => (
                      <div key={String(title)} className="flex gap-2.5">
                        <span className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full ${done ? "bg-emerald-500 text-white" : "border-2 border-indigo-300 bg-white"}`}>
                          {done ? <CheckCircle2 className="size-3" /> : null}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] font-medium">{title}</p>
                          <p className="truncate text-[10px] text-muted-foreground">{who} · {when}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-lg bg-indigo-600 px-3 py-1.5 text-[11px] font-semibold text-white">Approve</span>
                  <span className="rounded-lg border border-border bg-white px-3 py-1.5 text-[11px] font-medium">Return for changes</span>
                  <span className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-[11px] font-medium text-rose-600">Reject</span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section id="study" className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 lg:py-24">
          <div className="relative overflow-hidden rounded-[28px] bg-[#101433] px-6 py-10 text-white sm:px-10 lg:px-14 lg:py-14">
            <div className="pointer-events-none absolute -right-24 -top-24 size-80 rounded-full bg-violet-600/30 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-32 -left-16 size-80 rounded-full bg-cyan-500/20 blur-3xl" />
            <div className="relative grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-indigo-200">
                  <Bot className="size-3.5" /> AI Learning Hub
                </span>
                <h2 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-[2.2rem]">
                  Answers that know your syllabus.
                </h2>
                <p className="mt-3 max-w-lg text-sm leading-6 text-indigo-100/70">
                  The Study Hub retrieves from authorised E-Library material and your
                  own notes, labels every grounded answer with real page citations,
                  and clearly says when it is giving a general explanation instead.
                </p>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {[
                    ["Planner", "Draft plan → review topics → confirm"],
                    ["Doubt solver", "Grounded answers + citations"],
                    ["Practice", "MCQ sets, scoring, weak topics"],
                    ["Summaries", "Revision notes with async processing"],
                  ].map(([title, body]) => (
                    <div key={title} className="rounded-xl border border-white/10 bg-white/[0.04] p-3.5">
                      <p className="text-xs font-semibold">{title}</p>
                      <p className="mt-0.5 text-[11px] leading-5 text-indigo-200/60">{body}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur">
                <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                  <span className="flex size-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-indigo-500">
                    <MessageSquareText className="size-3.5" />
                  </span>
                  <p className="text-xs font-semibold">Doubt solver · Database Management Systems</p>
                  <span className="ml-auto rounded-full bg-emerald-400/15 px-2 py-0.5 text-[9px] font-semibold text-emerald-300">
                    Grounded in your materials
                  </span>
                </div>
                <div className="mt-3 rounded-xl bg-white/[0.05] p-3">
                  <p className="text-[11px] leading-5 text-indigo-100/80">
                    Why does 3NF remove transitive dependencies but 2NF does not?
                  </p>
                </div>
                <div className="mt-2 rounded-xl bg-white/[0.09] p-3">
                  <p className="text-[11px] leading-5 text-indigo-50/90">
                    <span className="font-semibold text-white">Short answer.</span>{" "}
                    2NF removes partial dependencies on a composite key. 3NF goes further:
                    every non-key attribute must depend only on a candidate key, never
                    through another non-key attribute.
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {["DBMS — Complete Unit Notes · p. 29", "Unit 3 · Normalisation"].map((c) => (
                      <span key={c} className="flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[9px] text-indigo-200/70">
                        <BookOpen className="size-2.5" /> {c}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
                  <span className="text-[10px] text-indigo-200/40">Ask a follow-up…</span>
                  <span className="ml-auto flex size-6 items-center justify-center rounded-lg bg-indigo-500">
                    <ArrowRight className="size-3" />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="roles" className="mx-auto w-full max-w-7xl px-5 pb-16 sm:px-8 lg:pb-24">
          <motion.div {...fadeUp} className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Built for everyone on campus</p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-[2.1rem]">
              Six portals. One shared product.
            </h2>
          </motion.div>
          <div className="mt-8 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {ROLES.map((role, i) => (
              <motion.div
                key={role.name}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: (i % 3) * 0.05 }}
                className="uz-card uz-card-hover flex items-start gap-3.5 p-5"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-indigo-600">
                  <role.icon className="size-[18px]" />
                </span>
                <div>
                  <h3 className="font-display text-sm font-semibold">{role.name}</h3>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{role.line}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-5 pb-16 sm:px-8 lg:pb-24">
          <div className="relative overflow-hidden rounded-[28px] border border-indigo-100 bg-gradient-to-br from-indigo-50 via-violet-50/60 to-cyan-50/50 px-6 py-12 text-center sm:px-12">
            <div className="pointer-events-none absolute inset-0 uz-grid-lines opacity-40" />
            <div className="relative mx-auto max-w-2xl">
              <Logo size="lg" className="justify-center" />
              <h2 className="mt-6 font-display text-3xl font-bold tracking-tight sm:text-[2.2rem]">
                Start where your campus already is.
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Sign in, pick a portal and explore a fully seeded campus. Approvals,
                tokens and study plans are live — no setup wizard, no empty screens.
              </p>
              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <Button asChild size="lg" className="gap-2 rounded-xl px-6">
                  <Link to={primaryHref}>
                    {isAuthenticated ? "Open dashboard" : "Enter UniZone"}
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-xl bg-white/70">
                  <Link to="/auth">See the sign-in flow</Link>
                </Button>
              </div>
              <p className="mt-5 text-[10px] text-muted-foreground">
                Demo institution data · Simulated payments · Role-based demo portals
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/70 bg-white/60">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-5 py-7 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div className="flex items-center gap-3">
            <Logo size="sm" />
            <span className="text-[11px] text-muted-foreground">Your Campus. All in One Zone.</span>
          </div>
          <div className="flex flex-wrap items-center gap-5 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1.5"><TrendingUp className="size-3.5" /> Built for modern campuses</span>
            <span className="flex items-center gap-1.5"><Clock3 className="size-3.5" /> Real-time by default</span>
            <span>© {new Date().getFullYear()} UniZone</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
