import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { audit, requireRole, requireUser } from "./lib";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const events = await ctx.db.query("events").take(60);
    const registrations = await ctx.db.query("eventRegistrations").take(400);
    return events
      .sort((a, b) => a.startAt - b.startAt)
      .map((event) => {
        const mine = registrations.find(
          (r) => r.eventId === event._id && r.userId === user._id,
        );
        return {
          ...event,
          registered: mine?.status === "registered",
          registrationCount: registrations.filter(
            (r) => r.eventId === event._id && r.status === "registered",
          ).length,
        };
      });
  },
});

export const mine = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const registrations = await ctx.db
      .query("eventRegistrations")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .take(80);
    const events = await ctx.db.query("events").take(60);
    return registrations
      .filter((r) => r.status === "registered")
      .map((r) => ({ registration: r, event: events.find((e) => e._id === r.eventId) }))
      .filter((x) => x.event)
      .sort((a, b) => (a.event?.startAt ?? 0) - (b.event?.startAt ?? 0));
  },
});

export const register = mutation({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    if (user.role !== "student") throw new Error("Only student accounts can register for events.");
    const event = await ctx.db.get(args.eventId);
    if (!event) throw new Error("Event not found.");
    if (!event.registrationOpen) throw new Error("Registration for this event is closed.");
    if (event.startAt < Date.now()) throw new Error("This event has already started.");

    const registrations = await ctx.db
      .query("eventRegistrations")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .take(600);
    const active = registrations.filter((r) => r.status === "registered");
    if (active.some((r) => r.userId === user._id)) {
      throw new Error("You are already registered for this event.");
    }
    if (active.length >= event.capacity) {
      throw new Error("This event has reached its capacity.");
    }
    await ctx.db.insert("eventRegistrations", {
      eventId: args.eventId,
      userId: user._id,
      userName: user.name ?? "Student",
      status: "registered",
      createdAt: Date.now(),
    });
    await ctx.db.insert("notifications", {
      userId: user._id,
      title: `Registered · ${event.title}`,
      body: `${new Date(event.startAt).toLocaleDateString("en-IN", { day: "numeric", month: "long" })} at ${event.venue}. A reminder will appear in your notifications before the event.`,
      kind: "event",
      link: "/events",
      read: false,
      createdAt: Date.now(),
    });
    await audit(ctx, user, `Registered for event "${event.title}"`, `events/${args.eventId}`);
    return null;
  },
});

export const cancelRegistration = mutation({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const registrations = await ctx.db
      .query("eventRegistrations")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .take(600);
    const mine = registrations.find(
      (r) => r.userId === user._id && r.status === "registered",
    );
    if (!mine) throw new Error("You are not registered for this event.");
    await ctx.db.patch(mine._id, { status: "cancelled" });
    const event = await ctx.db.get(args.eventId);
    await audit(ctx, user, `Cancelled registration for "${event?.title ?? "event"}"`, `events/${args.eventId}`);
    return null;
  },
});

export const createEvent = mutation({
  args: {
    title: v.string(),
    type: v.string(),
    description: v.string(),
    venue: v.string(),
    startAt: v.number(),
    endAt: v.number(),
    fee: v.number(),
    capacity: v.number(),
    tags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, ["event_coordinator", "admin"]);
    if (args.title.trim().length < 4) throw new Error("Give the event a clear title.");
    if (args.endAt < args.startAt) throw new Error("The end time must be after the start time.");
    if (args.capacity < 1) throw new Error("Capacity must be at least 1.");
    const themes = ["indigo", "violet", "cyan", "amber", "emerald"];
    const id = await ctx.db.insert("events", {
      title: args.title.trim(),
      type: args.type,
      description: args.description.trim(),
      venue: args.venue.trim() || "Campus",
      startAt: args.startAt,
      endAt: args.endAt,
      fee: Math.max(0, args.fee),
      capacity: Math.round(args.capacity),
      coordinatorName: user.name ?? "Event coordinator",
      department: user.department ?? "CSE",
      registrationOpen: true,
      tags: args.tags,
      theme: themes[Math.floor(Math.random() * themes.length)] ?? "indigo",
    });
    await audit(ctx, user, `Published event "${args.title}"`, `events/${id}`);
    return id;
  },
});

export const registrationsForEvent = query({
  args: { eventId: v.id("events") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    if (!user.role || !["event_coordinator", "admin"].includes(user.role)) return [];
    const event = await ctx.db.get(args.eventId);
    if (!event) return [];
    if (user.role !== "admin" && event.department !== user.department) return [];
    const rows = await ctx.db
      .query("eventRegistrations")
      .withIndex("by_event", (q) => q.eq("eventId", args.eventId))
      .take(600);
    return rows
      .filter((r) => r.status === "registered")
      .sort((a, b) => a.createdAt - b.createdAt);
  },
});

export const setRegistrationOpen = mutation({
  args: { eventId: v.id("events"), open: v.boolean() },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, ["event_coordinator", "admin"]);
    const event = await ctx.db.get(args.eventId);
    if (!event) throw new Error("Event not found.");
    if (user.role !== "admin" && event.department !== user.department) {
      throw new Error("You can only manage events from your own department.");
    }
    await ctx.db.patch(args.eventId, { registrationOpen: args.open });
    await audit(ctx, user, `${args.open ? "Opened" : "Closed"} registration for "${event.title}"`, `events/${args.eventId}`);
    return null;
  },
});
