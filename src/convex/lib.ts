import { getAuthUserId } from "@convex-dev/auth/server";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Role } from "./schema";

export const ALL_ROLES: Role[] = [
  "student",
  "faculty",
  "hod",
  "admin",
  "canteen_staff",
  "event_coordinator",
];

export const STAFF_ROLES: Role[] = ["faculty", "hod", "admin"];

type AnyCtx = QueryCtx | MutationCtx;

export async function getUser(ctx: AnyCtx): Promise<Doc<"users"> | null> {
  const userId = await getAuthUserId(ctx);
  if (!userId) return null;
  return await ctx.db.get(userId);
}

export async function requireUser(ctx: AnyCtx): Promise<Doc<"users">> {
  const user = await getUser(ctx);
  if (!user) throw new Error("Please sign in to continue.");
  if (user.status === "disabled")
    throw new Error("This account has been disabled by the administrator.");
  return user;
}

export async function requireRole(
  ctx: AnyCtx,
  roles: Role[],
): Promise<Doc<"users">> {
  const user = await requireUser(ctx);
  if (!user.role || !roles.includes(user.role)) {
    throw new Error("You do not have permission to do that.");
  }
  return user;
}

export async function audit(
  ctx: MutationCtx,
  actor: Doc<"users">,
  action: string,
  target: string,
): Promise<void> {
  await ctx.db.insert("auditLogs", {
    actorId: actor._id,
    actorName: actor.name ?? "UniZone user",
    actorRole: actor.role ?? "student",
    action,
    target,
    at: Date.now(),
  });
}

export async function notify(
  ctx: MutationCtx,
  userId: Id<"users">,
  payload: {
    title: string;
    body: string;
    kind: string;
    link: string;
  },
): Promise<void> {
  await ctx.db.insert("notifications", {
    userId,
    title: payload.title,
    body: payload.body,
    kind: payload.kind,
    link: payload.link,
    read: false,
    createdAt: Date.now(),
  });
}

export async function nextCounter(
  ctx: MutationCtx,
  name: string,
  start = 1,
): Promise<number> {
  const existing = await ctx.db
    .query("counters")
    .withIndex("by_name", (q) => q.eq("name", name))
    .unique();
  const value = existing ? existing.value + 1 : start;
  if (existing) {
    await ctx.db.patch(existing._id, { value });
  } else {
    await ctx.db.insert("counters", { name, value });
  }
  return value;
}

export function isSameDept(
  a: Doc<"users"> | null,
  department: string | undefined,
): boolean {
  return !!a && !!a.department && a.department === department;
}

export function dayKey(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

export function startOfDayISO(iso: string): number {
  return new Date(`${iso}T00:00:00`).getTime();
}

export function formatDateLabel(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export const CATEGORY_LABELS: Record<string, string> = {
  symposium: "Symposium",
  workshop: "Workshop",
  hackathon: "Hackathon",
  competition: "Technical competition",
  sports: "Sports",
  ncc: "NCC / NSS",
  representation: "College representation",
  medical: "Medical",
  personal: "Personal",
  family: "Family",
  emergency: "Emergency",
  other: "Other",
};
