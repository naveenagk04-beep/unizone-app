import { api } from "@/convex/_generated/api";
import {
  PageWrap,
  PageHeader,
  Panel,
  Stat,
  EmptyState,
  Chip,
  Loading,
  Field,
  ProgressBar,
} from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fmtShortDate, todayISO } from "@/lib/format";
import { useMutation, useQuery } from "convex/react";
import {
  Brain,
  Check,
  Clock3,
  Coffee,
  Flame,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Target,
  Timer,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const STORAGE_KEY = "unizone.focus.timer.v1";

type TimerStore = {
  startedAt: number;
  endAt: number | null;
  duration: number;
  remaining: number;
  subject: string;
  running: boolean;
};

function readStored(): TimerStore | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as TimerStore;
  } catch {
    return null;
  }
}

export default function Productivity() {
  const data = useQuery(api.productivity.overview, {});
  const subjects = useQuery(api.academics.overview, {});
  const logSession = useMutation(api.productivity.logSession);
  const addGoal = useMutation(api.productivity.addGoal);
  const updateGoal = useMutation(api.productivity.updateGoal);
  const addHabit = useMutation(api.productivity.addHabit);
  const toggleHabitToday = useMutation(api.productivity.toggleHabitToday);

  const [duration, setDuration] = useState(25);
  const [subject, setSubject] = useState("Database Management Systems");
  const [remaining, setRemaining] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [endAt, setEndAt] = useState<number | null>(null);
  const [focusMode, setFocusMode] = useState(false);
  const [custom, setCustom] = useState(45);
  const completedRef = useRef(false);

  const [goalTitle, setGoalTitle] = useState("");
  const [goalTarget, setGoalTarget] = useState(5);
  const [habitName, setHabitName] = useState("");

  // Restore a session across refresh. A session whose end passed while the tab was
  // closed is recorded as interrupted on the next load.
  useEffect(() => {
    const stored = readStored();
    if (!stored) return;
    setDuration(stored.duration);
    setSubject(stored.subject);
    if (stored.running && stored.endAt) {
      const left = Math.max(0, Math.round((stored.endAt - Date.now()) / 1000));
      if (left > 0) {
        setStartedAt(stored.startedAt);
        setEndAt(stored.endAt);
        setRemaining(left);
        setRunning(true);
        toast.info("Focus session restored", { description: `${left}s remaining on your timer.` });
      } else {
        setRemaining(stored.duration * 60);
        logSession({
          minutes: stored.duration,
          startedAt: stored.startedAt,
          subject: stored.subject,
          kind: "pomodoro",
          completed: false,
        })
          .then(() => toast.info("An away session was recorded as interrupted."))
          .catch(() => undefined);
        localStorage.removeItem(STORAGE_KEY);
      }
    } else {
      setRemaining(stored.remaining);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!running || !endAt) return;
    const tick = () => {
      const left = Math.max(0, Math.round((endAt - Date.now()) / 1000));
      setRemaining(left);
      if (left <= 0 && !completedRef.current) {
        completedRef.current = true;
        setRunning(false);
        setEndAt(null);
        localStorage.removeItem(STORAGE_KEY);
        if (startedAt) {
          logSession({
            minutes: duration,
            startedAt,
            subject,
            kind: "pomodoro",
            completed: true,
          })
            .then(() => toast.success("Focus session complete", { description: `${duration} minutes logged for ${subject}.` }))
            .catch(() => toast.error("Could not log the session."));
        }
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, endAt]);

  if (data === undefined) return <Loading label="Loading your focus space" />;

  const persist = (next: Partial<TimerStore>) => {
    const payload: TimerStore = {
      startedAt: next.startedAt ?? startedAt ?? Date.now(),
      endAt: next.endAt ?? endAt,
      duration: next.duration ?? duration,
      remaining: next.remaining ?? remaining,
      subject: next.subject ?? subject,
      running: next.running ?? running,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  };

  const start = () => {
    const secs = remaining > 0 && remaining < duration * 60 ? remaining : duration * 60;
    const startTs = Date.now();
    const target = startTs + secs * 1000;
    completedRef.current = false;
    setStartedAt(startTs);
    setEndAt(target);
    setRunning(true);
    setRemaining(secs);
    persist({ startedAt: startTs, endAt: target, running: true, remaining: secs, duration, subject });
  };

  const pause = () => {
    setRunning(false);
    setEndAt(null);
    persist({ endAt: null, running: false, remaining });
  };

  const reset = () => {
    if (running && startedAt && remaining < duration * 60 - 60) {
      logSession({
        minutes: Math.max(1, Math.round((duration * 60 - remaining) / 60)),
        startedAt,
        subject,
        kind: "pomodoro",
        completed: false,
      }).catch(() => undefined);
    }
    setRunning(false);
    setEndAt(null);
    setStartedAt(null);
    setRemaining(duration * 60);
    localStorage.removeItem(STORAGE_KEY);
  };

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");
  const progress = 1 - remaining / (duration * 60);
  const themeBySubject = subjects?.subjects.find((s) => s.name === subject)?.color;

  const timerCard = (large = false) => (
    <div className="flex flex-col items-center">
      <div className="relative flex size-[220px] items-center justify-center sm:size-[250px]">
        <svg viewBox="0 0 120 120" className="absolute inset-0 size-full -rotate-90">
          <circle cx="60" cy="60" r="52" fill="none" stroke="var(--muted)" strokeWidth="5" />
          <circle
            cx="60"
            cy="60"
            r="52"
            fill="none"
            stroke={themeBySubject ?? "#6366f1"}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 52}
            strokeDashoffset={2 * Math.PI * 52 * (1 - Math.min(1, progress))}
            className="transition-all duration-500"
          />
        </svg>
        <div className="text-center">
          <p className={`font-display font-bold tabular-nums tracking-tight ${large ? "text-6xl" : "text-5xl"}`}>
            {mm}:{ss}
          </p>
          <p className={`mt-1 text-muted-foreground ${large ? "text-sm" : "text-[11px]"}`}>{subject}</p>
        </div>
      </div>
      <div className="mt-5 flex items-center gap-2">
        {running ? (
          <Button className="gap-2 rounded-xl px-5" onClick={pause}>
            <Pause className="size-4" /> Pause
          </Button>
        ) : (
          <Button className="gap-2 rounded-xl px-5" onClick={start}>
            <Play className="size-4" /> {remaining < duration * 60 && remaining > 0 ? "Resume" : "Start focus"}
          </Button>
        )}
        <Button variant="outline" className="gap-2 rounded-xl" onClick={reset}>
          <RotateCcw className="size-4" /> Reset
        </Button>
        {!large && (
          <Button variant="ghost" size="icon" aria-label="Enter focus mode" onClick={() => setFocusMode(true)}>
            <Maximize2 className="size-4" />
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <PageWrap>
      <PageHeader
        eyebrow="Productivity"
        title="Protect your focus"
        description="Pomodoro sessions that survive a refresh, daily goals, habits and a weekly focus picture."
        actions={
          <Chip className="gap-1.5">
            <Flame className="size-3" /> {data.stats.sessionsThisWeek} sessions this week
          </Chip>
        }
      />

      <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Focus this week" value={`${Math.floor(data.stats.focusThisWeek / 60)}h ${data.stats.focusThisWeek % 60}m`} hint="Completed and interrupted sessions" icon={Clock3} tone="indigo" />
        <Stat label="Tasks completed" value={`${data.stats.completedTasks}/${data.stats.totalTasks}`} hint="Across your workspace" icon={Check} tone="emerald" />
        <Stat label="Active goals" value={data.goals.length} hint="Weekly targets" icon={Target} tone="violet" />
        <Stat label="Habits tracked" value={data.habits.length} hint="Tap today to log" icon={Sparkles} tone="amber" />
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_1.1fr]">
        <Panel title="Focus timer" description="Choose a block, then start. Refreshing keeps the session running.">
          <div className="mb-4 grid grid-cols-4 gap-1.5 rounded-xl border border-border p-1">
            {[25, 50, 90, custom].map((value, index) => {
              const isCustom = index === 3;
              const active = isCustom ? duration === custom && ![25, 50, 90].includes(duration) : duration === value;
              return (
                <button
                  key={isCustom ? "custom" : value}
                  type="button"
                  onClick={() => {
                    if (running) return;
                    setDuration(value);
                    setRemaining(value * 60);
                  }}
                  disabled={running}
                  className={`rounded-lg px-2 py-1.5 text-[11px] font-medium transition ${
                    active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                  } ${running ? "opacity-60" : ""}`}
                >
                  {isCustom ? `${value}m` : `${value} min`}
                </button>
              );
            })}
          </div>
          <div className="mb-4 flex items-center gap-2">
            <Input
              type="number"
              min={5}
              max={180}
              value={custom}
              onChange={(e) => {
                const value = Number(e.target.value);
                setCustom(value);
                if (!running) {
                  setDuration(value);
                  setRemaining(value * 60);
                }
              }}
              className="h-8 w-20 text-xs"
              aria-label="Custom timer minutes"
            />
            <Select value={subject} onValueChange={(v) => { setSubject(v); persist({ subject: v }); }} disabled={running}>
              <SelectTrigger className="h-8 flex-1 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(subjects?.subjects.map((s) => s.name) ?? [subject]).map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {timerCard()}
          <p className="mt-4 flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground">
            <Coffee className="size-3" /> Sessions save automatically. Closing mid-session records it as interrupted next time.
          </p>
        </Panel>

        <div className="flex flex-col gap-5">
          <Panel title="Weekly focus" description="Minutes per day from saved sessions.">
            <div className="flex h-[150px] items-end justify-between gap-2">
              {data.stats.dailyMinutes.map((day) => {
                const max = Math.max(1, ...data.stats.dailyMinutes.map((d) => d.minutes));
                const height = (day.minutes / max) * 100;
                const isToday = day.day === todayISO();
                return (
                  <div key={day.day} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                    <span className="text-[9px] font-medium text-muted-foreground">{day.minutes || ""}</span>
                    <div
                      className={`w-full rounded-t-md transition-all ${isToday ? "bg-gradient-to-t from-indigo-500 to-violet-500" : "bg-indigo-100"}`}
                      style={{ height: `${Math.max(4, height)}%` }}
                    />
                    <span className={`text-[9px] ${isToday ? "font-semibold text-primary" : "text-muted-foreground"}`}>
                      {new Date(`${day.day}T00:00:00`).toLocaleDateString("en-IN", { weekday: "short" })}
                    </span>
                  </div>
                );
              })}
            </div>
          </Panel>

          <Panel title="Goals" description="Update progress with one tap.">
            <div className="space-y-3">
              {data.goals.map((goal) => (
                <div key={goal._id}>
                  <div className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="font-medium">{goal.title}</span>
                    <span className="text-muted-foreground">{goal.progress}/{goal.target} {goal.unit}</span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <ProgressBar value={(goal.progress / Math.max(1, goal.target)) * 100} tone="violet" />
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 shrink-0 px-2 text-[10px]"
                      onClick={async () => {
                        try {
                          await updateGoal({ goalId: goal._id, delta: 1 });
                        } catch (error) {
                          toast.error(error instanceof Error ? error.message : "Could not update goal");
                        }
                      }}
                    >
                      +1
                    </Button>
                  </div>
                </div>
              ))}
              {data.goals.length === 0 && <p className="text-[11px] text-muted-foreground">No goals yet. Add a weekly target below.</p>}
              <div className="flex gap-2 border-t border-border/60 pt-3">
                <Input value={goalTitle} onChange={(e) => setGoalTitle(e.target.value)} placeholder="New goal" className="h-8 text-xs" />
                <Input type="number" min={1} value={goalTarget} onChange={(e) => setGoalTarget(Number(e.target.value))} className="h-8 w-16 text-xs" aria-label="Target" />
                <Button
                  size="sm"
                  className="h-8 gap-1 px-2.5 text-[10px]"
                  onClick={async () => {
                    try {
                      await addGoal({ title: goalTitle, target: goalTarget, unit: "sessions" });
                      setGoalTitle("");
                      toast.success("Goal added");
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : "Could not add goal");
                    }
                  }}
                >
                  <Plus className="size-3" /> Add
                </Button>
              </div>
            </div>
          </Panel>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
        <Panel title="Habit tracker" description="A small daily win, every day.">
          <div className="space-y-3">
            {data.habits.map((habit) => {
              const doneToday = habit.dates.includes(todayISO());
              const week = Array.from({ length: 7 }).map((_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - (6 - i));
                return d.toISOString().slice(0, 10);
              });
              return (
                <div key={habit._id} className="flex flex-wrap items-center gap-3 rounded-xl border border-border/70 p-3">
                  <span className="text-lg">{habit.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium">{habit.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {habit.dates.filter((d) => week.includes(d)).length}/{habit.targetPerWeek} this week
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {week.map((day) => (
                      <span
                        key={day}
                        className={`size-5 rounded-md ${habit.dates.includes(day) ? "bg-emerald-500" : "bg-muted"}`}
                        title={fmtShortDate(day)}
                      />
                    ))}
                  </div>
                  <Button
                    size="sm"
                    variant={doneToday ? "default" : "outline"}
                    className="h-7 gap-1 px-2 text-[10px]"
                    onClick={async () => {
                      try {
                        await toggleHabitToday({ habitId: habit._id });
                        toast.success(doneToday ? "Unchecked today" : "Logged for today");
                      } catch (error) {
                        toast.error(error instanceof Error ? error.message : "Could not update habit");
                      }
                    }}
                  >
                    {doneToday ? <Check className="size-3" /> : <Plus className="size-3" />}
                    {doneToday ? "Done" : "Today"}
                  </Button>
                </div>
              );
            })}
            {data.habits.length === 0 && (
              <EmptyState icon={Sparkles} title="No habits yet" description="Track a small daily habit to build momentum." />
            )}
            <div className="flex gap-2 border-t border-border/60 pt-3">
              <Input value={habitName} onChange={(e) => setHabitName(e.target.value)} placeholder="e.g. Read 20 pages" className="h-8 text-xs" />
              <Button
                size="sm"
                className="h-8 gap-1 px-2.5 text-[10px]"
                onClick={async () => {
                  try {
                    await addHabit({ name: habitName, emoji: "🌱", targetPerWeek: 5 });
                    setHabitName("");
                    toast.success("Habit added");
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : "Could not add habit");
                  }
                }}
              >
                <Plus className="size-3" /> Add
              </Button>
            </div>
          </div>
        </Panel>

        <Panel title="Session history" description="The timer is the source of truth for these numbers.">
          <div className="space-y-2">
            {data.sessions.slice(0, 7).map((session) => (
              <div key={session._id} className="flex items-center gap-2.5 rounded-xl border border-border/70 p-2.5">
                <span className={`flex size-7 items-center justify-center rounded-lg ${session.status === "completed" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
                  <Timer className="size-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-medium">{session.subject ?? "Focus session"}</p>
                  <p className="text-[9px] text-muted-foreground">
                    {fmtShortDate(session.startedAt)} · {session.minutes}m · {session.status}
                  </p>
                </div>
                <Chip className="capitalize">{session.kind}</Chip>
              </div>
            ))}
            {data.sessions.length === 0 && (
              <p className="py-6 text-center text-[11px] text-muted-foreground">No sessions yet — start your first block.</p>
            )}
          </div>
        </Panel>
      </div>

      {focusMode && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0d1129] px-6 text-white">
          <div className="pointer-events-none absolute -left-20 top-10 size-96 rounded-full bg-indigo-600/20 blur-3xl" />
          <div className="pointer-events-none absolute -right-20 bottom-0 size-96 rounded-full bg-violet-600/20 blur-3xl" />
          <div className="relative flex flex-col items-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-indigo-300">Focus mode</p>
            <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.04] px-10 py-8 backdrop-blur">
              {timerCard(true)}
            </div>
            <Button
              variant="ghost"
              className="mt-6 gap-2 text-white/70 hover:bg-white/10 hover:text-white"
              onClick={() => setFocusMode(false)}
            >
              <Minimize2 className="size-4" /> Exit focus mode
            </Button>
            <p className="mt-4 flex items-center gap-1.5 text-[10px] text-indigo-200/50">
              <Brain className="size-3" /> Deep work in progress · notifications are paused here
            </p>
          </div>
        </div>
      )}
    </PageWrap>
  );
}
