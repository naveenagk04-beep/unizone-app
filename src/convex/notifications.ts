import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUser } from "./lib";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const rows = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .take(60);
    return rows.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const unreadCount = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const rows = await ctx.db
      .query("notifications")
      .withIndex("by_user_read", (q) => q.eq("userId", user._id).eq("read", false))
      .take(100);
    return rows.length;
  },
});

export const markRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const notification = await ctx.db.get(args.notificationId);
    if (!notification || notification.userId !== user._id) {
      throw new Error("Notification not found.");
    }
    await ctx.db.patch(args.notificationId, { read: true });
    return null;
  },
});

export const markAllRead = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const rows = await ctx.db
      .query("notifications")
      .withIndex("by_user_read", (q) => q.eq("userId", user._id).eq("read", false))
      .take(100);
    for (const row of rows) {
      await ctx.db.patch(row._id, { read: true });
    }
    return rows.length;
  },
});
