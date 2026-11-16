import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser } from "./lib";

function today() {
  return new Date().toISOString().slice(0, 10);
}

export const overview = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .take(80);
    const notes = await ctx.db
      .query("notes")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .take(50);
    const goals = await ctx.db
      .query("goals")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .take(30);
    const habits = await ctx.db
      .query("habits")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .take(20);
    const logs = await ctx.db
      .query("habitLogs")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .take(300);
    const sessions = await ctx.db
      .query("focusSessions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .take(120);
    const events = await ctx.db
      .query("workspaceEvents")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .take(60);
    const bookmarks = await ctx.db
      .query("bookmarks")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .take(50);

    const weekAgo = Date.now() - 7 * 86_400_000;
    const weekSessions = sessions.filter((s) => s.startedAt >= weekAgo);
    const dailyMinutes: { day: string; minutes: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      dailyMinutes.push({
        day: key,
        minutes: sessions
          .filter((s) => new Date(s.startedAt).toISOString().slice(0, 10) === key)
          .reduce((sum, s) => sum + s.minutes, 0),
      });
    }

    return {
      tasks: tasks.sort((a, b) => Number(a.done) - Number(b.done) || a.createdAt - b.createdAt),
      notes: notes.sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt - a.updatedAt),
      goals,
      habits: habits.map((h) => ({
        ...h,
        dates: logs.filter((l) => l.habitId === h._id).map((l) => l.date),
      })),
      sessions: sessions.sort((a, b) => b.startedAt - a.startedAt),
      events: events.sort((a, b) => a.date.localeCompare(b.date)),
      bookmarkCount: bookmarks.length,
      stats: {
        focusThisWeek: weekSessions.reduce((sum, s) => sum + s.minutes, 0),
        sessionsThisWeek: weekSessions.length,
        completedTasks: tasks.filter((t) => t.done).length,
        totalTasks: tasks.length,
        dailyMinutes,
      },
    };
  },
});

export const addTask = mutation({
  args: {
    title: v.string(),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    dueAt: v.optional(v.number()),
    subject: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    if (args.title.trim().length < 2) throw new Error("Add a task title first.");
    return await ctx.db.insert("tasks", {
      userId: user._id,
      title: args.title.trim(),
      priority: args.priority,
      dueAt: args.dueAt,
      subject: args.subject,
      done: false,
      createdAt: Date.now(),
    });
  },
});

export const toggleTask = mutation({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const task = await ctx.db.get(args.taskId);
    if (!task || task.userId !== user._id) throw new Error("Task not found.");
    await ctx.db.patch(args.taskId, { done: !task.done });
    return null;
  },
});

export const deleteTask = mutation({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const task = await ctx.db.get(args.taskId);
    if (!task || task.userId !== user._id) throw new Error("Task not found.");
    await ctx.db.delete(args.taskId);
    return null;
  },
});

export const addNote = mutation({
  args: { title: v.string(), body: v.string(), subject: v.string() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    if (!args.title.trim()) throw new Error("Give your note a title.");
    return await ctx.db.insert("notes", {
      userId: user._id,
      title: args.title.trim(),
      body: args.body,
      subject: args.subject || "General",
      pinned: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const updateNote = mutation({
  args: {
    noteId: v.id("notes"),
    title: v.optional(v.string()),
    body: v.optional(v.string()),
    pinned: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const note = await ctx.db.get(args.noteId);
    if (!note || note.userId !== user._id) throw new Error("Note not found.");
    await ctx.db.patch(args.noteId, {
      title: args.title ?? note.title,
      body: args.body ?? note.body,
      pinned: args.pinned ?? note.pinned,
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const deleteNote = mutation({
  args: { noteId: v.id("notes") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const note = await ctx.db.get(args.noteId);
    if (!note || note.userId !== user._id) throw new Error("Note not found.");
    await ctx.db.delete(args.noteId);
    return null;
  },
});

export const addGoal = mutation({
  args: { title: v.string(), target: v.number(), unit: v.string() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    if (!args.title.trim() || args.target <= 0) throw new Error("A goal needs a title and a target.");
    return await ctx.db.insert("goals", {
      userId: user._id,
      title: args.title.trim(),
      target: args.target,
      progress: 0,
      unit: args.unit || "units",
      createdAt: Date.now(),
    });
  },
});

export const updateGoal = mutation({
  args: { goalId: v.id("goals"), delta: v.number() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const goal = await ctx.db.get(args.goalId);
    if (!goal || goal.userId !== user._id) throw new Error("Goal not found.");
    const progress = Math.min(goal.target, Math.max(0, goal.progress + args.delta));
    await ctx.db.patch(args.goalId, { progress });
    return progress;
  },
});

export const addHabit = mutation({
  args: { name: v.string(), emoji: v.string(), targetPerWeek: v.number() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    if (!args.name.trim()) throw new Error("Name your habit first.");
    return await ctx.db.insert("habits", {
      userId: user._id,
      name: args.name.trim(),
      emoji: args.emoji || "✅",
      targetPerWeek: Math.min(7, Math.max(1, args.targetPerWeek)),
      createdAt: Date.now(),
    });
  },
});

export const toggleHabitToday = mutation({
  args: { habitId: v.id("habits") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const habit = await ctx.db.get(args.habitId);
    if (!habit || habit.userId !== user._id) throw new Error("Habit not found.");
    const logs = await ctx.db
      .query("habitLogs")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .take(300);
    const existing = logs.find((l) => l.habitId === args.habitId && l.date === today());
    if (existing) {
      await ctx.db.delete(existing._id);
      return { done: false };
    }
    await ctx.db.insert("habitLogs", {
      userId: user._id,
      habitId: args.habitId,
      date: today(),
    });
    return { done: true };
  },
});

export const logSession = mutation({
  args: {
    minutes: v.number(),
    startedAt: v.number(),
    subject: v.optional(v.string()),
    kind: v.string(),
    completed: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    if (args.minutes < 1) throw new Error("Sessions need at least a minute of focus.");
    const id = await ctx.db.insert("focusSessions", {
      userId: user._id,
      minutes: Math.round(args.minutes),
      startedAt: args.startedAt,
      endedAt: Date.now(),
      subject: args.subject,
      status: args.completed ? "completed" : "interrupted",
      kind: args.kind,
    });
    return id;
  },
});

export const addWorkspaceEvent = mutation({
  args: { title: v.string(), date: v.string(), time: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    if (!args.title.trim()) throw new Error("Add an event title.");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(args.date)) throw new Error("Pick a valid date.");
    return await ctx.db.insert("workspaceEvents", {
      userId: user._id,
      title: args.title.trim(),
      date: args.date,
      time: args.time,
      kind: "personal",
      createdAt: Date.now(),
    });
  },
});

export const deleteWorkspaceEvent = mutation({
  args: { eventId: v.id("workspaceEvents") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const event = await ctx.db.get(args.eventId);
    if (!event || event.userId !== user._id) throw new Error("Event not found.");
    await ctx.db.delete(args.eventId);
    return null;
  },
});
