export const ROLE_LABELS: Record<string, string> = {
  student: "Student",
  faculty: "Faculty",
  hod: "Head of Department",
  admin: "Administrator",
  canteen_staff: "Canteen staff",
  event_coordinator: "Event coordinator",
};

export const ROLE_SHORT: Record<string, string> = {
  student: "Student portal",
  faculty: "Faculty portal",
  hod: "HOD portal",
  admin: "Admin console",
  canteen_staff: "Canteen desk",
  event_coordinator: "Events desk",
};

export const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  submitted: "Submitted",
  under_faculty_review: "With faculty",
  forwarded_to_hod: "With HOD",
  approved: "Approved",
  rejected: "Rejected",
  returned: "Returned for changes",
  cancelled: "Cancelled",
  placed: "Placed",
  preparing: "Preparing",
  ready: "Ready",
  collected: "Collected",
  pending: "Pending",
  declined: "Declined",
  accepted: "Accepted",
  open: "Open",
  claimed: "Claimed",
  resolved: "Returned",
  processing: "Processing",
  failed: "Failed",
  present: "Present",
  absent: "Absent",
  od: "On duty",
  graded: "Graded",
  active: "Active",
  disabled: "Disabled",
};

export function fmtDate(value: number | string) {
  const date = typeof value === "number" ? new Date(value) : new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function fmtShortDate(value: number | string) {
  const date = typeof value === "number" ? new Date(value) : new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function fmtDateTime(value: number) {
  return new Date(value).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function fmtTime(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
}

export function timeAgo(value: number) {
  const diff = Date.now() - value;
  const mins = Math.round(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return fmtDate(value);
}

export function inr(value: number) {
  return `₹${value.toLocaleString("en-IN")}`;
}

export function initials(name?: string | null) {
  if (!name) return "U";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function isoIn(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function toEpoch(iso: string) {
  return new Date(`${iso}T09:00:00`).getTime();
}

export function dayName(index: number) {
  return ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][index] ?? "";
}

export function isGreetingHour() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function percentage(part: number, total: number) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}
