import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  PageWrap,
  PageHeader,
  Panel,
  StatusBadge,
  EmptyState,
  Chip,
  Loading,
  Field,
} from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fmtDate, isoIn, todayISO } from "@/lib/format";
import { useMutation, useQuery } from "convex/react";
import {
  ArrowRight,
  CalendarDays,
  ClipboardCheck,
  FileText,
  Info,
  Plus,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";

const OD_CATEGORIES = [
  ["symposium", "Symposium"],
  ["workshop", "Workshop"],
  ["hackathon", "Hackathon"],
  ["competition", "Technical competition"],
  ["sports", "Sports"],
  ["ncc", "NCC / NSS"],
  ["representation", "College representation"],
  ["other", "Other institution-approved activity"],
];

const LEAVE_CATEGORIES = [
  ["medical", "Medical"],
  ["personal", "Personal"],
  ["family", "Family function"],
  ["emergency", "Emergency"],
  ["other", "Other"],
];

const ACTIVE = ["submitted", "under_faculty_review", "forwarded_to_hod", "returned"];

export default function Requests() {
  const navigate = useNavigate();
  const requests = useQuery(api.requests.mine, {});
  const policies = useQuery(api.requests.policies, {});
  const submit = useMutation(api.requests.submit);

  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"od" | "leave">("od");
  const [category, setCategory] = useState("hackathon");
  const [title, setTitle] = useState("");
  const [organizer, setOrganizer] = useState("");
  const [venue, setVenue] = useState("");
  const [startDate, setStartDate] = useState(isoIn(2));
  const [endDate, setEndDate] = useState(isoIn(2));
  const [halfDay, setHalfDay] = useState(false);
  const [reason, setReason] = useState("");
  const [documentName, setDocumentName] = useState("");
  const [busy, setBusy] = useState(false);

  if (requests === undefined) return <Loading label="Loading your requests" />;

  const pending = requests.filter((r) => ACTIVE.includes(r.status));
  const decided = requests.filter((r) => !ACTIVE.includes(r.status));
  const categories = type === "od" ? OD_CATEGORIES : LEAVE_CATEGORIES;

  const reset = () => {
    setTitle("");
    setOrganizer("");
    setVenue("");
    setStartDate(isoIn(2));
    setEndDate(isoIn(2));
    setHalfDay(false);
    setReason("");
    setDocumentName("");
  };

  const handleSubmit = async () => {
    setBusy(true);
    try {
      const result = await submit({
        type,
        category,
        title,
        organizer: organizer || undefined,
        venue: venue || undefined,
        startDate,
        endDate,
        halfDay,
        reason,
        documentName: documentName || undefined,
      });
      toast.success(`Request ${result.refNo} submitted`, {
        description: "Your class advisor has been notified. Track the timeline from this page.",
      });
      setOpen(false);
      reset();
      navigate(`/requests/${result.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not submit the request");
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageWrap>
      <PageHeader
        eyebrow="OD & Leave"
        title="Requests and approvals"
        description="Apply for on-duty or leave, attach supporting documents and follow every step of the decision — no email threads."
        actions={
          <Button size="sm" className="gap-1.5" onClick={() => setOpen(true)}>
            <Plus className="size-3.5" /> New request
          </Button>
        }
      />

      <div className="grid gap-3.5 sm:grid-cols-3">
        <div className="uz-card p-5">
          <p className="text-xs text-muted-foreground">In progress</p>
          <p className="mt-2 font-display text-2xl font-bold">{pending.length}</p>
          <p className="mt-1 text-[10px] text-muted-foreground">Waiting on a reviewer</p>
        </div>
        <div className="uz-card p-5">
          <p className="text-xs text-muted-foreground">Approved</p>
          <p className="mt-2 font-display text-2xl font-bold">{requests.filter((r) => r.status === "approved").length}</p>
          <p className="mt-1 text-[10px] text-muted-foreground">Permission letters available</p>
        </div>
        <div className="uz-card p-5">
          <p className="text-xs text-muted-foreground">Returned for changes</p>
          <p className="mt-2 font-display text-2xl font-bold">{requests.filter((r) => r.status === "returned").length}</p>
          <p className="mt-1 text-[10px] text-muted-foreground">Edit and resubmit without losing history</p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.7fr_1fr]">
        <div className="flex flex-col gap-5">
          <Panel title="In progress" description="Requests still moving through the approval chain.">
            {pending.length === 0 ? (
              <EmptyState
                icon={ClipboardCheck}
                title="No active requests"
                description="When you apply for OD or leave it appears here with its current reviewer."
                action={
                  <Button size="sm" onClick={() => setOpen(true)} className="rounded-lg">
                    Apply for OD or leave
                  </Button>
                }
              />
            ) : (
              <div className="space-y-2.5">
                {pending.map((r) => (
                  <RequestRow key={r._id} request={r} />
                ))}
              </div>
            )}
          </Panel>

          <Panel title="Decision history" description="Final and returned requests retain their full timeline.">
            {decided.length === 0 ? (
              <EmptyState icon={FileText} title="No decisions yet" description="Approved, rejected and cancelled requests are archived here." />
            ) : (
              <div className="space-y-2.5">
                {decided.map((r) => (
                  <RequestRow key={r._id} request={r} />
                ))}
              </div>
            )}
          </Panel>
        </div>

        <div className="flex flex-col gap-5">
          <Panel title="How approval works" description="Policies are configured by the campus, not hard-coded.">
            <div className="space-y-3">
              {(policies ?? []).filter((p) => p.active).map((policy) => (
                <div key={policy._id} className="rounded-xl border border-border/70 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold">{policy.name}</p>
                    <Chip className="capitalize">{policy.type}</Chip>
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    {policy.steps.map((step, i) => (
                      <span key={step} className="flex items-center gap-1.5">
                        <span className="rounded-md bg-muted px-1.5 py-0.5 capitalize">{step}</span>
                        {i < policy.steps.length - 1 && <ArrowRight className="size-2.5" />}
                      </span>
                    ))}
                  </div>
                  {policy.type === "od" && (
                    <p className="mt-2 text-[10px] text-emerald-600">
                      Approved OD {policy.attendanceEffect ? "counts toward attendance" : "does not affect attendance"}.
                    </p>
                  )}
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Before you submit" description="Faster approvals start with complete requests.">
            <div className="space-y-3">
              {[
                { icon: Upload, text: "Attach the invitation, approval or medical certificate required by the category." },
                { icon: CalendarDays, text: "Check that dates do not overlap another active request — the form validates this." },
                { icon: Info, text: "A returned request keeps its history and can be resubmitted after edits." },
                { icon: ShieldCheck, text: "You can never approve your own request. Reviewers are scope-checked." },
              ].map((item) => (
                <div key={item.text} className="flex gap-2.5">
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-lg bg-muted text-primary">
                    <item.icon className="size-3.5" />
                  </span>
                  <p className="text-[11px] leading-5 text-muted-foreground">{item.text}</p>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>New OD or leave request</DialogTitle>
            <DialogDescription>
              Profile details are added automatically. Supporting documents are required
              for OD and medical leave.
            </DialogDescription>
          </DialogHeader>

          <div className="flex rounded-xl border border-border p-1">
            {(["od", "leave"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => {
                  setType(option);
                  setCategory(option === "od" ? "hackathon" : "medical");
                }}
                className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                  type === option ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {option === "od" ? "On duty (OD)" : "Leave"}
              </button>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Category">
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categories.map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Request title">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={type === "od" ? "Event / activity name" : "Short reason label"} />
            </Field>

            {type === "od" && (
              <>
                <Field label="Organising institution">
                  <Input value={organizer} onChange={(e) => setOrganizer(e.target.value)} placeholder="e.g. IIT Bombay · Techfest" />
                </Field>
                <Field label="Venue">
                  <Input value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="e.g. Mumbai" />
                </Field>
              </>
            )}

            <Field label="Start date">
              <Input
                type="date"
                min={todayISO()}
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (e.target.value > endDate) setEndDate(e.target.value);
                }}
              />
            </Field>
            <Field label="End date">
              <Input type="date" min={startDate} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </Field>

            <Field label="Reason" className="sm:col-span-2">
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder="Explain the purpose, your selection or the medical advice. Reviewers see this."
              />
            </Field>

            <Field
              label="Supporting document"
              hint="PDF, JPG or PNG. In this demo the file name is recorded with the request."
              className="sm:col-span-2"
            >
              <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-dashed border-border bg-muted/20 px-3 py-3 text-xs text-muted-foreground transition hover:border-primary/40 hover:bg-muted/40">
                <Upload className="size-4 text-primary" />
                {documentName || "Choose a supporting document"}
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={(e) => setDocumentName(e.target.files?.[0]?.name ?? "")}
                />
              </label>
            </Field>

            <label className="flex items-center gap-2 text-xs sm:col-span-2">
              <input
                type="checkbox"
                checked={halfDay}
                onChange={(e) => setHalfDay(e.target.checked)}
                className="size-3.5 rounded border-border"
              />
              Half-day request (leave only)
            </label>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={busy} className="gap-1.5">
              {busy ? "Submitting…" : "Submit for review"} <ArrowRight className="size-3.5" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageWrap>
  );
}

function RequestRow({
  request,
}: {
  request: {
    _id: Id<"requests">;
    refNo: string;
    title: string;
    type: string;
    startDate: string;
    endDate: string;
    status: string;
    currentRole: string;
  };
}) {
  return (
    <Link
      to={`/requests/${request._id}`}
      className="flex items-center gap-3 rounded-xl border border-border/70 p-3.5 transition hover:border-primary/25 hover:bg-muted/30"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
        <ClipboardCheck className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-xs font-semibold">{request.title}</p>
          <Chip className="uppercase">{request.type}</Chip>
        </div>
        <p className="mt-0.5 text-[10px] text-muted-foreground">
          {request.refNo} · {fmtDate(request.startDate)} → {fmtDate(request.endDate)}
          {request.status !== "approved" && request.status !== "rejected" && request.currentRole !== "none"
            ? ` · with ${request.currentRole}`
            : ""}
        </p>
      </div>
      <StatusBadge status={request.status} />
      <ArrowRight className="size-3.5 shrink-0 text-muted-foreground/50" />
    </Link>
  );
}
