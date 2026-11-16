import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
import {
  PageWrap,
  PageHeader,
  Panel,
  EmptyState,
  Chip,
  Loading,
} from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { timeAgo } from "@/lib/format";
import { useMutation, useQuery } from "convex/react";
import {
  ArrowRight,
  Bell,
  BellOff,
  CalendarDays,
  CheckCheck,
  ClipboardCheck,
  Coffee,
  GraduationCap,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";

const ICONS: Record<string, typeof Bell> = {
  request: ClipboardCheck,
  academic: GraduationCap,
  event: CalendarDays,
  canteen: Coffee,
  connect: Users,
  lostfound: ShieldCheck,
  admin: ShieldCheck,
  report: ShieldCheck,
  ai: Sparkles,
};

export default function Notifications() {
  const notifications = useQuery(api.notifications.list, {});
  const markRead = useMutation(api.notifications.markRead);
  const markAllRead = useMutation(api.notifications.markAllRead);
  const [tab, setTab] = useState("all");

  if (notifications === undefined) return <Loading label="Loading notifications" />;

  const unread = notifications.filter((n) => !n.read);
  const visible = tab === "unread" ? unread : notifications;

  return (
    <PageWrap>
      <PageHeader
        eyebrow="Notifications"
        title="What needs your attention"
        description="One inbox for approvals, academics, canteen, events and campus life. Only you can read these."
        actions={
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            disabled={unread.length === 0}
            onClick={async () => {
              try {
                await markAllRead();
                toast.success("All notifications marked read");
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Could not update notifications");
              }
            }}
          >
            <CheckCheck className="size-3.5" /> Mark all read
          </Button>
        }
      />

      <Tabs value={tab} onValueChange={setTab} className="gap-5">
        <TabsList>
          <TabsTrigger value="all" className="gap-1.5">
            All <Chip className="ml-1 text-[9px]">{notifications.length}</Chip>
          </TabsTrigger>
          <TabsTrigger value="unread" className="gap-1.5">
            Unread <Chip className="ml-1 text-[9px]">{unread.length}</Chip>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <NotificationList
            rows={visible}
            empty={tab === "unread" ? "Nothing unread" : "No notifications yet"}
            onRead={(id) => markRead({ notificationId: id })}
          />
        </TabsContent>
        <TabsContent value="unread">
          <NotificationList
            rows={visible}
            empty="Nothing unread"
            onRead={(id) => markRead({ notificationId: id })}
          />
        </TabsContent>
      </Tabs>
    </PageWrap>
  );
}

function NotificationList({
  rows,
  empty,
  onRead,
}: {
  rows: Doc<"notifications">[];
  empty: string;
  onRead: (id: Id<"notifications">) => void;
}) {
  if (rows.length === 0) {
    return (
      <Panel>
        <EmptyState
          icon={BellOff}
          title={empty}
          description="You're all caught up. New approvals, orders and campus updates will land here."
        />
      </Panel>
    );
  }
  return (
    <Panel title="Your inbox" description="Marking a notification read persists across devices.">
      <div className="divide-y divide-border/60">
        {rows.map((n) => {
          const Icon = ICONS[n.kind] ?? Bell;
          return (
            <div key={n._id} className="flex items-start gap-3 py-3.5 first:pt-0 last:pb-0">
              <span className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl ${n.read ? "bg-muted text-muted-foreground" : "bg-indigo-50 text-indigo-600"}`}>
                <Icon className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className={`text-xs ${n.read ? "font-medium text-muted-foreground" : "font-semibold"}`}>{n.title}</p>
                  {!n.read && <span className="size-1.5 rounded-full bg-primary" />}
                </div>
                <p className="mt-0.5 text-[11px] leading-5 text-muted-foreground">{n.body}</p>
                <p className="mt-1 text-[9px] text-muted-foreground/70">{timeAgo(n.createdAt)}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button asChild size="sm" variant="ghost" className="h-7 gap-1 px-2 text-[10px]">
                  <Link to={n.link} onClick={() => onRead(n._id)}>
                    Open <ArrowRight className="size-2.5" />
                  </Link>
                </Button>
                {!n.read && (
                  <Button size="sm" variant="ghost" className="h-7 px-2 text-[10px]" onClick={() => onRead(n._id)}>
                    Mark read
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}
