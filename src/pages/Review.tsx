import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { PageWrap, PageHeader, Panel, Stat, StatusBadge, EmptyState, Chip, Loading } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fmtDate, fmtShortDate } from "@/lib/format";
import { useQuery } from "convex/react";
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Search,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";

const PAGE_NOW_MS = Date.now();

export default function Review() {
  const { user } = useAuth();
  const queue = useQuery(api.requests.queue, {});
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [sort, setSort] = useState("oldest");

  if (queue === undefined) return <Loading label="Loading approval queue" />;

  const filtered = queue
    .filter((r) => (type === "all" ? true : r.type === type))
    .filter((r) =>
      query.trim()
        ? `${r.title} ${r.userName} ${r.registerNumber} ${r.refNo}`.toLowerCase().includes(query.toLowerCase())
        : true,
    )
    .sort((a, b) => (sort === "oldest" ? a.createdAt - b.createdAt : b.createdAt - a.createdAt));

  const urgent = queue.filter(
    (r) => new Date(`${r.startDate}T00:00:00`).getTime() - PAGE_NOW_MS < 3 * 86_400_000,
  );

  return (
    <PageWrap>
      <PageHeader
        eyebrow="Approvals"
        title={user?.role === "admin" ? "All campus approvals" : "Your review queue"}
        description="Requests assigned to your role in your department. Decisions are scope-checked, notified and audited."
        actions={<Chip className="gap-1.5"><ShieldCheck className="size-3" /> Role & scope enforced</Chip>}
      />

      <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="In your queue" value={queue.length} hint="Assigned to your role" icon={ClipboardCheck} tone="indigo" />
        <Stat label="Starting within 3 days" value={urgent.length} hint="Prioritise these first" icon={CalendarClock} tone="amber" />
        <Stat label="OD requests" value={queue.filter((r) => r.type === "od").length} hint="Activities and representation" icon={CheckCircle2} tone="violet" />
        <Stat label="Leave requests" value={queue.filter((r) => r.type === "leave").length} hint="Medical, personal, family" icon={Clock3} tone="sky" />
      </div>

      <Panel
        title="Pending decisions"
        description={user?.role === "hod" ? "Forwarded by class faculty and awaiting your final decision." : "Oldest requests are shown first so nothing gets stuck."}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name, ref no…"
                className="h-8 w-[180px] rounded-lg pl-8 text-xs"
              />
            </div>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="h-8 w-[110px] rounded-lg text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="od">OD</SelectItem>
                <SelectItem value="leave">Leave</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="h-8 w-[120px] rounded-lg text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="oldest">Oldest first</SelectItem>
                <SelectItem value="newest">Newest first</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      >
        {filtered.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title={queue.length === 0 ? "Nothing waiting on you" : "No requests match these filters"}
            description={
              queue.length === 0
                ? "New requests assigned to your role will appear here and in your notifications."
                : "Clear the search or switch the type filter."
            }
          />
        ) : (
          <div className="space-y-2.5">
            {filtered.map((request) => {
              const daysUntil = Math.ceil(
                (new Date(`${request.startDate}T00:00:00`).getTime() - PAGE_NOW_MS) / 86_400_000,
              );
              return (
                <Link
                  key={request._id}
                  to={`/requests/${request._id}`}
                  className="flex flex-col gap-3 rounded-xl border border-border/70 p-4 transition hover:border-primary/25 hover:bg-muted/30 sm:flex-row sm:items-center"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                    <ClipboardCheck className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold">{request.title}</p>
                      <Chip className="uppercase">{request.type}</Chip>
                      {daysUntil <= 2 && (
                        <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[9px] font-semibold text-rose-600">
                          {daysUntil < 0 ? "Date passed" : "Starts soon"}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {request.userName} · {request.registerNumber} · {request.department} Y{request.year}
                      {request.section} · {request.refNo}
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {fmtDate(request.startDate)} → {fmtDate(request.endDate)} · submitted {fmtShortDate(request.createdAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <StatusBadge status={request.status} />
                    <span className="hidden items-center gap-1 text-[11px] font-medium text-primary sm:flex">
                      Review <ArrowRight className="size-3.5" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </Panel>

      <Panel title="Reviewer guidance" description="What the backend will allow — and what it will refuse.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Assigned role only", "A faculty reviewer cannot decide a request already forwarded to the HOD."],
            ["Department scope", "Requests from another department are not returned to your queue or readable."],
            ["No self-approval", "The server rejects any decision where reviewer and applicant are the same account."],
            ["Remarks required", "Reject and return actions need a written remark for the student and audit trail."],
          ].map(([title, body]) => (
            <div key={title} className="rounded-xl border border-border/70 p-3.5">
              <p className="text-xs font-semibold">{title}</p>
              <p className="mt-1 text-[11px] leading-5 text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
        {user?.role === "admin" && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-indigo-100 bg-indigo-50/50 px-3.5 py-3">
            <p className="text-[11px] text-indigo-800">
              Admin decisions bypass the assigned-role check but are still audited and
              still blocked for self-approval.
            </p>
            <Button asChild size="sm" variant="outline" className="bg-white">
              <Link to="/admin">Approval policies</Link>
            </Button>
          </div>
        )}
      </Panel>
    </PageWrap>
  );
}
