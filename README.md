# UniZone — Your Campus. All in One Zone.

One role-based campus product for students, faculty, HODs, administrators, canteen
staff and event coordinators. Every module shares one auth system, one design
system and one live data layer.

## What is in version 1

| Module | What it does |
|---|---|
| Dashboard | Role-aware overview of classes, deadlines, approvals, focus, events and notifications |
| Academics | Timetable, attendance, internal marks, assignments + submissions, exams, announcements |
| E-Library | Unit-wise notes, papers, videos, restricted material, search, bookmarks, faculty uploads |
| Study Hub | Draft-first AI planner, grounded doubt solver with citations, practice tests, note summaries |
| Focus & habits | Pomodoro with refresh recovery, custom timers, focus mode, goals, habits, weekly stats |
| Personal workspace | Notes, tasks, personal calendar merged with read-only official dates, saved resources |
| OD & Leave | Policy-driven submission, reviewer queue, timed history, return/resubmit, audited decisions, permission letter |
| Canteen | Live menu, cart, simulated payment, token allocation, real-time staff board |
| Events | Browse/register with capacity limits, coordinator studio, registrations, OD kept separate |
| Lost & Found | Reports, private claims, staff verification, return tracking |
| Student Connect | Opt-in profiles, connection requests, communities, verified opportunities, reports |
| Notifications | In-app inbox with per-user read state and links into every module |
| Admin console | Users and roles, departments, approval policies, moderation, lost & found, audit log |

## Stack

React 19 · TypeScript · Vite · Tailwind CSS v4 · shadcn/ui (Radix) · React Router ·
Framer Motion · Convex (database + server functions) · Convex Auth · Bun.

The original product spec assumed Firebase. In this environment the same
architecture is implemented on Convex: server-side queries/mutations own all
official writes, role checks and audit logging, and the UI subscribes reactively.

## Run it

```bash
bun install
bun convex dev        # managed by the Freebuff environment
bun dev               # managed by the Freebuff environment
```

Typecheck: `bun tsc -b --noEmit`. After changing anything in `src/convex/`, run
`bun convex dev --once` first so generated types refresh.

## Signing in and exploring roles

1. Open `/auth`.
2. Use **Continue with a demo account** (no email delivery needed) or sign in with
   an email one-time code.
3. Pick a portal on the onboarding screen: student, faculty, HOD, admin, canteen
   staff or event coordinator.
4. Use the account menu → **Preview another portal** to switch roles at any time.
   This is demo-only; every backend guard still checks the active role.

On first sign-in the app seeds a demo institution — departments, subjects,
timetable, library material, assignments, pending approvals for the review queue,
canteen orders, events, lost & found cases and connect profiles — plus personal
data for the signed-in account. The seed is idempotent.

## Suggested demo path

1. As a **student**, submit an OD request with a document, then open its timeline.
2. Open the **canteen**, place an order, and note the token + simulated payment.
3. Register for an event, then use **Apply OD** separately — registration is not approval.
4. Switch to **faculty** and review a seeded request: forward it, or return it with remarks.
5. Switch to **HOD** and approve a forwarded request.
6. Switch to **admin** to change a role, toggle OD attendance credit, resolve a
   moderation report and inspect the audit log.

## Design

- Logo mark: `src/assets/unizone-mark.svg` (also `public/logo.svg` and the favicon).
  The wordmark is rendered with the display font and brand gradient in `src/components/Logo.tsx`.
- Theme tokens: `src/index.css` — indigo/violet accents, quiet neutral surfaces,
  soft layered cards, Inter + Plus Jakarta Sans.
- Shared primitives: `src/components/shared.tsx`; app shell and role navigation:
  `src/components/AppShell.tsx`.

## Server structure

```text
src/convex/
├─ schema.ts        all tables and indexes
├─ seed.ts          idempotent demo institution + per-user setup
├─ lib.ts           auth/role guards, audit, notifications, counters
├─ academics.ts     timetable, attendance, marks, assignments, announcements
├─ requests.ts      OD/leave state machine, policy resolution, queue
├─ library.ts       access-filtered resources and bookmarks
├─ study.ts         planner, grounded Q&A, quizzes, async summaries
├─ productivity.ts  tasks, notes, goals, habits, focus sessions, calendar
├─ canteen.ts       menu, idempotent orders, tokens, live board
├─ events.ts        registrations, capacity, coordinator tools
├─ lostfound.ts     reports, claims, verification, returns
├─ connect.ts       public profiles, connections, opportunities, communities
├─ admin.ts         users, roles, policies, moderation, audit
├─ notifications.ts inbox and read state
└─ profile.ts       onboarding role, demo preview, display profile
```

## Deliberate demo limitations

- **AI** answers come from the deployment's server-side LLM gateway
  (`src/convex/ai.ts`); the integration key never reaches the browser. If the
  provider is missing or fails, the deterministic retrieval engine answers
  instead, so the Study Hub still works offline. Quota (30 requests/day),
  grounded/general labelling and citation integrity apply to both paths;
  citations are only attached when a real library excerpt was retrieved.
- **Payments** use a visibly labelled simulated provider; no card data is stored.
- **File attachments** record the file name (and validated access rules) rather than
  uploading bytes; production would use private storage plus server-side type checks.
- **Push/email** delivery is not wired; notifications are in-app and persisted.
- **Event reminders** are created at registration time rather than by a scheduler.
- Role preview exists only to make the demo explorable; remove `profile.previewRole`
  and the account-menu entry for a production deployment.

## Environment notes

Environment variables are managed by the Freebuff Keys UI. The client only needs the
public `VITE_CONVEX_URL` / `VITE_CONVEX_SITE_URL` already configured for this project.
Never place secrets in `VITE_*` variables.
