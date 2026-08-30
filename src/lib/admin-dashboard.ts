import { db } from "./db";
import { getStoreSettings, type StoreSettingsData } from "./settings";

const PAID_STATUSES = ["PAID", "SHIPPED", "DELIVERED"] as const;
const NEEDS_ACTION = ["PENDING", "CONFIRMED", "PAID"] as const;
const LOW_STOCK_THRESHOLD = 5;

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function daysAgo(n: number): Date {
  const d = startOfDay(new Date());
  d.setDate(d.getDate() - n);
  return d;
}

function monthStart(offsetMonths = 0): Date {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  d.setMonth(d.getMonth() + offsetMonths);
  return d;
}

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null;
  return Math.round(((current - previous) / previous) * 100);
}

export type DailyRevenue = { date: string; label: string; cents: number; orders: number };

export type DashboardData = {
  settings: StoreSettingsData;
  storeClosed: boolean;
  revenue: {
    allTimeCents: number;
    thisMonthCents: number;
    lastMonthCents: number;
    monthChangePct: number | null;
    avgOrderCents: number;
  };
  orders: {
    total: number;
    needsAction: number;
    thisWeek: number;
    lastWeek: number;
    weekChangePct: number | null;
    byStatus: { status: string; count: number }[];
  };
  catalog: {
    total: number;
    published: number;
    lowStock: number;
    outOfStock: number;
    lowStockProducts: { id: string; name: string; slug: string; stock: number }[];
  };
  customers: { total: number; newThisMonth: number };
  engagement: {
    subscribers: number;
    reviews: number;
    wishlistItems: number;
    stockAlerts: number;
    messagesTotal: number;
    messagesThisWeek: number;
  };
  coupons: { active: number; total: number };
  paymentMix: { method: string; count: number; revenueCents: number }[];
  dailyRevenue: DailyRevenue[];
  topProducts: {
    productId: string;
    name: string;
    slug: string;
    image: string;
    unitsSold: number;
    revenueCents: number;
  }[];
  recentOrders: {
    id: string;
    orderNumber: number;
    status: string;
    paymentMethod: string;
    email: string;
    totalCents: number;
    createdAt: Date;
  }[];
  recentMessages: {
    id: string;
    name: string;
    email: string;
    subject: string;
    message: string;
    createdAt: Date;
  }[];
};

function bucketDailyRevenue(
  orders: { createdAt: Date; totalCents: number }[],
  days: number
): DailyRevenue[] {
  const buckets: DailyRevenue[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const day = daysAgo(i);
    const key = day.toISOString().slice(0, 10);
    const label = day.toLocaleDateString("en-PK", { weekday: "short", day: "numeric" });
    buckets.push({ date: key, label, cents: 0, orders: 0 });
  }
  const byDate = new Map(buckets.map((b) => [b.date, b]));
  for (const o of orders) {
    const key = startOfDay(o.createdAt).toISOString().slice(0, 10);
    const bucket = byDate.get(key);
    if (bucket) {
      bucket.cents += o.totalCents;
      bucket.orders += 1;
    }
  }
  return buckets;
}

export async function getDashboardData(): Promise<DashboardData> {
  const now = new Date();
  const weekStart = daysAgo(6);
  const lastWeekStart = daysAgo(13);
  const lastWeekEnd = daysAgo(7);
  const thisMonthStart = monthStart(0);
  const lastMonthStart = monthStart(-1);
  const chartStart = daysAgo(6);

  const paidWhere = { status: { in: [...PAID_STATUSES] } };
  const notCancelled = { status: { not: "CANCELLED" } };

  const [
    settings,
    productCount,
    publishedCount,
    lowStockCount,
    outOfStockCount,
    lowStockProducts,
    orderCount,
    needsActionCount,
    ordersThisWeek,
    ordersLastWeek,
    revenueAllTime,
    revenueThisMonth,
    revenueLastMonth,
    paidOrderCount,
    customerCount,
    newCustomersThisMonth,
    subscriberCount,
    reviewCount,
    wishlistCount,
    stockAlertCount,
    messageCount,
    messagesThisWeek,
    couponTotal,
    couponActive,
    orderStatusGroups,
    paymentGroups,
    chartOrders,
    soldGroups,
    recentOrders,
    recentMessages,
  ] = await Promise.all([
    getStoreSettings(),
    db.product.count(),
    db.product.count({ where: { published: true } }),
    db.product.count({ where: { stock: { lte: LOW_STOCK_THRESHOLD }, published: true } }),
    db.product.count({ where: { stock: 0, published: true } }),
    db.product.findMany({
      where: { stock: { lte: LOW_STOCK_THRESHOLD }, published: true },
      orderBy: { stock: "asc" },
      take: 6,
      select: { id: true, name: true, slug: true, stock: true },
    }),
    db.order.count(),
    db.order.count({ where: { status: { in: [...NEEDS_ACTION] } } }),
    db.order.count({ where: { createdAt: { gte: weekStart } } }),
    db.order.count({
      where: { createdAt: { gte: lastWeekStart, lt: lastWeekEnd } },
    }),
    db.order.aggregate({ _sum: { totalCents: true }, where: paidWhere }),
    db.order.aggregate({
      _sum: { totalCents: true },
      where: { ...paidWhere, createdAt: { gte: thisMonthStart } },
    }),
    db.order.aggregate({
      _sum: { totalCents: true },
      where: {
        ...paidWhere,
        createdAt: { gte: lastMonthStart, lt: thisMonthStart },
      },
    }),
    db.order.count({ where: paidWhere }),
    db.user.count({ where: { role: "CUSTOMER" } }),
    db.user.count({
      where: { role: "CUSTOMER", createdAt: { gte: thisMonthStart } },
    }),
    db.newsletterSubscriber.count(),
    db.review.count(),
    db.wishlistItem.count(),
    db.stockNotification.count({ where: { notifiedAt: null } }),
    db.contactMessage.count(),
    db.contactMessage.count({ where: { createdAt: { gte: weekStart } } }),
    db.coupon.count(),
    db.coupon.count({
      where: {
        active: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
    }),
    db.order.groupBy({ by: ["status"], _count: true }),
    db.order.groupBy({
      by: ["paymentMethod"],
      where: paidWhere,
      _count: true,
      _sum: { totalCents: true },
    }),
    db.order.findMany({
      where: { ...paidWhere, createdAt: { gte: chartStart } },
      select: { createdAt: true, totalCents: true },
    }),
    db.orderItem.groupBy({
      by: ["productId"],
      where: { productId: { not: null }, order: notCancelled },
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    }),
    db.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        paymentMethod: true,
        email: true,
        totalCents: true,
        createdAt: true,
      },
    }),
    db.contactMessage.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const allTimeCents = revenueAllTime._sum.totalCents ?? 0;
  const thisMonthCents = revenueThisMonth._sum.totalCents ?? 0;
  const lastMonthCents = revenueLastMonth._sum.totalCents ?? 0;

  const soldIds = soldGroups
    .map((g) => g.productId)
    .filter((id): id is string => id !== null);
  const soldProductRows = soldIds.length
    ? await db.product.findMany({
        where: { id: { in: soldIds } },
        select: { id: true, name: true, slug: true, image: true },
      })
    : [];
  const productById = new Map(soldProductRows.map((p) => [p.id, p]));

  const revenueByProduct = new Map<string, number>();
  if (soldIds.length > 0) {
    const items = await db.orderItem.findMany({
      where: { productId: { in: soldIds }, order: notCancelled },
      select: { productId: true, priceCents: true, quantity: true },
    });
    for (const item of items) {
      if (!item.productId) continue;
      const prev = revenueByProduct.get(item.productId) ?? 0;
      revenueByProduct.set(item.productId, prev + item.priceCents * item.quantity);
    }
  }

  const topProducts = soldGroups
    .map((g) => {
      const p = g.productId ? productById.get(g.productId) : undefined;
      if (!p || !g.productId) return null;
      return {
        productId: g.productId,
        name: p.name,
        slug: p.slug,
        image: p.image,
        unitsSold: g._sum.quantity ?? 0,
        revenueCents: revenueByProduct.get(g.productId) ?? 0,
      };
    })
    .filter((p): p is NonNullable<typeof p> => p !== null);

  const storeClosed =
    settings.mode === "MAINTENANCE" ||
    (settings.mode === "COMING_SOON" &&
      !(settings.launchAt && settings.launchAt.getTime() <= Date.now()));

  return {
    settings,
    storeClosed,
    revenue: {
      allTimeCents,
      thisMonthCents,
      lastMonthCents,
      monthChangePct: pctChange(thisMonthCents, lastMonthCents),
      avgOrderCents: paidOrderCount > 0 ? Math.round(allTimeCents / paidOrderCount) : 0,
    },
    orders: {
      total: orderCount,
      needsAction: needsActionCount,
      thisWeek: ordersThisWeek,
      lastWeek: ordersLastWeek,
      weekChangePct: pctChange(ordersThisWeek, ordersLastWeek),
      byStatus: orderStatusGroups
        .map((g) => ({ status: g.status, count: g._count }))
        .sort((a, b) => b.count - a.count),
    },
    catalog: {
      total: productCount,
      published: publishedCount,
      lowStock: lowStockCount,
      outOfStock: outOfStockCount,
      lowStockProducts,
    },
    customers: { total: customerCount, newThisMonth: newCustomersThisMonth },
    engagement: {
      subscribers: subscriberCount,
      reviews: reviewCount,
      wishlistItems: wishlistCount,
      stockAlerts: stockAlertCount,
      messagesTotal: messageCount,
      messagesThisWeek,
    },
    coupons: { active: couponActive, total: couponTotal },
    paymentMix: paymentGroups
      .map((g) => ({
        method: g.paymentMethod,
        count: g._count,
        revenueCents: g._sum.totalCents ?? 0,
      }))
      .sort((a, b) => b.revenueCents - a.revenueCents),
    dailyRevenue: bucketDailyRevenue(chartOrders, 7),
    topProducts,
    recentOrders,
    recentMessages,
  };
}
