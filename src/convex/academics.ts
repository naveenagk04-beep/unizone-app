import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { audit, notify, requireRole, requireUser, STAFF_ROLES } from "./lib";

export const overview = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const department = user.department ?? "CSE";
    const year = user.year ?? 3;
    const section = user.section ?? "A";

    const subjects = await ctx.db
      .query("subjects")
      .withIndex("by_department", (q) => q.eq("department", department))
      .take(20);
    const timetable = await ctx.db
      .query("timetableSlots")
      .withIndex("by_scope", (q) =>
        q.eq("department", department).eq("year", year).eq("section", section),
      )
      .take(40);
    const assignments = await ctx.db.query("assignments").take(30);
    const scopedAssignments = assignments
      .filter(
        (a) =>
          a.department === department &&
          (user.role === "student" ? a.year === year && a.section === section : true),
      )
      .sort((a, b) => a.dueAt - b.dueAt);
    const exams = await ctx.db
      .query("exams")
      .withIndex("by_department", (q) => q.eq("department", department).eq("year", year))
      .take(20);
    const announcements = (await ctx.db.query("announcements").take(20))
      .filter((a) => a.audience !== "section" || a.department === department)
      .sort((a, b) => b.createdAt - a.createdAt);
    const mine = await ctx.db
      .query("attendance")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .take(400);
    const marks = await ctx.db
      .query("marks")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .take(30);
    const submissions = await ctx.db
      .query("submissions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .take(60);

    const attendanceBySubject = subjects.map((subject) => {
      const rows = mine.filter((a) => a.subject === subject.name);
      const present = rows.filter((a) => a.status !== "absent").length;
      return {
        subject: subject.name,
        color: subject.color,
        present,
        total: rows.length,
        percent: rows.length ? Math.round((present / rows.length) * 100) : 0,
      };
    });
    const totalClasses = mine.length;
    const attended = mine.filter((a) => a.status !== "absent").length;

    return {
      subjects,
      timetable,
      assignments: scopedAssignments,
      submissions,
      exams,
      announcements,
      attendanceBySubject,
      attendancePercent: totalClasses ? Math.round((attended / totalClasses) * 100) : 0,
      marks,
      scope: { department, year, section },
    };
  },
});

export const classRoster = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireRole(ctx, STAFF_ROLES);
    if (!user.department) return [];
    const students = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "student"))
      .take(60);
    return students
      .filter((s) => s.department === user.department && (s.year ?? 3) === (user.year ?? 3))
      .map((s) => ({
        _id: s._id,
        name: s.name ?? "Student",
        registerNumber: s.registerNumber ?? "—",
        section: s.section ?? "A",
      }));
  },
});

export const recordAttendance = mutation({
  args: {
    subject: v.string(),
    date: v.string(),
    entries: v.array(
      v.object({
        studentId: v.id("users"),
        status: v.union(v.literal("present"), v.literal("absent")),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, STAFF_ROLES);
    if (!args.entries.length) throw new Error("Select at least one student.");
    for (const entry of args.entries) {
      const student = await ctx.db.get(entry.studentId);
      if (!student) continue;
      if (student.department !== user.department) {
        throw new Error("You can only record attendance for your own department.");
      }
      const existing = await ctx.db
        .query("attendance")
        .withIndex("by_user", (q) => q.eq("userId", entry.studentId))
        .take(400);
      const same = existing.find(
        (a) => a.subject === args.subject && a.date === args.date,
      );
      if (same) {
        await ctx.db.patch(same._id, { status: entry.status, source: "manual" });
      } else {
        await ctx.db.insert("attendance", {
          userId: entry.studentId,
          subject: args.subject,
          date: args.date,
          status: entry.status,
          source: "manual",
        });
      }
      await notify(ctx, entry.studentId, {
        title: "Attendance updated",
        body: `${args.subject} · ${args.date} marked ${entry.status}.`,
        kind: "academic",
        link: "/academics",
      });
    }
    await audit(
      ctx,
      user,
      `Recorded attendance for ${args.subject} (${args.entries.length} students)`,
      `attendance/${args.subject}/${args.date}`,
    );
    return { recorded: args.entries.length };
  },
});

export const submitAssignment = mutation({
  args: { assignmentId: v.id("assignments"), content: v.string(), fileName: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    if (user.role !== "student") throw new Error("Only students can submit assignments.");
    if (args.content.trim().length < 10) throw new Error("Add a short note describing your submission.");
    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment) throw new Error("Assignment not found.");
    if (assignment.department !== user.department || assignment.year !== (user.year ?? 0)) {
      throw new Error("This assignment is outside your enrolled scope.");
    }
    const existing = await ctx.db
      .query("submissions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .take(60);
    const current = existing.find((s) => s.assignmentId === args.assignmentId);
    if (current) {
      throw new Error("You have already submitted this assignment.");
    }
    await ctx.db.insert("submissions", {
      assignmentId: args.assignmentId,
      userId: user._id,
      userName: user.name ?? "Student",
      content: args.content,
      fileName: args.fileName,
      submittedAt: Date.now(),
      status: "submitted",
    });
    await audit(ctx, user, `Submitted assignment "${assignment.title}"`, `assignments/${args.assignmentId}`);
    return null;
  },
});

export const gradeSubmission = mutation({
  args: { submissionId: v.id("submissions"), grade: v.number(), feedback: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, STAFF_ROLES);
    const submission = await ctx.db.get(args.submissionId);
    if (!submission) throw new Error("Submission not found.");
    const assignment = await ctx.db.get(submission.assignmentId);
    if (!assignment) throw new Error("Assignment not found.");
    if (user.role !== "admin" && assignment.department !== user.department) {
      throw new Error("This submission is outside your department scope.");
    }
    if (args.grade < 0 || args.grade > assignment.points) {
      throw new Error(`Grade must be between 0 and ${assignment.points}.`);
    }
    await ctx.db.patch(args.submissionId, {
      grade: args.grade,
      feedback: args.feedback,
      status: "graded",
    });
    await notify(ctx, submission.userId, {
      title: "Assignment graded",
      body: `${assignment.title}: ${args.grade}/${assignment.points}${args.feedback ? ` · ${args.feedback}` : ""}`,
      kind: "academic",
      link: "/academics",
    });
    await audit(ctx, user, `Graded "${assignment.title}" for ${submission.userName}`, `submissions/${args.submissionId}`);
    return null;
  },
});

export const submissionsForAssignment = query({
  args: { assignmentId: v.id("assignments") },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, STAFF_ROLES);
    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment) return [];
    if (user.role !== "admin" && assignment.department !== user.department) return [];
    return await ctx.db
      .query("submissions")
      .withIndex("by_assignment", (q) => q.eq("assignmentId", args.assignmentId))
      .take(60);
  },
});

export const createAssignment = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    subject: v.string(),
    dueAt: v.number(),
    points: v.number(),
    section: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, STAFF_ROLES);
    if (!args.title.trim() || !args.description.trim()) throw new Error("Title and description are required.");
    if (!user.department) throw new Error("Your department is not configured.");
    const id = await ctx.db.insert("assignments", {
      title: args.title.trim(),
      description: args.description.trim(),
      subject: args.subject,
      department: user.department,
      year: user.year ?? 3,
      section: args.section,
      dueAt: args.dueAt,
      points: Math.max(1, args.points),
      authorName: user.name ?? "Faculty",
      createdAt: Date.now(),
    });
    await audit(ctx, user, `Created assignment "${args.title}"`, `assignments/${id}`);
    return id;
  },
});

export const addAnnouncement = mutation({
  args: {
    title: v.string(),
    body: v.string(),
    audience: v.union(v.literal("college"), v.literal("department"), v.literal("section")),
  },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, STAFF_ROLES);
    if (args.title.trim().length < 4 || args.body.trim().length < 10) {
      throw new Error("Add a clear title and body first.");
    }
    const id = await ctx.db.insert("announcements", {
      title: args.title.trim(),
      body: args.body.trim(),
      audience: args.audience,
      department: user.department,
      authorName: user.name ?? "Faculty",
      authorRole: user.role ?? "faculty",
      pinned: false,
      createdAt: Date.now(),
    });
    await audit(ctx, user, `Posted announcement "${args.title}"`, `announcements/${id}`);
    return id;
  },
});
