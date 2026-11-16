import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { roleValidator } from "./schema";
import { audit, requireUser } from "./lib";

/**
 * Demo onboarding: a newly signed-in account picks the portal it wants to
 * explore. This only succeeds while no role is assigned — it can never be used
 * to promote an existing account. In production, roles are provisioned by an
 * administrator from the Admin console instead.
 */
export const setInitialRole = mutation({
  args: { role: roleValidator },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    if (user.role) throw new Error("This account already has a role.");
    const isStudent = args.role === "student";
    await ctx.db.patch(user._id, {
      role: args.role,
      department: user.department ?? "CSE",
      departmentId: "CSE",
      year: user.year ?? 3,
      section: user.section ?? "A",
      registerNumber:
        user.registerNumber ??
        (isStudent
          ? `22CSE${String(Math.floor(100 + Math.random() * 899))}`
          : undefined),
      status: "active",
      demo: true,
    });
    return null;
  },
});

/** Demo-only portal preview. Every backend guard still enforces the active role. */
export const previewRole = mutation({
  args: { role: roleValidator },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    if (!user.role) throw new Error("Choose your portal first.");
    if (user.role === args.role) return null;
    await ctx.db.patch(user._id, {
      role: args.role,
      department: user.department ?? "CSE",
      year: user.year ?? 3,
      section: user.section ?? "A",
      status: "active",
      demo: true,
    });
    await audit(ctx, user, `Previewed the ${args.role.replace("_", " ")} portal`, "users/self/role-preview");
    return null;
  },
});

export const updateDisplayProfile = mutation({
  args: {
    name: v.string(),
    phone: v.optional(v.string()),
    bio: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    if (args.name.trim().length < 2) throw new Error("Your name needs at least two characters.");
    if ((args.bio ?? "").length > 280) throw new Error("Keep your bio under 280 characters.");
    await ctx.db.patch(user._id, {
      name: args.name.trim(),
      phone: args.phone?.trim(),
      bio: args.bio?.trim(),
    });
    return null;
  },
});
