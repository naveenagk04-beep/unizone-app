import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { audit, notify, nextCounter, requireRole, requireUser } from "./lib";

const STATUS_ORDER = ["placed", "preparing", "ready", "collected"] as const;

export const menu = query({
  args: {},
  handler: async (ctx) => {
    await requireUser(ctx);
    const items = await ctx.db.query("canteenItems").take(60);
    return items.sort((a, b) => Number(b.available) - Number(a.available) || Number(b.bestseller) - Number(a.bestseller));
  },
});

export const myOrders = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const rows = await ctx.db
      .query("orders")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .take(40);
    return rows.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const board = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    if (!user.role || !["canteen_staff", "admin"].includes(user.role)) return [];
    const rows = await ctx.db.query("orders").take(120);
    return rows
      .filter((o) => o.status !== "collected" && o.status !== "cancelled")
      .sort((a, b) => a.createdAt - b.createdAt);
  },
});

export const createOrder = mutation({
  args: {
    items: v.array(v.object({ id: v.id("canteenItems"), qty: v.number() })),
    note: v.optional(v.string()),
    idempotencyKey: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    if (user.role !== "student") throw new Error("Only student accounts can place canteen orders.");
    if (!args.items.length) throw new Error("Your cart is empty.");
    if (args.idempotencyKey.length < 6) throw new Error("Invalid order request.");

    const previous = await ctx.db
      .query("orders")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .take(40);
    const duplicate = previous.find((o) => o.idempotencyKey === args.idempotencyKey);
    if (duplicate) return { orderId: duplicate._id, tokenNo: duplicate.tokenNo, duplicate: true };

    const lines: { name: string; qty: number; price: number }[] = [];
    let amount = 0;
    for (const line of args.items) {
      if (line.qty < 1 || line.qty > 10) throw new Error("Choose between 1 and 10 of each item.");
      const item = await ctx.db.get(line.id);
      if (!item) throw new Error("An item in your cart is no longer on the menu.");
      if (!item.available) throw new Error(`${item.name} is unavailable right now.`);
      lines.push({ name: item.name, qty: line.qty, price: item.price });
      amount += item.price * line.qty;
    }

    const tokenNo = await nextCounter(ctx, "order", 41);
    const now = Date.now();
    const orderId = await ctx.db.insert("orders", {
      userId: user._id,
      userName: user.name ?? "Student",
      items: lines,
      amount,
      tokenNo,
      status: "placed",
      paymentStatus: "paid",
      paymentProvider: "Simulated",
      note: args.note,
      idempotencyKey: args.idempotencyKey,
      createdAt: now,
      updatedAt: now,
    });

    await notify(ctx, user._id, {
      title: `Order confirmed — token #${tokenNo}`,
      body: `${lines.map((l) => `${l.qty}× ${l.name}`).join(", ")} · ₹${amount}. Simulated payment marked paid.`,
      kind: "canteen",
      link: "/canteen",
    });
    const staff = await ctx.db.query("users").withIndex("by_role", (q) => q.eq("role", "canteen_staff")).take(10);
    for (const person of staff) {
      await notify(ctx, person._id, {
        title: `New order · token #${tokenNo}`,
        body: `${user.name ?? "Student"} · ₹${amount} · ${lines.length} item(s).`,
        kind: "canteen",
        link: "/canteen",
      });
    }
    await audit(ctx, user, `Placed canteen order token #${tokenNo}`, `orders/${orderId}`);
    return { orderId, tokenNo, duplicate: false };
  },
});

export const updateOrderStatus = mutation({
  args: {
    orderId: v.id("orders"),
    status: v.union(
      v.literal("placed"),
      v.literal("preparing"),
      v.literal("ready"),
      v.literal("collected"),
      v.literal("cancelled"),
    ),
  },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, ["canteen_staff", "admin"]);
    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error("Order not found.");
    if (order.status === "collected" || order.status === "cancelled") {
      throw new Error("This order is already closed.");
    }
    await ctx.db.patch(args.orderId, { status: args.status, updatedAt: Date.now() });
    const message: Record<string, string> = {
      placed: "received",
      preparing: "being prepared",
      ready: "ready for pickup",
      collected: "collected. Enjoy!",
      cancelled: "cancelled",
    };
    await notify(ctx, order.userId, {
      title: `Token #${order.tokenNo} · ${message[args.status]}`,
      body: `Your order total is ₹${order.amount}. ${args.status === "ready" ? "Please collect it at the counter." : ""}`,
      kind: "canteen",
      link: "/canteen",
    });
    await audit(ctx, user, `Marked order token #${order.tokenNo} as ${args.status}`, `orders/${args.orderId}`);
    return null;
  },
});

export const toggleAvailability = mutation({
  args: { itemId: v.id("canteenItems") },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, ["canteen_staff", "admin"]);
    const item = await ctx.db.get(args.itemId);
    if (!item) throw new Error("Menu item not found.");
    await ctx.db.patch(args.itemId, { available: !item.available });
    await audit(ctx, user, `Marked ${item.name} ${item.available ? "unavailable" : "available"}`, `canteenItems/${args.itemId}`);
    return null;
  },
});

export const addMenuItem = mutation({
  args: {
    name: v.string(),
    price: v.number(),
    category: v.string(),
    description: v.string(),
    prepMinutes: v.number(),
    veg: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await requireRole(ctx, ["canteen_staff", "admin"]);
    if (args.name.trim().length < 2) throw new Error("Add an item name.");
    if (args.price <= 0) throw new Error("Price must be greater than zero.");
    const id = await ctx.db.insert("canteenItems", {
      name: args.name.trim(),
      price: Math.round(args.price),
      category: args.category,
      description: args.description.trim(),
      available: true,
      prepMinutes: Math.max(1, args.prepMinutes),
      veg: args.veg,
      bestseller: false,
    });
    await audit(ctx, user, `Added canteen item ${args.name}`, `canteenItems/${id}`);
    return id;
  },
});

export { STATUS_ORDER };
