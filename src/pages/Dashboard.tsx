import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { PageWrap, Panel, Stat, StatusBadge, EmptyState, ProgressBar, Chip } from "@/components/shared";
import { Button } from "@/components/ui/button";
import {
  ROLE_LABELS,
  dayName,
  fmtDate,
  fmtShortDate,
  fmtTime,
  inr,
  isGreetingHour,
  timeAgo,
} from "@/lib/format";
import { useQuery } from "convex/react";
import {
  ArrowRight,
  Bell,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Coffee,
  FileText,
  GraduationCap,
  Loader2,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  Timer,
  TrendingUp,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import { Link } from "react-router";
import type { ReactNode } from "react";

const ACADEMIC_ROLES = ["student", "faculty", "hod", "admin"];

function Welcome({
  name,
  role,
  department,
  children,
}: {
  name: string;
  role: string;
  department?: string;
  children?: ReactNode;
}) {
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return (
    <div className="relative overflow-hidden rounded-2xl border border-indigo-100/80 bg-gradient-to-br from-indigo-50/90 via-white to-violet-50/60 p-6 sm:p-7">
      <div className="pointer-events-none absolute -right-10 -top-14 size-56 rounded-full bg-violet-300/20 blur-3xl" />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200/70 bg-white/80 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-indigo-700">
              <ShieldCheck className="size-3" />
              {ROLE_LABELS[role] ?? role} portal
            </span>
            <span className="text-[11px] text-muted-foreground">{today}</span>
          </div>
          <h1 className="mt-3 font-display text-2xl font-bold tracking-tight sm:text-[1.9rem]">
            {isGreetingHour()}, {name.split(" ")[0]}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {department ? `${department} · ` : ""}Here is what needs your attention today.
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}

function QuickAction({
  to,
  icon: Icon,
  label,
  desc,
}: {
  to: string;
  icon: typeof BookOpen;
  label: string;
  desc: string;
}) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-3 rounded-xl border border-border/70 bg-card p-3.5 transition hover:border-primary/30 hover:bg-muted/30"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-indigo-600 transition group-hover:bg-primary group-hover:text-white">
        <Icon className="size-4" />
      </span>
      <span className="min-w-0">
        <span className="block text-xs font-semibold">{label}</span>
        <span className="block truncate text-[10px] text-muted-foreground">{desc}</span>
      </span>
      <ArrowRight className="ml-auto size-3.5 shrink-0 text-muted-foreground/50 transition group-hover:text-primary" />
    </Link>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const role = user?.role ?? "student";
  const isAcademic = ACADEMIC_ROLES.includes(role);
  const isStaff = role === "faculty" || role === "hod" || role === "admin";
  const isStudent = role === "student";

  const academics = useQuery(api.academics.overview, isAcademic ? {} : "skip");
  const requests = useQuery(api.requests.mine, isStudent ? {} : "skip");
  const queue = useQuery(api.requests.queue, isStaff ? {} : "skip");
  const events = useQuery(api.events.list, {});
  const productivity = useQuery(api.productivity.overview, {});
  const notifications = useQuery(api.notifications.list, {});
  const admin = useQuery(api.admin.overview, role === "admin" ? {} : "skip");
  const plans = useQuery(api.study.plans, isAcademic ? {} : "skip");
  const board = useQuery(api.canteen.board, role === "canteen_staff" ? {} : "skip");
  const myOrders = useQuery(api.canteen.myOrders, isStudent ? {} : "skip");

  const today = new Date().getDay();
  const todaySlots = (academics?.timetable ?? [])
    .filter((s) => s.day === today)
    .sort((a, b) => a.start.localeCompare(b.start));
  const nowHHMM = new Date().toTimeString().slice(0, 5);
  const nextClass = todaySlots.find((s) => s.start >= nowHHMM) ?? todaySlots[0];
  const submittedIds = new Set((academics?.submissions ?? []).map((s) => s.assignmentId));
  const deadlines = (academics?.assignments ?? [])
    .filter((a) => a.dueAt > Date.now() - 86_400_000)
    .slice(0, 4);
  const upcomingEvents = (events ?? []).filter((e) => e.startAt > Date.now()).slice(0, 3);
  const latestRequests = (requests ?? []).slice(0, 3);
  const pendingRequests = (requests ?? []).filter((r) =>
    ["under_faculty_review", "forwarded_to_hod", "submitted", "returned"].includes(r.status),
  );
  const activePlan = (plans ?? []).find((p) => p.status === "active");
  const planDone = activePlan ? activePlan.topics.filter((t) => t.done).length : 0;
  const openTasks = (productivity?.tasks ?? []).filter((t) => !t.done);
  const unread = (notifications ?? []).filter((n) => !n.read).length;

  return (
    <PageWrap>
      <Welcome
        name={user?.name ?? "Campus member"}
        role={role}
        department={user?.department}
      >
        <div className="flex flex-wrap gap-2">
          {isStudent && (
            <Button asChild size="sm" className="gap-1.5 rounded-xl">
              <Link to="/requests">
                <ClipboardCheck className="size-3.5" /> Apply OD / leave
              </Link>
            </Button>
          )}
          {isStaff && (
            <Button asChild size="sm" className="gap-1.5 rounded-xl">
              <Link to="/review">
                <CheckCircle2 className="size-3.5" /> Review queue
              </Link>
            </Button>
          )}
          {role === "canteen_staff" && (
            <Button asChild size="sm" className="gap-1.5 rounded-xl">
              <Link to="/canteen">
                <Coffee className="size-3.5" /> Open order board
              </Link>
            </Button>
          )}
          {role === "event_coordinator" && (
            <Button asChild size="sm" className="gap-1.5 rounded-xl">
              <Link to="/events">
                <CalendarDays className="size-3.5" /> Manage events
              </Link>
            </Button>
          )}
          {role === "admin" && (
            <Button asChild size="sm" className="gap-1.5 rounded-xl">
              <Link to="/admin">
                <ShieldCheck className="size-3.5" /> Admin console
              </Link>
            </Button>
          )}
        </div>
      </Welcome>

      {isAcademic && (
        <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
          <Stat
            label="Overall attendance"
            value={`${academics?.attendancePercent ?? 0}%`}
            hint="Across your enrolled subjects"
            icon={TrendingUp}
            tone="emerald"
          />
          {isStudent ? (
            <Stat
              label="Open requests"
              value={pendingRequests.length}
              hint={`${requests?.length ?? 0} total OD/leave requests`}
              icon={ClipboardCheck}
              tone="indigo"
            />
          ) : (
            <Stat
              label="Awaiting your review"
              value={queue?.length ?? 0}
              hint="Assigned to your role and department"
              icon={CheckCircle2}
              tone="indigo"
            />
          )}
          <Stat
            label="Focus this week"
            value={`${Math.floor((productivity?.stats.focusThisWeek ?? 0) / 60)}h ${(productivity?.stats.focusThisWeek ?? 0) % 60}m`}
            hint={`${productivity?.stats.sessionsThisWeek ?? 0} sessions logged`}
            icon={Timer}
            tone="violet"
          />
          <Stat
            label="Unread notifications"
            value={unread}
            hint="Across approvals, events and campus"
            icon={Bell}
            tone="amber"
          />
        </div>
      )}

      {role === "canteen_staff" && (
        <div className="grid gap-3.5 sm:grid-cols-3">
          <Stat label="Active orders" value={board?.length ?? 0} hint="Placed, preparing or ready" icon={UtensilsCrossed} tone="indigo" />
          <Stat label="Ready for pickup" value={(board ?? []).filter((o) => o.status === "ready").length} hint="Waiting at the counter" icon={CheckCircle2} tone="emerald" />
          <Stat label="Unread notifications" value={unread} hint="New orders and updates" icon={Bell} tone="amber" />
        </div>
      )}

      {role === "event_coordinator" && (
        <div className="grid gap-3.5 sm:grid-cols-3">
          <Stat label="Live events" value={(events ?? []).filter((e) => e.registrationOpen).length} hint="Registration open" icon={CalendarDays} tone="indigo" />
          <Stat
            label="Registrations"
            value={(events ?? []).reduce((sum, e) => sum + e.registrationCount, 0)}
            hint="Across all your events"
            icon={Users}
            tone="violet"
          />
          <Stat label="Unread notifications" value={unread} hint="Coordinator updates" icon={Bell} tone="amber" />
        </div>
      )}

      {role === "admin" && (
        <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
          <Stat label="Students" value={admin?.stats.students ?? 0} hint="Active campus accounts" icon={GraduationCap} tone="indigo" />
          <Stat label="Faculty & HODs" value={admin?.stats.faculty ?? 0} hint="Reviewers and staff" icon={Users} tone="violet" />
          <Stat label="Pending approvals" value={admin?.stats.pendingRequests ?? 0} hint="Across all departments" icon={ClipboardCheck} tone="amber" />
          <Stat label="Open reports" value={admin?.stats.openReports ?? 0} hint="Moderation queue" icon={ShieldCheck} tone="sky" />
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[1.65fr_1fr]">
        <div className="flex flex-col gap-5">
          {isStudent && (
            <Panel
              title="Upcoming deadlines"
              description="Assignments across your enrolled subjects."
              action={
                <Button asChild size="sm" variant="ghost" className="gap-1 text-[11px]">
                  <Link to="/academics">All academics <ArrowRight className="size-3" /></Link>
                </Button>
              }
            >
              {academics === undefined ? (
                <LoadingRow />
              ) : deadlines.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title="No deadlines in the next few days"
                  description="New assignments from your faculty will appear here automatically."
                />
              ) : (
                <div className="space-y-2.5">
                  {deadlines.map((a) => {
                    const submitted = submittedIds.has(a._id);
                    const daysLeft = Math.ceil((a.dueAt - Date.now()) / 86_400_000);
                    return (
                      <div
                        key={a._id}
                        className="flex items-center gap-3 rounded-xl border border-border/70 p-3.5 transition hover:bg-muted/30"
                      >
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                          <FileText className="size-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-semibold">{a.title}</p>
                          <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                            {a.subject} · {a.points} pts · due {fmtShortDate(a.dueAt)}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          {submitted ? (
                            <StatusBadge status="submitted" label="Submitted" />
                          ) : (
                            <span
                              className={`text-[10px] font-semibold ${daysLeft <= 2 ? "text-rose-600" : "text-muted-foreground"}`}
                            >
                              {daysLeft <= 0 ? "Due today" : `${daysLeft} days left`}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Panel>
          )}

          {isStaff && (
            <Panel
              title="Your approval queue"
              description="Requests waiting on your role in your department."
              action={
                <Button asChild size="sm" variant="ghost" className="gap-1 text-[11px]">
                  <Link to="/review">Open queue <ArrowRight className="size-3" /></Link>
                </Button>
              }
            >
              {queue === undefined ? (
                <LoadingRow />
              ) : queue.length === 0 ? (
                <EmptyState
                  icon={CheckCircle2}
                  title="Queue is clear"
                  description="New student requests assigned to you will appear here and in your notifications."
                />
              ) : (
                <div className="space-y-2.5">
                  {queue.slice(0, 4).map((r) => (
                    <Link
                      key={r._id}
                      to={`/requests/${r._id}`}
                      className="flex items-center gap-3 rounded-xl border border-border/70 p-3.5 transition hover:border-primary/25 hover:bg-muted/30"
                    >
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                        <ClipboardCheck className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold">{r.title}</p>
                        <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                          {r.userName} · {r.registerNumber} · {fmtShortDate(r.startDate)}–{fmtShortDate(r.endDate)}
                        </p>
                      </div>
                      <StatusBadge status={r.status} />
                    </Link>
                  ))}
                </div>
              )}
            </Panel>
          )}

          {role === "canteen_staff" && (
            <Panel
              title="Live order board"
              description="Tokens update in real time as you move orders along."
              action={
                <Button asChild size="sm" variant="ghost" className="gap-1 text-[11px]">
                  <Link to="/canteen">Manage board <ArrowRight className="size-3" /></Link>
                </Button>
              }
            >
              {(board ?? []).length === 0 ? (
                <EmptyState icon={Coffee} title="No active orders" description="New student orders will appear here instantly." />
              ) : (
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {(board ?? []).slice(0, 4).map((o) => (
                    <div key={o._id} className="rounded-xl border border-border/70 p-3.5">
                      <div className="flex items-center justify-between">
                        <span className="font-display text-lg font-bold">#{o.tokenNo}</span>
                        <StatusBadge status={o.status} />
                      </div>
                      <p className="mt-1 truncate text-[11px] text-muted-foreground">
                        {o.userName} · {o.items.map((i) => `${i.qty}× ${i.name}`).join(", ")}
                      </p>
                      <p className="mt-1 text-xs font-semibold">{inr(o.amount)}</p>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          )}

          {role === "event_coordinator" && (
            <Panel
              title="Your events"
              description="Seats, registrations and registration state."
              action={
                <Button asChild size="sm" variant="ghost" className="gap-1 text-[11px]">
                  <Link to="/events">Manage <ArrowRight className="size-3" /></Link>
                </Button>
              }
            >
              {upcomingEvents.length === 0 ? (
                <EmptyState icon={CalendarDays} title="No upcoming events" description="Publish your next symposium, workshop or hackathon." />
              ) : (
                <div className="space-y-2.5">
                  {upcomingEvents.map((e) => (
                    <div key={e._id} className="flex items-center gap-3 rounded-xl border border-border/70 p-3.5">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                        <CalendarDays className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold">{e.title}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {fmtDate(e.startAt)} · {e.registrationCount}/{e.capacity} registered
                        </p>
                      </div>
                      <Chip>{e.type}</Chip>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          )}

          {role === "admin" && (
            <>
              <Panel
                title="Recent official actions"
                description="Every privileged change writes an audit entry."
                action={
                  <Button asChild size="sm" variant="ghost" className="gap-1 text-[11px]">
                    <Link to="/admin">Full audit log <ArrowRight className="size-3" /></Link>
                  </Button>
                }
              >
                <div className="space-y-3">
                  {(admin?.auditLogs ?? []).slice(0, 5).map((log) => (
                    <div key={log._id} className="flex items-start gap-3">
                      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                        <ShieldCheck className="size-3.5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs">{log.action}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {log.actorName} · {log.actorRole} · {timeAgo(log.at)}
                        </p>
                      </div>
                    </div>
                  ))}
                  {(admin?.auditLogs ?? []).length === 0 && (
                    <p className="py-6 text-center text-xs text-muted-foreground">No audit entries yet.</p>
                  )}
                </div>
              </Panel>

              <Panel title="Campus services snapshot" description="Orders, revenue and moderation.">
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    { label: "Orders today", value: admin?.stats.ordersToday ?? 0 },
                    { label: "Canteen revenue", value: inr(admin?.stats.revenue ?? 0) },
                    { label: "Pending claims", value: admin?.pendingClaims.length ?? 0 },
                  ].map((item) => (
                    <div key={item.label} className="rounded-xl border border-border/70 p-3">
                      <p className="text-[10px] text-muted-foreground">{item.label}</p>
                      <p className="mt-1 font-display text-base font-bold">{item.value}</p>
                    </div>
                  ))}
                </div>
              </Panel>
            </>
          )}

          <Panel
            title={isStaff ? "Today's classes" : "Today's timetable"}
            description={
              todaySlots.length
                ? `${dayName(today)} · ${todaySlots.length} sessions`
                : "No scheduled classes today."
            }
            action={
              <Button asChild size="sm" variant="ghost" className="gap-1 text-[11px]">
                <Link to="/academics">Timetable <ArrowRight className="size-3" /></Link>
              </Button>
            }
          >
            {academics === undefined ? (
              <LoadingRow />
            ) : todaySlots.length === 0 ? (
              <EmptyState
                icon={CalendarDays}
                title="A free day"
                description="Use the time for revision or catch up on your workspace. Your full timetable is under Academics."
              />
            ) : (
              <div className="space-y-2">
                {todaySlots.map((slot) => {
                  const isNext = slot._id === nextClass?._id;
                  return (
                    <div
                      key={slot._id}
                      className={`flex items-center gap-3 rounded-xl border p-3 ${isNext ? "border-indigo-200 bg-indigo-50/50" : "border-border/70"}`}
                    >
                      <div className="w-[74px] shrink-0">
                        <p className="text-[11px] font-semibold">{fmtTime(slot.start)}</p>
                        <p className="text-[10px] text-muted-foreground">{fmtTime(slot.end)}</p>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold">{slot.subject}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {slot.room} · {slot.faculty}
                        </p>
                      </div>
                      {isNext && (
                        <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-[9px] font-semibold text-white">
                          Next
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Panel>

          {isStudent && (
            <Panel
              title="Your OD & leave"
              description="Status of your latest requests and the next action."
              action={
                <Button asChild size="sm" variant="ghost" className="gap-1 text-[11px]">
                  <Link to="/requests">All requests <ArrowRight className="size-3" /></Link>
                </Button>
              }
            >
              {requests === undefined ? (
                <LoadingRow />
              ) : latestRequests.length === 0 ? (
                <EmptyState
                  icon={ClipboardCheck}
                  title="No requests yet"
                  description="Apply for OD or leave with a supporting document. Your class advisor is assigned automatically by policy."
                  action={
                    <Button asChild size="sm" className="rounded-lg">
                      <Link to="/requests">Apply now</Link>
                    </Button>
                  }
                />
              ) : (
                <div className="space-y-2.5">
                  {latestRequests.map((r) => (
                    <Link
                      key={r._id}
                      to={`/requests/${r._id}`}
                      className="flex items-center gap-3 rounded-xl border border-border/70 p-3.5 transition hover:bg-muted/30"
                    >
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                        <ClipboardCheck className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold">{r.title}</p>
                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                          {r.refNo} · {fmtShortDate(r.startDate)}–{fmtShortDate(r.endDate)}
                        </p>
                      </div>
                      <StatusBadge status={r.status} />
                    </Link>
                  ))}
                </div>
              )}
            </Panel>
          )}

          <Panel
            title="Campus events"
            description="Registrations are separate from OD approval."
            action={
              <Button asChild size="sm" variant="ghost" className="gap-1 text-[11px]">
                <Link to="/events">All events <ArrowRight className="size-3" /></Link>
              </Button>
            }
          >
            {events === undefined ? (
              <LoadingRow />
            ) : upcomingEvents.length === 0 ? (
              <EmptyState icon={CalendarDays} title="No upcoming events" description="Campus events will appear here once published." />
            ) : (
              <div className="grid gap-3 sm:grid-cols-3">
                {upcomingEvents.map((event) => (
                  <Link
                    key={event._id}
                    to="/events"
                    className="group flex flex-col rounded-xl border border-border/70 p-3.5 transition hover:border-primary/25 hover:bg-muted/30"
                  >
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                      {event.type}
                    </span>
                    <p className="mt-1 line-clamp-2 text-xs font-semibold">{event.title}</p>
                    <p className="mt-2 text-[10px] text-muted-foreground">{fmtShortDate(event.startAt)} · {event.venue}</p>
                    <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-medium text-primary">
                      {event.registered ? "Registered" : inr(event.fee) === "₹0" ? "Free entry" : inr(event.fee)}
                      <ArrowRight className="size-3" />
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </Panel>
        </div>

        <div className="flex flex-col gap-5">
          <Panel title="Quick actions" description="The things you do most.">
            <div className="space-y-2">
              {isStudent && (
                <>
                  <QuickAction to="/study" icon={Sparkles} label="Ask the Study Hub" desc="Grounded answers from your materials" />
                  <QuickAction to="/library" icon={BookOpen} label="Open the E-Library" desc="Notes, papers and recorded lectures" />
                  <QuickAction to="/canteen" icon={UtensilsCrossed} label="Order from the canteen" desc={`${(myOrders ?? []).length} past orders`} />
                  <QuickAction to="/workspace" icon={FileText} label="My workspace" desc="Notes, tasks and calendar" />
                </>
              )}
              {isStaff && (
                <>
                  <QuickAction to="/review" icon={CheckCircle2} label="Review approvals" desc={`${queue?.length ?? 0} in your queue`} />
                  <QuickAction to="/academics" icon={GraduationCap} label="Class academics" desc="Attendance, assignments, announcements" />
                  <QuickAction to="/library" icon={BookOpen} label="E-Library" desc="Upload and manage resources" />
                  <QuickAction to="/workspace" icon={Timer} label="Focus & planning" desc="Protect time for deep work" />
                </>
              )}
              {role === "canteen_staff" && (
                <>
                  <QuickAction to="/canteen" icon={UtensilsCrossed} label="Order board" desc="Move tokens through the queue" />
                  <QuickAction to="/notifications" icon={Bell} label="Notifications" desc="New orders and updates" />
                  <QuickAction to="/profile" icon={Users} label="Your profile" desc="Account and portal details" />
                </>
              )}
              {role === "event_coordinator" && (
                <>
                  <QuickAction to="/events" icon={CalendarDays} label="Event studio" desc="Publish and manage registrations" />
                  <QuickAction to="/connect" icon={Users} label="Student Connect" desc="See community activity" />
                  <QuickAction to="/notifications" icon={Bell} label="Notifications" desc="Registrations and reminders" />
                </>
              )}
              {role === "admin" && (
                <>
                  <QuickAction to="/admin" icon={ShieldCheck} label="Admin console" desc="Roles, policies, moderation" />
                  <QuickAction to="/review" icon={CheckCircle2} label="All approvals" desc="Department-wide review" />
                  <QuickAction to="/lost-found" icon={FileText} label="Lost & found" desc="Verify claims and returns" />
                  <QuickAction to="/canteen" icon={Coffee} label="Canteen services" desc="Menu and live orders" />
                </>
              )}
            </div>
          </Panel>

          {activePlan && (
            <Panel
              title="Study plan progress"
              description={`${activePlan.subject} · exam ${fmtShortDate(activePlan.examDate)}`}
              action={<Chip>AI plan</Chip>}
            >
              <div className="flex items-end justify-between">
                <p className="font-display text-2xl font-bold">
                  {planDone}
                  <span className="text-sm font-medium text-muted-foreground">/{activePlan.topics.length}</span>
                </p>
                <span className="text-[11px] text-muted-foreground">topics done</span>
              </div>
              <ProgressBar value={(planDone / Math.max(1, activePlan.topics.length)) * 100} className="mt-3" />
              <div className="mt-4 space-y-2">
                {activePlan.topics
                  .filter((t) => !t.done)
                  .slice(0, 2)
                  .map((topic) => (
                    <div key={topic.id} className="flex items-center gap-2 text-[11px]">
                      <span className="size-1.5 rounded-full bg-primary" />
                      <span className="truncate">{topic.title}</span>
                      <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">{fmtShortDate(topic.scheduledDate)}</span>
                    </div>
                  ))}
              </div>
              <Button asChild variant="outline" size="sm" className="mt-4 w-full rounded-lg text-[11px]">
                <Link to="/study">Open Study Hub</Link>
              </Button>
            </Panel>
          )}

          <Panel
            title="Recent notifications"
            action={
              <Button asChild size="sm" variant="ghost" className="gap-1 text-[11px]">
                <Link to="/notifications">View all <ArrowRight className="size-3" /></Link>
              </Button>
            }
          >
            {(notifications ?? []).length === 0 ? (
              <div className="py-6 text-center">
                <Bell className="mx-auto mb-2 size-5 text-muted-foreground/60" />
                <p className="text-xs text-muted-foreground">Nothing yet — you're all caught up.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {(notifications ?? []).slice(0, 4).map((n) => (
                  <Link key={n._id} to={n.link} className="flex items-start gap-2.5">
                    <span className={`mt-1.5 size-1.5 shrink-0 rounded-full ${n.read ? "bg-border" : "bg-primary"}`} />
                    <div className="min-w-0">
                      <p className="truncate text-[11px] font-semibold">{n.title}</p>
                      <p className="line-clamp-2 text-[10px] leading-4 text-muted-foreground">{n.body}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Panel>

          {openTasks.length > 0 && (
            <Panel title="Open tasks" action={<Chip>{openTasks.length} pending</Chip>}>
              <div className="space-y-2.5">
                {openTasks.slice(0, 4).map((task) => (
                  <div key={task._id} className="flex items-start gap-2.5">
                    <span className="mt-0.5 size-3.5 rounded border border-border" />
                    <div className="min-w-0">
                      <p className="truncate text-[11px] font-medium">{task.title}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {task.priority} priority{task.dueAt ? ` · ${fmtShortDate(task.dueAt)}` : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <Button asChild variant="ghost" size="sm" className="mt-3 w-full text-[11px]">
                <Link to="/workspace">Manage tasks</Link>
              </Button>
            </Panel>
          )}

          <Panel title="Campus announcements" description="From faculty and the campus office.">
            {(academics?.announcements ?? []).length === 0 ? (
              <p className="py-5 text-center text-xs text-muted-foreground">No announcements yet.</p>
            ) : (
              <div className="space-y-3.5">
                {(academics?.announcements ?? []).slice(0, 3).map((a) => (
                  <div key={a._id} className="border-b border-border/50 pb-3 last:border-0 last:pb-0">
                    <div className="flex items-center gap-2">
                      {a.pinned && <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[9px] font-semibold text-amber-700">Pinned</span>}
                      <p className="truncate text-[11px] font-semibold">{a.title}</p>
                    </div>
                    <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-muted-foreground">{a.body}</p>
                    <p className="mt-1 text-[9px] text-muted-foreground/70">{a.authorName} · {timeAgo(a.createdAt)}</p>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>
      </div>
    </PageWrap>
  );
}

function LoadingRow() {
  return (
    <div className="flex items-center justify-center gap-2 py-8 text-xs text-muted-foreground">
      <Loader2 className="size-4 animate-spin" /> Loading live campus data…
    </div>
  );
}
