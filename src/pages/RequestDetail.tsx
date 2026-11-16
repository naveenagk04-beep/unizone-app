import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useAuth } from "@/hooks/use-auth";
import {
  PageWrap,
  PageHeader,
  Panel,
  StatusBadge,
  EmptyState,
  Chip,
  Loading,
  Field,
  ErrorNote,
} from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { fmtDate, fmtDateTime } from "@/lib/format";
import { useMutation, useQuery } from "convex/react";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Download,
  FileText,
  MapPin,
  RotateCcw,
  Send,
  ShieldCheck,
  UserRound,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router";
import { toast } from "sonner";

const STAFF = ["faculty", "hod", "admin"];
const TERMINAL = ["approved", "rejected", "cancelled"];

export default function RequestDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const requestId = id as Id<"requests"> | undefined;
  const request = useQuery(api.requests.get, requestId ? { requestId } : "skip");
  const policies = useQuery(api.requests.policies, {});
  const transition = useMutation(api.requests.transition);
  const cancel = useMutation(api.requests.cancel);
  const resubmit = useMutation(api.requests.resubmit);

  const [action, setAction] = useState<"approve" | "reject" | "return" | "forward" | null>(null);
  const [remarks, setRemarks] = useState("");
  const [cancelOpen, setCancelOpen] = useState(false);
  const [resubmitOpen, setResubmitOpen] = useState(false);
  const [resubmitReason, setResubmitReason] = useState("");
  const [resubmitDoc, setResubmitDoc] = useState("");
  const [busy, setBusy] = useState(false);

  if (!requestId) {
    return (
      <PageWrap>
        <EmptyState icon={ClipboardCheck} title="Request not found" description="This link is incomplete." action={<Button asChild><Link to="/requests">Back to requests</Link></Button>} />
      </PageWrap>
    );
  }

  if (request === undefined) return <Loading label="Loading request" />;
  if (request === null) {
    return (
      <PageWrap>
        <Panel>
          <EmptyState
            icon={ShieldCheck}
            title="You cannot view this request"
            description="Requests are visible only to the applicant and the reviewers responsible for their department."
            action={<Button asChild size="sm"><Link to="/dashboard">Back to dashboard</Link></Button>}
          />
        </Panel>
      </PageWrap>
    );
  }

  const role = user?.role ?? "student";
  const isStaff = STAFF.includes(role);
  const isOwner = request.userId === user?._id;
  const actionable = ["under_faculty_review", "forwarded_to_hod"].includes(request.status);
  const assignedToMe =
    isStaff &&
    (role === "admin" ||
      (request.currentRole === role && request.department === user?.department));
  const canDecide = actionable && assignedToMe && !isOwner;
  const policy = (policies ?? []).find((p) => p.type === request.type && p.active);
  const canCancel = isOwner && !TERMINAL.includes(request.status);
  const canResubmit = isOwner && request.status === "returned";

  const downloadLetter = () => {
    const text = [
      "VIDYANOVA INSTITUTE OF TECHNOLOGY",
      "Office of Academic Affairs",
      "",
      request.type === "od" ? "ON-DUTY PERMISSION LETTER" : "LEAVE APPROVAL LETTER",
      "",
      `Reference: ${request.refNo}`,
      `Date: ${fmtDate(Date.now())}`,
      "",
      `This is to certify that ${request.userName} (${request.registerNumber}), a student of`,
      `${request.department}, Year ${request.year}, Section ${request.section}, has been granted`,
      `${request.type === "od" ? "on-duty" : "leave"} permission for: ${request.title}.`,
      "",
      `From: ${fmtDate(request.startDate)}`,
      `To: ${fmtDate(request.endDate)}`,
      request.organizer ? `Organising institution: ${request.organizer}` : "",
      request.venue ? `Venue: ${request.venue}` : "",
      `Approval reference: ${request.refNo}`,
      "",
      "This letter is generated from the UniZone approval record and is valid only with",
      "the final approval entry in the campus system.",
      "",
      "Authorised by the approval workflow · Vidyanova Institute of Technology",
    ]
      .filter(Boolean)
      .join("\n");
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${request.refNo}-permission-letter.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Permission letter downloaded");
  };

  const runAction = async () => {
    if (!action) return;
    setBusy(true);
    try {
      const result = await transition({ requestId, action, remarks: remarks || undefined });
      toast.success(`Request ${String(result.status).split("_").join(" ")}`, {
        description: "The applicant and the next reviewer have been notified.",
      });
      setAction(null);
      setRemarks("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update request");
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageWrap>
      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
        <Link to={isStaff && !isOwner ? "/review" : "/requests"} className="inline-flex items-center gap-1.5 hover:text-foreground">
          <ArrowLeft className="size-3.5" />
          {isStaff && !isOwner ? "Back to approval queue" : "Back to requests"}
        </Link>
        <span className="text-border">/</span>
        <span>{request.refNo}</span>
      </div>

      <PageHeader
        eyebrow={request.type === "od" ? "On-duty request" : "Leave request"}
        title={request.title}
        description={`${request.userName} · ${request.registerNumber} · ${request.department} Year ${request.year} Section ${request.section}`}
        actions={
          <>
            <StatusBadge status={request.status} />
            {request.status === "approved" && (
              <Button size="sm" className="gap-1.5" onClick={downloadLetter}>
                <Download className="size-3.5" /> Permission letter
              </Button>
            )}
            {canCancel && (
              <Button size="sm" variant="outline" className="text-rose-600" onClick={() => setCancelOpen(true)}>
                Cancel request
              </Button>
            )}
            {canResubmit && (
              <Button size="sm" className="gap-1.5" onClick={() => setResubmitOpen(true)}>
                <RotateCcw className="size-3.5" /> Edit & resubmit
              </Button>
            )}
          </>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[1.55fr_1fr]">
        <div className="flex flex-col gap-5">
          <Panel title="Request details" description={`Submitted ${fmtDateTime(request.createdAt)}`}>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { icon: CalendarDays, label: "Dates", value: `${fmtDate(request.startDate)} → ${fmtDate(request.endDate)}${request.halfDay ? " · half day" : ""}` },
                { icon: UserRound, label: "Applied by", value: `${request.userName} (${request.registerNumber})` },
                ...(request.organizer ? [{ icon: Building2, label: "Organising institution", value: request.organizer }] : []),
                ...(request.venue ? [{ icon: MapPin, label: "Venue", value: request.venue }] : []),
                { icon: ClipboardCheck, label: "Category", value: request.category.split("_").join(" ") },
                {
                  icon: ShieldCheck,
                  label: "Attendance effect",
                  value:
                    request.type === "od"
                      ? request.attendanceEffect
                        ? "Approved OD credits attendance where the date overlaps a class"
                        : "OD does not change attendance"
                      : "Leave never creates attendance credit",
                },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-border/70 p-3.5">
                  <p className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <item.icon className="size-3" /> {item.label}
                  </p>
                  <p className="mt-1 text-xs font-medium capitalize">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-xl border border-border/70 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Reason</p>
              <p className="mt-1.5 whitespace-pre-wrap text-xs leading-6 text-foreground/90">{request.reason}</p>
            </div>

            <div className="mt-3 flex items-center gap-3 rounded-xl border border-border/70 p-3.5">
              <span className="flex size-9 items-center justify-center rounded-xl bg-muted text-primary">
                <FileText className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium">{request.documentName ?? "No supporting document attached"}</p>
                <p className="text-[10px] text-muted-foreground">
                  {request.documentName
                    ? "Private document · visible only to the applicant and assigned reviewers"
                    : "This request type does not require a document"}
                </p>
              </div>
              {request.documentName && <Chip>Verified at submission</Chip>}
            </div>
          </Panel>

          <Panel title="Approval timeline" description="Every transition is append-only and audited.">
            <div className="space-y-0">
              {request.history.map((entry, index) => {
                const last = index === request.history.length - 1;
                const done = ["approved", "rejected", "cancelled"].includes(entry.status) || !last;
                return (
                  <div key={`${entry.at}-${index}`} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span
                        className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full ${
                          entry.status === "rejected"
                            ? "bg-rose-100 text-rose-600"
                            : entry.status === "returned"
                              ? "bg-amber-100 text-amber-600"
                              : entry.status === "approved"
                                ? "bg-emerald-100 text-emerald-600"
                                : done
                                  ? "bg-indigo-100 text-indigo-600"
                                  : "border-2 border-indigo-300 bg-white text-transparent"
                        }`}
                      >
                        {entry.status === "rejected" ? (
                          <XCircle className="size-3.5" />
                        ) : (
                          <CheckCircle2 className="size-3.5" />
                        )}
                      </span>
                      {index < request.history.length - 1 && <span className="my-1 h-full min-h-8 w-px bg-border" />}
                    </div>
                    <div className="pb-5">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-xs font-semibold">
                          {entry.status === "under_faculty_review"
                            ? "Assigned to class faculty"
                            : entry.status === "forwarded_to_hod"
                              ? "Forwarded to HOD"
                              : entry.status === "submitted"
                                ? "Submitted"
                                : entry.status.split("_").join(" ")}
                        </p>
                        <Chip>{entry.actorRole}</Chip>
                      </div>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        {entry.actorName} · {fmtDateTime(entry.at)}
                      </p>
                      {entry.remarks && (
                        <p className="mt-1.5 rounded-lg bg-muted/60 px-2.5 py-1.5 text-[11px] leading-5 text-muted-foreground">
                          “{entry.remarks}”
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>
        </div>

        <div className="flex flex-col gap-5">
          {canDecide && (
            <Panel title="Your decision" description="Reviewer scope and self-approval are enforced on the server.">
              <div className="space-y-2">
                <Button
                  className="w-full justify-start gap-2"
                  disabled={request.currentRole === "faculty" && !request.finalStep}
                  onClick={() => {
                    setAction("approve");
                    setRemarks("");
                  }}
                >
                  <CheckCircle2 className="size-4" /> Approve request
                </Button>
                {request.currentRole === "faculty" && !request.finalStep && (
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                    onClick={() => {
                      setAction("forward");
                      setRemarks("");
                    }}
                  >
                    <Send className="size-4" /> Forward to HOD
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2 text-amber-700"
                  onClick={() => {
                    setAction("return");
                    setRemarks("");
                  }}
                >
                  <RotateCcw className="size-4" /> Return for changes
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2 text-rose-600"
                  onClick={() => {
                    setAction("reject");
                    setRemarks("");
                  }}
                >
                  <XCircle className="size-4" /> Reject request
                </Button>
              </div>
              <p className="mt-3 text-[10px] leading-4 text-muted-foreground">
                Approving a non-final faculty step is blocked by policy — use forward.
                Remarks are required to reject or return.
              </p>
            </Panel>
          )}

          {!canDecide && actionable && (
            <Panel title="Waiting on a reviewer">
              <div className="flex items-start gap-2.5">
                <span className="flex size-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <ClipboardCheck className="size-4" />
                </span>
                <div>
                  <p className="text-xs font-semibold capitalize">
                    Currently with {request.currentRole === "none" ? "the campus office" : request.currentRole}
                  </p>
                  <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
                    You will be notified as soon as a decision is recorded. Reviewers are
                    assigned from the active {request.type.toUpperCase()} policy.
                  </p>
                </div>
              </div>
            </Panel>
          )}

          <Panel title="Approval policy" description={policy?.name ?? "Default campus policy"}>
            <div className="space-y-2">
              {(policy?.steps ?? ["faculty", "hod"]).map((step, index) => {
                const reached =
                  request.history.some((h) =>
                    step === "faculty" ? h.actorRole === "faculty" : h.actorRole === "hod",
                  ) || request.status === "approved";
                return (
                  <div key={`${step}-${index}`} className="flex items-center gap-2.5 rounded-xl border border-border/70 p-3">
                    <span className={`flex size-6 items-center justify-center rounded-full text-[10px] font-semibold ${reached ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium capitalize">{step === "hod" ? "Head of Department" : step}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {index === (policy?.finalStepIndex ?? 1) ? "Final decision" : "Reviews and forwards"}
                      </p>
                    </div>
                    {reached && <CheckCircle2 className="size-3.5 text-emerald-500" />}
                  </div>
                );
              })}
            </div>
            {request.type === "od" && (
              <p className="mt-3 rounded-lg bg-indigo-50/70 px-2.5 py-2 text-[10px] leading-4 text-indigo-700">
                Approved OD can credit attendance only when the institution enables the
                policy flag. The credit is applied by an audited function.
              </p>
            )}
          </Panel>

          {isOwner && TERMINAL.includes(request.status) && (
            <Panel title="Final decision recorded">
              <p className="text-xs leading-5 text-muted-foreground">
                {request.status === "approved"
                  ? "Your request is approved. Keep the permission letter with you and share it with the class advisor if asked."
                  : request.status === "rejected"
                    ? "This request was rejected. You can submit a new request with corrected details or a fresh document."
                    : "You cancelled this request. The history is preserved for your records."}
              </p>
              {request.status === "approved" && (
                <Button className="mt-3 w-full gap-1.5" variant="outline" onClick={downloadLetter}>
                  <Download className="size-3.5" /> Download permission letter
                </Button>
              )}
            </Panel>
          )}

          <ErrorNote>
            Reviewers see only their department. Students see only their own requests.
            Documents and approval evidence are never public.
          </ErrorNote>
        </div>
      </div>

      <Dialog open={action !== null} onOpenChange={(open) => !open && setAction(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="capitalize">{action} request</DialogTitle>
            <DialogDescription>
              {action === "reject" || action === "return"
                ? "Remarks are required and will be visible to the student."
                : "Add an optional remark for the student and the audit trail."}
            </DialogDescription>
          </DialogHeader>
          <Field label={action === "reject" || action === "return" ? "Remarks (required)" : "Remarks (optional)"}>
            <Textarea rows={3} value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Explain your decision clearly…" />
          </Field>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAction(null)}>Cancel</Button>
            <Button onClick={runAction} disabled={busy || ((action === "reject" || action === "return") && remarks.trim().length < 3)}>
              {busy ? "Saving…" : `Confirm ${action}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this request?</AlertDialogTitle>
            <AlertDialogDescription>
              The workflow stops immediately and the cancellation is recorded in the
              timeline. You can submit a new request afterwards.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep request</AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-600 hover:bg-rose-700"
              onClick={async () => {
                try {
                  await cancel({ requestId });
                  toast.success("Request cancelled");
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Could not cancel");
                }
              }}
            >
              Cancel request
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={resubmitOpen} onOpenChange={setResubmitOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit and resubmit</DialogTitle>
            <DialogDescription>
              Update the reason or document. The existing timeline is kept and a new
              review cycle is appended.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Field label="Reason">
              <Textarea rows={3} value={resubmitReason} onChange={(e) => setResubmitReason(e.target.value)} placeholder={request.reason} />
            </Field>
            <Field label="Document name">
              <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-border px-3 py-2.5 text-xs text-muted-foreground">
                <FileText className="size-4 text-primary" />
                {resubmitDoc || request.documentName || "Choose a supporting document"}
                <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setResubmitDoc(e.target.files?.[0]?.name ?? "")} />
              </label>
            </Field>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setResubmitOpen(false)}>Cancel</Button>
            <Button
              onClick={async () => {
                try {
                  await resubmit({
                    requestId,
                    reason: resubmitReason || undefined,
                    documentName: resubmitDoc || undefined,
                  });
                  toast.success("Request resubmitted", { description: "Your class advisor has been notified." });
                  setResubmitOpen(false);
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Could not resubmit");
                }
              }}
            >
              Resubmit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageWrap>
  );
}
