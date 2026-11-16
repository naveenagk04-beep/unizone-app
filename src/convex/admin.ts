import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { roleValidator } from "./schema";
import { audit, notify, requireRole } from "./lib";

export const overview = query({
  args: {},
  handler: async (ctx) => {
    await requireRole(ctx, ["admin"]);
    const users = await ctx.db.query("users").take(120);
    const departments = await ctx.db.query("departments").take(20);
    const policies = await ctx.db.query("approvalPolicies").take(20);
    const auditLogs = await ctx.db.query("auditLogs").take(200);
    const reports = await ctx.db.query("reports").take(80);
    const claims = await ctx.db.query("claims").take(80);
    const items = await ctx.db.query("lostFound").take(80);
    const requests = await ctx.db.query("requests").take(120);
    const orders = await ctx.db.query("orders").take(150);
    const setting = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", "attendanceEffect"))
      .unique();

    return {
      users: users
        .filter((u) => !u.isAnonymous)
        .sort((a, b) => (a.name ?? "").localeCompare(b.name ?? "")),
      departments,
      policies,
      auditLogs: auditLogs.sort((a, b) => b.at - a.at).slice(0, 40),
      reports: reports.sort((a, b) => b.createdAt - a.createdAt),
      pendingClaims: claims
        .filter((c) => c.status === "pending")
        .map((claim) => ({ claim, item: items.find((i) => i._id === claim.itemId) })),
      items: items.sort((a, b) => b.createdAt - a.createdAt),
      attendanceEffect: setting?.value !== "false",
      stats: {
        students: users.filter((u) => u.role === "student").length,
        faculty: users.filter((u) => u.role === "faculty" || u.role === "hod").length,
        pendingRequests: requests.filter((r) =>
          ["under_faculty_review", "forwarded_to_hod", "submitted"].includes(r.status),
        ).length,
        openReports: reports.filter((r) => r.status === "open").length,
        ordersToday: orders.filter(
          (o) => o.createdAt > new Date().setHours(0, 0, 0, 0),
        ).length,
        revenue: orders
          .filter((o) => o.status !== "cancelled")
          .reduce((sum, o) => sum + o.amount, 0),
      },
    };
  },
});

export const setUserRole = mutation({
  args: {
    userId: v.id("users"),
    role: roleValidator,
    department: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await requireRole(ctx, ["admin"]);
    if (args.userId === admin._id) {
      throw new Error("You cannot change your own role. Ask another administrator.");
    }
    const target = await ctx.db.get(args.userId);
    if (!target) throw new Error("User not found.");
    const department = args.department ?? target.department ?? "CSE";
    await ctx.db.patch(args.userId, {
      role: args.role,
      department,
      departmentId: department,
      status: "active",
    });
    await notify(ctx, args.userId, {
      title: "Your UniZone role was updated",
      body: `An administrator set your role to ${args.role.replace("_", " ")} in ${department}. Sign out and back in if the portal does not refresh.`,
      kind: "admin",
      link: "/dashboard",
    });
    await audit(
      ctx,
      admin,
      `Changed role of ${target.name ?? "user"} from ${target.role ?? "unassigned"} to ${args.role}`,
      `users/${args.userId}`,
    );
    return null;
  },
});

export const setUserStatus = mutation({
  args: {
    userId: v.id("users"),
    status: v.union(v.literal("active"), v.literal("disabled")),
  },
  handler: async (ctx, args) => {
    const admin = await requireRole(ctx, ["admin"]);
    if (args.userId === admin._id) throw new Error("You cannot disable your own account.");
    const target = await ctx.db.get(args.userId);
    if (!target) throw new Error("User not found.");
    await ctx.db.patch(args.userId, { status: args.status });
    await notify(ctx, args.userId, {
      title: `Account ${args.status}`,
      body:
        args.status === "disabled"
          ? "An administrator disabled this account. Contact the campus office."
          : "Your account has been re-enabled. Welcome back.",
      kind: "admin",
      link: "/dashboard",
    });
    await audit(ctx, admin, `Set account ${target.name ?? "user"} to ${args.status}`, `users/${args.userId}`);
    return null;
  },
});

export const updatePolicy = mutation({
  args: {
    policyId: v.id("approvalPolicies"),
    active: v.boolean(),
    attendanceEffect: v.boolean(),
  },
  handler: async (ctx, args) => {
    const admin = await requireRole(ctx, ["admin"]);
    const policy = await ctx.db.get(args.policyId);
    if (!policy) throw new Error("Policy not found.");
    await ctx.db.patch(args.policyId, {
      active: args.active,
      attendanceEffect: args.attendanceEffect,
    });
    await audit(
      ctx,
      admin,
      `Updated policy “${policy.name}” (${args.active ? "active" : "inactive"}, OD attendance ${args.attendanceEffect ? "on" : "off"})`,
      `approvalPolicies/${args.policyId}`,
    );
    return null;
  },
});

export const setAttendanceEffect = mutation({
  args: { enabled: v.boolean() },
  handler: async (ctx, args) => {
    const admin = await requireRole(ctx, ["admin"]);
    const existing = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", "attendanceEffect"))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, { value: String(args.enabled) });
    } else {
      await ctx.db.insert("settings", { key: "attendanceEffect", value: String(args.enabled) });
    }
    await audit(
      ctx,
      admin,
      `${args.enabled ? "Enabled" : "Disabled"} attendance credit for approved OD`,
      "settings/attendanceEffect",
    );
    return null;
  },
});

export const resolveReport = mutation({
  args: { reportId: v.id("reports") },
  handler: async (ctx, args) => {
    const admin = await requireRole(ctx, ["admin"]);
    const report = await ctx.db.get(args.reportId);
    if (!report) throw new Error("Report not found.");
    await ctx.db.patch(args.reportId, { status: "reviewed" });
    await audit(ctx, admin, `Reviewed moderation report for ${report.targetLabel}`, `reports/${args.reportId}`);
    return null;
  },
});
