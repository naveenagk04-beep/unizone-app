import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useAuth } from "@/hooks/use-auth";
import {
  PageWrap,
  PageHeader,
  Panel,
  EmptyState,
  Chip,
  Loading,
  Field,
  StatusBadge,
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
import { fmtDate, fmtDateTime, todayISO } from "@/lib/format";
import { useMutation, useQuery } from "convex/react";
import {
  CheckCircle2,
  Eye,
  FileSearch,
  Lock,
  PackageSearch,
  Plus,
  Search,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const STAFF = ["admin", "hod", "faculty"];
const CATEGORIES = ["Electronics", "Personal item", "ID card", "Books", "Clothing", "Keys", "Other"];
const EMOJI = ["📦", "🎧", "🧴", "🪪", "🧮", "📚", "🔑", "👟", "⌚", "🎒"];

export default function LostFound() {
  const { user } = useAuth();
  const isStaff = STAFF.includes(user?.role ?? "");
  const items = useQuery(api.lostfound.list, {});
  const mine = useQuery(api.lostfound.mine, {});
  const create = useMutation(api.lostfound.create);
  const claim = useMutation(api.lostfound.claim);
  const decideClaim = useMutation(api.lostfound.decideClaim);
  const markResolved = useMutation(api.lostfound.markResolved);

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [reportOpen, setReportOpen] = useState(false);
  const [claimTarget, setClaimTarget] = useState<{ id: Id<"lostFound">; title: string } | null>(null);
  const [manageItem, setManageItem] = useState<Id<"lostFound"> | null>(null);
  const [evidence, setEvidence] = useState("");

  const [type, setType] = useState<"lost" | "found">("lost");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Electronics");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState(todayISO());
  const [contact, setContact] = useState("");
  const [emoji, setEmoji] = useState("📦");

  const claims = useQuery(api.lostfound.claimsForItem, manageItem ? { itemId: manageItem } : "skip");

  if (items === undefined) return <Loading label="Loading lost & found" />;

  const filtered = items
    .filter((i) => (filter === "all" ? true : i.type === filter))
    .filter((i) =>
      query.trim()
        ? `${i.title} ${i.description} ${i.location} ${i.category}`.toLowerCase().includes(query.toLowerCase())
        : true,
    );

  return (
    <PageWrap>
      <PageHeader
        eyebrow="Lost & Found"
        title="Reunite people with their things"
        description="Public reports show the item only. Claim evidence and contact details stay with the claimant and authorised staff."
        actions={
          <>
            {isStaff && <Chip className="gap-1.5"><ShieldCheck className="size-3" /> Staff verification</Chip>}
            <Button size="sm" className="gap-1.5" onClick={() => setReportOpen(true)}>
              <Plus className="size-3.5" /> Report an item
            </Button>
          </>
        }
      />

      <div className="grid gap-3.5 sm:grid-cols-3">
        <div className="uz-card p-5">
          <p className="text-xs text-muted-foreground">Open cases</p>
          <p className="mt-2 font-display text-2xl font-bold">{items.filter((i) => i.status === "open").length}</p>
          <p className="mt-1 text-[10px] text-muted-foreground">Waiting to be matched</p>
        </div>
        <div className="uz-card p-5">
          <p className="text-xs text-muted-foreground">Claimed</p>
          <p className="mt-2 font-display text-2xl font-bold">{items.filter((i) => i.status === "claimed").length}</p>
          <p className="mt-1 text-[10px] text-muted-foreground">Ownership verified by staff</p>
        </div>
        <div className="uz-card p-5">
          <p className="text-xs text-muted-foreground">Returned</p>
          <p className="mt-2 font-display text-2xl font-bold">{items.filter((i) => i.status === "resolved").length}</p>
          <p className="mt-1 text-[10px] text-muted-foreground">Closed with an audit entry</p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.7fr_1fr]">
        <Panel
          title="Campus reports"
          description="Search by item, place or category."
          action={
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search…" className="h-8 w-[150px] rounded-lg pl-8 text-xs" />
              </div>
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="h-8 w-[110px] rounded-lg text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All reports</SelectItem>
                  <SelectItem value="lost">Lost</SelectItem>
                  <SelectItem value="found">Found</SelectItem>
                </SelectContent>
              </Select>
            </div>
          }
        >
          {filtered.length === 0 ? (
            <EmptyState icon={PackageSearch} title="No matching reports" description="Try a broader search, or report your lost item so others can spot it." />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {filtered.map((item) => (
                <div key={item._id} className="uz-card flex flex-col p-4">
                  <div className="flex items-start justify-between">
                    <span className="flex size-11 items-center justify-center rounded-xl bg-muted text-xl">{item.emoji}</span>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase ${item.type === "lost" ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}>
                        {item.type}
                      </span>
                      <StatusBadge status={item.status} />
                    </div>
                  </div>
                  <p className="mt-2.5 text-sm font-semibold">{item.title}</p>
                  <p className="mt-1 line-clamp-3 text-[11px] leading-5 text-muted-foreground">{item.description}</p>
                  <div className="mt-2 space-y-0.5 text-[10px] text-muted-foreground">
                    <p>{item.location} · {fmtDate(item.date)}</p>
                    <p>Reported by {item.reporterName}{item.isMine ? " (you)" : ""}</p>
                  </div>
                  {item.contact && (
                    <p className="mt-1.5 flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-1 text-[9px] text-amber-800">
                      <Lock className="size-2.5" /> Contact visible to staff only
                    </p>
                  )}
                  <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-3">
                    <span className="text-[10px] text-muted-foreground">{fmtDate(item.createdAt)}</span>
                    <div className="flex gap-1.5">
                      {isStaff && (
                        <Button size="sm" variant="outline" className="h-7 gap-1 px-2 text-[10px]" onClick={() => setManageItem(item._id)}>
                          <Eye className="size-3" /> Claims
                        </Button>
                      )}
                      {!item.isMine && item.status === "open" && (
                        <Button size="sm" className="h-7 gap-1 px-2 text-[10px]" onClick={() => setClaimTarget({ id: item._id, title: item.title })}>
                          This is mine
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <div className="flex flex-col gap-5">
          <Panel title="Your activity" description="Your reports and the claims you submitted.">
            {(mine?.reports.length ?? 0) === 0 && (mine?.claims.length ?? 0) === 0 ? (
              <p className="py-4 text-center text-[11px] text-muted-foreground">You haven't reported or claimed anything yet.</p>
            ) : (
              <div className="space-y-2">
                {(mine?.reports ?? []).map((report) => (
                  <div key={report._id} className="flex items-center gap-2.5 rounded-xl border border-border/70 p-2.5">
                    <span className="text-base">{report.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] font-medium">{report.title}</p>
                      <p className="text-[9px] text-muted-foreground">Your report · {fmtDate(report.date)}</p>
                    </div>
                    <StatusBadge status={report.status} />
                  </div>
                ))}
                {(mine?.claims ?? []).map(({ claim: c, item }) => (
                  <div key={c._id} className="flex items-center gap-2.5 rounded-xl border border-border/70 p-2.5">
                    <span className="flex size-7 items-center justify-center rounded-lg bg-muted text-muted-foreground"><UserRound className="size-3.5" /></span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] font-medium">Claim · {item?.title}</p>
                      <p className="text-[9px] text-muted-foreground">{fmtDateTime(c.createdAt)}</p>
                    </div>
                    <StatusBadge status={c.status} />
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <Panel title="How verification works" description="Privacy is built into the workflow.">
            <div className="space-y-3">
              {[
                ["Report with details", "Describe the item, where it was lost or found, and a staff-only contact."],
                ["Claim with evidence", "The owner submits distinguishing details that only the real owner would know."],
                ["Staff verify", "Authorised staff compare evidence and approve or reject the claim."],
                ["Return is audited", "Only staff mark an item returned, and the action is logged."],
              ].map(([title, body], i) => (
                <div key={title} className="flex gap-2.5">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/8 text-[10px] font-bold text-primary">{i + 1}</span>
                  <div>
                    <p className="text-[11px] font-semibold">{title}</p>
                    <p className="text-[10px] leading-4 text-muted-foreground">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>

      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Report a lost or found item</DialogTitle>
            <DialogDescription>Contact details are private and shown only to authorised staff.</DialogDescription>
          </DialogHeader>
          <div className="flex rounded-xl border border-border p-1">
            {(["lost", "found"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setType(option)}
                className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition ${type === option ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
              >
                I {option} something
              </button>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Item title" className="sm:col-span-2">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Black Sony headphones" />
            </Field>
            <Field label="Category">
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Date">
              <Input type="date" max={todayISO()} value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>
            <Field label="Location" className="sm:col-span-2">
              <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Where did it happen?" />
            </Field>
            <Field label="Description" className="sm:col-span-2">
              <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Colour, markings, contents — enough to identify it." />
            </Field>
            <Field label="Private contact" hint="Visible to campus staff only" className="sm:col-span-2">
              <Input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Email or phone" />
            </Field>
            <div className="sm:col-span-2">
              <p className="mb-1.5 text-xs font-medium">Icon</p>
              <div className="flex flex-wrap gap-1.5">
                {EMOJI.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setEmoji(e)}
                    className={`flex size-8 items-center justify-center rounded-lg border text-base transition ${emoji === e ? "border-primary bg-primary/10" : "border-border hover:bg-muted"}`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setReportOpen(false)}>Cancel</Button>
            <Button
              onClick={async () => {
                try {
                  await create({ type, title, category, description, location, date, contact, emoji });
                  toast.success("Report published", { description: "Staff can now help match it with a claim." });
                  setTitle("");
                  setDescription("");
                  setLocation("");
                  setContact("");
                  setReportOpen(false);
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Could not publish report");
                }
              }}
            >
              Publish report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={claimTarget !== null} onOpenChange={(open) => !open && setClaimTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Claim · {claimTarget?.title}</DialogTitle>
            <DialogDescription>
              Only the claimant and authorised staff can read this evidence. Describe
              something only the owner would know.
            </DialogDescription>
          </DialogHeader>
          <Field label="Ownership evidence">
            <Textarea rows={4} value={evidence} onChange={(e) => setEvidence(e.target.value)} placeholder="Serial number, contents, a photo reference, a distinguishing mark…" />
          </Field>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setClaimTarget(null)}>Cancel</Button>
            <Button
              onClick={async () => {
                if (!claimTarget) return;
                try {
                  await claim({ itemId: claimTarget.id, evidence });
                  toast.success("Claim submitted", { description: "Authorised staff will verify it and update you." });
                  setEvidence("");
                  setClaimTarget(null);
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Could not submit claim");
                }
              }}
            >
              Submit claim
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={manageItem !== null} onOpenChange={(open) => !open && setManageItem(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Verify claims</DialogTitle>
            <DialogDescription>Staff-only view. Approving a claim marks the item claimed; returning it closes the case.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {(claims ?? []).map((c) => (
              <div key={c._id} className="rounded-xl border border-border/70 p-3.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold">{c.userName}</p>
                  <StatusBadge status={c.status} />
                </div>
                <p className="mt-1.5 rounded-lg bg-muted/50 px-2.5 py-2 text-[11px] leading-5 text-muted-foreground">{c.evidence}</p>
                <p className="mt-1 text-[9px] text-muted-foreground">{fmtDateTime(c.createdAt)}</p>
                {c.status === "pending" && (
                  <div className="mt-2 flex gap-2">
                    <Button
                      size="sm"
                      className="h-7 gap-1 text-[10px]"
                      onClick={async () => {
                        await decideClaim({ claimId: c._id, decision: "approved" });
                        toast.success("Claim approved");
                      }}
                    >
                      <CheckCircle2 className="size-3" /> Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-[10px] text-rose-600"
                      onClick={async () => {
                        await decideClaim({ claimId: c._id, decision: "rejected" });
                        toast.success("Claim rejected");
                      }}
                    >
                      Reject
                    </Button>
                  </div>
                )}
              </div>
            ))}
            {(claims ?? []).length === 0 && (
              <EmptyState icon={FileSearch} title="No claims yet" description="Owners can submit evidence from the report card." />
            )}
          </div>
          {manageItem && (
            <div className="flex justify-end border-t border-border/60 pt-3">
              <Button
                variant="outline"
                className="gap-1.5"
                onClick={async () => {
                  try {
                    await markResolved({ itemId: manageItem });
                    toast.success("Item marked as returned", { description: "The reporter was notified and the action was audited." });
                    setManageItem(null);
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : "Could not update item");
                  }
                }}
              >
                <ShieldCheck className="size-3.5" /> Mark returned
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PageWrap>
  );
}
