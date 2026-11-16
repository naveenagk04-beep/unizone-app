import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { notify, requireUser } from "./lib";

export const data = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const profiles = await ctx.db.query("publicProfiles").take(80);
    const mine = profiles.find((p) => p.userId === user._id) ?? null;
    const connections = await ctx.db.query("connections").take(200);
    const visible = profiles.filter(
      (p) => p.visibility === "public" && p.userId !== user._id,
    );
    const opportunities = await ctx.db.query("opportunities").take(40);
    const posts = await ctx.db.query("communityPosts").take(60);

    return {
      myProfile: mine,
      directory: visible
        .map((profile) => {
          const outgoing = connections.find(
            (c) => c.fromId === user._id && c.toId === profile.userId,
          );
          const incoming = connections.find(
            (c) => c.fromId === profile.userId && c.toId === user._id,
          );
          return {
            ...profile,
            connectionStatus:
              outgoing?.status === "accepted" || incoming?.status === "accepted"
                ? "connected"
                : outgoing?.status === "pending"
                  ? "requested"
                  : incoming?.status === "pending"
                    ? "incoming"
                    : "none",
          };
        })
        .sort((a, b) => a.displayName.localeCompare(b.displayName)),
      incoming: connections
        .filter((c) => c.toId === user._id && c.status === "pending")
        .sort((a, b) => b.createdAt - a.createdAt),
      outgoing: connections
        .filter((c) => c.fromId === user._id)
        .sort((a, b) => b.createdAt - a.createdAt),
      opportunities: opportunities.sort(
        (a, b) => Number(b.verified) - Number(a.verified),
      ),
      posts: posts.sort((a, b) => b.createdAt - a.createdAt),
    };
  },
});

export const upsertProfile = mutation({
  args: {
    displayName: v.string(),
    bio: v.string(),
    year: v.number(),
    skills: v.array(v.string()),
    interests: v.array(v.string()),
    lookingFor: v.array(v.string()),
    visibility: v.union(v.literal("public"), v.literal("hidden")),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    if (args.displayName.trim().length < 2) throw new Error("Add your display name.");
    if (args.bio.trim().length > 280) throw new Error("Keep your bio under 280 characters.");
    if (!user.department) throw new Error("Your department is not configured yet.");
    const existing = await ctx.db
      .query("publicProfiles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();
    const payload = {
      displayName: args.displayName.trim(),
      bio: args.bio.trim(),
      department: user.department,
      year: args.year,
      skills: args.skills.slice(0, 8).map((s) => s.trim()).filter(Boolean),
      interests: args.interests.slice(0, 8).map((s) => s.trim()).filter(Boolean),
      lookingFor: args.lookingFor.slice(0, 5).map((s) => s.trim()).filter(Boolean),
      visibility: args.visibility,
    };
    if (existing) {
      await ctx.db.patch(existing._id, payload);
    } else {
      await ctx.db.insert("publicProfiles", { ...payload, userId: user._id });
    }
    return null;
  },
});

export const sendConnection = mutation({
  args: { toUserId: v.id("users"), purpose: v.string() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    if (args.toUserId === user._id) throw new Error("You cannot connect with yourself.");
    if (args.purpose.trim().length < 4) throw new Error("Add a short note about why you want to connect.");
    const targetProfile = await ctx.db
      .query("publicProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.toUserId))
      .unique();
    if (!targetProfile || targetProfile.visibility !== "public") {
      throw new Error("This student is not accepting connections.");
    }
    const existing = await ctx.db.query("connections").take(200);
    const duplicate = existing.find(
      (c) =>
        (c.fromId === user._id && c.toId === args.toUserId) ||
        (c.fromId === args.toUserId && c.toId === user._id),
    );
    if (duplicate && duplicate.status !== "declined") {
      throw new Error("A connection request already exists between you two.");
    }
    await ctx.db.insert("connections", {
      fromId: user._id,
      fromName: user.name ?? "Campus member",
      toId: args.toUserId,
      toName: targetProfile.displayName,
      purpose: args.purpose.trim(),
      status: "pending",
      createdAt: Date.now(),
    });
    await notify(ctx, args.toUserId, {
      title: "New connection request",
      body: `${user.name ?? "A student"} wants to connect: ${args.purpose.trim()}`,
      kind: "connect",
      link: "/connect",
    });
    return null;
  },
});

export const respondConnection = mutation({
  args: {
    connectionId: v.id("connections"),
    decision: v.union(v.literal("accepted"), v.literal("declined")),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const connection = await ctx.db.get(args.connectionId);
    if (!connection) throw new Error("Connection request not found.");
    if (connection.toId !== user._id) throw new Error("This request is not addressed to you.");
    if (connection.status !== "pending") throw new Error("This request was already handled.");
    await ctx.db.patch(args.connectionId, { status: args.decision });
    await notify(ctx, connection.fromId, {
      title: `Connection ${args.decision}`,
      body: `${user.name ?? "The student"} ${args.decision} your connection request. Chat stays inside UniZone — contact details are never shared.`,
      kind: "connect",
      link: "/connect",
    });
    return null;
  },
});

export const createPost = mutation({
  args: {
    community: v.string(),
    title: v.string(),
    body: v.string(),
    tags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    if (args.title.trim().length < 4) throw new Error("Give your post a clear title.");
    if (args.body.trim().length < 12) throw new Error("Add a little more detail to your post.");
    const id = await ctx.db.insert("communityPosts", {
      community: args.community,
      authorId: user._id,
      authorName: user.name ?? "Campus member",
      title: args.title.trim(),
      body: args.body.trim(),
      tags: args.tags.slice(0, 4),
      createdAt: Date.now(),
    });
    return id;
  },
});

export const report = mutation({
  args: {
    targetType: v.string(),
    targetId: v.string(),
    targetLabel: v.string(),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    if (args.reason.trim().length < 8) throw new Error("Tell the moderators what is wrong.");
    await ctx.db.insert("reports", {
      targetType: args.targetType,
      targetId: args.targetId,
      targetLabel: args.targetLabel,
      reason: args.reason.trim(),
      reporterId: user._id,
      reporterName: user.name ?? "Campus member",
      status: "open",
      createdAt: Date.now(),
    });
    const admins = await ctx.db.query("users").withIndex("by_role", (q) => q.eq("role", "admin")).take(10);
    for (const person of admins) {
      await notify(ctx, person._id, {
        title: "New moderation report",
        body: `${args.targetLabel}: ${args.reason.trim()}`,
        kind: "report",
        link: "/admin",
      });
    }
    return null;
  },
});
