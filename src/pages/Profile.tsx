import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import {
  PageWrap,
  PageHeader,
  Panel,
  Chip,
  Field,
  Avatar,
  ProgressBar,
} from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ROLE_LABELS } from "@/lib/format";
import { useMutation, useQuery } from "convex/react";
import {
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  Compass,
  GraduationCap,
  LogOut,
  Mail,
  Phone,
  ShieldCheck,
  Sparkles,
  Timer,
  UserRound,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

const ROLES = [
  { role: "student", icon: GraduationCap, line: "Academics, requests, canteen and campus life." },
  { role: "faculty", icon: BookOpen, line: "Review queue, attendance and announcements." },
  { role: "hod", icon: ShieldCheck, line: "Department approvals and oversight." },
  { role: "admin", icon: ShieldCheck, line: "Users, policies, moderation and audit." },
  { role: "canteen_staff", icon: ClipboardCheck, line: "Live orders, tokens and menu." },
  { role: "event_coordinator", icon: CalendarDays, line: "Events, seats and registrations." },
] as const;
type RoleOption = (typeof ROLES)[number]["role"];

export default function Profile() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const productivity = useQuery(api.productivity.overview, {});
  const academics = useQuery(api.academics.overview, {});
  const requests = useQuery(api.requests.mine, user?.role === "student" ? {} : "skip");
  const updateProfile = useMutation(api.profile.updateDisplayProfile);
  const previewRole = useMutation(api.profile.previewRole);

  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");

  if (!user) return null;
  const role = user.role ?? "student";

  return (
    <PageWrap>
      <PageHeader
        eyebrow="Profile"
        title="Your account and portal"
        description="Update your display details, review your academic summary and preview another campus role."
        actions={
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-rose-600"
            onClick={async () => {
              await signOut();
              navigate("/");
            }}
          >
            <LogOut className="size-3.5" /> Sign out
          </Button>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1.1fr_1.5fr]">
        <div className="flex flex-col gap-5">
          <Panel title="Campus profile">
            <div className="flex items-center gap-3">
              <Avatar name={user.name} className="size-14 text-base" />
              <div className="min-w-0">
                <p className="font-display text-lg font-bold">{user.name ?? "Campus member"}</p>
                <p className="text-xs text-muted-foreground">{user.email ?? "Demo account"}</p>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  <Chip className="border-indigo-200 bg-indigo-50 text-indigo-700">{ROLE_LABELS[role]}</Chip>
                  {user.registerNumber && <Chip>{user.registerNumber}</Chip>}
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-2 text-[11px]">
              {[
                ["Department", user.department ?? "—"],
                ["Year & section", `${user.year ?? "—"} · ${user.section ?? "—"}`],
                ["Account status", user.status ?? "active"],
                ["Demo account", user.demo ? "Yes — role preview enabled" : "No"],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium capitalize">{value}</span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Edit display details" description="Official fields such as role, department and register number are managed by the admin console.">
            <div className="space-y-3">
              <Field label="Full name">
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </Field>
              <Field label="Phone" hint="Never shown to other students.">
                <div className="relative">
                  <Phone className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="pl-8" placeholder="+91 …" />
                </div>
              </Field>
              <Field label="Short bio">
                <Textarea rows={3} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="What are you studying or working on?" />
              </Field>
              <Button
                className="w-full"
                onClick={async () => {
                  try {
                    await updateProfile({ name, phone: phone || undefined, bio: bio || undefined });
                    toast.success("Profile updated");
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : "Could not update profile");
                  }
                }}
              >
                Save changes
              </Button>
              <p className="flex items-start gap-1.5 text-[9px] leading-4 text-muted-foreground">
                <Mail className="mt-0.5 size-3 shrink-0" />
                Email is tied to your sign-in identity and cannot be changed here.
              </p>
            </div>
          </Panel>
        </div>

        <div className="flex flex-col gap-5">
          <div className="grid gap-3.5 sm:grid-cols-3">
            <div className="uz-card p-4">
              <p className="flex items-center gap-1.5 text-[10px] text-muted-foreground"><Timer className="size-3" /> Focus this week</p>
              <p className="mt-2 font-display text-xl font-bold">{Math.floor((productivity?.stats.focusThisWeek ?? 0) / 60)}h {(productivity?.stats.focusThisWeek ?? 0) % 60}m</p>
            </div>
            <div className="uz-card p-4">
              <p className="flex items-center gap-1.5 text-[10px] text-muted-foreground"><GraduationCap className="size-3" /> Attendance</p>
              <p className="mt-2 font-display text-xl font-bold">{academics?.attendancePercent ?? 0}%</p>
            </div>
            <div className="uz-card p-4">
              <p className="flex items-center gap-1.5 text-[10px] text-muted-foreground"><ClipboardCheck className="size-3" /> Requests</p>
              <p className="mt-2 font-display text-xl font-bold">{requests?.length ?? 0}</p>
            </div>
          </div>

          <Panel title="Academic snapshot" description="Read-only official data from your record.">
            <div className="space-y-2.5">
              {(academics?.attendanceBySubject ?? []).slice(0, 5).map((row) => (
                <div key={row.subject}>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="truncate">{row.subject}</span>
                    <span className="text-muted-foreground">{row.percent}%</span>
                  </div>
                  <ProgressBar value={row.percent} className="mt-1" tone={row.percent < 75 ? "amber" : "emerald"} />
                </div>
              ))}
              {(academics?.attendanceBySubject ?? []).length === 0 && (
                <p className="py-4 text-center text-[11px] text-muted-foreground">No academic record in this portal.</p>
              )}
            </div>
          </Panel>

          <Panel
            title="Preview another portal"
            description="Demo-only: switch the active role to explore every experience. All backend guards still apply."
            action={<Chip className="gap-1"><Compass className="size-3" /> Demo</Chip>}
          >
            <div className="grid gap-2 sm:grid-cols-2">
              {ROLES.filter((r) => r.role !== role).map((r) => (
                <button
                  key={r.role}
                  type="button"
                  onClick={async () => {
                    try {
                      await previewRole({ role: r.role as RoleOption });
                      toast.success(`Now viewing the ${ROLE_LABELS[r.role]} portal`);
                      navigate("/dashboard");
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : "Could not switch portal");
                    }
                  }}
                  className="flex items-start gap-2.5 rounded-xl border border-border/70 p-3 text-left transition hover:border-primary/30 hover:bg-muted/30"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-primary">
                    <r.icon className="size-3.5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[11px] font-semibold">{ROLE_LABELS[r.role]}</span>
                    <span className="block text-[9px] leading-4 text-muted-foreground">{r.line}</span>
                  </span>
                </button>
              ))}
            </div>
          </Panel>

          <Panel title="Account & privacy" description="How UniZone protects this account.">
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["Role security", "Roles are checked on the server for every write. Frontend guards are UX only."],
                ["Private documents", "Supporting documents and claim evidence are scoped to the workflow."],
                ["Contact privacy", "Student Connect never exposes email or phone numbers."],
                ["Your data", "Delete AI conversations and note summaries any time from the Study Hub."],
              ].map(([title, body]) => (
                <div key={title} className="rounded-xl border border-border/70 p-3">
                  <p className="flex items-center gap-1.5 text-[11px] font-semibold">
                    <Sparkles className="size-3 text-primary" /> {title}
                  </p>
                  <p className="mt-1 text-[10px] leading-4 text-muted-foreground">{body}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2 rounded-xl bg-muted/40 px-3 py-2.5 text-[10px] text-muted-foreground">
              <UserRound className="size-3.5" />
              Signed in as {user.email ?? "demo account"} · Vidyanova Institute of Technology
            </div>
          </Panel>
        </div>
      </div>
    </PageWrap>
  );
}
