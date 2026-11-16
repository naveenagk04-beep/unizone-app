import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import {
  action,
  internalMutation,
  internalQuery,
  mutation,
  query,
  type QueryCtx,
} from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { audit, requireUser } from "./lib";

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

const QUESTION_BANK = [
  { subject: "Database Management Systems", question: "Which normal form removes transitive dependencies?", options: ["1NF", "2NF", "3NF", "BCNF"], answer: 2, explanation: "3NF removes transitive dependencies on the primary key, while 2NF removes partial dependencies." },
  { subject: "Database Management Systems", question: "A transaction that never exposes partial updates satisfies which property?", options: ["Atomicity", "Consistency", "Isolation", "Durability"], answer: 0, explanation: "Atomicity means all operations in a transaction succeed or none of them are applied." },
  { subject: "Database Management Systems", question: "Which index is best for range queries?", options: ["Hash index", "B+ tree index", "Bitmap index", "Inverted index"], answer: 1, explanation: "B+ trees keep keys ordered, so range scans remain efficient." },
  { subject: "Database Management Systems", question: "In SQL, which clause filters groups after aggregation?", options: ["WHERE", "HAVING", "GROUP BY", "ORDER BY"], answer: 1, explanation: "HAVING filters aggregated groups; WHERE filters rows before grouping." },
  { subject: "Operating Systems", question: "Which scheduling algorithm can cause starvation of long jobs?", options: ["FCFS", "SJF", "Round Robin", "FIFO"], answer: 1, explanation: "Shortest Job First keeps preferring short jobs, so long jobs may wait indefinitely." },
  { subject: "Operating Systems", question: "Which condition is NOT required for deadlock?", options: ["Mutual exclusion", "Hold and wait", "Preemption", "Circular wait"], answer: 2, explanation: "Deadlock needs no preemption; allowing preemption breaks the cycle." },
  { subject: "Operating Systems", question: "Paging suffers from which main overhead?", options: ["Internal fragmentation", "External fragmentation", "Page faults", "Context switches"], answer: 2, explanation: "Paging avoids external fragmentation but can cause page faults when pages are not resident." },
  { subject: "Operating Systems", question: "A page replacement policy with Belady's anomaly is:", options: ["LRU", "FIFO", "Optimal", "Clock"], answer: 1, explanation: "FIFO can show more page faults when frames increase; LRU and Optimal do not." },
  { subject: "Data Structures & Algorithms", question: "Which structure follows FIFO order?", options: ["Stack", "Queue", "Heap", "Tree"], answer: 1, explanation: "A queue inserts at the rear and removes from the front, which is FIFO." },
  { subject: "Data Structures & Algorithms", question: "BFS on a graph is implemented using a:", options: ["Stack", "Queue", "Priority queue", "Hash map"], answer: 1, explanation: "BFS explores level by level, so it uses a queue." },
  { subject: "Data Structures & Algorithms", question: "The worst-case time complexity of quicksort is:", options: ["O(n log n)", "O(n²)", "O(n)", "O(log n)"], answer: 1, explanation: "Unbalanced partitions on sorted input produce O(n²) worst-case behaviour." },
  { subject: "Data Structures & Algorithms", question: "Dijkstra's algorithm requires edge weights to be:", options: ["Negative", "Non-negative", "Integers", "Equal"], answer: 1, explanation: "Negative weights break the greedy assumption used by Dijkstra." },
  { subject: "Computer Networks", question: "Which layer of TCP/IP handles logical addressing?", options: ["Link", "Internet", "Transport", "Application"], answer: 1, explanation: "The internet layer handles IP addressing and routing." },
  { subject: "Computer Networks", question: "TCP guarantees ordered delivery using:", options: ["Port numbers", "Sequence numbers", "MAC addresses", "Checksums only"], answer: 1, explanation: "Sequence numbers let the receiver reorder segments and detect gaps." },
  { subject: "Computer Networks", question: "How many usable hosts are in a /30 IPv4 subnet?", options: ["2", "4", "6", "8"], answer: 0, explanation: "A /30 has 4 addresses, of which 2 are usable after network and broadcast." },
  { subject: "Computer Networks", question: "Which protocol maps IP addresses to MAC addresses?", options: ["DNS", "DHCP", "ARP", "ICMP"], answer: 2, explanation: "ARP resolves an IPv4 address to a local link-layer MAC address." },
  { subject: "Artificial Intelligence", question: "A* search is optimal when the heuristic is:", options: ["Zero", "Admissible", "Random", "Negative"], answer: 1, explanation: "An admissible heuristic never overestimates the true remaining cost." },
  { subject: "Artificial Intelligence", question: "Supervised learning requires:", options: ["Only inputs", "Labelled data", "Reward signals", "No data"], answer: 1, explanation: "Supervised learning learns a mapping from labelled input-output pairs." },
  { subject: "Artificial Intelligence", question: "Backpropagation computes:", options: ["Activations", "Gradients", "Biases only", "Epochs"], answer: 1, explanation: "Backpropagation applies the chain rule to compute gradients for weight updates." },
  { subject: "Artificial Intelligence", question: "Which metric is misleading on imbalanced classes?", options: ["F1 score", "Precision", "Accuracy", "Recall"], answer: 2, explanation: "High accuracy is easy to reach when one class dominates the dataset." },
];

const GENERAL_GUIDANCE: Record<string, string[]> = {
  "Database Management Systems": [
    "Start from the entity-relationship view, then map entities to tables and relationships to foreign keys.",
    "Check normal form one step at a time: 1NF needs atomic values, 2NF removes partial dependencies, 3NF removes transitive dependencies.",
    "For transaction questions, reason about atomicity and isolation before discussing performance.",
  ],
  "Operating Systems": [
    "Separate the CPU view (processes, scheduling) from the memory view (paging, segmentation).",
    "Draw a resource allocation graph before answering any deadlock question.",
    "Compare algorithms with a small worked table: waiting time, turnaround time, throughput.",
  ],
  "Data Structures & Algorithms": [
    "State the invariant of the data structure before writing the operation.",
    "For graph problems, decide first whether the graph is weighted, directed, or acyclic.",
    "Express the complexity of every loop nest you write; that is usually where marks are lost.",
  ],
  "Computer Networks": [
    "Walk the packet down the layers: application, transport, internet, link.",
    "For subnetting, convert the prefix to a mask and count block size before listing hosts.",
    "Explain TCP state transitions with a diagram; it wins structure marks.",
  ],
  "Artificial Intelligence": [
    "Write the state space, goal test and cost function before choosing a search strategy.",
    "For ML questions, identify whether the task is classification, regression or clustering first.",
    "Always mention an evaluation metric and a validation split when discussing a model.",
  ],
};

const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "of", "to", "in", "is", "are", "was", "were", "what", "how", "why", "explain", "with", "for", "on", "that", "this", "it", "be", "can", "does", "do", "difference", "between",
]);

function terms(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

// Deterministic engine: used when the LLM provider is unavailable, and for
// offline demos. It stays an internal mutation because the public entry point
// is the `ask` action below, which prefers the real model.
export const askLocal = internalMutation({
  args: {
    userId: v.id("users"),
    subject: v.string(),
    question: v.string(),
    chatId: v.optional(v.id("aiChats")),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("Please sign in to continue.");
    if (user.status === "disabled")
      throw new Error("This account has been disabled by the administrator.");
    const question = args.question.trim();
    if (question.length < 8) throw new Error("Ask a slightly longer question so I can help properly.");

    const quotaSetting = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", "aiQuota"))
      .unique();
    const quota = Number(quotaSetting?.value ?? "30");
    const chats = await ctx.db
      .query("aiChats")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .take(200);
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const usedToday = chats.filter((c) => c.createdAt >= startOfToday.getTime()).length;
    if (usedToday >= quota) {
      throw new Error(`You have reached today's limit of ${quota} AI requests. Practice sets and plans still work.`);
    }

    const resources = await ctx.db.query("libraryResources").take(80);
    const readable = resources.filter((r) => {
      if (r.access === "public") return true;
      if (r.access === "department") return r.department === user.department;
      return !!user.role && ["faculty", "hod", "admin"].includes(user.role);
    });
    const qTerms = terms(question);
    let bestScore = 0;
    let best: (typeof readable)[number] | undefined;
    for (const resource of readable) {
      if (resource.subject !== args.subject && resource.subject !== "All subjects") continue;
      const haystack = `${resource.title} ${resource.content} ${resource.tags.join(" ")}`.toLowerCase();
      const score = qTerms.filter((t) => haystack.includes(t)).length;
      if (score > bestScore) {
        bestScore = score;
        best = resource;
      }
    }

    const now = Date.now();
    let answer: string;
    let grounded = false;
    let citations: { title: string; page: number }[] = [];

    if (best && bestScore >= 1) {
      grounded = true;
      const sentences = best.content
        .split(/(?<=\.)\s+/)
        .filter((s) => s.trim().length > 20);
      const relevant = sentences
        .map((s) => ({ s, score: qTerms.filter((t) => s.toLowerCase().includes(t)).length }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map((x) => x.s);
      const picked = relevant.length ? relevant : sentences.slice(0, 2);
      answer = [
        `From your course material — ${args.subject}`,
        "",
        `Short answer`,
        picked[0] ?? best.description,
        "",
        `How to think about it`,
        ...picked.slice(1).map((p, i) => `${i + 1}. ${p}`),
        "",
        `For the exam`,
        `• Anchor your answer in ${best.title} (${best.unit}).`,
        `• Rewrite the idea in one sentence, then add a worked example of your own.`,
        `• Source: ${best.title}${best.pages ? ` · approx. page ${Math.max(1, Math.round(best.pages * 0.35))}` : ""}.`,
      ].join("\n");
      citations = [
        {
          title: best.title,
          page: Math.max(1, Math.round((best.pages || 1) * 0.35)),
        },
      ];
    } else {
      const guidance = GENERAL_GUIDANCE[args.subject] ?? [
        "Break the question into the definition, the mechanism, and one concrete example.",
        "Write down what you already know, then find the gap in your reasoning.",
        "Check the textbook unit summary for the exact terminology your examiner expects.",
      ];
      answer = [
        `General AI explanation — no matching course document was retrieved`,
        "",
        `A clear way to approach this`,
        ...guidance.map((g, i) => `${i + 1}. ${g}`),
        "",
        `Your question: ${question}`,
        "",
        "This answer is generated from study guidance rather than your uploaded notes. Add the relevant notes to the E-Library, or attach a document in Study Hub, for a grounded answer with citations.",
      ].join("\n");
    }

    const message = {
      id: uid(),
      role: "assistant",
      content: answer,
      grounded,
      citations,
    };
    const userMessage = { id: uid(), role: "user", content: question };

    if (args.chatId) {
      const chat = await ctx.db.get(args.chatId);
      if (!chat || chat.userId !== user._id) throw new Error("Conversation not found.");
      await ctx.db.patch(args.chatId, {
        messages: [...chat.messages, userMessage, message],
        updatedAt: now,
      });
      return { chatId: args.chatId, message };
    }

    const chatId = await ctx.db.insert("aiChats", {
      userId: user._id,
      title: question.length > 64 ? `${question.slice(0, 61)}…` : question,
      subject: args.subject,
      mode: grounded ? "grounded" : "general",
      messages: [userMessage, message],
      createdAt: now,
      updatedAt: now,
    });
    return { chatId, message };
  },
});

type PromptContext = {
  subject: string;
  question: string;
  history: { role: string; content: string }[];
  material: { title: string; unit: string; page: number; excerpt: string } | null;
};

const SYSTEM_PROMPT = [
  "You are UniZone's study assistant for an Indian engineering college.",
  "Answer for the subject the student selected, in the register of a patient tutor.",
  "When retrieved course material is supplied, base the explanation on it and never invent a source, quote or page number.",
  "When no material is supplied, say plainly that this is a general explanation and suggest adding the relevant notes to the E-Library.",
  "Write plain text only: no markdown, no asterisks, no # headings. Use short section labels in Title Case and bullet points starting with the character •.",
  "Stay under 220 words and finish with one exam-oriented tip.",
].join(" ");

function buildPrompt(context: PromptContext): string {
  const lines: string[] = [`Subject: ${context.subject}`, `Student's question: ${context.question}`];
  if (context.history.length) {
    lines.push("Earlier in this conversation:");
    for (const turn of context.history) {
      lines.push(`${turn.role === "user" ? "Student" : "You"}: ${turn.content}`);
    }
  }
  if (context.material) {
    lines.push(
      "Retrieved course material (the only material you may cite):",
      `Title: ${context.material.title}`,
      `Unit: ${context.material.unit}`,
      `Excerpt: ${context.material.excerpt}`,
    );
  } else {
    lines.push("Retrieved course material: none — answer as a general explanation and say so.");
  }
  return lines.join("\n");
}

async function retrieveMaterial(
  ctx: QueryCtx,
  user: Doc<"users">,
  subject: string,
  question: string,
): Promise<PromptContext["material"]> {
  const resources = await ctx.db.query("libraryResources").take(80);
  const readable = resources.filter((r) => {
    if (r.access === "public") return true;
    if (r.access === "department") return r.department === user.department;
    return !!user.role && ["faculty", "hod", "admin"].includes(user.role);
  });
  const qTerms = terms(question);
  let bestScore = 0;
  let best: (typeof readable)[number] | undefined;
  for (const resource of readable) {
    if (resource.subject !== subject && resource.subject !== "All subjects") continue;
    const haystack = `${resource.title} ${resource.content} ${resource.tags.join(" ")}`.toLowerCase();
    const score = qTerms.filter((t) => haystack.includes(t)).length;
    if (score > bestScore) {
      bestScore = score;
      best = resource;
    }
  }
  if (!best || bestScore < 1) return null;

  const sentences = best.content
    .split(/(?<=\.)\s+/)
    .filter((s) => s.trim().length > 20);
  const excerpt = sentences
    .map((s) => ({ s, score: qTerms.filter((t) => s.toLowerCase().includes(t)).length }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .map((x) => x.s)
    .join(" ")
    .slice(0, 1200);

  return {
    title: best.title,
    unit: best.unit,
    page: Math.max(1, Math.round((best.pages || 1) * 0.35)),
    excerpt: excerpt || best.description,
  };
}

// Read-only half of the doubt solver: ownership, quota, conversation history
// and retrieval. Runs before the model call so a blocked request costs nothing.
export const askPrompt = internalQuery({
  args: {
    userId: v.id("users"),
    subject: v.string(),
    question: v.string(),
    chatId: v.optional(v.id("aiChats")),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("Please sign in to continue.");
    if (user.status === "disabled")
      throw new Error("This account has been disabled by the administrator.");

    const question = args.question.trim();
    if (question.length < 8) throw new Error("Ask a slightly longer question so I can help properly.");

    const quotaSetting = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", "aiQuota"))
      .unique();
    const quota = Number(quotaSetting?.value ?? "30");
    const chats = await ctx.db
      .query("aiChats")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .take(200);
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const usedToday = chats.filter((c) => c.createdAt >= startOfToday.getTime()).length;
    if (usedToday >= quota) {
      throw new Error(`You have reached today's limit of ${quota} AI requests. Practice sets and plans still work.`);
    }

    let history: PromptContext["history"] = [];
    if (args.chatId) {
      const chat = await ctx.db.get(args.chatId);
      if (!chat || chat.userId !== user._id) throw new Error("Conversation not found.");
      history = chat.messages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .slice(-4)
        .map((m) => ({ role: m.role, content: m.content.slice(0, 700) }));
    }

    const material = await retrieveMaterial(ctx, user, args.subject, question);

    const context: PromptContext = {
      subject: args.subject,
      question,
      history,
      material,
    };
    return context;
  },
});

export const saveAssistant = internalMutation({
  args: {
    userId: v.id("users"),
    chatId: v.optional(v.id("aiChats")),
    subject: v.string(),
    question: v.string(),
    answer: v.string(),
    grounded: v.boolean(),
    citations: v.array(v.object({ title: v.string(), page: v.number() })),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("Please sign in to continue.");
    const now = Date.now();
    const message = {
      id: uid(),
      role: "assistant",
      content: args.answer,
      grounded: args.grounded,
      citations: args.citations,
    };
    const userMessage = { id: uid(), role: "user", content: args.question };

    if (args.chatId) {
      const chat = await ctx.db.get(args.chatId);
      if (!chat || chat.userId !== user._id) throw new Error("Conversation not found.");
      await ctx.db.patch(args.chatId, {
        messages: [...chat.messages, userMessage, message],
        updatedAt: now,
      });
      return { chatId: args.chatId, message };
    }

    const chatId = await ctx.db.insert("aiChats", {
      userId: user._id,
      title: args.question.length > 64 ? `${args.question.slice(0, 61)}…` : args.question,
      subject: args.subject,
      mode: args.grounded ? "grounded" : "general",
      messages: [userMessage, message],
      createdAt: now,
      updatedAt: now,
    });
    return { chatId, message };
  },
});

type AskResult = {
  chatId: Id<"aiChats">;
  message: {
    id: string;
    role: string;
    content: string;
    grounded?: boolean;
    citations?: { title: string; page: number }[];
  };
};

// Public entry point. The model is called server-side with the deployment's
// integration key; if it is unavailable the deterministic engine answers, so
// the Study Hub never breaks in a demo or offline environment.
export const ask = action({
  args: {
    subject: v.string(),
    question: v.string(),
    chatId: v.optional(v.id("aiChats")),
  },
  handler: async (ctx, args): Promise<AskResult> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Please sign in to continue.");

    const context = await ctx.runQuery(internal.study.askPrompt, {
      userId,
      subject: args.subject,
      question: args.question,
      chatId: args.chatId,
    });

    const completion = await ctx.runAction(internal.ai.complete, {
      system: SYSTEM_PROMPT,
      prompt: buildPrompt(context),
    });

    if (!completion.text) {
      return await ctx.runMutation(internal.study.askLocal, {
        userId,
        subject: args.subject,
        question: context.question,
        chatId: args.chatId,
      });
    }

    return await ctx.runMutation(internal.study.saveAssistant, {
      userId,
      chatId: args.chatId,
      subject: args.subject,
      question: context.question,
      answer: completion.text,
      grounded: !!context.material,
      citations: context.material
        ? [{ title: context.material.title, page: context.material.page }]
        : [],
    });
  },
});

export const chats = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const rows = await ctx.db
      .query("aiChats")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .take(50);
    return rows.sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

export const deleteChat = mutation({
  args: { chatId: v.id("aiChats") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const chat = await ctx.db.get(args.chatId);
    if (!chat) throw new Error("Conversation not found.");
    if (chat.userId !== user._id) throw new Error("You can only delete your own conversations.");
    await ctx.db.delete(args.chatId);
    return null;
  },
});

export const generatePlan = mutation({
  args: {
    subject: v.string(),
    examDate: v.number(),
    hoursPerDay: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    if (args.examDate <= Date.now()) throw new Error("Pick an exam date in the future.");
    if (args.hoursPerDay < 0.5 || args.hoursPerDay > 12) {
      throw new Error("Choose between 0.5 and 12 study hours per day.");
    }
    const subject = (await ctx.db.query("subjects").take(30)).find((s) => s.name === args.subject);
    if (!subject) throw new Error("That subject is not in your department's catalogue.");

    const daysAvailable = Math.max(
      1,
      Math.min(21, Math.ceil((args.examDate - Date.now()) / 86_400_000)),
    );
    const units = subject.units;
    const topics: {
      id: string;
      title: string;
      unit: string;
      minutes: number;
      scheduledDate: string;
      done: boolean;
    }[] = [];
    let day = 0;
    for (let i = 0; i < units.length; i++) {
      const perDay = daysAvailable > units.length * 2 ? 1 : 2;
      day = Math.floor(i / perDay);
      const date = new Date();
      date.setDate(date.getDate() + 1 + day);
      topics.push({
        id: uid(),
        title: units[i],
        unit: `Unit ${i + 1}`,
        minutes: Math.round(args.hoursPerDay * 60 * 0.6),
        scheduledDate: date.toISOString().slice(0, 10),
        done: false,
      });
    }
    const revisionStart = new Date();
    revisionStart.setDate(revisionStart.getDate() + Math.max(2, daysAvailable - 2));
    topics.push({
      id: uid(),
      title: `${subject.name} — full revision and PYQ practice`,
      unit: "Revision",
      minutes: Math.round(args.hoursPerDay * 60),
      scheduledDate: revisionStart.toISOString().slice(0, 10),
      done: false,
    });

    const id = await ctx.db.insert("studyPlans", {
      userId: user._id,
      subject: args.subject,
      examDate: args.examDate,
      hoursPerDay: args.hoursPerDay,
      status: "draft",
      topics,
      createdAt: Date.now(),
    });
    await audit(ctx, user, `Generated a draft study plan for ${args.subject}`, `studyPlans/${id}`);
    return id;
  },
});

export const plans = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const rows = await ctx.db
      .query("studyPlans")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .take(30);
    return rows.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const toggleTopic = mutation({
  args: { planId: v.id("studyPlans"), topicId: v.string(), done: v.boolean() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const plan = await ctx.db.get(args.planId);
    if (!plan || plan.userId !== user._id) throw new Error("Plan not found.");
    await ctx.db.patch(args.planId, {
      topics: plan.topics.map((t) => (t.id === args.topicId ? { ...t, done: args.done } : t)),
    });
    return null;
  },
});

export const confirmPlan = mutation({
  args: { planId: v.id("studyPlans") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const plan = await ctx.db.get(args.planId);
    if (!plan || plan.userId !== user._id) throw new Error("Plan not found.");
    if (plan.status !== "draft") throw new Error("This plan is already confirmed.");
    await ctx.db.patch(args.planId, { status: "active" });
    await audit(ctx, user, `Confirmed study plan for ${plan.subject}`, `studyPlans/${args.planId}`);
    return null;
  },
});

export const deletePlan = mutation({
  args: { planId: v.id("studyPlans") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const plan = await ctx.db.get(args.planId);
    if (!plan || plan.userId !== user._id) throw new Error("Plan not found.");
    await ctx.db.delete(args.planId);
    return null;
  },
});

export const generateQuiz = mutation({
  args: { subject: v.string(), topic: v.string(), difficulty: v.string() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const bank = QUESTION_BANK.filter((q) => q.subject === args.subject);
    const pool = bank.length >= 5 ? bank : [...bank, ...QUESTION_BANK].slice(0, 8);
    const offset = Math.floor(Math.random() * Math.max(1, pool.length - 4));
    const picked = pool.slice(offset, offset + 5);
    const questions = picked.map((q) => ({
      id: uid(),
      question: q.question,
      options: q.options,
      answer: q.answer,
      explanation: q.explanation,
    }));
    const id = await ctx.db.insert("quizzes", {
      userId: user._id,
      subject: args.subject,
      topic: args.topic || "Mixed revision",
      difficulty: args.difficulty,
      questions,
      createdAt: Date.now(),
    });
    await audit(ctx, user, `Generated a practice quiz for ${args.subject}`, `quizzes/${id}`);
    return id;
  },
});

export const quizzes = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const rows = await ctx.db
      .query("quizzes")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .take(30);
    const attempts = await ctx.db
      .query("quizAttempts")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .take(80);
    return {
      quizzes: rows.sort((a, b) => b.createdAt - a.createdAt),
      attempts: attempts.sort((a, b) => b.createdAt - a.createdAt),
    };
  },
});

export const submitQuiz = mutation({
  args: { quizId: v.id("quizzes"), answers: v.array(v.number()) },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const quiz = await ctx.db.get(args.quizId);
    if (!quiz || quiz.userId !== user._id) throw new Error("Quiz not found.");
    if (args.answers.length !== quiz.questions.length) throw new Error("Answer every question before submitting.");
    const correct = quiz.questions.map((q, i) => (args.answers[i] === q.answer ? 1 : 0));
    const score = correct.reduce<number>((a, b) => a + b, 0);
    await ctx.db.insert("quizAttempts", {
      quizId: args.quizId,
      userId: user._id,
      subject: quiz.subject,
      score,
      total: quiz.questions.length,
      answers: args.answers,
      createdAt: Date.now(),
    });
    const weakTopics = quiz.questions.filter((_, i) => !correct[i]).map((q) => q.question);
    return { score, total: quiz.questions.length, weakTopics };
  },
});

function buildSummary(text: string) {
  const sentences = text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 30);
  if (!sentences.length) throw new Error("Paste a few paragraphs so there is something to summarise.");
  const freq = new Map<string, number>();
  for (const t of terms(text)) freq.set(t, (freq.get(t) ?? 0) + 1);
  const scored = sentences.map((s) => ({
    s,
    score: terms(s).reduce((sum, t) => sum + (freq.get(t) ?? 0), 0) / Math.sqrt(s.length),
  }));
  const chosen = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.min(6, scored.length))
    .map((x) => x.s);
  const keywords = [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([w]) => w);
  return { summary: chosen.map((c) => `• ${c}`).join("\n"), keywords };
}

export const summarizeNotes = mutation({
  args: { title: v.string(), subject: v.string(), text: v.string() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    if (args.title.trim().length < 3) throw new Error("Add a title for this note set.");
    if (args.text.trim().length < 120) throw new Error("Paste at least a few paragraphs of notes.");
    const { summary, keywords } = buildSummary(args.text);
    const id = await ctx.db.insert("studyDocs", {
      userId: user._id,
      title: args.title.trim(),
      subject: args.subject,
      status: "processing",
      pages: Math.max(1, Math.ceil(args.text.split(/\s+/).length / 350)),
      summary,
      keywords,
      createdAt: Date.now(),
    });
    await ctx.scheduler.runAfter(1200, internal.study.finishDoc, { docId: id });
    return id;
  },
});

export const finishDoc = internalMutation({
  args: { docId: v.id("studyDocs") },
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.docId);
    if (!doc) return;
    await ctx.db.patch(args.docId, { status: "ready" });
  },
});

export const docs = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const rows = await ctx.db
      .query("studyDocs")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .take(30);
    return rows.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const deleteDoc = mutation({
  args: { docId: v.id("studyDocs") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const doc = await ctx.db.get(args.docId);
    if (!doc || doc.userId !== user._id) throw new Error("Note set not found.");
    await ctx.db.delete(args.docId);
    return null;
  },
});
