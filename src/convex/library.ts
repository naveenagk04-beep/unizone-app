import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { audit, requireRole, requireUser, STAFF_ROLES } from "./lib";

type Access = "public" | "department" | "restricted";

function canRead(
  role: string | undefined,
  department: string | undefined,
  resource: { access: Access; department: string },
) {
  if (resource.access === "public") return true;
  if (resource.access === "department") return department === resource.department;
  return !!role && ["faculty", "hod", "admin"].includes(role);
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const resources = await ctx.db.query("libraryResources").take(80);
    const bookmarks = await ctx.db
      .query("bookmarks")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .take(80);
    const saved = new Set(bookmarks.map((b) => b.resourceId));
    return resources
      .filter((r) => canRead(user.role, user.department, r))
      .map((r) => ({ ...r, bookmarked: saved.has(r._id) }));
  },
});

export const get = query({
  args: { resourceId: v.id("libraryResources") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const resource = await ctx.db.get(args.resourceId);
    if (!resource) return null;
    if (!canRead(user.role, user.department, resource)) return null;
    return resource;
  },
});

export const toggleBookmark = mutation({
  args: { resourceId: v.id("libraryResources") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const resource = await ctx.db.get(args.resourceId);
    if (!resource) throw new Error("Resource not found.");
    if (!canRead(user.role, user.department, resource)) {
      throw new Error("You do not have access to this resource.");
    }
    const existing = await ctx.db
      .query("bookmarks")
      .withIndex("by_user_resource", (q) =>
        q.eq("userId", user._id).eq("resourceId", args.resourceId),
      )
      .unique();
    if (existing) {
      await ctx.db.delete(existing._id);
      return { saved: false };
    }
    await ctx.db.insert("bookmarks", {
      userId: user._id,
      resourceId: args.resourceId,
      createdAt: Date.now(),
    });
    return { saved: true };
  },
});

export const addResource = mutation({
  args: {
    title: v.string(),
    author: v.string(),
    type: v.string(),
    subject: v.string(),
    unit: v.string(),
    access: v.union(v.literal("public"), v.literal("department"), v.literal("restricted")),
    description: v.string(),
    content: v.string(),
    pages: v.number(),
    tags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, STAFF_ROLES);
    if (args.title.trim().length < 4) throw new Error("Add a clear resource title.");
    if (!user.department) throw new Error("Your department is not configured.");
    const id = await ctx.db.insert("libraryResources", {
      title: args.title.trim(),
      author: args.author.trim() || user.name || "Faculty",
      type: args.type,
      subject: args.subject,
      department: user.department,
      unit: args.unit,
      access: args.access,
      description: args.description.trim(),
      content: args.content,
      pages: Math.max(0, args.pages),
      tags: args.tags,
      year: new Date().getFullYear(),
    });
    await audit(ctx, user, `Uploaded library resource "${args.title}"`, `libraryResources/${id}`);
    return id;
  },
});
