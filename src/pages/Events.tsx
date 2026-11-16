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
  ProgressBar,
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
import { fmtDate, fmtDateTime, fmtShortDate, inr, isoIn } from "@/lib/format";
import { useMutation, useQuery } from "convex/react";
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  MapPin,
  Plus,
  Ticket,
  Users,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";

const THEMES: Record<string, string> = {
  indigo: "from-indigo-600 via-violet-600 to-violet-700",
  violet: "from-violet-600 via-purple-600 to-fuchsia-600",
  cyan: "from-sky-600 via-cyan-600 to-teal-600",
  amber: "from-amber-500 via-orange-500 to-rose-500",
  emerald: "from-emerald-600 via-teal-600 to-cyan-700",
};

const STAFF = ["event_coordinator", "admin"];

export default function Events() {
  const { user } = useAuth();
  const role = user?.role ?? "student";
  const isCoordinator = STAFF.includes(role);
  const events = useQuery(api.events.list, {});
  const mine = useQuery(api.events.mine, role === "student" ? {} : "skip");
  const register = useMutation(api.events.register);
  const cancelRegistration = useMutation(api.events.cancelRegistration);
  const createEvent = useMutation(api.events.createEvent);
  const setRegistrationOpen = useMutation(api.events.setRegistrationOpen);

  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState("Workshop");
  const [description, setDescription] = useState("");
  const [venue, setVenue] = useState("");
  const [startDate, setStartDate] = useState(isoIn(14));
  const [endDate, setEndDate] = useState(isoIn(14));
  const [fee, setFee] = useState(0);
  const [capacity, setCapacity] = useState(100);
  const [tags, setTags] = useState("");
  const [manageEvent, setManageEvent] = useState<Id<"events"> | null>(null);
  const registrations = useQuery(
    api.events.registrationsForEvent,
    manageEvent ? { eventId: manageEvent } : "skip",
  );

  if (events === undefined) return <Loading label="Loading campus events" />;

  const upcoming = events.filter((e) => e.endAt > Date.now());
  const past = events.filter((e) => e.endAt <= Date.now());
  const totalRegistrations = events.reduce((sum, e) => sum + e.registrationCount, 0);

  return (
    <PageWrap>
      <PageHeader
        eyebrow={isCoordinator ? "Event studio" : "Campus events"}
        title={isCoordinator ? "Publish and manage campus events" : "Something is always happening"}
        description={
          isCoordinator
            ? "Create events, watch seats fill and manage registrations. Registration never implies OD approval."
            : "Symposiums, workshops, hackathons and cultural nights. Register in one tap; apply for OD separately."
        }
        actions={
          isCoordinator ? (
            <Button size="sm" className="gap-1.5" onClick={() => setCreateOpen(true)}>
              <Plus className="size-3.5" /> Create event
            </Button>
          ) : (
            <Chip className="gap-1.5"><Ticket className="size-3" /> {mine?.length ?? 0} registrations</Chip>
          )
        }
      />

      <div className="grid gap-3.5 sm:grid-cols-3">
        <div className="uz-card p-5">
          <p className="text-xs text-muted-foreground">Live events</p>
          <p className="mt-2 font-display text-2xl font-bold">{upcoming.filter((e) => e.registrationOpen).length}</p>
          <p className="mt-1 text-[10px] text-muted-foreground">Registration open now</p>
        </div>
        <div className="uz-card p-5">
          <p className="text-xs text-muted-foreground">Total registrations</p>
          <p className="mt-2 font-display text-2xl font-bold">{totalRegistrations}</p>
          <p className="mt-1 text-[10px] text-muted-foreground">Across all campus events</p>
        </div>
        <div className="uz-card p-5">
          <p className="text-xs text-muted-foreground">Free events</p>
          <p className="mt-2 font-display text-2xl font-bold">{upcoming.filter((e) => e.fee === 0).length}</p>
          <p className="mt-1 text-[10px] text-muted-foreground">No fee required</p>
        </div>
      </div>

      {role === "student" && (mine ?? []).length > 0 && (
        <Panel title="Your registrations" description="A reminder notification is scheduled before each event.">
          <div className="grid gap-2.5 sm:grid-cols-2">
            {(mine ?? []).map(({ event, registration }) =>
              event ? (
                <div key={registration._id} className="flex items-center gap-3 rounded-xl border border-border/70 p-3.5">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <Ticket className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold">{event.title}</p>
                    <p className="text-[10px] text-muted-foreground">{fmtShortDate(event.startAt)} · {event.venue}</p>
                  </div>
                  <Button asChild size="sm" variant="ghost" className="shrink-0 gap-1 text-[10px]">
                    <Link to="/requests">Apply OD <ArrowRight className="size-3" /></Link>
                  </Button>
                </div>
              ) : null,
            )}
          </div>
        </Panel>
      )}

      <div>
        <h2 className="font-display text-lg font-semibold">Upcoming</h2>
        <div className="mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {upcoming.map((event) => {
            const seatsLeft = Math.max(0, event.capacity - event.registrationCount);
            const full = seatsLeft === 0;
            const started = event.startAt < Date.now();
            return (
              <div key={event._id} className="uz-card uz-card-hover flex flex-col overflow-hidden">
                <div className={`relative bg-gradient-to-br ${THEMES[event.theme] ?? THEMES.indigo} p-4 text-white`}>
                  <div className="absolute right-3 top-3 rounded-xl bg-white/15 px-2.5 py-1 text-center backdrop-blur">
                    <p className="text-[9px] uppercase tracking-wider text-white/70">{new Date(event.startAt).toLocaleDateString("en-IN", { month: "short" })}</p>
                    <p className="font-display text-base font-bold leading-none">{new Date(event.startAt).getDate()}</p>
                  </div>
                  <span className="rounded-full bg-white/15 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider backdrop-blur">
                    {event.type}
                  </span>
                  <p className="mt-3 line-clamp-2 pr-12 font-display text-[15px] font-bold leading-snug">{event.title}</p>
                  <p className="mt-1 text-[10px] text-white/70">{event.coordinatorName}</p>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <p className="line-clamp-2 text-[11px] leading-5 text-muted-foreground">{event.description}</p>
                  <div className="mt-2.5 space-y-1 text-[10px] text-muted-foreground">
                    <p className="flex items-center gap-1.5"><Clock3 className="size-3" /> {fmtDateTime(event.startAt)}</p>
                    <p className="flex items-center gap-1.5"><MapPin className="size-3" /> {event.venue}</p>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {event.tags.map((tag) => <Chip key={tag}>{tag}</Chip>)}
                  </div>
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>{event.registrationCount}/{event.capacity} registered</span>
                      <span>{full ? "Full" : `${seatsLeft} seats left`}</span>
                    </div>
                    <ProgressBar value={(event.registrationCount / event.capacity) * 100} className="mt-1.5" tone={full ? "amber" : "indigo"} />
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-3">
                    <span className="text-xs font-semibold">{event.fee === 0 ? "Free entry" : inr(event.fee)}</span>
                    {isCoordinator ? (
                      <Button size="sm" variant="outline" className="h-7 gap-1 px-2.5 text-[10px]" onClick={() => setManageEvent(event._id)}>
                        <Users className="size-3" /> Registrations
                      </Button>
                    ) : event.registered ? (
                      <div className="flex gap-1.5">
                        <Chip className="border-emerald-200 bg-emerald-50 text-emerald-700"><CheckCircle2 className="mr-1 size-3" /> Registered</Chip>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-[10px] text-muted-foreground"
                          onClick={async () => {
                            try {
                              await cancelRegistration({ eventId: event._id });
                              toast.success("Registration cancelled");
                            } catch (error) {
                              toast.error(error instanceof Error ? error.message : "Could not cancel");
                            }
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        className="h-7 gap-1 px-2.5 text-[10px]"
                        disabled={full || !event.registrationOpen || started}
                        onClick={async () => {
                          try {
                            await register({ eventId: event._id });
                            toast.success("You're registered", { description: "A reminder will arrive before the event. Apply for OD separately if you need it." });
                          } catch (error) {
                            toast.error(error instanceof Error ? error.message : "Could not register");
                          }
                        }}
                      >
                        {full ? "Event full" : started ? "Started" : "Register"} <ArrowRight className="size-3" />
                      </Button>
                    )}
                  </div>
                  {isCoordinator && (
                    <button
                      type="button"
                      onClick={async () => {
                        await setRegistrationOpen({ eventId: event._id, open: !event.registrationOpen });
                        toast.success(event.registrationOpen ? "Registration closed" : "Registration opened");
                      }}
                      className="mt-2 text-left text-[9px] font-medium text-primary"
                    >
                      {event.registrationOpen ? "Close registration" : "Open registration"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {upcoming.length === 0 && (
            <div className="md:col-span-2 xl:col-span-3">
              <EmptyState icon={CalendarDays} title="No upcoming events" description="New campus events will appear here once published." />
            </div>
          )}
        </div>
      </div>

      {past.length > 0 && (
        <Panel title="Past events" description="Records for reference.">
          <div className="space-y-2">
            {past.map((event) => (
              <div key={event._id} className="flex items-center gap-3 rounded-xl border border-border/70 p-3">
                <CalendarDays className="size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium">{event.title}</p>
                  <p className="text-[10px] text-muted-foreground">{fmtDate(event.startAt)} · {event.venue}</p>
                </div>
                <Chip>{event.registrationCount} attended</Chip>
              </div>
            ))}
          </div>
        </Panel>
      )}

      <div className="flex items-start gap-2.5 rounded-xl border border-indigo-100 bg-indigo-50/50 px-4 py-3">
        <ClipboardCheck className="mt-0.5 size-4 shrink-0 text-indigo-600" />
        <p className="text-[11px] leading-5 text-indigo-900/80">
          <span className="font-semibold">Registration is not OD approval.</span> If you
          need attendance credit, apply separately from OD & Leave with the event
          invitation. Capacity and duplicate registrations are enforced on the server.
        </p>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create an event</DialogTitle>
            <DialogDescription>Published events appear immediately with registration open.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Title" className="sm:col-span-2">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Campus Robotics Challenge" />
            </Field>
            <Field label="Type">
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Symposium", "Workshop", "Hackathon", "Competition", "Cultural", "Sports"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Venue">
              <Input value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="e.g. Main Auditorium" />
            </Field>
            <Field label="Start date">
              <Input type="date" min={isoIn(0)} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </Field>
            <Field label="End date">
              <Input type="date" min={startDate} value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </Field>
            <Field label="Fee (₹)">
              <Input type="number" min={0} value={fee} onChange={(e) => setFee(Number(e.target.value))} />
            </Field>
            <Field label="Capacity">
              <Input type="number" min={1} value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} />
            </Field>
            <Field label="Description" className="sm:col-span-2">
              <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What should students expect?" />
            </Field>
            <Field label="Tags" hint="Comma separated" className="sm:col-span-2">
              <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Hackathon, Team, Tech" />
            </Field>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button
              onClick={async () => {
                try {
                  await createEvent({
                    title,
                    type,
                    description,
                    venue,
                    startAt: new Date(`${startDate}T09:00:00`).getTime(),
                    endAt: new Date(`${endDate}T18:00:00`).getTime(),
                    fee,
                    capacity,
                    tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
                  });
                  toast.success("Event published");
                  setTitle("");
                  setDescription("");
                  setVenue("");
                  setCreateOpen(false);
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Could not create event");
                }
              }}
            >
              Publish event
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={manageEvent !== null} onOpenChange={(open) => !open && setManageEvent(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Registrations</DialogTitle>
            <DialogDescription>
              {(registrations ?? []).length} participant(s) · only coordinators and admins can see this list.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {(registrations ?? []).map((registration) => (
              <div key={registration._id} className="flex items-center gap-3 rounded-xl border border-border/70 p-3">
                <span className="flex size-8 items-center justify-center rounded-full bg-muted text-[10px] font-semibold">
                  {registration.userName.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium">{registration.userName}</p>
                  <p className="text-[10px] text-muted-foreground">Registered {fmtDateTime(registration.createdAt)}</p>
                </div>
                <BadgeCheck className="size-4 text-emerald-500" />
              </div>
            ))}
            {(registrations ?? []).length === 0 && (
              <EmptyState icon={Users} title="No registrations yet" description="Students will appear here as they register." />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </PageWrap>
  );
}
