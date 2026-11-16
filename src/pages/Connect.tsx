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
import { fmtDateTime, timeAgo } from "@/lib/format";
import { useMutation, useQuery } from "convex/react";
import {
  ArrowRight,
  BadgeCheck,
  Flag,
  GraduationCap,
  Handshake,
  HeartHandshake,
  Lightbulb,
  Lock,
  MessageSquarePlus,
  Plus,
  Search,
  ShieldAlert,
  Sparkles,
  UserPlus,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const COMMUNITIES = ["Study buddies", "Teams", "Communities", "Interest groups", "Skill exchange"];
const LOOKING_FOR = ["Study buddy", "Hackathon team", "Project collaborator", "Skill exchange", "Mentor"];

export default function Connect() {
  const { user } = useAuth();
  const data = useQuery(api.connect.data, {});
  const upsertProfile = useMutation(api.connect.upsertProfile);
  const sendConnection = useMutation(api.connect.sendConnection);
  const respond = useMutation(api.connect.respondConnection);
  const createPost = useMutation(api.connect.createPost);
  const report = useMutation(api.connect.report);

  const [profileOpen, setProfileOpen] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [year, setYear] = useState(3);
  const [skills, setSkills] = useState("");
  const [interests, setInterests] = useState("");
  const [lookingFor, setLookingFor] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<"public" | "hidden">("public");

  const [connectTarget, setConnectTarget] = useState<{ id: Id<"users">; name: string } | null>(null);
  const [purpose, setPurpose] = useState("");
  const [postOpen, setPostOpen] = useState(false);
  const [postCommunity, setPostCommunity] = useState("Study buddies");
  const [postTitle, setPostTitle] = useState("");
  const [postBody, setPostBody] = useState("");
  const [postTags, setPostTags] = useState("");
  const [reportTarget, setReportTarget] = useState<{ type: string; id: string; label: string } | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [query, setQuery] = useState("");

  if (data === undefined) return <Loading label="Loading Student Connect" />;

  const profile = data.myProfile;
  const openEdit = () => {
    setDisplayName(profile?.displayName ?? user?.name ?? "");
    setBio(profile?.bio ?? "");
    setYear(profile?.year ?? 3);
    setSkills((profile?.skills ?? []).join(", "));
    setInterests((profile?.interests ?? []).join(", "));
    setLookingFor(profile?.lookingFor ?? []);
    setVisibility(profile?.visibility ?? "public");
    setProfileOpen(true);
  };

  const filteredDirectory = data.directory.filter((p) =>
    query.trim()
      ? `${p.displayName} ${p.skills.join(" ")} ${p.interests.join(" ")} ${p.lookingFor.join(" ")}`
          .toLowerCase()
          .includes(query.toLowerCase())
      : true,
  );

  return (
    <PageWrap>
      <PageHeader
        eyebrow="Student Connect"
        title="Find your people, not their phone numbers"
        description="Opt-in profiles, in-app connection requests, student communities and verified opportunities. Contact details are never exposed."
        actions={
          <Button size="sm" className="gap-1.5" onClick={openEdit}>
            <Sparkles className="size-3.5" /> Edit my profile
          </Button>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[0.85fr_1.6fr]">
        <div className="flex flex-col gap-5">
          <Panel
            title="Your public profile"
            description={profile ? "What other students can see." : "Create an opt-in profile to appear in discovery."}
            action={<StatusBadge status={profile?.visibility === "hidden" ? "hidden" : "approved"} label={profile?.visibility === "hidden" ? "Hidden" : "Visible"} />}
          >
            {profile ? (
              <>
                <div className="flex items-center gap-3">
                  <span className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 font-display text-base font-bold text-white">
                    {profile.displayName.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                  </span>
                  <div>
                    <p className="font-display text-sm font-semibold">{profile.displayName}</p>
                    <p className="text-[11px] text-muted-foreground">{profile.department} · Year {profile.year}</p>
                  </div>
                </div>
                <p className="mt-3 text-[11px] leading-5 text-muted-foreground">{profile.bio}</p>
                <div className="mt-3">
                  <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">Skills</p>
                  <div className="mt-1 flex flex-wrap gap-1">{profile.skills.map((s) => <Chip key={s}>{s}</Chip>)}</div>
                </div>
                <div className="mt-2.5">
                  <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">Looking for</p>
                  <div className="mt-1 flex flex-wrap gap-1">{profile.lookingFor.map((s) => <Chip key={s} className="border-indigo-200 bg-indigo-50 text-indigo-700">{s}</Chip>)}</div>
                </div>
                <Button variant="outline" size="sm" className="mt-3 w-full" onClick={openEdit}>Edit profile & visibility</Button>
              </>
            ) : (
              <EmptyState
                icon={UserPlus}
                title="You haven't opted in yet"
                description="Create a profile to be discoverable for study buddies, hackathon teams and communities."
                action={<Button size="sm" onClick={openEdit}>Create profile</Button>}
              />
            )}
            <p className="mt-3 flex items-start gap-1.5 rounded-lg bg-muted/50 px-2.5 py-2 text-[9px] leading-4 text-muted-foreground">
              <Lock className="mt-0.5 size-3 shrink-0" />
              Only fields you make visible are used for matching. No phone numbers or
              email addresses are ever shown.
            </p>
          </Panel>

          <Panel
            title={`Connection requests (${data.incoming.length})`}
            description="Accept to reveal the connect button on their profile — chat stays in-app."
          >
            <div className="space-y-2">
              {data.incoming.map((request) => (
                <div key={request._id} className="rounded-xl border border-border/70 p-3">
                  <p className="text-xs font-semibold">{request.fromName}</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">{request.purpose}</p>
                  <div className="mt-2 flex gap-1.5">
                    <Button
                      size="sm"
                      className="h-7 text-[10px]"
                      onClick={async () => {
                        try {
                          await respond({ connectionId: request._id, decision: "accepted" });
                          toast.success("Connection accepted");
                        } catch (error) {
                          toast.error(error instanceof Error ? error.message : "Could not respond");
                        }
                      }}
                    >
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-[10px]"
                      onClick={async () => {
                        try {
                          await respond({ connectionId: request._id, decision: "declined" });
                          toast.success("Request declined");
                        } catch (error) {
                          toast.error(error instanceof Error ? error.message : "Could not respond");
                        }
                      }}
                    >
                      Decline
                    </Button>
                  </div>
                </div>
              ))}
              {data.incoming.length === 0 && (
                <p className="py-3 text-center text-[11px] text-muted-foreground">No pending requests.</p>
              )}
            </div>
          </Panel>

          <Panel title="Your sent requests" description="Outgoing connection invitations.">
            <div className="space-y-2">
              {data.outgoing.slice(0, 5).map((request) => (
                <div key={request._id} className="flex items-center gap-2.5 rounded-xl border border-border/70 p-2.5">
                  <Handshake className="size-3.5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-medium">{request.toName}</p>
                    <p className="truncate text-[9px] text-muted-foreground">{request.purpose}</p>
                  </div>
                  <StatusBadge status={request.status} />
                </div>
              ))}
              {data.outgoing.length === 0 && (
                <p className="py-3 text-center text-[11px] text-muted-foreground">You haven't sent any requests.</p>
              )}
            </div>
          </Panel>
        </div>

        <div className="flex flex-col gap-5">
          <Tabs defaultValue="discover" className="gap-4">
            <TabsList className="flex w-full flex-wrap sm:w-auto">
              <TabsTrigger value="discover" className="gap-1.5"><Users className="size-3.5" /> Discover</TabsTrigger>
              <TabsTrigger value="opportunities" className="gap-1.5"><Lightbulb className="size-3.5" /> Opportunities</TabsTrigger>
              <TabsTrigger value="communities" className="gap-1.5"><HeartHandshake className="size-3.5" /> Communities</TabsTrigger>
            </TabsList>

            <TabsContent value="discover">
              <Panel
                title="Students open to connecting"
                description="Opt-in profiles only. Hidden profiles never appear here."
                action={
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Skill, name, interest…" className="h-8 w-[190px] rounded-lg pl-8 text-xs" />
                  </div>
                }
              >
                {filteredDirectory.length === 0 ? (
                  <EmptyState icon={Users} title="No profiles match" description="Try another skill or interest. Only public profiles are searchable." />
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {filteredDirectory.map((student) => (
                      <div key={student._id} className="rounded-xl border border-border/70 p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2.5">
                            <span className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 text-xs font-bold text-indigo-700">
                              {student.displayName.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                            </span>
                            <div>
                              <p className="text-xs font-semibold">{student.displayName}</p>
                              <p className="text-[10px] text-muted-foreground">{student.department} · Year {student.year}</p>
                            </div>
                          </div>
                          <Chip className="text-[9px]">{student.connectionStatus === "connected" ? "Connected" : student.connectionStatus === "requested" ? "Requested" : "Open"}</Chip>
                        </div>
                        <p className="mt-2 line-clamp-2 text-[11px] leading-5 text-muted-foreground">{student.bio}</p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {student.skills.slice(0, 3).map((s) => <Chip key={s}>{s}</Chip>)}
                        </div>
                        <p className="mt-1.5 text-[9px] text-indigo-600">Looking for: {student.lookingFor.join(" · ")}</p>
                        <div className="mt-2.5 flex gap-1.5">
                          <Button
                            size="sm"
                            className="h-7 flex-1 gap-1 text-[10px]"
                            disabled={student.connectionStatus !== "none"}
                            onClick={() => {
                              setConnectTarget({ id: student.userId, name: student.displayName });
                              setPurpose("");
                            }}
                          >
                            <UserPlus className="size-3" />
                            {student.connectionStatus === "connected" ? "Connected" : student.connectionStatus === "requested" ? "Request sent" : "Connect"}
                          </Button>
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            aria-label={`Report ${student.displayName}`}
                            onClick={() => setReportTarget({ type: "profile", id: student.userId, label: student.displayName })}
                          >
                            <Flag className="size-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Panel>
            </TabsContent>

            <TabsContent value="opportunities">
              <Panel
                title="Verified opportunities"
                description="Internships, fellowships and programs. A verified flag means the campus checked the listing."
              >
                <div className="mb-3 flex items-start gap-2 rounded-xl border border-amber-200/70 bg-amber-50/60 px-3 py-2.5">
                  <ShieldAlert className="mt-0.5 size-4 shrink-0 text-amber-600" />
                  <p className="text-[10px] leading-4 text-amber-900/80">
                    Never pay for an internship or share bank details. Unverified listings are
                    labelled and should be checked independently. Report anything suspicious.
                  </p>
                </div>
                <div className="space-y-3">
                  {data.opportunities.map((opportunity) => (
                    <div key={opportunity._id} className="rounded-xl border border-border/70 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold">{opportunity.title}</p>
                            {opportunity.verified ? (
                              <Chip className="border-emerald-200 bg-emerald-50 text-emerald-700"><BadgeCheck className="mr-1 size-3" /> Verified</Chip>
                            ) : (
                              <Chip className="border-amber-200 bg-amber-50 text-amber-700">Unverified</Chip>
                            )}
                          </div>
                          <p className="mt-0.5 text-[11px] text-muted-foreground">{opportunity.org} · {opportunity.location}</p>
                        </div>
                        <Chip>{opportunity.type}</Chip>
                      </div>
                      <p className="mt-2 text-[11px] leading-5 text-muted-foreground">{opportunity.description}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {opportunity.tags.map((t) => <Chip key={t}>{t}</Chip>)}
                        <Chip className="border-indigo-200 bg-indigo-50 text-indigo-700">{opportunity.stipend}</Chip>
                      </div>
                      <div className="mt-2.5 flex items-center justify-between">
                        <a
                          href={opportunity.link}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
                        >
                          View listing <ArrowRight className="size-3" />
                        </a>
                        <Button size="sm" variant="ghost" className="h-7 gap-1 px-2 text-[10px]" onClick={() => setReportTarget({ type: "opportunity", id: opportunity._id, label: opportunity.title })}>
                          <Flag className="size-3" /> Report
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>
            </TabsContent>

            <TabsContent value="communities">
              <Panel
                title="Campus communities"
                description="Study circles, teams and interest groups. Every post has a report action."
                action={
                  <Button size="sm" className="h-8 gap-1.5" onClick={() => setPostOpen(true)}>
                    <MessageSquarePlus className="size-3.5" /> New post
                  </Button>
                }
              >
                <div className="space-y-3">
                  {data.posts.map((post) => (
                    <div key={post._id} className="rounded-xl border border-border/70 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="flex size-8 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground">
                            {post.authorName.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                          </span>
                          <div>
                            <p className="text-xs font-semibold">{post.title}</p>
                            <p className="text-[9px] text-muted-foreground">{post.authorName} · {post.community} · {timeAgo(post.createdAt)}</p>
                          </div>
                        </div>
                        <Button size="icon-sm" variant="ghost" aria-label="Report post" onClick={() => setReportTarget({ type: "post", id: post._id, label: post.title })}>
                          <Flag className="size-3.5 text-muted-foreground" />
                        </Button>
                      </div>
                      <p className="mt-2 text-[11px] leading-5 text-muted-foreground">{post.body}</p>
                      <div className="mt-2 flex flex-wrap gap-1">{post.tags.map((t) => <Chip key={t}>#{t}</Chip>)}</div>
                    </div>
                  ))}
                </div>
              </Panel>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Your connect profile</DialogTitle>
            <DialogDescription>Only visible fields are used for matching. Hide your profile any time.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Display name">
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </Field>
            <Field label="Year">
              <Input type="number" min={1} max={5} value={year} onChange={(e) => setYear(Number(e.target.value))} />
            </Field>
            <Field label="Bio" hint="Up to 280 characters" className="sm:col-span-2">
              <Textarea rows={3} value={bio} onChange={(e) => setBio(e.target.value)} />
            </Field>
            <Field label="Skills" hint="Comma separated" className="sm:col-span-2">
              <Input value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="React, UI design, Python" />
            </Field>
            <Field label="Interests" hint="Comma separated" className="sm:col-span-2">
              <Input value={interests} onChange={(e) => setInterests(e.target.value)} placeholder="Hackathons, Chess, Campus radio" />
            </Field>
            <Field label="Visibility" className="sm:col-span-2">
              <Select value={visibility} onValueChange={(v) => setVisibility(v as typeof visibility)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public — discoverable by students</SelectItem>
                  <SelectItem value="hidden">Hidden — nobody can find or request</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <div className="sm:col-span-2">
              <p className="mb-1.5 text-xs font-medium">Looking for</p>
              <div className="flex flex-wrap gap-1.5">
                {LOOKING_FOR.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() =>
                      setLookingFor((prev) =>
                        prev.includes(option) ? prev.filter((x) => x !== option) : [...prev, option],
                      )
                    }
                    className={`rounded-full border px-2.5 py-1 text-[10px] transition ${
                      lookingFor.includes(option)
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setProfileOpen(false)}>Cancel</Button>
            <Button
              onClick={async () => {
                try {
                  await upsertProfile({
                    displayName,
                    bio,
                    year,
                    skills: skills.split(",").map((s) => s.trim()).filter(Boolean),
                    interests: interests.split(",").map((s) => s.trim()).filter(Boolean),
                    lookingFor,
                    visibility,
                  });
                  toast.success("Profile saved", { description: visibility === "hidden" ? "You are now hidden from discovery." : "Students can now find you in Student Connect." });
                  setProfileOpen(false);
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Could not save profile");
                }
              }}
            >
              Save profile
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={connectTarget !== null} onOpenChange={(open) => !open && setConnectTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Connect with {connectTarget?.name}</DialogTitle>
            <DialogDescription>
              Your contact details stay private. Write a short note about what you'd like
              to work on together.
            </DialogDescription>
          </DialogHeader>
          <Field label="Purpose">
            <Textarea rows={3} value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="e.g. Looking for a designer for CodeSprint this weekend." />
          </Field>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConnectTarget(null)}>Cancel</Button>
            <Button
              onClick={async () => {
                if (!connectTarget) return;
                try {
                  await sendConnection({ toUserId: connectTarget.id, purpose });
                  toast.success("Connection request sent", { description: "They will respond inside UniZone." });
                  setConnectTarget(null);
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Could not send request");
                }
              }}
            >
              Send request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={postOpen} onOpenChange={setPostOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create a community post</DialogTitle>
            <DialogDescription>Keep it useful and respectful. Posts are moderated.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Field label="Community">
              <Select value={postCommunity} onValueChange={setPostCommunity}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {COMMUNITIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Title">
              <Input value={postTitle} onChange={(e) => setPostTitle(e.target.value)} placeholder="e.g. DBMS revision circle" />
            </Field>
            <Field label="Details">
              <Textarea rows={4} value={postBody} onChange={(e) => setPostBody(e.target.value)} placeholder="What are you looking for? When and where do you meet?" />
            </Field>
            <Field label="Tags" hint="Comma separated">
              <Input value={postTags} onChange={(e) => setPostTags(e.target.value)} placeholder="DBMS, Revision" />
            </Field>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPostOpen(false)}>Cancel</Button>
            <Button
              onClick={async () => {
                try {
                  await createPost({
                    community: postCommunity,
                    title: postTitle,
                    body: postBody,
                    tags: postTags.split(",").map((t) => t.trim()).filter(Boolean),
                  });
                  toast.success("Post published");
                  setPostTitle("");
                  setPostBody("");
                  setPostTags("");
                  setPostOpen(false);
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Could not publish post");
                }
              }}
            >
              Publish post
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={reportTarget !== null} onOpenChange={(open) => !open && setReportTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Report content</DialogTitle>
            <DialogDescription>
              Reports go to the campus moderation queue. Abusive use is itself reportable.
            </DialogDescription>
          </DialogHeader>
          <Field label="What is wrong?">
            <Textarea rows={3} value={reportReason} onChange={(e) => setReportReason(e.target.value)} placeholder="Harassment, spam, false listing, contact details exposed…" />
          </Field>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setReportTarget(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!reportTarget) return;
                try {
                  await report({
                    targetType: reportTarget.type,
                    targetId: reportTarget.id,
                    targetLabel: reportTarget.label,
                    reason: reportReason,
                  });
                  toast.success("Report submitted", { description: "The moderation team has been notified." });
                  setReportReason("");
                  setReportTarget(null);
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : "Could not submit report");
                }
              }}
            >
              Submit report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageWrap>
  );
}
