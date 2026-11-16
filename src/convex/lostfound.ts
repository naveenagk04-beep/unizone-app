import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { audit, notify, requireRole, requireUser, STAFF_ROLES } from "./lib";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const staff = !!user.role && ["admin", "hod", "faculty"].includes(user.role);
    const items = await ctx.db.query("lostFound").take(80);
    return items
      .sort((a, b) => b.createdAt - a.createdAt)
      .map(({ contact, ...rest }) => ({
        ...rest,
        contact: staff ? contact : undefined,
        isMine: rest.reporterId === user._id,
      }));
  },
});

export const mine = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const items = await ctx.db.query("lostFound").take(80);
    const claims = await ctx.db
      .query("claims")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .take(40);
    return {
      reports: items
        .filter((i) => i.reporterId === user._id)
        .sort((a, b) => b.createdAt - a.createdAt),
      claims: claims
        .map((claim) => ({
          claim,
          item: items.find((i) => i._id === claim.itemId),
        }))
        .filter((c) => c.item),
    };
  },
});

export const create = mutation({
  args: {
    type: v.union(v.literal("lost"), v.literal("found")),
    title: v.string(),
    category: v.string(),
    description: v.string(),
    location: v.string(),
    date: v.string(),
    contact: v.string(),
    emoji: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    if (args.title.trim().length < 4) throw new Error("Add a clear item title.");
    if (args.description.trim().length < 12) throw new Error("Describe the item so it can be identified.");
    if (args.contact.trim().length < 6) throw new Error("Add a contact the campus office can use.");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(args.date)) throw new Error("Pick the date you lost or found it.");
    const id = await ctx.db.insert("lostFound", {
      type: args.type,
      title: args.title.trim(),
      category: args.category,
      description: args.description.trim(),
      location: args.location.trim() || "Campus",
      date: args.date,
      reporterId: user._id,
      reporterName: user.name ?? "Campus member",
      contact: args.contact.trim(),
      status: "open",
      emoji: args.emoji || "📦",
      createdAt: Date.now(),
    });
    await audit(ctx, user, `Reported ${args.type} item "${args.title}"`, `lostFound/${id}`);
    return id;
  },
});

export const claim = mutation({
  args: { itemId: v.id("lostFound"), evidence: v.string() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const item = await ctx.db.get(args.itemId);
    if (!item) throw new Error("Item not found.");
    if (item.reporterId === user._id) throw new Error("You cannot claim your own report.");
    if (item.status === "resolved") throw new Error("This item has already been returned.");
    if (args.evidence.trim().length < 20) {
      throw new Error("Add enough detail to verify ownership (at least 20 characters).");
    }
    const existing = await ctx.db
      .query("claims")
      .withIndex("by_item", (q) => q.eq("itemId", args.itemId))
      .take(30);
    if (existing.some((c) => c.userId === user._id && c.status === "pending")) {
      throw new Error("You already have a pending claim for this item.");
    }
    await ctx.db.insert("claims", {
      itemId: args.itemId,
      userId: user._id,
      userName: user.name ?? "Student",
      evidence: args.evidence.trim(),
      status: "pending",
      createdAt: Date.now(),
    });
    const staff = await ctx.db.query("users").withIndex("by_role", (q) => q.eq("role", "admin")).take(10);
    for (const person of staff) {
      await notify(ctx, person._id, {
        title: "New lost & found claim",
        body: `${user.name ?? "A student"} submitted a claim for “${item.title}”. Verify it from the admin console.`,
        kind: "lostfound",
        link: "/admin",
      });
    }
    await audit(ctx, user, `Submitted a claim for "${item.title}"`, `lostFound/${args.itemId}`);
    return null;
  },
});

export const claimsForItem = query({
  args: { itemId: v.id("lostFound") },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, STAFF_ROLES);
    if (user.role === "faculty" && user.department !== "CSE") return [];
    return await ctx.db
      .query("claims")
      .withIndex("by_item", (q) => q.eq("itemId", args.itemId))
      .take(30);
  },
});

export const decideClaim = mutation({
  args: {
    claimId: v.id("claims"),
    decision: v.union(v.literal("approved"), v.literal("rejected")),
  },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, STAFF_ROLES);
    const claim = await ctx.db.get(args.claimId);
    if (!claim) throw new Error("Claim not found.");
    if (claim.status !== "pending") throw new Error("This claim was already reviewed.");
    const item = await ctx.db.get(claim.itemId);
    if (!item) throw new Error("Item not found.");
    await ctx.db.patch(args.claimId, { status: args.decision });
    if (args.decision === "approved") {
      await ctx.db.patch(claim.itemId, { status: "claimed" });
    }
    await notify(ctx, claim.userId, {
      title: `Claim ${args.decision}`,
      body: `Your claim for “${item.title}” was ${args.decision} by the campus office.${args.decision === "approved" ? " Please collect it from the admin desk with your ID card." : ""}`,
      kind: "lostfound",
      link: "/lost-found",
    });
    await audit(ctx, user, `${args.decision === "approved" ? "Approved" : "Rejected"} claim for "${item.title}"`, `claims/${args.claimId}`);
    return null;
  },
});

export const markResolved = mutation({
  args: { itemId: v.id("lostFound") },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, STAFF_ROLES);
    const item = await ctx.db.get(args.itemId);
    if (!item) throw new Error("Item not found.");
    await ctx.db.patch(args.itemId, { status: "resolved" });
    await notify(ctx, item.reporterId, {
      title: "Lost & found item resolved",
      body: `“${item.title}” has been marked as returned by the campus office.`,
      kind: "lostfound",
      link: "/lost-found",
    });
    await audit(ctx, user, `Marked "${item.title}" as returned`, `lostFound/${args.itemId}`);
    return null;
  },
});
