import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useAuth } from "@/hooks/use-auth";
import {
  PageWrap,
  PageHeader,
  Panel,
  Stat,
  StatusBadge,
  EmptyState,
  ProgressBar,
  Chip,
  Loading,
  Field,
} from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { dayName, fmtDate, fmtShortDate, fmtTime, isoIn, toEpoch, todayISO } from "@/lib/format";
import { useMutation, useQuery } from "convex/react";
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FileText,
  GraduationCap,
  Megaphone,
  PencilLine,
  Plus,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const STAFF = ["faculty", "hod", "admin"];

export default function Academics() {
  const { user } = useAuth();
  const role = user?.role ?? "student";
  const isStaff = STAFF.includes(role);
  const overview = useQuery(api.academics.overview, {});
  const roster = useQuery(api.academics.classRoster, isStaff ? {} : "skip");
  const addAnnouncement = useMutation(api.academics.addAnnouncement);
  const createAssignment = useMutation(api.academics.createAssignment);
  const recordAttendance = useMutation(api.academics.recordAttendance);
  const submitAssignment = useMutation(api.academics.submitAssignment);
  const gradeSubmission = useMutation(api.academics.gradeSubmission);

  const [attendanceOpen, setAttendanceOpen] = useState(false);
  const [announcementOpen, setAnnouncementOpen] = useState(false);
  const [assignmentOpen, setAssignmentOpen] = useState(false);
  const [submitTarget, setSubmitTarget] = useState<{ id: Id<"assignments">; title: string; points: number } | null>(null);
  const [gradingTarget, setGradingTarget] = useState<{ id: Id<"assignments">; title: string; points: number } | null>(null);

  const [attSubject, setAttSubject] = useState("");
  const [attDate, setAttDate] = useState(todayISO());
  const [attEntries, setAttEntries] = useState<Record<string, "present" | "absent">>({});

  const [annTitle, setAnnTitle] = useState("");
  const [annBody, setAnnBody] = useState("");
  const [annAudience, setAnnAudience] = useState<"college" | "department" | "section">("department");

  const [asgTitle, setAsgTitle] = useState("");
  const [asgDescription, setAsgDescription] = useState("");
  const [asgSubject, setAsgSubject] = useState("");
  const [asgDue, setAsgDue] = useState(isoIn(7));
  const [asgPoints, setAsgPoints] = useState(20);
  const [asgSection, setAsgSection] = useState("A");

  const [submitContent, setSubmitContent] = useState("");
  const [submitFile, setSubmitFile] = useState("");
  const [gradeValue, setGradeValue] = useState(0);
  const [gradeFeedback, setGradeFeedback] = useState("");

  if (overview === undefined) return <Loading label="Loading academics" />;

  const submittedByAssignment = new Map(
    overview.submissions.map((s) => [s.assignmentId, s]),
  );
  const today = new Date().getDay();

  const openAttendance = (subject: string) => {
    setAttSubject(subject);
    setAttDate(todayISO());
    setAttEntries(Object.fromEntries((roster ?? []).map((s) => [s._id, "present" as const])));
    setAttendanceOpen(true);
  };

  return (
    <PageWrap>
      <PageHeader
        eyebrow="Academics"
        title="Your academic record, in one view"
        description={
          isStaff
            ? "Scope-aware records for your department. Attendance and marks are official — every change is audited."
            : "Attendance, marks, assignments, exams and announcements for your enrolled semester."
        }
        actions={
          isStaff ? (
            <>
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setAnnouncementOpen(true)}>
                <Megaphone className="size-3.5" /> Post announcement
              </Button>
              <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setAssignmentOpen(true)}>
                <Plus className="size-3.5" /> New assignment
              </Button>
              <Button size="sm" className="gap-1.5" onClick={() => openAttendance(overview.subjects[0]?.name ?? "")}>
                <UserCheck className="size-3.5" /> Record attendance
              </Button>
            </>
          ) : (
            <Chip className="text-[11px]">
              Semester {overview.subjects[0]?.semester ?? 5} · {overview.scope.department} {overview.scope.year}
              {overview.scope.section}
            </Chip>
          )
        }
      />

      <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Attendance" value={`${overview.attendancePercent}%`} hint="All recorded sessions" icon={TrendingUp} tone="emerald" />
        <Stat label="Subjects" value={overview.subjects.length} hint={`Semester ${overview.subjects[0]?.semester ?? 5}`} icon={BookOpen} tone="indigo" />
        <Stat label="Open assignments" value={overview.assignments.filter((a) => a.dueAt > Date.now()).length} hint="Across your scope" icon={FileText} tone="violet" />
        <Stat label="Upcoming exams" value={overview.exams.filter((e) => e.date > Date.now()).length} hint="Internal assessments" icon={CalendarDays} tone="amber" />
      </div>

      <Tabs defaultValue="overview" className="gap-5">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="timetable">Timetable & exams</TabsTrigger>
          <TabsTrigger value="announcements">Announcements</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="flex flex-col gap-5">
          <div className="grid gap-5 lg:grid-cols-2">
            <Panel title="Attendance by subject" description="Official records, updated by faculty only.">
              <div className="space-y-4">
                {overview.attendanceBySubject.map((row) => (
                  <div key={row.subject}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="truncate font-medium">{row.subject}</span>
                      <span className={row.percent < 75 ? "font-semibold text-rose-600" : "text-muted-foreground"}>
                        {row.percent}% · {row.present}/{row.total}
                      </span>
                    </div>
                    <ProgressBar
                      value={row.percent}
                      className="mt-1.5"
                      tone={row.percent < 75 ? "amber" : "emerald"}
                    />
                  </div>
                ))}
                {overview.attendanceBySubject.length === 0 && (
                  <EmptyState icon={CalendarDays} title="No attendance yet" description="Sessions recorded by your faculty will appear here." />
                )}
              </div>
            </Panel>

            {isStaff ? (
              <Panel title="Class roster" description={`${overview.scope.department} · Year ${overview.scope.year}`}>
                <div className="space-y-2">
                  {(roster ?? []).map((student) => (
                    <div key={student._id} className="flex items-center gap-3 rounded-xl border border-border/70 p-3">
                      <span className="flex size-8 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground">
                        {student.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium">{student.name}</p>
                        <p className="text-[10px] text-muted-foreground">{student.registerNumber} · Section {student.section}</p>
                      </div>
                      <Button size="sm" variant="ghost" className="text-[10px]" onClick={() => openAttendance(overview.subjects[0]?.name ?? "")}>
                        Mark attendance
                      </Button>
                    </div>
                  ))}
                  {(roster ?? []).length === 0 && (
                    <EmptyState icon={Users} title="No students in scope" description="Students from your assigned classes will appear here." />
                  )}
                </div>
              </Panel>
            ) : (
              <Panel title="Internal marks" description="Best-of internal assessment, visible only to you.">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        <th className="pb-2 font-medium">Subject</th>
                        <th className="pb-2 font-medium">Internal</th>
                        <th className="pb-2 font-medium">Practical</th>
                        <th className="pb-2 font-medium">Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {overview.marks.map((m) => (
                        <tr key={m._id} className="border-t border-border/60">
                          <td className="max-w-[180px] truncate py-2.5 font-medium">{m.subject}</td>
                          <td className="py-2.5 text-muted-foreground">{m.internal}/{m.maxInternal}</td>
                          <td className="py-2.5 text-muted-foreground">{m.practical}/20</td>
                          <td className="py-2.5"><StatusBadge status="approved" label={m.grade} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {overview.marks.length === 0 && (
                    <EmptyState icon={GraduationCap} title="No marks published" description="Your internal marks will appear once faculty publish them." />
                  )}
                </div>
              </Panel>
            )}
          </div>

          <Panel title="Subjects this semester" description="Unit structure and faculty for each subject.">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {overview.subjects.map((subject) => (
                <div key={subject._id} className="rounded-xl border border-border/70 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {subject.code}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Clock3 className="size-3" /> {subject.credits} credits
                    </span>
                  </div>
                  <p className="mt-1.5 font-display text-sm font-semibold">{subject.name}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{subject.faculty}</p>
                  <div className="mt-2.5 flex flex-wrap gap-1">
                    {subject.units.map((unit, i) => (
                      <Chip key={unit} className="text-[9px]">U{i + 1} · {unit.split(" ").slice(0, 2).join(" ")}</Chip>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </TabsContent>

        <TabsContent value="assignments">
          <Panel
            title="Assignments"
            description={isStaff ? "Create work, review submissions and publish grades." : "Submit work before the deadline. Grades appear here once reviewed."}
          >
            <div className="space-y-3">
              {overview.assignments.map((assignment) => {
                const submission = submittedByAssignment.get(assignment._id);
                const overdue = assignment.dueAt < Date.now();
                return (
                  <div
                    key={assignment._id}
                    className="flex flex-col gap-3 rounded-xl border border-border/70 p-4 sm:flex-row sm:items-center"
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                      <ClipboardList className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold">{assignment.title}</p>
                        {submission && <StatusBadge status={submission.status} label={submission.status === "graded" ? `Graded ${submission.grade}/${assignment.points}` : "Submitted"} />}
                        {!submission && overdue && <StatusBadge status="rejected" label="Overdue" />}
                      </div>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {assignment.subject} · {assignment.points} points · due {fmtDate(assignment.dueAt)}
                      </p>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{assignment.description}</p>
                      {submission?.feedback && (
                        <p className="mt-1.5 rounded-lg bg-muted/60 px-2.5 py-1.5 text-[10px] text-muted-foreground">
                          Feedback: {submission.feedback}
                        </p>
                      )}
                    </div>
                    {isStaff ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="shrink-0 gap-1.5"
                        onClick={() => setGradingTarget({ id: assignment._id, title: assignment.title, points: assignment.points })}
                      >
                        <PencilLine className="size-3.5" /> Review submissions
                      </Button>
                    ) : submission ? (
                      <Chip className="shrink-0">{submission.status === "graded" ? "Graded" : "Submitted"}</Chip>
                    ) : (
                      <Button
                        size="sm"
                        className="shrink-0 gap-1.5"
                        onClick={() => setSubmitTarget({ id: assignment._id, title: assignment.title, points: assignment.points })}
                      >
                        <FileText className="size-3.5" /> Submit
                      </Button>
                    )}
                  </div>
                );
              })}
              {overview.assignments.length === 0 && (
                <EmptyState icon={ClipboardList} title="No assignments yet" description="New work from your faculty will show up here." />
              )}
            </div>
          </Panel>
        </TabsContent>

        <TabsContent value="timetable" className="flex flex-col gap-5">
          <Panel title="Weekly timetable" description={`${overview.scope.department} · Year ${overview.scope.year} · Section ${overview.scope.section}`}>
            <div className="grid gap-3 md:grid-cols-5">
              {[1, 2, 3, 4, 5].map((day) => {
                const slots = overview.timetable.filter((s) => s.day === day).sort((a, b) => a.start.localeCompare(b.start));
                return (
                  <div key={day} className={day === today ? "rounded-xl bg-indigo-50/50 p-2" : "p-2"}>
                    <p className={`mb-2 text-[11px] font-semibold ${day === today ? "text-indigo-700" : "text-muted-foreground"}`}>
                      {dayName(day)}
                    </p>
                    <div className="space-y-2">
                      {slots.map((slot) => (
                        <div key={slot._id} className="rounded-lg border border-border/70 bg-card p-2.5">
                          <p className="text-[10px] font-semibold">{fmtTime(slot.start)}</p>
                          <p className="mt-0.5 line-clamp-2 text-[10px] leading-4">{slot.subject}</p>
                          <p className="mt-1 text-[9px] text-muted-foreground">{slot.room}</p>
                        </div>
                      ))}
                      {slots.length === 0 && <p className="text-[10px] text-muted-foreground">No classes</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>

          <Panel title="Upcoming exams" description="Internal assessment schedule.">
            <div className="space-y-2.5">
              {overview.exams.map((exam) => (
                <div key={exam._id} className="flex items-center gap-3 rounded-xl border border-border/70 p-3.5">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                    <CalendarDays className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold">{exam.subject}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {exam.type} · {fmtDate(exam.date)} · {exam.startTime} · {exam.room}
                    </p>
                  </div>
                  <Chip>{fmtShortDate(exam.date)}</Chip>
                </div>
              ))}
              {overview.exams.length === 0 && (
                <EmptyState icon={CalendarDays} title="No exams scheduled" description="The exam timetable will appear here once published." />
              )}
            </div>
          </Panel>
        </TabsContent>

        <TabsContent value="announcements">
          <Panel
            title="Announcements"
            description="Official notices from faculty and the campus office."
            action={
              isStaff ? (
                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setAnnouncementOpen(true)}>
                  <Megaphone className="size-3.5" /> Post
                </Button>
              ) : undefined
            }
          >
            <div className="space-y-3">
              {overview.announcements.map((a) => (
                <div key={a._id} className="rounded-xl border border-border/70 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold">{a.title}</p>
                    {a.pinned && <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[9px] font-semibold text-amber-700">Pinned</span>}
                    <Chip className="ml-auto capitalize">{a.audience}</Chip>
                  </div>
                  <p className="mt-1.5 text-xs leading-5 text-muted-foreground">{a.body}</p>
                  <p className="mt-2 text-[10px] text-muted-foreground/70">
                    {a.authorName} · {a.authorRole} · {fmtDate(a.createdAt)}
                  </p>
                </div>
              ))}
              {overview.announcements.length === 0 && (
                <EmptyState icon={Megaphone} title="No announcements" description="Campus notices will appear here." />
              )}
            </div>
          </Panel>
        </TabsContent>
      </Tabs>

      <Dialog open={attendanceOpen} onOpenChange={setAttendanceOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Record attendance</DialogTitle>
            <DialogDescription>
              Official records are written with an audit entry and a notification to each student.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Subject">
              <Select value={attSubject} onValueChange={setAttSubject}>
                <SelectTrigger><SelectValue placeholder="Choose subject" /></SelectTrigger>
                <SelectContent>
                  {overview.subjects.map((s) => (
                    <SelectItem key={s._id} value={s.name}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Date">
              <Input type="date" value={attDate} max={todayISO()} onChange={(e) => setAttDate(e.target.value)} />
            </Field>
          </div>
          <div className="max-h-[300px] space-y-2 overflow-y-auto">
            {(roster ?? []).map((student) => {
              const status = attEntries[student._id] ?? "present";
              return (
                <div key={student._id} className="flex items-center gap-3 rounded-xl border border-border/70 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium">{student.name}</p>
                    <p className="text-[10px] text-muted-foreground">{student.registerNumber}</p>
                  </div>
                  <div className="flex rounded-lg border border-border p-0.5">
                    {(["present", "absent"] as const).map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setAttEntries((prev) => ({ ...prev, [student._id]: option }))}
                        className={`rounded-md px-2.5 py-1 text-[10px] font-medium capitalize transition ${
                          status === option
                            ? option === "present"
                              ? "bg-emerald-600 text-white"
                              : "bg-rose-600 text-white"
                            : "text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
            {(roster ?? []).length === 0 && (
              <p className="py-6 text-center text-xs text-muted-foreground">No students in your scope.</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAttendanceOpen(false)}>Cancel</Button>
            <Button
              disabled={!attSubject || !(roster ?? []).length}
              onClick={async () => {
                try {
                  await recordAttendance({
                    subject: attSubject,
                    date: attDate,
                    entries: (roster ?? []).map((s) => ({
                      studentId: s._id,
                      status: attEntries[s._id] ?? "present",
                    })),
                  });
                  toast.success("Attendance recorded", { description: "Students were notified and the action was audited." });
                  setAttendanceOpen(false);
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Could not record attendance");
                }
              }}
            >
              Save attendance
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={announcementOpen} onOpenChange={setAnnouncementOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Post an announcement</DialogTitle>
            <DialogDescription>Visible to the audience you choose, within your department scope.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Field label="Title">
              <Input value={annTitle} onChange={(e) => setAnnTitle(e.target.value)} placeholder="e.g. IA-II schedule published" />
            </Field>
            <Field label="Audience">
              <Select value={annAudience} onValueChange={(v) => setAnnAudience(v as typeof annAudience)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="college">Whole college</SelectItem>
                  <SelectItem value="department">My department</SelectItem>
                  <SelectItem value="section">My section</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Message">
              <Textarea value={annBody} onChange={(e) => setAnnBody(e.target.value)} rows={4} placeholder="Write a clear, useful notice…" />
            </Field>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAnnouncementOpen(false)}>Cancel</Button>
            <Button
              onClick={async () => {
                try {
                  await addAnnouncement({ title: annTitle, body: annBody, audience: annAudience });
                  toast.success("Announcement posted");
                  setAnnTitle("");
                  setAnnBody("");
                  setAnnouncementOpen(false);
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Could not post announcement");
                }
              }}
            >
              Publish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={assignmentOpen} onOpenChange={setAssignmentOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create assignment</DialogTitle>
            <DialogDescription>Students in the selected section are notified when they open the app.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Title" className="sm:col-span-2">
              <Input value={asgTitle} onChange={(e) => setAsgTitle(e.target.value)} placeholder="What should students do?" />
            </Field>
            <Field label="Subject">
              <Select value={asgSubject} onValueChange={setAsgSubject}>
                <SelectTrigger><SelectValue placeholder="Choose subject" /></SelectTrigger>
                <SelectContent>
                  {overview.subjects.map((s) => (
                    <SelectItem key={s._id} value={s.name}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Due date">
              <Input type="date" value={asgDue} min={todayISO()} onChange={(e) => setAsgDue(e.target.value)} />
            </Field>
            <Field label="Points">
              <Input type="number" min={1} value={asgPoints} onChange={(e) => setAsgPoints(Number(e.target.value))} />
            </Field>
            <Field label="Section">
              <Input value={asgSection} onChange={(e) => setAsgSection(e.target.value.toUpperCase().slice(0, 2))} />
            </Field>
            <Field label="Description" className="sm:col-span-2">
              <Textarea value={asgDescription} onChange={(e) => setAsgDescription(e.target.value)} rows={4} placeholder="Instructions, deliverables and marking notes…" />
            </Field>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setAssignmentOpen(false)}>Cancel</Button>
            <Button
              onClick={async () => {
                try {
                  await createAssignment({
                    title: asgTitle,
                    description: asgDescription,
                    subject: asgSubject,
                    dueAt: toEpoch(asgDue) + 14 * 3_600_000,
                    points: asgPoints,
                    section: asgSection || "A",
                  });
                  toast.success("Assignment created");
                  setAsgTitle("");
                  setAsgDescription("");
                  setAssignmentOpen(false);
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Could not create assignment");
                }
              }}
            >
              Create assignment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={submitTarget !== null} onOpenChange={(open) => !open && setSubmitTarget(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Submit · {submitTarget?.title}</DialogTitle>
            <DialogDescription>Worth {submitTarget?.points} points. Add a short note and any file name you are attaching in class.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Field label="Submission note">
              <Textarea value={submitContent} onChange={(e) => setSubmitContent(e.target.value)} rows={4} placeholder="What did you complete, and where should the reviewer look?" />
            </Field>
            <Field label="Attachment name" hint="File upload is represented by name in this demo; production stores it privately with type and size checks.">
              <Input value={submitFile} onChange={(e) => setSubmitFile(e.target.value)} placeholder="normalisation-report.pdf" />
            </Field>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSubmitTarget(null)}>Cancel</Button>
            <Button
              onClick={async () => {
                if (!submitTarget) return;
                try {
                  await submitAssignment({
                    assignmentId: submitTarget.id,
                    content: submitContent,
                    fileName: submitFile || undefined,
                  });
                  toast.success("Assignment submitted", { description: "Your faculty can now review it." });
                  setSubmitContent("");
                  setSubmitFile("");
                  setSubmitTarget(null);
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Could not submit");
                }
              }}
            >
              Submit assignment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <GradingDialog
        target={gradingTarget}
        onClose={() => setGradingTarget(null)}
        gradeValue={gradeValue}
        setGradeValue={setGradeValue}
        feedback={gradeFeedback}
        setFeedback={setGradeFeedback}
        onGrade={async (submissionId) => {
          try {
            await gradeSubmission({ submissionId, grade: gradeValue, feedback: gradeFeedback || undefined });
            toast.success("Grade published", { description: "The student was notified." });
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Could not publish grade");
          }
        }}
      />
    </PageWrap>
  );
}

function GradingDialog({
  target,
  onClose,
  gradeValue,
  setGradeValue,
  feedback,
  setFeedback,
  onGrade,
}: {
  target: { id: Id<"assignments">; title: string; points: number } | null;
  onClose: () => void;
  gradeValue: number;
  setGradeValue: (n: number) => void;
  feedback: string;
  setFeedback: (s: string) => void;
  onGrade: (id: Id<"submissions">) => Promise<void>;
}) {
  const submissions = useQuery(
    api.academics.submissionsForAssignment,
    target ? { assignmentId: target.id } : "skip",
  );
  return (
    <Dialog open={target !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Review · {target?.title}</DialogTitle>
          <DialogDescription>Grade out of {target?.points}. The student is notified when you publish.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {(submissions ?? []).map((submission) => (
            <div key={submission._id} className="rounded-xl border border-border/70 p-3.5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold">{submission.userName}</p>
                <StatusBadge status={submission.status} />
              </div>
              <p className="mt-1.5 text-[11px] leading-5 text-muted-foreground">{submission.content}</p>
              {submission.fileName && <p className="mt-1 text-[10px] text-primary">{submission.fileName}</p>}
              <div className="mt-3 flex flex-wrap items-end gap-2">
                <Field label={`Score / ${target?.points ?? 0}`} className="w-20">
                  <Input type="number" min={0} max={target?.points ?? 100} value={gradeValue} onChange={(e) => setGradeValue(Number(e.target.value))} />
                </Field>
                <Field label="Feedback" className="min-w-[160px] flex-1">
                  <Input value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder="Short, useful feedback" />
                </Field>
                <Button size="sm" disabled={submission.status === "graded"} onClick={() => onGrade(submission._id)}>
                  {submission.status === "graded" ? "Graded" : "Publish grade"}
                </Button>
              </div>
            </div>
          ))}
          {(submissions ?? []).length === 0 && (
            <EmptyState icon={CheckCircle2} title="No submissions yet" description="Student submissions will appear here." />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
