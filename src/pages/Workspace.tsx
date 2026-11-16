import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
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
import { fmtShortDate, isoIn, todayISO } from "@/lib/format";
import { useMutation, useQuery } from "convex/react";
import {
  Bookmark,
  CalendarDays,
  Check,
  CheckSquare,
  ExternalLink,
  Pin,
  PinOff,
  Plus,
  Sparkles,
  StickyNote,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";

export default function Workspace() {
  const data = useQuery(api.productivity.overview, {});
  const library = useQuery(api.library.list, {});
  const academics = useQuery(api.academics.overview, {});
  const events = useQuery(api.events.list, {});
  const addTask = useMutation(api.productivity.addTask);
  const toggleTask = useMutation(api.productivity.toggleTask);
  const deleteTask = useMutation(api.productivity.deleteTask);
  const addNote = useMutation(api.productivity.addNote);
  const updateNote = useMutation(api.productivity.updateNote);
  const deleteNote = useMutation(api.productivity.deleteNote);
  const addEvent = useMutation(api.productivity.addWorkspaceEvent);
  const deleteEvent = useMutation(api.productivity.deleteWorkspaceEvent);

  const [taskTitle, setTaskTitle] = useState("");
  const [taskPriority, setTaskPriority] = useState<"low" | "medium" | "high">("medium");
  const [taskDue, setTaskDue] = useState(isoIn(1));
  const [noteOpen, setNoteOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Id<"notes"> | null>(null);
  const [noteTitle, setNoteTitle] = useState("");
  const [noteBody, setNoteBody] = useState("");
  const [noteSubject, setNoteSubject] = useState("General");
  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState(isoIn(1));
  const [eventTime, setEventTime] = useState("15:00");

  if (data === undefined || library === undefined) return <Loading label="Opening your workspace" />;

  const saved = library.filter((r) => r.bookmarked);
  const officialItems = [
    ...(academics?.assignments ?? []).map((a) => ({
      id: `assignment-${a._id}`,
      date: new Date(a.dueAt).toISOString().slice(0, 10),
      title: a.title,
      kind: "Assignment deadline",
      detail: a.subject,
      official: true,
    })),
    ...(academics?.exams ?? []).map((e) => ({
      id: `exam-${e._id}`,
      date: new Date(e.date).toISOString().slice(0, 10),
      title: `${e.subject} · ${e.type}`,
      kind: "Exam",
      detail: `${e.startTime} · ${e.room}`,
      official: true,
    })),
    ...(events ?? []).map((e) => ({
      id: `event-${e._id}`,
      date: new Date(e.startAt).toISOString().slice(0, 10),
      title: e.title,
      kind: "Campus event",
      detail: e.venue,
      official: true,
    })),
    ...data.events.map((e) => ({
      id: e._id,
      date: e.date,
      title: e.title,
      kind: "Personal",
      detail: e.time ?? "",
      official: false,
    })),
  ]
    .filter((item) => item.date >= todayISO())
    .sort((a, b) => a.date.localeCompare(b.date));

  const openNewNote = () => {
    setEditingNote(null);
    setNoteTitle("");
    setNoteBody("");
    setNoteSubject("General");
    setNoteOpen(true);
  };

  const openEditNote = (note: { _id: Id<"notes">; title: string; body: string; subject: string }) => {
    setEditingNote(note._id);
    setNoteTitle(note.title);
    setNoteBody(note.body);
    setNoteSubject(note.subject);
    setNoteOpen(true);
  };

  return (
    <PageWrap>
      <PageHeader
        eyebrow="Personal workspace"
        title="Your notes, tasks and calendar"
        description="Private to you. Official deadlines and events appear here read-only and are always labelled."
        actions={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="gap-1.5" onClick={openNewNote}>
              <StickyNote className="size-3.5" /> New note
            </Button>
            <Button size="sm" className="gap-1.5" onClick={() => document.getElementById("quick-task")?.focus()}>
              <Plus className="size-3.5" /> Quick task
            </Button>
          </div>
        }
      />

      <div className="grid gap-3.5 sm:grid-cols-3">
        <div className="uz-card p-5">
          <p className="text-xs text-muted-foreground">Open tasks</p>
          <p className="mt-2 font-display text-2xl font-bold">{data.tasks.filter((t) => !t.done).length}</p>
          <p className="mt-1 text-[10px] text-muted-foreground">{data.tasks.filter((t) => t.done).length} completed</p>
        </div>
        <div className="uz-card p-5">
          <p className="text-xs text-muted-foreground">Notes</p>
          <p className="mt-2 font-display text-2xl font-bold">{data.notes.length}</p>
          <p className="mt-1 text-[10px] text-muted-foreground">{data.notes.filter((n) => n.pinned).length} pinned</p>
        </div>
        <div className="uz-card p-5">
          <p className="text-xs text-muted-foreground">Saved resources</p>
          <p className="mt-2 font-display text-2xl font-bold">{saved.length}</p>
          <p className="mt-1 text-[10px] text-muted-foreground">Bookmarks from the E-Library</p>
        </div>
      </div>

      <Tabs defaultValue="notes" className="gap-5">
        <TabsList>
          <TabsTrigger value="notes" className="gap-1.5"><StickyNote className="size-3.5" /> Notes</TabsTrigger>
          <TabsTrigger value="tasks" className="gap-1.5"><CheckSquare className="size-3.5" /> Tasks</TabsTrigger>
          <TabsTrigger value="calendar" className="gap-1.5"><CalendarDays className="size-3.5" /> Calendar</TabsTrigger>
          <TabsTrigger value="saved" className="gap-1.5"><Bookmark className="size-3.5" /> Saved</TabsTrigger>
        </TabsList>

        <TabsContent value="notes">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {data.notes.map((note) => (
              <div key={note._id} className="uz-card flex flex-col p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-display text-sm font-semibold">{note.title}</p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">{note.subject} · {fmtShortDate(note.updatedAt)}</p>
                  </div>
                  <div className="flex shrink-0 gap-0.5">
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label={note.pinned ? "Unpin note" : "Pin note"}
                      onClick={() => updateNote({ noteId: note._id, pinned: !note.pinned })}
                    >
                      {note.pinned ? <Pin className="size-3.5 text-primary" /> : <PinOff className="size-3.5" />}
                    </Button>
                    <Button size="icon-sm" variant="ghost" aria-label="Delete note" onClick={() => deleteNote({ noteId: note._id })}>
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
                <p className="mt-2 line-clamp-5 whitespace-pre-wrap text-[11px] leading-5 text-muted-foreground">{note.body}</p>
                <Button variant="ghost" size="sm" className="mt-3 w-full text-[11px]" onClick={() => openEditNote(note)}>
                  Open note
                </Button>
              </div>
            ))}
            <button
              type="button"
              onClick={openNewNote}
              className="flex min-h-[160px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 text-muted-foreground transition hover:border-primary/30 hover:bg-muted/40"
            >
              <Plus className="size-5" />
              <span className="mt-1.5 text-xs font-medium">New note</span>
              <span className="text-[10px]">Private to your account</span>
            </button>
          </div>
        </TabsContent>

        <TabsContent value="tasks">
          <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
            <Panel title="Your tasks" description="Personal items only — they never change official records.">
              <div className="space-y-2">
                {data.tasks.map((task) => (
                  <div key={task._id} className={`flex items-center gap-3 rounded-xl border p-3 ${task.done ? "border-border/50 bg-muted/20" : "border-border/70"}`}>
                    <button
                      type="button"
                      aria-label={task.done ? "Mark task incomplete" : "Mark task complete"}
                      onClick={() => toggleTask({ taskId: task._id })}
                      className={`flex size-4 shrink-0 items-center justify-center rounded-full border ${task.done ? "border-emerald-500 bg-emerald-500 text-white" : "border-border"}`}
                    >
                      {task.done && <Check className="size-2.5" />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className={`truncate text-xs ${task.done ? "text-muted-foreground line-through" : "font-medium"}`}>{task.title}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {task.subject ? `${task.subject} · ` : ""}
                        {task.dueAt ? `due ${fmtShortDate(task.dueAt)}` : "no due date"}
                      </p>
                    </div>
                    <StatusBadge status={task.priority === "high" ? "rejected" : task.priority === "medium" ? "pending" : "draft"} label={task.priority} />
                    <Button size="icon-sm" variant="ghost" aria-label="Delete task" onClick={() => deleteTask({ taskId: task._id })}>
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                ))}
                {data.tasks.length === 0 && (
                  <EmptyState icon={CheckSquare} title="No tasks yet" description="Capture the next thing you need to do." />
                )}
              </div>
            </Panel>

            <Panel title="Add a task" description="Keep it small enough to finish today.">
              <div className="space-y-3">
                <Field label="Task">
                  <Input id="quick-task" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="e.g. Revise deadlock notes" />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Priority">
                    <Select value={taskPriority} onValueChange={(v) => setTaskPriority(v as typeof taskPriority)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Due">
                    <Input type="date" value={taskDue} onChange={(e) => setTaskDue(e.target.value)} />
                  </Field>
                </div>
                <Button
                  className="w-full gap-1.5"
                  onClick={async () => {
                    try {
                      await addTask({ title: taskTitle, priority: taskPriority, dueAt: new Date(`${taskDue}T18:00:00`).getTime() });
                      setTaskTitle("");
                      toast.success("Task added");
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : "Could not add task");
                    }
                  }}
                >
                  <Plus className="size-4" /> Add task
                </Button>
              </div>
            </Panel>
          </div>
        </TabsContent>

        <TabsContent value="calendar">
          <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
            <Panel title="Upcoming" description="Official items are read-only and labelled; personal items are yours.">
              <div className="space-y-2">
                {officialItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 rounded-xl border border-border/70 p-3">
                    <div className="w-12 shrink-0 rounded-lg bg-muted py-1.5 text-center">
                      <p className="text-[9px] uppercase text-muted-foreground">{fmtShortDate(item.date).split(" ")[1]}</p>
                      <p className="font-display text-sm font-bold leading-tight">{fmtShortDate(item.date).split(" ")[0]}</p>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium">{item.title}</p>
                      <p className="truncate text-[10px] text-muted-foreground">{item.kind}{item.detail ? ` · ${item.detail}` : ""}</p>
                    </div>
                    {item.official ? (
                      <Chip className="shrink-0 border-indigo-200 bg-indigo-50 text-indigo-700">Official</Chip>
                    ) : (
                      <button
                        type="button"
                        aria-label="Delete personal event"
                        onClick={() => deleteEvent({ eventId: item.id as Id<"workspaceEvents"> })}
                        className="shrink-0 text-muted-foreground hover:text-rose-600"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    )}
                  </div>
                ))}
                {officialItems.length === 0 && (
                  <EmptyState icon={CalendarDays} title="Nothing upcoming" description="Official deadlines and your personal events will appear here." />
                )}
              </div>
            </Panel>

            <Panel title="Add a personal event" description="Plans, reminders and personal blocks.">
              <div className="space-y-3">
                <Field label="Title">
                  <Input value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} placeholder="e.g. Project review with mentor" />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Date">
                    <Input type="date" min={todayISO()} value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
                  </Field>
                  <Field label="Time">
                    <Input type="time" value={eventTime} onChange={(e) => setEventTime(e.target.value)} />
                  </Field>
                </div>
                <Button
                  className="w-full gap-1.5"
                  onClick={async () => {
                    try {
                      await addEvent({ title: eventTitle, date: eventDate, time: eventTime });
                      setEventTitle("");
                      toast.success("Event added to your calendar");
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : "Could not add event");
                    }
                  }}
                >
                  <Plus className="size-4" /> Add to calendar
                </Button>
                <p className="flex items-start gap-2 rounded-xl bg-muted/50 px-2.5 py-2 text-[10px] leading-4 text-muted-foreground">
                  <Sparkles className="mt-0.5 size-3.5 shrink-0 text-primary" />
                  Personal items never write to academic records. Official deadlines stay
                  read-only here by design.
                </p>
              </div>
            </Panel>
          </div>
        </TabsContent>

        <TabsContent value="saved">
          <Panel title="Saved resources" description="Bookmarked E-Library material, kept across logins.">
            {saved.length === 0 ? (
              <EmptyState
                icon={Bookmark}
                title="Nothing saved yet"
                description="Bookmark notes, papers and lectures in the E-Library and they will appear here."
                action={<Button asChild size="sm"><Link to="/library">Browse the library</Link></Button>}
              />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {saved.map((resource) => (
                  <Link key={resource._id} to="/library" className="uz-card uz-card-hover p-4">
                    <div className="flex items-center justify-between">
                      <Chip>{resource.type}</Chip>
                      <ExternalLink className="size-3.5 text-muted-foreground" />
                    </div>
                    <p className="mt-2 line-clamp-2 font-display text-sm font-semibold">{resource.title}</p>
                    <p className="mt-1 text-[10px] text-muted-foreground">{resource.subject} · {resource.unit}</p>
                  </Link>
                ))}
              </div>
            )}
          </Panel>
        </TabsContent>
      </Tabs>

      <Dialog open={noteOpen} onOpenChange={setNoteOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingNote ? "Edit note" : "New note"}</DialogTitle>
            <DialogDescription>Notes are private to your account and never affect official records.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Field label="Title">
              <Input value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} placeholder="What is this note about?" />
            </Field>
            <Field label="Subject">
              <Input value={noteSubject} onChange={(e) => setNoteSubject(e.target.value)} placeholder="Subject or topic" />
            </Field>
            <Field label="Note">
              <Textarea rows={9} value={noteBody} onChange={(e) => setNoteBody(e.target.value)} placeholder="Write freely…" />
            </Field>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setNoteOpen(false)}>Cancel</Button>
            <Button
              onClick={async () => {
                try {
                  if (editingNote) {
                    await updateNote({ noteId: editingNote, title: noteTitle, body: noteBody });
                  } else {
                    await addNote({ title: noteTitle, body: noteBody, subject: noteSubject });
                  }
                  toast.success(editingNote ? "Note updated" : "Note saved");
                  setNoteOpen(false);
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Could not save note");
                }
              }}
            >
              Save note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageWrap>
  );
}
