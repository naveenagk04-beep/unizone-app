import { api } from "@/convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import {
  PageWrap,
  PageHeader,
  Panel,
  EmptyState,
  Chip,
  Loading,
  Field,
  StatusBadge,
  ProgressBar,
} from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fmtDateTime, inr } from "@/lib/format";
import { useMutation, useQuery } from "convex/react";
import {
  BadgeCheck,
  CheckCircle2,
  ChefHat,
  Clock3,
  Coffee,
  CreditCard,
  Minus,
  Plus,
  ShoppingBag,
  Timer,
  UtensilsCrossed,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const FLOW = ["placed", "preparing", "ready", "collected"] as const;

export default function Canteen() {
  const { user } = useAuth();
  const role = user?.role ?? "student";
  const isStaff = role === "canteen_staff" || role === "admin";
  const menu = useQuery(api.canteen.menu, {});
  const myOrders = useQuery(api.canteen.myOrders, role === "student" ? {} : "skip");
  const board = useQuery(api.canteen.board, isStaff ? {} : "skip");
  const createOrder = useMutation(api.canteen.createOrder);
  const updateStatus = useMutation(api.canteen.updateOrderStatus);
  const toggleAvailability = useMutation(api.canteen.toggleAvailability);
  const addItem = useMutation(api.canteen.addMenuItem);

  const [cart, setCart] = useState<Record<string, number>>({});
  const [note, setNote] = useState("");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [receipt, setReceipt] = useState<{ tokenNo: number; amount: number } | null>(null);
  const [orderKey, setOrderKey] = useState(() => `web-${crypto.randomUUID()}`);
  const [category, setCategory] = useState("All");
  const [itemOpen, setItemOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState(60);
  const [newCategory, setNewCategory] = useState("Snacks");
  const [newDescription, setNewDescription] = useState("");
  const [newVeg, setNewVeg] = useState(true);

  if (menu === undefined || (isStaff && board === undefined)) {
    return <Loading label="Loading the canteen" />;
  }

  const categories = ["All", ...new Set(menu.map((i) => i.category))];
  const visible = menu.filter((i) => (category === "All" ? true : i.category === category));
  const cartLines = Object.entries(cart)
    .map(([id, qty]) => {
      const item = menu.find((m) => m._id === id);
      return item ? { item, qty } : null;
    })
    .filter((line): line is { item: (typeof menu)[number]; qty: number } => line !== null);
  const total = cartLines.reduce((sum, line) => sum + line.item.price * line.qty, 0);

  const adjust = (id: string, delta: number) => {
    setCart((prev) => {
      const next = { ...prev, [id]: (prev[id] ?? 0) + delta };
      if (next[id] <= 0) delete next[id];
      return next;
    });
  };

  const placeOrder = async () => {
    setPlacing(true);
    try {
      const result = await createOrder({
        items: cartLines.map((line) => ({ id: line.item._id, qty: line.qty })),
        note: note || undefined,
        idempotencyKey: orderKey,
      });
      setReceipt({ tokenNo: result.tokenNo, amount: total });
      setOrderKey(`web-${crypto.randomUUID()}`);
      setCart({});
      setNote("");
      setCheckoutOpen(false);
      toast.success(`Order confirmed · token #${result.tokenNo}`, {
        description: "Simulated payment marked paid. Track the live status below.",
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not place the order");
    } finally {
      setPlacing(false);
    }
  };

  if (isStaff) {
    const activeOrders = board ?? [];
    return (
      <PageWrap>
        <PageHeader
          eyebrow="Canteen desk"
          title="Live order board"
          description="Move tokens through the queue. Students see every status change instantly."
          actions={
            <div className="flex gap-2">
              <Chip className="gap-1.5"><CreditCard className="size-3" /> Simulated payments</Chip>
              <Button size="sm" className="gap-1.5" onClick={() => setItemOpen(true)}>
                <Plus className="size-3.5" /> Add menu item
              </Button>
            </div>
          }
        />

        <div className="grid gap-3.5 sm:grid-cols-3">
          <div className="uz-card p-5">
            <p className="text-xs text-muted-foreground">Active orders</p>
            <p className="mt-2 font-display text-2xl font-bold">{activeOrders.length}</p>
            <p className="mt-1 text-[10px] text-muted-foreground">Placed, preparing or ready</p>
          </div>
          <div className="uz-card p-5">
            <p className="text-xs text-muted-foreground">Ready for pickup</p>
            <p className="mt-2 font-display text-2xl font-bold">{activeOrders.filter((o) => o.status === "ready").length}</p>
            <p className="mt-1 text-[10px] text-muted-foreground">Waiting at the counter</p>
          </div>
          <div className="uz-card p-5">
            <p className="text-xs text-muted-foreground">Menu available</p>
            <p className="mt-2 font-display text-2xl font-bold">{menu.filter((i) => i.available).length}/{menu.length}</p>
            <p className="mt-1 text-[10px] text-muted-foreground">Toggle availability below</p>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          {(["placed", "preparing", "ready"] as const).map((status) => (
            <Panel
              key={status}
              title={status === "placed" ? "New orders" : status === "preparing" ? "Preparing" : "Ready for pickup"}
              description={status === "placed" ? "Confirmed and paid" : status === "preparing" ? "In the kitchen" : "Call the token"}
              action={<Chip>{activeOrders.filter((o) => o.status === status).length}</Chip>}
            >
              <div className="space-y-2.5">
                {activeOrders.filter((o) => o.status === status).map((order) => (
                  <div key={order._id} className="rounded-xl border border-border/70 p-3.5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-display text-lg font-bold leading-none">#{order.tokenNo}</p>
                        <p className="mt-1 text-[10px] text-muted-foreground">{order.userName}</p>
                      </div>
                      <p className="text-xs font-semibold">{inr(order.amount)}</p>
                    </div>
                    <div className="mt-2 space-y-0.5">
                      {order.items.map((item) => (
                        <p key={item.name} className="text-[11px] text-muted-foreground">
                          {item.qty}× {item.name}
                        </p>
                      ))}
                    </div>
                    {order.note && <p className="mt-1.5 rounded bg-amber-50 px-2 py-1 text-[10px] text-amber-700">Note: {order.note}</p>}
                    <p className="mt-1.5 text-[9px] text-muted-foreground/70">{fmtDateTime(order.createdAt)}</p>
                    <div className="mt-2.5 flex gap-1.5">
                      {status !== "ready" ? (
                        <Button
                          size="sm"
                          className="h-7 flex-1 gap-1 text-[10px]"
                          onClick={async () => {
                            const next = status === "placed" ? "preparing" : "ready";
                            try {
                              await updateStatus({ orderId: order._id, status: next });
                              toast.success(`Token #${order.tokenNo} → ${next}`);
                            } catch (error) {
                              toast.error(error instanceof Error ? error.message : "Could not update order");
                            }
                          }}
                        >
                          <ChefHat className="size-3" />
                          {status === "placed" ? "Start preparing" : "Mark ready"}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          className="h-7 flex-1 gap-1 text-[10px]"
                          onClick={async () => {
                            try {
                              await updateStatus({ orderId: order._id, status: "collected" });
                              toast.success(`Token #${order.tokenNo} collected`);
                            } catch (error) {
                              toast.error(error instanceof Error ? error.message : "Could not update order");
                            }
                          }}
                        >
                          <CheckCircle2 className="size-3" /> Collected
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                {activeOrders.filter((o) => o.status === status).length === 0 && (
                  <p className="py-6 text-center text-[11px] text-muted-foreground">No orders here.</p>
                )}
              </div>
            </Panel>
          ))}
        </div>

        <Panel title="Menu availability" description="Unavailable items cannot be ordered — the server validates this at checkout.">
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {menu.map((item) => (
              <div key={item._id} className="flex items-center gap-3 rounded-xl border border-border/70 p-3">
                <span className={`size-2 shrink-0 rounded-full ${item.veg ? "bg-emerald-500" : "bg-rose-500"}`} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium">{item.name}</p>
                  <p className="text-[10px] text-muted-foreground">{inr(item.price)} · {item.prepMinutes} min</p>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    await toggleAvailability({ itemId: item._id });
                    toast.success(`${item.name} ${item.available ? "marked unavailable" : "is available again"}`);
                  }}
                  className={`rounded-full px-2.5 py-1 text-[10px] font-semibold transition ${item.available ? "bg-emerald-50 text-emerald-700" : "bg-muted text-muted-foreground"}`}
                >
                  {item.available ? "Available" : "Unavailable"}
                </button>
              </div>
            ))}
          </div>
        </Panel>

        <Dialog open={itemOpen} onOpenChange={setItemOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add a menu item</DialogTitle>
              <DialogDescription>New items are immediately available to students.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <Field label="Name"><Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Paneer Tikka Roll" /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Price (₹)"><Input type="number" min={1} value={newPrice} onChange={(e) => setNewPrice(Number(e.target.value))} /></Field>
                <Field label="Category">
                  <Select value={newCategory} onValueChange={setNewCategory}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["South Indian", "Main course", "Snacks", "Beverages", "Healthy"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <Field label="Description"><Textarea rows={2} value={newDescription} onChange={(e) => setNewDescription(e.target.value)} /></Field>
              <label className="flex items-center gap-2 text-xs">
                <input type="checkbox" checked={newVeg} onChange={(e) => setNewVeg(e.target.checked)} className="size-3.5" />
                Vegetarian
              </label>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setItemOpen(false)}>Cancel</Button>
              <Button
                onClick={async () => {
                  try {
                    await addItem({ name: newName, price: newPrice, category: newCategory, description: newDescription, prepMinutes: 6, veg: newVeg });
                    toast.success("Menu item added");
                    setNewName("");
                    setNewDescription("");
                    setItemOpen(false);
                  } catch (error) {
                    toast.error(error instanceof Error ? error.message : "Could not add item");
                  }
                }}
              >
                Add item
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageWrap>
    );
  }

  return (
    <PageWrap>
      <PageHeader
        eyebrow="Canteen"
        title="Skip the queue, keep the token"
        description="Order from the live menu, pay with the simulated provider and follow your token in real time."
        actions={<Chip className="gap-1.5"><CreditCard className="size-3" /> Simulated payment · no card data stored</Chip>}
      />

      {receipt && (
        <div className="flex flex-col gap-4 rounded-2xl border border-emerald-200/80 bg-gradient-to-r from-emerald-50 to-teal-50/50 p-5 sm:flex-row sm:items-center">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white">
            <BadgeCheck className="size-6" />
          </span>
          <div className="flex-1">
            <p className="font-display text-sm font-semibold text-emerald-900">Order confirmed · token #{receipt.tokenNo}</p>
            <p className="mt-0.5 text-xs text-emerald-800/70">
              Paid {inr(receipt.amount)} with the simulated provider. Watch the live status below.
            </p>
          </div>
          <Button variant="outline" size="sm" className="bg-white" onClick={() => setReceipt(null)}>Dismiss</Button>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
        <div className="flex flex-col gap-5">
          <Panel
            title="Today's menu"
            description="Prices are validated again when the order is created."
            action={
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-8 w-[140px] rounded-lg text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            }
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {visible.map((item) => (
                <div key={item._id} className={`flex flex-col rounded-xl border p-3.5 ${item.available ? "border-border/70" : "border-border/50 bg-muted/20 opacity-70"}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <span className={`mt-1 size-2 shrink-0 rounded-full ${item.veg ? "bg-emerald-500" : "bg-rose-500"}`} />
                      <div>
                        <p className="text-xs font-semibold">{item.name}</p>
                        <p className="mt-0.5 text-[10px] leading-4 text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                    {item.bestseller && <Chip className="shrink-0 border-amber-200 bg-amber-50 text-[9px] text-amber-700">Popular</Chip>}
                  </div>
                  <div className="mt-2.5 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold">{inr(item.price)}</p>
                      <p className="flex items-center gap-1 text-[9px] text-muted-foreground"><Timer className="size-2.5" /> {item.prepMinutes} min</p>
                    </div>
                    {!item.available ? (
                      <Chip>Unavailable</Chip>
                    ) : cart[item._id] ? (
                      <div className="flex items-center gap-1.5 rounded-lg border border-border p-0.5">
                        <Button size="icon-sm" variant="ghost" className="size-6" aria-label={`Remove one ${item.name}`} onClick={() => adjust(item._id, -1)}>
                          <Minus className="size-3" />
                        </Button>
                        <span className="w-4 text-center text-xs font-semibold">{cart[item._id]}</span>
                        <Button size="icon-sm" variant="ghost" className="size-6" aria-label={`Add one ${item.name}`} onClick={() => adjust(item._id, 1)}>
                          <Plus className="size-3" />
                        </Button>
                      </div>
                    ) : (
                      <Button size="sm" variant="outline" className="h-7 gap-1 px-2.5 text-[10px]" onClick={() => adjust(item._id, 1)}>
                        <Plus className="size-3" /> Add
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Your orders" description="Live token status, straight from the counter.">
            {myOrders === undefined ? (
              <Loading label="Loading orders" />
            ) : (myOrders ?? []).length === 0 ? (
              <EmptyState icon={ShoppingBag} title="No orders yet" description="Add something from the menu and your token will appear here." />
            ) : (
              <div className="space-y-3">
                {(myOrders ?? []).map((order) => {
                  const stepIndex = FLOW.indexOf(order.status as (typeof FLOW)[number]);
                  return (
                    <div key={order._id} className="rounded-xl border border-border/70 p-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-display text-base font-bold">Token #{order.tokenNo}</p>
                          <p className="text-[10px] text-muted-foreground">{fmtDateTime(order.createdAt)} · {order.items.map((i) => `${i.qty}× ${i.name}`).join(", ")}</p>
                        </div>
                        <div className="text-right">
                          <StatusBadge status={order.status} />
                          <p className="mt-1 text-xs font-semibold">{inr(order.amount)}</p>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center gap-1">
                        {FLOW.map((step, i) => (
                          <div key={step} className="flex flex-1 items-center gap-1">
                            <span className={`flex size-5 shrink-0 items-center justify-center rounded-full text-[8px] font-bold ${i <= stepIndex && order.status !== "cancelled" ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"}`}>
                              {i + 1}
                            </span>
                            <span className="hidden text-[9px] capitalize text-muted-foreground sm:block">{step}</span>
                            {i < FLOW.length - 1 && <span className={`h-px flex-1 ${i < stepIndex ? "bg-emerald-300" : "bg-border"}`} />}
                          </div>
                        ))}
                      </div>
                      <p className="mt-2 text-[9px] text-muted-foreground">
                        {order.paymentProvider} payment · {order.paymentStatus}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </Panel>
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <Panel title="Your cart" description={`${cartLines.reduce((n, l) => n + l.qty, 0)} item(s)`}>
            {cartLines.length === 0 ? (
              <div className="py-6 text-center">
                <span className="mx-auto flex size-11 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                  <UtensilsCrossed className="size-5" />
                </span>
                <p className="mt-2 text-xs font-medium">Your cart is empty</p>
                <p className="text-[10px] text-muted-foreground">Add an item to get started.</p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  {cartLines.map((line) => (
                    <div key={line.item._id} className="flex items-center gap-2 text-xs">
                      <span className="min-w-0 flex-1 truncate">{line.qty}× {line.item.name}</span>
                      <span className="text-muted-foreground">{inr(line.qty * line.item.price)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-3 text-sm">
                  <span className="font-medium">Total</span>
                  <span className="font-display font-bold">{inr(total)}</span>
                </div>
                <Field label="Note for the counter" className="mt-3">
                  <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Less spicy, no onions…" className="text-xs" />
                </Field>
                <Button className="mt-3 w-full gap-1.5" onClick={() => setCheckoutOpen(true)}>
                  <CreditCard className="size-4" /> Checkout · {inr(total)}
                </Button>
                <p className="mt-2 flex items-start gap-1.5 text-[9px] leading-4 text-muted-foreground">
                  <Coffee className="mt-0.5 size-3 shrink-0" />
                  Payment is visibly simulated. No card details are collected or stored.
                </p>
              </>
            )}
          </Panel>

          <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50/50 p-3.5">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold text-indigo-900">
              <Clock3 className="size-3.5" /> Average prep time
            </p>
            <p className="mt-1 text-[10px] leading-4 text-indigo-800/70">
              Most orders are ready in 8–12 minutes. You will get a notification the
              moment your token is called.
            </p>
            <ProgressBar value={72} className="mt-2" tone="indigo" />
          </div>
        </div>
      </div>

      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm and pay</DialogTitle>
            <DialogDescription>This demo uses a simulated payment provider. No card data is collected.</DialogDescription>
          </DialogHeader>
          <div className="rounded-xl border border-border/70 p-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Items</span>
              <span>{cartLines.reduce((n, l) => n + l.qty, 0)}</span>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Payment</span>
              <Chip className="border-amber-200 bg-amber-50 text-amber-700">SIMULATED</Chip>
            </div>
            <div className="mt-2.5 flex items-center justify-between border-t border-border/60 pt-2.5">
              <span className="text-sm font-medium">Payable</span>
              <span className="font-display text-lg font-bold">{inr(total)}</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCheckoutOpen(false)}>Back to cart</Button>
            <Button onClick={placeOrder} disabled={placing} className="gap-1.5">
              {placing ? "Placing order…" : "Pay & place order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageWrap>
  );
}
