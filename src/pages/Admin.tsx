import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useAuth } from "@/hooks/use-auth";
import {
  PageWrap,
  PageHeader,
  Panel,
  Stat,
  EmptyState,
  Chip,
  Loading,
  StatusBadge,
} from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ROLE_LABELS, fmtDateTime, inr, timeAgo } from "@/lib/format";
import { useMutation, useQuery } from "convex/react";
import {
  Activity,
  BadgeCheck,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  Flag,
  Search,
  ShieldCheck,
  UserCog,
  Users,
  Wallet,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const ROLES = ["student", "faculty", "hod", "admin", "canteen_staff", "event_coordinator"] as const;
type RoleOption = (typeof ROLES)[number];

export default function Admin() {
  const { user } = useAuth();
  const data = useQuery(api.admin.overview, {});
  const setUserRole = useMutation(api.admin.setUserRole);
  const setUserStatus = useMutation(api.admin.setUserStatus);
  const updatePolicy = useMutation(api.admin.updatePolicy);
  const setAttendanceEffect = useMutation(api.admin.setAttendanceEffect);
  const resolveReport = useMutation(api.admin.resolveReport);
  const decideClaim = useMutation(api.lostfound.decideClaim);
  const markResolved = useMutation(api.lostfound.markResolved);
  const [userQuery, setUserQuery] = useState("");

  if (data === undefined) return <Loading label="Loading the admin console" />;

  const users = data.users.filter((u) =>
    userQuery.trim()
      ? `${u.name ?? ""} ${u.email ?? ""} ${u.registerNumber ?? ""} ${u.role ?? ""}`
          .toLowerCase()
          .includes(userQuery.toLowerCase())
      : true,
  );

  return (
    <PageWrap>
      <PageHeader
        eyebrow="Admin console"
        title="Run the campus, with evidence"
        description="Roles, departments, approval policies, moderation and an append-only audit trail. Privileged actions notify the affected user."
        actions={<Chip className="gap-1.5"><ShieldCheck className="size-3" /> Admin only</Chip>}
      />

      <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Campus accounts" value={data.users.length} hint={`${data.stats.students} students · ${data.stats.faculty} faculty/HOD`} icon={Users} tone="indigo" />
        <Stat label="Pending approvals" value={data.stats.pendingRequests} hint="Across all departments" icon={ClipboardCheck} tone="amber" />
        <Stat label="Canteen revenue" value={inr(data.stats.revenue)} hint={`${data.stats.ordersToday} orders today`} icon={Wallet} tone="emerald" />
        <Stat label="Open reports" value={data.stats.openReports} hint={`${data.pendingClaims.length} pending claims`} icon={Flag} tone="violet" />
      </div>

      <Tabs defaultValue="overview" className="gap-5">
        <TabsList className="flex w-full flex-wrap sm:w-auto">
          <TabsTrigger value="overview" className="gap-1.5"><Activity className="size-3.5" /> Overview</TabsTrigger>
          <TabsTrigger value="users" className="gap-1.5"><UserCog className="size-3.5" /> Users & roles</TabsTrigger>
          <TabsTrigger value="policies" className="gap-1.5"><ShieldCheck className="size-3.5" /> Policies</TabsTrigger>
          <TabsTrigger value="moderation" className="gap-1.5"><Flag className="size-3.5" /> Moderation</TabsTrigger>
          <TabsTrigger value="lostfound" className="gap-1.5"><Search className="size-3.5" /> Lost & found</TabsTrigger>
          <TabsTrigger value="audit" className="gap-1.5"><ClipboardCheck className="size-3.5" /> Audit log</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="grid gap-5 lg:grid-cols-2">
          <Panel title="Departments" description="Scope boundaries used by every rule and function.">
            <div className="space-y-2">
              {data.departments.map((department) => (
                <div key={department._id} className="flex items-center gap-3 rounded-xl border border-border/70 p-3.5">
                  <span className="flex size-9 items-center justify-center rounded-xl bg-muted text-primary">
                    <Building2 className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold">{department.name}</p>
                    <p className="text-[10px] text-muted-foreground">HOD {department.hod} · code {department.code}</p>
                  </div>
                  <div className="text-right text-[10px] text-muted-foreground">
                    <p>{department.studentCount} students</p>
                    <p>{department.facultyCount} faculty</p>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Recent audit entries" description="Official actions are append-only.">
            <div className="space-y-3">
              {data.auditLogs.slice(0, 8).map((log) => (
                <div key={log._id} className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <Activity className="size-3" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px]">{log.action}</p>
                    <p className="text-[9px] text-muted-foreground">{log.actorName} · {log.actorRole} · {timeAgo(log.at)}</p>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Operational notes" description="How this demo keeps itself honest." className="lg:col-span-2">
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ["Roles are server-side", "Every callable checks the active role and department before writing."],
                ["Official writes are audited", "Approvals, attendance, grades, policies and canteen status all write audit entries."],
                ["Payments are simulated", "No card data is stored. A production deploy swaps the PaymentProvider interface."],
              ].map(([title, body]) => (
                <div key={title} className="rounded-xl border border-border/70 p-3.5">
                  <p className="text-xs font-semibold">{title}</p>
                  <p className="mt-1 text-[10px] leading-4 text-muted-foreground">{body}</p>
                </div>
              ))}
            </div>
          </Panel>
        </TabsContent>

        <TabsContent value="users">
          <Panel
            title="Users & roles"
            description="Role changes take effect immediately. You cannot demote or disable your own account."
            action={
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input value={userQuery} onChange={(e) => setUserQuery(e.target.value)} placeholder="Search users…" className="h-8 w-[200px] rounded-lg pl-8 text-xs" />
              </div>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-xs">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    <th className="pb-2 font-medium">User</th>
                    <th className="pb-2 font-medium">Department</th>
                    <th className="pb-2 font-medium">Role</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 text-right font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((person) => {
                    const isSelf = person._id === user?._id;
                    return (
                      <tr key={person._id} className="border-t border-border/60">
                        <td className="py-2.5">
                          <p className="font-medium">{person.name ?? "Unnamed"}{isSelf ? " (you)" : ""}</p>
                          <p className="text-[10px] text-muted-foreground">{person.email ?? "—"}</p>
                        </td>
                        <td className="py-2.5 text-muted-foreground">{person.department ?? "—"}</td>
                        <td className="py-2.5">
                          <Select
                            value={(person.role ?? "student") as RoleOption}
                            disabled={isSelf}
                            onValueChange={async (value) => {
                              try {
                                await setUserRole({ userId: person._id, role: value as RoleOption });
                                toast.success(`${person.name ?? "User"} is now ${ROLE_LABELS[value]}`);
                              } catch (error) {
                                toast.error(error instanceof Error ? error.message : "Could not change role");
                              }
                            }}
                          >
                            <SelectTrigger className="h-7 w-[150px] text-[11px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {ROLES.map((r) => <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="py-2.5">
                          <StatusBadge status={person.status === "disabled" ? "disabled" : "active"} />
                        </td>
                        <td className="py-2.5 text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            className={`h-7 text-[10px] ${person.status === "disabled" ? "text-emerald-600" : "text-rose-600"}`}
                            disabled={isSelf}
                            onClick={async () => {
                              try {
                                await setUserStatus({
                                  userId: person._id,
                                  status: person.status === "disabled" ? "active" : "disabled",
                                });
                                toast.success(`Account ${person.status === "disabled" ? "enabled" : "disabled"}`);
                              } catch (error) {
                                toast.error(error instanceof Error ? error.message : "Could not update account");
                              }
                            }}
                          >
                            {person.status === "disabled" ? "Enable" : "Disable"}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {users.length === 0 && (
                <EmptyState icon={Users} title="No users match" description="Try a different search." />
              )}
            </div>
          </Panel>
        </TabsContent>

        <TabsContent value="policies">
          <div className="flex flex-col gap-5">
            <Panel title="Attendance policy" description="OD attendance credit can be switched off institution-wide.">
              <div className="flex items-center justify-between gap-3 rounded-xl border border-border/70 p-4">
                <div>
                  <p className="text-xs font-semibold">Approved OD counts as present</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    Applied only through an audited approval transition, never from the client.
                  </p>
                </div>
                <Switch
                  checked={data.attendanceEffect}
                  onCheckedChange={async (checked) => {
                    try {
                      await setAttendanceEffect({ enabled: checked });
                      toast.success(`OD attendance credit ${checked ? "enabled" : "disabled"}`);
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : "Could not update policy");
                    }
                  }}
                />
              </div>
            </Panel>

            <Panel title="Approval policies" description="New submissions use the active policy for their type and duration. Existing requests are unaffected.">
              <div className="space-y-3">
                {data.policies.map((policy) => (
                  <div key={policy._id} className="rounded-xl border border-border/70 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-xs font-semibold">{policy.name}</p>
                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                          {policy.type.toUpperCase()} · {policy.steps.length} step(s)
                          {policy.maxDays ? ` · up to ${policy.maxDays} days` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                          OD attendance
                          <Switch
                            checked={policy.attendanceEffect}
                            onCheckedChange={async (checked) => {
                              try {
                                await updatePolicy({ policyId: policy._id, active: policy.active, attendanceEffect: checked });
                                toast.success("Policy updated");
                              } catch (error) {
                                toast.error(error instanceof Error ? error.message : "Could not update policy");
                              }
                            }}
                          />
                        </label>
                        <label className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                          Active
                          <Switch
                            checked={policy.active}
                            onCheckedChange={async (checked) => {
                              try {
                                await updatePolicy({ policyId: policy._id, active: checked, attendanceEffect: policy.attendanceEffect });
                                toast.success("Policy updated");
                              } catch (error) {
                                toast.error(error instanceof Error ? error.message : "Could not update policy");
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>
                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                      {policy.steps.map((step, index) => (
                        <span key={`${policy._id}-${step}-${index}`} className="flex items-center gap-1.5">
                          <Chip className={index === policy.finalStepIndex ? "border-indigo-200 bg-indigo-50 text-indigo-700" : ""}>
                            {index + 1}. {step}
                            {index === policy.finalStepIndex ? " · final" : ""}
                          </Chip>
                          {index < policy.steps.length - 1 && <span className="text-[9px] text-muted-foreground">→</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </TabsContent>

        <TabsContent value="moderation">
          <Panel title="Moderation queue" description="Reports from Lost & Found, Student Connect and community posts.">
            <div className="space-y-2.5">
              {data.reports.map((report) => (
                <div key={report._id} className="flex flex-col gap-2 rounded-xl border border-border/70 p-4 sm:flex-row sm:items-center">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                    <Flag className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold">{report.targetLabel}</p>
                    <p className="mt-0.5 text-[10px] leading-4 text-muted-foreground">{report.reason}</p>
                    <p className="mt-0.5 text-[9px] text-muted-foreground">
                      {report.targetType} · reported by {report.reporterName} · {fmtDateTime(report.createdAt)}
                    </p>
                  </div>
                  {report.status === "open" ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 gap-1 text-[10px]"
                      onClick={async () => {
                        try {
                          await resolveReport({ reportId: report._id });
                          toast.success("Report marked reviewed");
                        } catch (error) {
                          toast.error(error instanceof Error ? error.message : "Could not resolve report");
                        }
                      }}
                    >
                      <CheckCircle2 className="size-3" /> Mark reviewed
                    </Button>
                  ) : (
                    <StatusBadge status="approved" label="Reviewed" />
                  )}
                </div>
              ))}
              {data.reports.length === 0 && (
                <EmptyState icon={Flag} title="No reports" description="Reports from students and staff will appear here." />
              )}
            </div>
          </Panel>
        </TabsContent>

        <TabsContent value="lostfound">
          <div className="grid gap-5 lg:grid-cols-2">
            <Panel title="Pending claims" description="Verify ownership before approving any claim.">
              <div className="space-y-2.5">
                {data.pendingClaims.map(({ claim, item }) => (
                  <div key={claim._id} className="rounded-xl border border-border/70 p-3.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold">{claim.userName}</p>
                      <Chip>{item?.title ?? "Item removed"}</Chip>
                    </div>
                    <p className="mt-1.5 rounded-lg bg-muted/50 px-2.5 py-2 text-[11px] leading-5 text-muted-foreground">{claim.evidence}</p>
                    <div className="mt-2 flex gap-2">
                      <Button
                        size="sm"
                        className="h-7 gap-1 text-[10px]"
                        onClick={async () => {
                          try {
                            await decideClaim({ claimId: claim._id, decision: "approved" });
                            toast.success("Claim approved", { description: "The claimant has been notified." });
                          } catch (error) {
                            toast.error(error instanceof Error ? error.message : "Could not approve claim");
                          }
                        }}
                      >
                        <BadgeCheck className="size-3" /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 gap-1 text-[10px] text-rose-600"
                        onClick={async () => {
                          try {
                            await decideClaim({ claimId: claim._id, decision: "rejected" });
                            toast.success("Claim rejected");
                          } catch (error) {
                            toast.error(error instanceof Error ? error.message : "Could not reject claim");
                          }
                        }}
                      >
                        <XCircle className="size-3" /> Reject
                      </Button>
                    </div>
                  </div>
                ))}
                {data.pendingClaims.length === 0 && (
                  <EmptyState icon={BadgeCheck} title="No pending claims" description="New claims from students appear here." />
                )}
              </div>
            </Panel>

            <Panel title="All reports" description="Mark returned only after the item is physically handed over.">
              <div className="space-y-2">
                {data.items.map((item) => (
                  <div key={item._id} className="flex items-center gap-2.5 rounded-xl border border-border/70 p-2.5">
                    <span className="text-base">{item.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] font-medium">{item.title}</p>
                      <p className="truncate text-[9px] text-muted-foreground">{item.reporterName} · {item.location}</p>
                    </div>
                    <StatusBadge status={item.status} />
                    {item.status !== "resolved" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 shrink-0 text-[10px]"
                        onClick={async () => {
                          try {
                            await markResolved({ itemId: item._id });
                            toast.success("Marked returned");
                          } catch (error) {
                            toast.error(error instanceof Error ? error.message : "Could not update item");
                          }
                        }}
                      >
                        Return
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </TabsContent>

        <TabsContent value="audit">
          <Panel title="Audit log" description="Every official action, newest first. Entries are never edited.">
            <div className="space-y-1">
              {data.auditLogs.map((log) => (
                <div key={log._id} className="flex items-start gap-3 border-b border-border/50 py-2.5 last:border-0">
                  <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <ShieldCheck className="size-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px]">{log.action}</p>
                    <p className="text-[9px] text-muted-foreground">{log.target}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[10px] font-medium">{log.actorName}</p>
                    <p className="text-[9px] text-muted-foreground">{fmtDateTime(log.at)}</p>
                  </div>
                </div>
              ))}
              {data.auditLogs.length === 0 && (
                <EmptyState icon={ClipboardCheck} title="No audit entries yet" description="Official actions will be recorded here." />
              )}
            </div>
          </Panel>
        </TabsContent>
      </Tabs>
    </PageWrap>
  );
}
