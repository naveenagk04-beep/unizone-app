import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { audit, notify, nextCounter, requireRole, requireUser, STAFF_ROLES } from "./lib";

const ACTIVE_STATUSES = [
  "submitted",
  "under_faculty_review",
  "forwarded_to_hod",
];

function countDays(startDate: string, endDate: string): number {
  const start = new Date(`${startDate}T00:00:00`).getTime();
  const end = new Date(`${endDate}T00:00:00`).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) {
    throw new Error("The end date must be on or after the start date.");
  }
  return Math.round((end - start) / 86_400_000) + 1;
}

async function notifyDepartmentRole(
  ctx: MutationCtx,
  role: "faculty" | "hod",
  department: string,
  payload: { title: string; body: string; link: string },
  excludeId?: string,
) {
  const people = await ctx.db
    .query("users")
    .withIndex("by_role", (q) => q.eq("role", role))
    .take(30);
  for (const person of people) {
    if (person.department !== department) continue;
    if (person._id === excludeId) continue;
    await notify(ctx, person._id, { ...payload, kind: "request" });
  }
}

export const submit = mutation({
  args: {
    type: v.union(v.literal("od"), v.literal("leave")),
    category: v.string(),
    title: v.string(),
    organizer: v.optional(v.string()),
    venue: v.optional(v.string()),
    startDate: v.string(),
    endDate: v.string(),
    halfDay: v.boolean(),
    reason: v.string(),
    documentName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    if (user.role !== "student") throw new Error("Only students can apply for OD or leave.");
    const days = countDays(args.startDate, args.endDate);
    if (args.title.trim().length < 4) throw new Error("Add a short title for the request.");
    if (args.reason.trim().length < 15) throw new Error("Please describe the reason in at least 15 characters.");
    if (args.type === "od" && !args.documentName) {
      throw new Error("OD requests need a supporting invitation or approval document.");
    }
    if (args.category === "medical" && !args.documentName) {
      throw new Error("Medical leave needs a supporting document.");
    }

    const existing = await ctx.db
      .query("requests")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .take(60);
    const overlap = existing.find(
      (r) =>
        r.status !== "rejected" &&
        r.status !== "cancelled" &&
        !(args.endDate < r.startDate || args.startDate > r.endDate),
    );
    if (overlap) {
      throw new Error(`This overlaps with your ${overlap.type.toUpperCase()} request ${overlap.refNo}. Cancel or adjust it first.`);
    }

    const policies = await ctx.db.query("approvalPolicies").take(20);
    const active = policies.filter((p) => p.active && p.type === args.type);
    let policy: Doc<"approvalPolicies"> | undefined;
    if (args.type === "leave") {
      policy = active
        .filter((p) => p.maxDays !== undefined && days <= (p.maxDays ?? 0))
        .sort((a, b) => (a.maxDays ?? 0) - (b.maxDays ?? 0))[0];
      if (!policy) policy = active.find((p) => p.maxDays === undefined);
    } else {
      policy = active.find((p) => !p.category || p.category === args.category) ?? active[0];
    }
    if (!policy) throw new Error("No approval policy is configured for this request type.");

    const firstStep = (policy.steps[0] ?? "faculty") as "faculty" | "hod";
    const finalStep = policy.finalStepIndex === 0;
    const now = Date.now();
    const refNo = `OD-2026-${String(await nextCounter(ctx, "reference", 1041)).padStart(6, "0")}`;

    const id = await ctx.db.insert("requests", {
      refNo: args.type === "od" ? refNo : refNo.replace("OD-", "LV-"),
      type: args.type,
      category: args.category,
      userId: user._id,
      userName: user.name ?? "Student",
      registerNumber: user.registerNumber ?? "—",
      department: user.department ?? "CSE",
      year: user.year ?? 3,
      section: user.section ?? "A",
      title: args.title.trim(),
      organizer: args.organizer,
      venue: args.venue,
      startDate: args.startDate,
      endDate: args.endDate,
      halfDay: args.halfDay,
      reason: args.reason.trim(),
      documentName: args.documentName,
      status: "under_faculty_review",
      currentRole: firstStep,
      finalStep,
      attendanceEffect: args.type === "od" && policy.attendanceEffect,
      history: [
        {
          status: "submitted",
          actorName: user.name ?? "Student",
          actorRole: "student",
          at: now,
        },
        {
          status: "under_faculty_review",
          actorName: "UniZone workflow",
          actorRole: "system",
          remarks: `Assigned to class faculty under policy “${policy.name}”.`,
          at: now + 1,
        },
      ],
      createdAt: now,
      updatedAt: now,
    });

    await notify(ctx, user._id, {
      title: "Request submitted",
      body: `${args.title} · ${args.startDate} to ${args.endDate}. Your class advisor has been notified.`,
      kind: "request",
      link: `/requests/${id}`,
    });
    await notifyDepartmentRole(
      ctx,
      firstStep,
      user.department ?? "CSE",
      {
        title: "New OD/leave request in your queue",
        body: `${user.name ?? "A student"} submitted “${args.title}”. Review it before the start date.`,
        link: "/review",
      },
      user._id,
    );
    await audit(ctx, user, `Submitted ${args.type.toUpperCase()} request ${refNo}`, `requests/${id}`);
    return { id, refNo };
  },
});

export const resubmit = mutation({
  args: { requestId: v.id("requests"), reason: v.optional(v.string()), documentName: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const request = await ctx.db.get(args.requestId);
    if (!request) throw new Error("Request not found.");
    if (request.userId !== user._id) throw new Error("You can only edit your own request.");
    if (request.status !== "returned") throw new Error("Only returned requests can be resubmitted.");
    if (args.reason !== undefined && args.reason.trim().length < 15) {
      throw new Error("Please describe the reason in at least 15 characters.");
    }
    const now = Date.now();
    await ctx.db.patch(args.requestId, {
      reason: args.reason?.trim() ?? request.reason,
      documentName: args.documentName ?? request.documentName,
      status: "under_faculty_review",
      currentRole: "faculty",
      history: [
        ...request.history,
        {
          status: "submitted",
          actorName: user.name ?? "Student",
          actorRole: "student",
          remarks: "Resubmitted after requested changes.",
          at: now,
        },
        {
          status: "under_faculty_review",
          actorName: "UniZone workflow",
          actorRole: "system",
          at: now + 1,
        },
      ],
      updatedAt: now,
    });
    await notifyDepartmentRole(
      ctx,
      "faculty",
      request.department,
      {
        title: "Request resubmitted",
        body: `${request.userName} resubmitted ${request.refNo}.`,
        link: "/review",
      },
      user._id,
    );
    await audit(ctx, user, `Resubmitted request ${request.refNo}`, `requests/${args.requestId}`);
    return null;
  },
});

export const cancel = mutation({
  args: { requestId: v.id("requests") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const request = await ctx.db.get(args.requestId);
    if (!request) throw new Error("Request not found.");
    if (request.userId !== user._id) throw new Error("You can only cancel your own request.");
    if (request.status === "approved" || request.status === "rejected" || request.status === "cancelled") {
      throw new Error("This request already has a final decision and cannot be cancelled.");
    }
    await ctx.db.patch(args.requestId, {
      status: "cancelled",
      currentRole: "none",
      updatedAt: Date.now(),
      history: [
        ...request.history,
        {
          status: "cancelled",
          actorName: user.name ?? "Student",
          actorRole: "student",
          at: Date.now(),
        },
      ],
    });
    await audit(ctx, user, `Cancelled request ${request.refNo}`, `requests/${args.requestId}`);
    return null;
  },
});

export const transition = mutation({
  args: {
    requestId: v.id("requests"),
    action: v.union(
      v.literal("approve"),
      v.literal("reject"),
      v.literal("return"),
      v.literal("forward"),
    ),
    remarks: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, STAFF_ROLES);
    const request = await ctx.db.get(args.requestId);
    if (!request) throw new Error("Request not found.");
    if (request.userId === user._id) {
      throw new Error("You cannot decide on your own request.");
    }
    if (request.status !== "under_faculty_review" && request.status !== "forwarded_to_hod") {
      throw new Error("This request is not awaiting a decision.");
    }
    if (user.role !== "admin") {
      if (request.currentRole !== user.role) {
        throw new Error("This request is assigned to another reviewer role.");
      }
      if (request.department !== user.department) {
        throw new Error("This request is outside your department scope.");
      }
    }
    const remarks = args.remarks?.trim();
    if ((args.action === "reject" || args.action === "return") && !remarks) {
      throw new Error("Remarks are required when rejecting or returning a request.");
    }
    const now = Date.now();
    let nextStatus: string;
    let nextRole: "faculty" | "hod" | "admin" | "none" = "none";

    if (args.action === "forward") {
      if (request.currentRole !== "faculty" || request.status !== "under_faculty_review") {
        throw new Error("Only the class faculty can forward this request to the HOD.");
      }
      nextStatus = "forwarded_to_hod";
      nextRole = "hod";
    } else if (args.action === "approve") {
      if (request.currentRole === "faculty" && !request.finalStep) {
        throw new Error("This policy needs HOD approval — forward it instead.");
      }
      nextStatus = "approved";
    } else if (args.action === "reject") {
      nextStatus = "rejected";
    } else {
      nextStatus = "returned";
    }

    await ctx.db.patch(args.requestId, {
      status: nextStatus,
      currentRole: nextRole,
      updatedAt: now,
      history: [
        ...request.history,
        {
          status: nextStatus,
          actorName: user.name ?? "Reviewer",
          actorRole: user.role ?? "faculty",
          remarks,
          at: now,
        },
      ],
    });

    const readable: Record<string, string> = {
      approved: "approved",
      rejected: "rejected",
      returned: "returned for changes",
      forwarded_to_hod: "forwarded to the HOD",
    };
    await notify(ctx, request.userId, {
      title: `Request ${readable[nextStatus] ?? nextStatus}`,
      body: `${request.refNo} · ${request.title}${remarks ? ` — ${remarks}` : ""}`,
      kind: "request",
      link: `/requests/${args.requestId}`,
    });

    if (nextStatus === "forwarded_to_hod") {
      await notifyDepartmentRole(
        ctx,
        "hod",
        request.department,
        {
          title: "OD/leave request awaiting your approval",
          body: `${request.userName} · ${request.title}. Forwarded by ${user.name ?? "faculty"}.`,
          link: "/review",
        },
        user._id,
      );
    }

    if (nextStatus === "approved" && request.type === "od" && request.attendanceEffect) {
      const setting = await ctx.db
        .query("settings")
        .withIndex("by_key", (q) => q.eq("key", "attendanceEffect"))
        .unique();
      if (setting?.value === "true") {
        const rows = await ctx.db
          .query("attendance")
          .withIndex("by_user", (q) => q.eq("userId", request.userId))
          .take(400);
        for (const row of rows) {
          if (row.date >= request.startDate && row.date <= request.endDate) {
            await ctx.db.patch(row._id, { status: "od", source: "od" });
          }
        }
      }
    }

    await audit(
      ctx,
      user,
      `${args.action === "approve" ? "Approved" : args.action === "reject" ? "Rejected" : args.action === "return" ? "Returned" : "Forwarded"} ${request.type.toUpperCase()} ${request.refNo}`,
      `requests/${args.requestId}`,
    );
    return { status: nextStatus };
  },
});

export const mine = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const rows = await ctx.db
      .query("requests")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .take(60);
    return rows.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const queue = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    if (!user.role || !STAFF_ROLES.includes(user.role)) return [];
    const rows = await ctx.db.query("requests").take(120);
    const scoped = rows.filter((r) => {
      if (user.role === "admin") return [...ACTIVE_STATUSES, "returned"].includes(r.status);
      if (r.department !== user.department) return false;
      if (user.role === "faculty") {
        return (
          r.status === "under_faculty_review" &&
          r.currentRole === "faculty" &&
          r.userId !== user._id
        );
      }
      return r.status === "forwarded_to_hod" && r.currentRole === "hod" && r.userId !== user._id;
    });
    return scoped.sort((a, b) => a.createdAt - b.createdAt);
  },
});

export const get = query({
  args: { requestId: v.id("requests") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const request = await ctx.db.get(args.requestId);
    if (!request) return null;
    const isOwner = request.userId === user._id;
    const isReviewer =
      !!user.role &&
      STAFF_ROLES.includes(user.role) &&
      (user.role === "admin" || request.department === user.department);
    if (!isOwner && !isReviewer) return null;
    return request;
  },
});

export const policies = query({
  args: {},
  handler: async (ctx) => {
    await requireUser(ctx);
    return await ctx.db.query("approvalPolicies").take(20);
  },
});
