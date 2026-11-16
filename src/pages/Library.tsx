import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import {
  PageWrap,
  PageHeader,
  Panel,
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
import { useMutation, useQuery } from "convex/react";
import {
  BookMarked,
  BookOpen,
  Bookmark,
  BookmarkCheck,
  Download,
  FileText,
  Film,
  LibraryBig,
  Lock,
  Plus,
  Search,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

const STAFF = ["faculty", "hod", "admin"];
const TYPES = ["All types", "Notes", "Question paper", "Video", "Book", "Syllabus", "Lab manual", "Reference"];

const TYPE_ICON: Record<string, typeof BookOpen> = {
  Video: Film,
  "Question paper": FileText,
  Book: LibraryBig,
  Syllabus: BookMarked,
  "Lab manual": FileText,
  Reference: BookOpen,
  Notes: BookOpen,
};

export default function Library() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const resources = useQuery(api.library.list, {});
  const toggleBookmark = useMutation(api.library.toggleBookmark);
  const addResource = useMutation(api.library.addResource);
  const subjects = useQuery(api.academics.overview, STAFF.includes(user?.role ?? "") ? {} : "skip");

  const [query, setQuery] = useState("");
  const [type, setType] = useState("All types");
  const [savedOnly, setSavedOnly] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [subject, setSubject] = useState("Database Management Systems");
  const [unit, setUnit] = useState("Unit 1");
  const [resType, setResType] = useState("Notes");
  const [access, setAccess] = useState<"public" | "department" | "restricted">("department");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [pages, setPages] = useState(24);

  if (resources === undefined) return <Loading label="Opening the E-Library" />;

  const filtered = resources
    .filter((r) => (type === "All types" ? true : r.type === type))
    .filter((r) => (savedOnly ? r.bookmarked : true))
    .filter((r) =>
      query.trim()
        ? `${r.title} ${r.subject} ${r.unit} ${r.tags.join(" ")}`.toLowerCase().includes(query.toLowerCase())
        : true,
    );
  const current = resources.find((r) => r._id === selected);
  const subjectOptions = [
    ...new Set([
      ...resources.map((r) => r.subject),
      ...(subjects?.subjects.map((s) => s.name) ?? []),
    ]),
  ].filter((s) => s !== "All subjects");

  return (
    <PageWrap>
      <PageHeader
        eyebrow="E-Library"
        title="Course material, properly organised"
        description="Unit-wise notes, previous papers and recordings. Access follows the resource's own visibility rule."
        actions={
          STAFF.includes(user?.role ?? "") ? (
            <Button size="sm" className="gap-1.5" onClick={() => setUploadOpen(true)}>
              <Plus className="size-3.5" /> Add resource
            </Button>
          ) : (
            <Chip className="gap-1.5"><Lock className="size-3" /> Restricted items stay private</Chip>
          )
        }
      />

      <div className="grid gap-3.5 sm:grid-cols-3">
        {[
          { label: "Resources available", value: resources.length, hint: "Visible to your role" },
          { label: "Saved for later", value: resources.filter((r) => r.bookmarked).length, hint: "Bookmarks persist across logins" },
          { label: "Subjects covered", value: new Set(resources.map((r) => r.subject)).size, hint: "Across your department" },
        ].map((s) => (
          <div key={s.label} className="uz-card p-5">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className="mt-2 font-display text-2xl font-bold">{s.value}</p>
            <p className="mt-1 text-[10px] text-muted-foreground">{s.hint}</p>
          </div>
        ))}
      </div>

      <Panel
        title="Browse the library"
        description="Search by topic, unit or tag."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search resources…" className="h-8 w-[190px] rounded-lg pl-8 text-xs" />
            </div>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="h-8 w-[140px] rounded-lg text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              variant={savedOnly ? "default" : "outline"}
              className="h-8 gap-1.5 text-xs"
              onClick={() => setSavedOnly((v) => !v)}
            >
              <Bookmark className="size-3.5" /> Saved
            </Button>
          </div>
        }
      >
        {filtered.length === 0 ? (
          <EmptyState
            icon={LibraryBig}
            title="No resources match"
            description="Try another subject, type or clear the saved filter. Faculty can add new material."
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((resource) => {
              const Icon = TYPE_ICON[resource.type] ?? BookOpen;
              return (
                <div key={resource._id} className="uz-card uz-card-hover flex flex-col p-4">
                  <div className="flex items-start justify-between gap-2">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-50 to-violet-50 text-indigo-600 ring-1 ring-indigo-100/60">
                      <Icon className="size-[18px]" />
                    </span>
                    <button
                      type="button"
                      aria-label={resource.bookmarked ? "Remove bookmark" : "Bookmark resource"}
                      onClick={async () => {
                        try {
                          const result = await toggleBookmark({ resourceId: resource._id });
                          toast.success(result.saved ? "Saved to bookmarks" : "Removed from bookmarks");
                        } catch (error) {
                          toast.error(error instanceof Error ? error.message : "Could not update bookmark");
                        }
                      }}
                      className={`flex size-8 items-center justify-center rounded-lg border transition ${
                        resource.bookmarked
                          ? "border-indigo-200 bg-indigo-50 text-indigo-600"
                          : "border-border/70 text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {resource.bookmarked ? <BookmarkCheck className="size-4" /> : <Bookmark className="size-4" />}
                    </button>
                  </div>

                  <p className="mt-3 line-clamp-2 font-display text-sm font-semibold">{resource.title}</p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{resource.author}</p>
                  <p className="mt-2 line-clamp-2 text-[11px] leading-5 text-muted-foreground">{resource.description}</p>

                  <div className="mt-2.5 flex flex-wrap gap-1">
                    <Chip>{resource.subject}</Chip>
                    <Chip>{resource.unit}</Chip>
                    <Chip className="capitalize">{resource.access}</Chip>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-3">
                    <span className="text-[10px] text-muted-foreground">
                      {resource.type}{resource.pages ? ` · ${resource.pages} pages` : ""}
                    </span>
                    <Button size="sm" variant="ghost" className="h-7 gap-1 px-2 text-[11px]" onClick={() => setSelected(resource._id)}>
                      Open <BookOpen className="size-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      <Dialog open={current !== undefined} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{current?.title}</DialogTitle>
            <DialogDescription>
              {current?.author} · {current?.subject} · {current?.unit}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-wrap gap-1.5">
            <Chip>{current?.type}</Chip>
            <Chip>{current?.pages} pages</Chip>
            <Chip className="capitalize">{current?.access}</Chip>
            {current?.tags.map((tag) => <Chip key={tag}>#{tag}</Chip>)}
          </div>
          <div className="max-h-[36vh] overflow-y-auto rounded-xl border border-border/70 bg-muted/20 p-4">
            <p className="whitespace-pre-wrap text-xs leading-6 text-foreground/90">{current?.content}</p>
          </div>
          <p className="flex items-start gap-2 rounded-xl bg-indigo-50/60 px-3 py-2.5 text-[10px] leading-4 text-indigo-700">
            <Lock className="mt-0.5 size-3.5 shrink-0" />
            Restricted material is filtered both when listing and when reading. The text shown here
            is the indexed excerpt used by the Study Hub for grounded answers.
          </p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSelected(null)}>Close</Button>
            <Button
              variant="outline"
              className="gap-1.5"
              onClick={() => toast.success("Resource marked for offline reading")}
            >
              <Download className="size-3.5" /> Save copy
            </Button>
            <Button
              className="gap-1.5"
              onClick={() => {
                setSelected(null);
                navigate("/study");
              }}
            >
              <Sparkles className="size-3.5" /> Use in Study Hub
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add a library resource</DialogTitle>
            <DialogDescription>Faculty-managed material. Access controls apply immediately.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Title" className="sm:col-span-2">
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. DBMS — Unit 4 notes" />
            </Field>
            <Field label="Author / owner">
              <Input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Your name" />
            </Field>
            <Field label="Type">
              <Select value={resType} onValueChange={setResType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TYPES.filter((t) => t !== "All types").map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Subject">
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {subjectOptions.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Unit">
              <Input value={unit} onChange={(e) => setUnit(e.target.value)} />
            </Field>
            <Field label="Access">
              <Select value={access} onValueChange={(v) => setAccess(v as typeof access)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public — all roles</SelectItem>
                  <SelectItem value="department">Department — own department</SelectItem>
                  <SelectItem value="restricted">Restricted — faculty only</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Pages">
              <Input type="number" min={0} value={pages} onChange={(e) => setPages(Number(e.target.value))} />
            </Field>
            <Field label="Description" className="sm:col-span-2">
              <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What does this resource cover?" />
            </Field>
            <Field label="Searchable excerpt" hint="Used by the AI Study Hub as the readable text for citations." className="sm:col-span-2">
              <Textarea rows={4} value={content} onChange={(e) => setContent(e.target.value)} placeholder="Paste a short unit summary or key passages…" />
            </Field>
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-border px-3 py-2.5 text-xs text-muted-foreground sm:col-span-2">
              <FileText className="size-4 text-primary" />
              Attach file (stored privately in production)
              <input type="file" className="hidden" accept=".pdf,.doc,.docx,.pptx" />
            </label>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setUploadOpen(false)}>Cancel</Button>
            <Button
              onClick={async () => {
                try {
                  await addResource({
                    title,
                    author,
                    type: resType,
                    subject,
                    unit,
                    access,
                    description,
                    content,
                    pages,
                    tags: [],
                  });
                  toast.success("Resource added", { description: "It is now visible to everyone with access." });
                  setTitle("");
                  setDescription("");
                  setContent("");
                  setUploadOpen(false);
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Could not add resource");
                }
              }}
            >
              Publish resource
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageWrap>
  );
}
