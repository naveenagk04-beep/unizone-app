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
  ProgressBar,
  StatusBadge,
} from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fmtShortDate, isoIn, toEpoch } from "@/lib/format";
import { useMutation, useQuery } from "convex/react";
import {
  BookOpen,
  Bot,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  FileText,
  GraduationCap,
  Layers,
  Lightbulb,
  ListChecks,
  Loader2,
  MessageSquareText,
  Plus,
  RefreshCw,
  Send,
  Sparkles,
  Target,
  Trash2,
  Upload,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

const SUPPORTED = [
  "Database Management Systems",
  "Operating Systems",
  "Data Structures & Algorithms",
  "Computer Networks",
  "Artificial Intelligence",
];

export default function StudyHub() {
  const plans = useQuery(api.study.plans, {});
  const chats = useQuery(api.study.chats, {});
  const quizzes = useQuery(api.study.quizzes, {});
  const docs = useQuery(api.study.docs, {});
  const subjects = useQuery(api.academics.overview, {});

  const generatePlan = useMutation(api.study.generatePlan);
  const toggleTopic = useMutation(api.study.toggleTopic);
  const confirmPlan = useMutation(api.study.confirmPlan);
  const deletePlan = useMutation(api.study.deletePlan);
  const ask = useMutation(api.study.ask);
  const deleteChat = useMutation(api.study.deleteChat);
  const generateQuiz = useMutation(api.study.generateQuiz);
  const submitQuiz = useMutation(api.study.submitQuiz);
  const summarizeNotes = useMutation(api.study.summarizeNotes);
  const deleteDoc = useMutation(api.study.deleteDoc);

  const subjectList = subjects?.subjects.map((s) => s.name) ?? SUPPORTED;

  const [planSubject, setPlanSubject] = useState(subjectList[0] ?? SUPPORTED[0]);
  const [examDate, setExamDate] = useState(isoIn(10));
  const [hours, setHours] = useState(2);
  const [planBusy, setPlanBusy] = useState(false);

  const [chatId, setChatId] = useState<Id<"aiChats"> | null>(null);
  const [question, setQuestion] = useState("");
  const [askSubject, setAskSubject] = useState(subjectList[0] ?? SUPPORTED[0]);
  const [asking, setAsking] = useState(false);

  const [quizSubject, setQuizSubject] = useState(subjectList[0] ?? SUPPORTED[0]);
  const [quizTopic, setQuizTopic] = useState("Mixed revision");
  const [quizDifficulty, setQuizDifficulty] = useState("Medium");
  const [activeQuizId, setActiveQuizId] = useState<Id<"quizzes"> | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [quizResult, setQuizResult] = useState<{ score: number; total: number; weakTopics: string[] } | null>(null);
  const [quizBusy, setQuizBusy] = useState(false);

  const [docTitle, setDocTitle] = useState("");
  const [docSubject, setDocSubject] = useState(subjectList[0] ?? SUPPORTED[0]);
  const [docText, setDocText] = useState("");
  const [docBusy, setDocBusy] = useState(false);

  const activeChat = useMemo(
    () => (chats ?? []).find((c) => c._id === chatId) ?? null,
    [chats, chatId],
  );
  const activeQuiz = useMemo(
    () => (quizzes?.quizzes ?? []).find((q) => q._id === activeQuizId) ?? null,
    [quizzes, activeQuizId],
  );

  if (plans === undefined || chats === undefined || quizzes === undefined || docs === undefined) {
    return <Loading label="Opening your Study Hub" />;
  }

  const handleAsk = async (prompt?: string) => {
    const text = (prompt ?? question).trim();
    if (!text) {

      toast.error("Type a question first.");
      return;
    }
    setAsking(true);
    try {
      const result = await ask({
        subject: askSubject,
        question: text,
        chatId: chatId ?? undefined,
      });
      setChatId(result.chatId);
      setQuestion("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The Study Hub could not answer that.");
    } finally {
      setAsking(false);
    }
  };

  return (
    <PageWrap>
      <PageHeader
        eyebrow="AI Learning Hub"
        title="Study smarter with your own material"
        description="Grounded answers with real citations, a draft-first planner, practice tests and revision summaries — all scoped to your account."
        actions={
          <Chip className="gap-1.5">
            <BrainCircuit className="size-3" /> Demo AI engine · on-campus materials
          </Chip>
        }
      />

      <Tabs defaultValue="planner" className="gap-5">
        <TabsList className="flex w-full flex-wrap sm:w-auto">
          <TabsTrigger value="planner" className="gap-1.5"><ListChecks className="size-3.5" /> Planner</TabsTrigger>
          <TabsTrigger value="doubt" className="gap-1.5"><MessageSquareText className="size-3.5" /> Doubt solver</TabsTrigger>
          <TabsTrigger value="practice" className="gap-1.5"><Target className="size-3.5" /> Practice</TabsTrigger>
          <TabsTrigger value="summaries" className="gap-1.5"><FileText className="size-3.5" /> Summaries</TabsTrigger>
        </TabsList>

        <TabsContent value="planner" className="grid gap-5 lg:grid-cols-[1fr_1.5fr]">
          <div className="flex flex-col gap-5">
            <Panel
              title="Generate a study plan"
              description="AI proposes the sequence. Nothing is active until you confirm it."
            >
              <div className="space-y-3">
                <Field label="Subject">
                  <Select value={planSubject} onValueChange={setPlanSubject}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {subjectList.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Exam date">
                    <Input type="date" min={isoIn(1)} value={examDate} onChange={(e) => setExamDate(e.target.value)} />
                  </Field>
                  <Field label="Hours / day">
                    <Input type="number" min={0.5} max={12} step={0.5} value={hours} onChange={(e) => setHours(Number(e.target.value))} />
                  </Field>
                </div>
                <Button
                  className="w-full gap-2"
                  disabled={planBusy}
                  onClick={async () => {
                    setPlanBusy(true);
                    try {
                      await generatePlan({ subject: planSubject, examDate: toEpoch(examDate), hoursPerDay: hours });
                      toast.success("Draft plan ready", { description: "Review the topics, then confirm to start tracking." });
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : "Could not generate a plan");
                    } finally {
                      setPlanBusy(false);
                    }
                  }}
                >
                  {planBusy ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                  {planBusy ? "Building your plan…" : "Generate draft plan"}
                </Button>
                <p className="text-[10px] leading-4 text-muted-foreground">
                  Plans are generated from your subject's five units and your available
                  time. Scanned or unreadable syllabus files would produce a clear failed
                  state instead of a broken plan.
                </p>
              </div>
            </Panel>

            <Panel title="Revision method" description="What makes this plan useful.">
              <div className="space-y-3">
                {[
                  ["Two passes", "Each unit gets a first pass and a revision pass before the exam."],
                  ["Small daily targets", "Topics are sized to your hours/day so the plan is realistic."],
                  ["Confirm before acting", "Draft plans never count as progress until you accept them."],
                ].map(([title, body]) => (
                  <div key={title} className="flex gap-2.5">
                    <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-lg bg-muted text-primary">
                      <Lightbulb className="size-3.5" />
                    </span>
                    <div>
                      <p className="text-[11px] font-semibold">{title}</p>
                      <p className="text-[10px] leading-4 text-muted-foreground">{body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          </div>

          <div className="flex flex-col gap-4">
            {plans.length === 0 ? (
              <Panel>
                <EmptyState
                  icon={ListChecks}
                  title="No study plans yet"
                  description="Pick a subject and exam date to generate your first draft. You can edit every topic's progress."
                />
              </Panel>
            ) : (
              plans.map((plan) => {
                const done = plan.topics.filter((t) => t.done).length;
                return (
                  <Panel
                    key={plan._id}
                    title={plan.subject}
                    description={`Exam ${fmtShortDate(plan.examDate)} · ${plan.hoursPerDay}h per day`}
                    action={
                      <div className="flex items-center gap-2">
                        <StatusBadge status={plan.status === "draft" ? "draft" : "approved"} label={plan.status === "draft" ? "Draft" : "Active"} />
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-muted-foreground" onClick={() => deletePlan({ planId: plan._id })} aria-label="Delete plan">
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    }
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{done} of {plan.topics.length} topics complete</span>
                      <span className="font-semibold">{Math.round((done / Math.max(1, plan.topics.length)) * 100)}%</span>
                    </div>
                    <ProgressBar value={(done / Math.max(1, plan.topics.length)) * 100} className="mt-2" />
                    <div className="mt-4 space-y-1.5">
                      {plan.topics.map((topic) => (
                        <button
                          key={topic.id}
                          type="button"
                          onClick={() => toggleTopic({ planId: plan._id, topicId: topic.id, done: !topic.done })}
                          className="flex w-full items-center gap-2.5 rounded-lg border border-transparent px-2 py-1.5 text-left transition hover:border-border/70 hover:bg-muted/40"
                        >
                          <span className={`flex size-4 shrink-0 items-center justify-center rounded-full border ${topic.done ? "border-emerald-500 bg-emerald-500 text-white" : "border-border"}`}>
                            {topic.done && <CheckCircle2 className="size-3" />}
                          </span>
                          <span className={`min-w-0 flex-1 truncate text-[11px] ${topic.done ? "text-muted-foreground line-through" : ""}`}>
                            {topic.title}
                          </span>
                          <span className="shrink-0 text-[10px] text-muted-foreground">{topic.unit} · {topic.minutes}m</span>
                          <span className="hidden shrink-0 text-[10px] text-muted-foreground sm:block">{fmtShortDate(topic.scheduledDate)}</span>
                        </button>
                      ))}
                    </div>
                    {plan.status === "draft" && (
                      <div className="mt-4 flex flex-col gap-2 rounded-xl border border-amber-200/70 bg-amber-50/50 p-3 sm:flex-row sm:items-center">
                        <p className="flex-1 text-[11px] text-amber-800">
                          This is a draft. Confirm it to switch on progress tracking.
                        </p>
                        <Button
                          size="sm"
                          className="gap-1.5"
                          onClick={async () => {
                            try {
                              await confirmPlan({ planId: plan._id });
                              toast.success("Plan confirmed", { description: "Start ticking topics as you finish them." });
                            } catch (error) {
                              toast.error(error instanceof Error ? error.message : "Could not confirm plan");
                            }
                          }}
                        >
                          <CheckCircle2 className="size-3.5" /> Confirm plan
                        </Button>
                      </div>
                    )}
                  </Panel>
                );
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="doubt" className="grid gap-5 lg:grid-cols-[0.9fr_1.6fr]">
          <div className="flex flex-col gap-4">
            <Panel
              title="Conversations"
              description="Saved privately to your account."
              action={
                <Button size="sm" variant="outline" className="h-7 gap-1 px-2 text-[10px]" onClick={() => { setChatId(null); setQuestion(""); }}>
                  <Plus className="size-3" /> New
                </Button>
              }
            >
              <div className="space-y-1.5">
                {chats.length === 0 && <p className="py-4 text-center text-[11px] text-muted-foreground">No conversations yet.</p>}
                {chats.map((chat) => (
                  <div
                    key={chat._id}
                    className={`group flex items-start gap-2 rounded-xl border p-2.5 transition ${
                      chat._id === chatId ? "border-indigo-200 bg-indigo-50/50" : "border-transparent hover:bg-muted/40"
                    }`}
                  >
                    <button type="button" className="min-w-0 flex-1 text-left" onClick={() => setChatId(chat._id)}>
                      <p className="truncate text-[11px] font-medium">{chat.title}</p>
                      <p className="truncate text-[10px] text-muted-foreground">{chat.subject} · {chat.messages.length} messages</p>
                    </button>
                    <button
                      type="button"
                      aria-label="Delete conversation"
                      className="opacity-0 transition group-hover:opacity-100"
                      onClick={async () => {
                        await deleteChat({ chatId: chat._id });
                        if (chatId === chat._id) setChatId(null);
                        toast.success("Conversation deleted");
                      }}
                    >
                      <Trash2 className="size-3.5 text-muted-foreground" />
                    </button>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel title="Ask about" description="Grounded answers use authorised library material.">
              <Select value={askSubject} onValueChange={setAskSubject}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {subjectList.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {["Explain normalisation with an example", "Compare paging and segmentation", "How does TCP congestion control work?"].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handleAsk(p)}
                    className="rounded-full border border-border/70 px-2.5 py-1 text-[10px] text-muted-foreground transition hover:border-primary/30 hover:text-primary"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </Panel>
          </div>

          <Panel
            title={activeChat ? activeChat.title : "Ask a doubt"}
            description={activeChat ? `${activeChat.subject} · ${activeChat.mode === "grounded" ? "Grounded answers active" : "General explanations"}` : "Every answer is labelled grounded or general — no invented citations."}
            bodyClassName="flex min-h-[420px] flex-col"
          >
            <div className="flex-1 space-y-4 overflow-y-auto pr-1">
              {!activeChat && (
                <div className="flex h-full flex-col items-center justify-center py-12 text-center">
                  <span className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white">
                    <Bot className="size-6" />
                  </span>
                  <p className="mt-3 font-display text-sm font-semibold">Your study companion, grounded in your syllabus</p>
                  <p className="mt-1 max-w-sm text-[11px] leading-5 text-muted-foreground">
                    Ask a concept question, attach nothing, and get a structured answer.
                    When a matching course resource is found, citations name the real
                    document and page.
                  </p>
                </div>
              )}
              {activeChat?.messages.map((message) => (
                <div key={message.id} className={message.role === "user" ? "flex justify-end" : "flex justify-start"}>
                  <div
                    className={`max-w-[88%] rounded-2xl px-3.5 py-3 text-[11px] leading-6 ${
                      message.role === "user"
                        ? "rounded-br-md bg-primary text-primary-foreground"
                        : "rounded-bl-md border border-border/70 bg-muted/30"
                    }`}
                  >
                    {message.role === "assistant" && (
                      <div className="mb-2 flex flex-wrap items-center gap-1.5">
                        <Chip className={message.grounded ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700"}>
                          {message.grounded ? "Grounded in your materials" : "General AI explanation"}
                        </Chip>
                      </div>
                    )}
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    {message.citations && message.citations.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {message.citations.map((citation) => (
                          <span key={`${citation.title}-${citation.page}`} className="inline-flex items-center gap-1 rounded-md border border-border/70 bg-card px-1.5 py-0.5 text-[9px] text-muted-foreground">
                            <BookOpen className="size-2.5" /> {citation.title} · p. {citation.page}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {asking && (
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <Loader2 className="size-3.5 animate-spin" /> Retrieving your course material…
                </div>
              )}
            </div>

            <div className="mt-4 flex items-end gap-2 border-t border-border/60 pt-4">
              <Textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleAsk();
                  }
                }}
                rows={2}
                placeholder="Ask a concept question… (Enter to send)"
                className="min-h-[46px] resize-none"
              />
              <Button size="icon" className="size-10 shrink-0" onClick={() => handleAsk()} disabled={asking} aria-label="Send question">
                {asking ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              </Button>
            </div>
            <p className="mt-2 text-[9px] text-muted-foreground">
              Demo engine · answers are composed from indexed excerpts in the E-Library,
              not sent to an external model. Quota: 30 requests per day, enforced server-side.
            </p>
          </Panel>
        </TabsContent>

        <TabsContent value="practice" className="grid gap-5 lg:grid-cols-[1fr_1.5fr]">
          <div className="flex flex-col gap-4">
            <Panel title="Generate practice" description="Five-question sets with explanations and weak-topic tracking.">
              <div className="space-y-3">
                <Field label="Subject">
                  <Select value={quizSubject} onValueChange={setQuizSubject}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {subjectList.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Topic or focus">
                  <Input value={quizTopic} onChange={(e) => setQuizTopic(e.target.value)} placeholder="e.g. Normalisation" />
                </Field>
                <Field label="Difficulty">
                  <Select value={quizDifficulty} onValueChange={setQuizDifficulty}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Easy">Easy</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Button
                  className="w-full gap-2"
                  onClick={async () => {
                    try {
                      const id = await generateQuiz({ subject: quizSubject, topic: quizTopic, difficulty: quizDifficulty });
                      setActiveQuizId(id);
                      setQuizResult(null);
                      setAnswers({});
                      toast.success("Practice set ready");
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : "Could not generate practice");
                    }
                  }}
                >
                  <RefreshCw className="size-4" /> Generate quiz
                </Button>
              </div>
            </Panel>

            <Panel title="Past attempts" description="Your most recent scores.">
              {quizzes.attempts.length === 0 ? (
                <p className="py-4 text-center text-[11px] text-muted-foreground">No attempts yet.</p>
              ) : (
                <div className="space-y-2">
                  {quizzes.attempts.slice(0, 6).map((attempt) => (
                    <div key={attempt._id} className="flex items-center gap-2 rounded-xl border border-border/70 p-2.5">
                      <span className={`flex size-7 items-center justify-center rounded-lg text-[10px] font-bold ${attempt.score / attempt.total >= 0.6 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                        {Math.round((attempt.score / attempt.total) * 100)}%
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[11px] font-medium">{attempt.subject}</p>
                        <p className="text-[9px] text-muted-foreground">{attempt.score}/{attempt.total} · {fmtShortDate(attempt.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Panel>

            <Panel title="Your practice sets" description="Pick one to reattempt.">
              <div className="space-y-1.5">
                {quizzes.quizzes.map((quiz) => (
                  <button
                    key={quiz._id}
                    type="button"
                    onClick={() => {
                      setActiveQuizId(quiz._id);
                      setAnswers({});
                      setQuizResult(null);
                    }}
                    className={`flex w-full items-center gap-2 rounded-lg p-2 text-left text-[11px] transition ${activeQuizId === quiz._id ? "bg-indigo-50 text-indigo-800" : "hover:bg-muted/50"}`}
                  >
                    <Layers className="size-3.5 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1 truncate">{quiz.subject} · {quiz.topic}</span>
                    <ChevronRight className="size-3 text-muted-foreground" />
                  </button>
                ))}
                {quizzes.quizzes.length === 0 && <p className="py-3 text-center text-[11px] text-muted-foreground">No sets yet.</p>}
              </div>
            </Panel>
          </div>

          <Panel
            title={activeQuiz ? `${activeQuiz.subject} · ${activeQuiz.topic}` : "Practice set"}
            description={activeQuiz ? `${activeQuiz.questions.length} questions · ${activeQuiz.difficulty}` : "Generate a set to begin."}
          >
            {!activeQuiz ? (
              <EmptyState
                icon={Target}
                title="No practice set selected"
                description="Generate a quiz or pick one of your saved sets. Explanations appear after you submit."
              />
            ) : (
              <div className="space-y-4">
                {quizResult && (
                  <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/60 p-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="size-4 text-emerald-600" />
                      <p className="text-sm font-semibold text-emerald-800">
                        {quizResult.score}/{quizResult.total} correct · {Math.round((quizResult.score / quizResult.total) * 100)}%
                      </p>
                    </div>
                    {quizResult.weakTopics.length > 0 ? (
                      <p className="mt-1.5 text-[11px] leading-5 text-emerald-800/80">
                        Revise: {quizResult.weakTopics.slice(0, 3).join(" · ")}
                      </p>
                    ) : (
                      <p className="mt-1.5 text-[11px] text-emerald-800/80">Strong set — try a harder difficulty next.</p>
                    )}
                  </div>
                )}

                {activeQuiz.questions.map((q, index) => {
                  const chosen = answers[q.id];
                  return (
                    <div key={q.id} className="rounded-xl border border-border/70 p-3.5">
                      <p className="text-xs font-semibold">{index + 1}. {q.question}</p>
                      <div className="mt-2.5 space-y-1.5">
                        {q.options.map((option, optionIndex) => {
                          const isChosen = chosen === optionIndex;
                          const reveal = quizResult !== null;
                          const correct = optionIndex === q.answer;
                          return (
                            <button
                              key={option}
                              type="button"
                              disabled={quizResult !== null}
                              onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: optionIndex }))}
                              className={`flex w-full items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left text-[11px] transition ${
                                reveal && correct
                                  ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                                  : reveal && isChosen && !correct
                                    ? "border-rose-300 bg-rose-50 text-rose-900"
                                    : isChosen
                                      ? "border-indigo-300 bg-indigo-50 text-indigo-900"
                                      : "border-border/70 hover:bg-muted/50"
                              }`}
                            >
                              <span className={`flex size-4 shrink-0 items-center justify-center rounded-full border text-[9px] ${isChosen ? "border-current" : "border-border"}`}>
                                {String.fromCharCode(65 + optionIndex)}
                              </span>
                              {option}
                            </button>
                          );
                        })}
                      </div>
                      {quizResult !== null && (
                        <p className="mt-2 rounded-lg bg-muted/60 px-2.5 py-1.5 text-[10px] leading-4 text-muted-foreground">
                          {q.explanation}
                        </p>
                      )}
                    </div>
                  );
                })}

                {quizResult === null ? (
                  <Button
                    className="w-full"
                    disabled={Object.keys(answers).length !== activeQuiz.questions.length || quizBusy}
                    onClick={async () => {
                      setQuizBusy(true);
                      try {
                        const result = await submitQuiz({
                          quizId: activeQuiz._id,
                          answers: activeQuiz.questions.map((q) => answers[q.id] ?? -1),
                        });
                        setQuizResult(result);
                        toast.success("Practice submitted", { description: `${result.score}/${result.total} correct.` });
                      } catch (error) {
                        toast.error(error instanceof Error ? error.message : "Could not score the quiz");
                      } finally {
                        setQuizBusy(false);
                      }
                    }}
                  >
                    {quizBusy ? "Scoring…" : `Submit ${Object.keys(answers).length}/${activeQuiz.questions.length} answered`}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full gap-1.5"
                    onClick={() => {
                      setAnswers({});
                      setQuizResult(null);
                    }}
                  >
                    <RefreshCw className="size-3.5" /> Try again
                  </Button>
                )}
              </div>
            )}
          </Panel>
        </TabsContent>

        <TabsContent value="summaries" className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
          <Panel title="Summarise your notes" description="Paste unit notes to generate a concise revision sheet.">
            <div className="space-y-3">
              <Field label="Title">
                <Input value={docTitle} onChange={(e) => setDocTitle(e.target.value)} placeholder="e.g. OS Unit 3 — memory" />
              </Field>
              <Field label="Subject">
                <Select value={docSubject} onValueChange={setDocSubject}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {subjectList.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Notes" hint="At least a few paragraphs. Processing runs asynchronously and the card updates live.">
                <Textarea rows={8} value={docText} onChange={(e) => setDocText(e.target.value)} placeholder="Paste the unit notes here…" />
              </Field>
              <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-border px-3 py-2.5 text-[11px] text-muted-foreground">
                <Upload className="size-4 text-primary" />
                Or choose a PDF / text file (demo records the name)
                <input type="file" className="hidden" accept=".pdf,.txt,.doc,.docx" />
              </label>
              <Button
                className="w-full gap-2"
                disabled={docBusy}
                onClick={async () => {
                  setDocBusy(true);
                  try {
                    await summarizeNotes({ title: docTitle, subject: docSubject, text: docText });
                    toast.success("Notes received", { description: "Processing runs asynchronously — the card will flip to ready." });
                    setDocTitle("");
                    setDocText("");
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : "Could not process notes");
                  } finally {
                    setDocBusy(false);
                  }
                }}
              >
                {docBusy ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                {docBusy ? "Extracting…" : "Summarise notes"}
              </Button>
            </div>
          </Panel>

          <div className="flex flex-col gap-4">
            {docs.length === 0 ? (
              <Panel>
                <EmptyState
                  icon={FileText}
                  title="No summaries yet"
                  description="Your summarised notes appear here with keywords and processing status."
                />
              </Panel>
            ) : (
              docs.map((doc) => (
                <Panel
                  key={doc._id}
                  title={doc.title}
                  description={`${doc.subject} · ${doc.pages} page${doc.pages === 1 ? "" : "s"} · ${fmtShortDate(doc.createdAt)}`}
                  action={
                    <div className="flex items-center gap-2">
                      <StatusBadge
                        status={doc.status === "ready" ? "approved" : doc.status}
                        label={doc.status === "ready" ? "Ready" : doc.status === "processing" ? "Processing" : "Failed"}
                      />
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0" aria-label="Delete summary" onClick={() => deleteDoc({ docId: doc._id })}>
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  }
                >
                  {doc.status === "processing" ? (
                    <div className="flex items-center gap-2 py-4 text-xs text-muted-foreground">
                      <Loader2 className="size-4 animate-spin" /> Extracting key points from your notes…
                    </div>
                  ) : (
                    <>
                      <p className="whitespace-pre-wrap text-[11px] leading-6 text-foreground/90">{doc.summary}</p>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {doc.keywords.map((keyword) => <Chip key={keyword}>#{keyword}</Chip>)}
                      </div>
                    </>
                  )}
                </Panel>
              ))
            )}
            <div className="flex items-start gap-2 rounded-xl border border-indigo-100 bg-indigo-50/50 px-3.5 py-3 text-[10px] leading-4 text-indigo-800">
              <GraduationCap className="mt-0.5 size-3.5 shrink-0" />
              Notes are private to your account. Deleting a summary removes it from your
              Study Hub; AI chat history is kept separately until you delete it.
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </PageWrap>
  );
}
