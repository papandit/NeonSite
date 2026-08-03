import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDashboard, getAnalytics, neonApi } from '../services/ops';
import { resource } from '../services/resourceApi';
import { formatPaise } from '../utils/money';
import { apiErrorMessage } from '../services/api';
import { AreaChart, Donut, BarList } from '../components/Charts';
import Icon from '../components/Icon';

const STATUS_STYLE = {
  confirmed: 'bg-blue-50 text-blue-700',
  design_review: 'bg-amber-50 text-amber-700',
  approved: 'bg-indigo-50 text-indigo-700',
  manufacturing: 'bg-purple-50 text-purple-700',
  packed: 'bg-cyan-50 text-cyan-700',
  shipped: 'bg-teal-50 text-teal-700',
  delivered: 'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-700',
  pending: 'bg-slate-100 text-slate-600',
};

// Donut colours per order status (falls back to slate).
const STATUS_COLOR = {
  confirmed: '#4dd8c8',
  design_review: '#ffb003',
  approved: '#00af99',
  manufacturing: '#009083',
  packed: '#1ac6b3',
  shipped: '#05b8a4',
  delivered: '#22c55e',
  cancelled: '#ef4444',
  pending: '#97b3ae',
};

const QUICK_ACTIONS = [
  { to: '/products/new', label: 'New product', icon: 'product', accent: 'text-indigo-600' },
  { to: '/orders', label: 'Manage orders', icon: 'orders', accent: 'text-blue-600' },
  { to: '/coupons', label: 'Coupons', icon: 'coupon', accent: 'text-emerald-600' },
  { to: '/banners', label: 'Banners', icon: 'banner', accent: 'text-rose-600' },
  { to: '/categories', label: 'Categories', icon: 'category', accent: 'text-amber-600' },
  { to: '/reviews', label: 'Reviews', icon: 'reviews', accent: 'text-yellow-600' },
  { to: '/analytics', label: 'Analytics', icon: 'analytics', accent: 'text-purple-600' },
  { to: '/settings', label: 'Settings & content', icon: 'settings', accent: 'text-slate-600' },
];

function StatCard({ label, value, sub, tone = 'slate' }) {
  const tones = {
    slate: 'from-slate-50 to-white',
    indigo: 'from-indigo-50 to-white',
    green: 'from-green-50 to-white',
    amber: 'from-amber-50 to-white',
  };
  return (
    <div className={`rounded-xl border border-slate-200 bg-linear-to-b ${tones[tone] || tones.slate} p-5`}>
      <div className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-1 text-2xl font-bold text-slate-900">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-slate-400">{sub}</div>}
    </div>
  );
}

function Panel({ title, cta, children }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold text-slate-800">{title}</h2>
        {cta}
      </div>
      {children}
    </div>
  );
}

// Small stat pill for the studio sections.
function MiniStat({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="text-xl font-bold text-slate-900">{value ?? '—'}</div>
      <div className="mt-0.5 text-xs text-slate-500">{label}</div>
    </div>
  );
}

function SectionTitle({ children, accent }) {
  return (
    <div className="mb-4 mt-10 flex items-center gap-2">
      <span className={`inline-block h-5 w-1.5 rounded-full ${accent}`} />
      <h2 className="text-lg font-semibold text-slate-800">{children}</h2>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [neon, setNeon] = useState(null);
  const [np, setNp] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    getDashboard().then(setData).catch((e) => setError(apiErrorMessage(e)));
    getAnalytics().then(setAnalytics).catch(() => {}); // charts are best-effort
    neonApi.get().then(setNeon).catch(() => {});
    // Name Plate counts (templates + collections).
    const npKeys = ['templates', 'categories', 'fonts', 'colors', 'elements'];
    Promise.all(npKeys.map((k) => resource(`nameplate/${k}`).list({ limit: 1 }).then((r) => [k, r.meta?.total ?? 0]).catch(() => [k, 0])))
      .then((pairs) => setNp(Object.fromEntries(pairs)));
  }, []);

  if (error) return <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>;
  if (!data) return <div className="text-slate-400">Loading metrics…</div>;

  const salesSeries = (analytics?.salesByDay || []).map((d) => ({ label: d.date.slice(5), value: d.salesPaise }));
  const statusSegments = (analytics?.statusDistribution || [])
    .filter((s) => s.status)
    .map((s) => ({ label: s.status.replace('_', ' '), value: s.count, color: STATUS_COLOR[s.status] || '#97b3ae' }));
  const topProducts = (analytics?.topProducts || []).map((p) => ({ label: p.name, value: p.revenuePaise, sub: `· ${p.qty} sold` }));

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-600">Live store overview — revenue, orders, catalog and quick actions.</p>
        </div>
        <Link to="/products/new" className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">+ New product</Link>
      </div>

      <SectionTitle accent="bg-indigo-500">E-commerce store</SectionTitle>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <StatCard tone="green" label="Total revenue" value={formatPaise(data.totalSalesPaise)} sub={`${data.totalOrders} orders all-time`} />
        <StatCard tone="indigo" label="Today's revenue" value={formatPaise(data.todaysRevenuePaise)} sub={`${data.todaysOrders} orders today`} />
        <StatCard label="Avg order value" value={formatPaise(data.avgOrderValuePaise)} />
        <StatCard tone="amber" label="Pending orders" value={data.pendingOrders} sub="not delivered / cancelled" />
        <StatCard label="Listed products" value={data.productCount} sub={`${data.activeProducts} active`} />
        <StatCard label="Categories" value={data.categoryCount} />
        <StatCard label="Active coupons" value={data.activeCoupons} />
        <StatCard label="Customers" value={data.customerCount} />
      </div>

      {/* Quick access */}
      <div className="mt-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">Quick access</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {QUICK_ACTIONS.map((a) => (
            <Link
              key={a.to}
              to={a.to}
              className="group flex flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white p-4 text-center transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
            >
              <span className={`${a.accent} transition group-hover:scale-110`}>
                <Icon name={a.icon} className="h-6 w-6" />
              </span>
              <span className="text-xs font-medium text-slate-600">{a.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Panel
            title="Revenue — last 14 days"
            cta={<Link to="/analytics" className="text-sm font-medium text-indigo-600 hover:underline">Full analytics</Link>}
          >
            <AreaChart data={salesSeries} formatValue={(v) => formatPaise(v)} />
            <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
              <span>Revenue per day</span>
              <span>Total 14d: <strong className="text-slate-700">{formatPaise(salesSeries.reduce((s, d) => s + d.value, 0))}</strong></span>
            </div>
          </Panel>
        </div>
        <Panel title="Orders by status">
          <Donut segments={statusSegments} />
        </Panel>
      </div>

      {/* Top products + review snapshot */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Panel title="Top products" cta={<Link to="/products" className="text-sm font-medium text-indigo-600 hover:underline">All products</Link>}>
            <BarList items={topProducts} formatValue={(v) => formatPaise(v)} />
          </Panel>
        </div>
        <Panel title="Customer reviews" cta={<Link to="/reviews" className="text-sm font-medium text-indigo-600 hover:underline">Moderate</Link>}>
          <div className="flex flex-col items-center justify-center py-4 text-center">
            <div className="text-4xl font-bold text-slate-900">{data.avgRating || '—'}</div>
            <div className="mt-1 text-amber-400">
              {'★'.repeat(Math.round(data.avgRating)) || '—'}
              <span className="text-slate-200">{'★'.repeat(5 - Math.round(data.avgRating))}</span>
            </div>
            <div className="mt-2 text-sm text-slate-500">{data.reviewCount} approved reviews</div>
          </div>
        </Panel>
      </div>

      {/* Recent orders */}
      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Recent orders</h2>
          <Link to="/orders" className="text-sm font-medium text-indigo-600 hover:underline">View all</Link>
        </div>
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-slate-500">Order</th>
                <th className="px-4 py-3 text-left font-medium text-slate-500">Items</th>
                <th className="px-4 py-3 text-left font-medium text-slate-500">Status</th>
                <th className="px-4 py-3 text-left font-medium text-slate-500">Date</th>
                <th className="px-4 py-3 text-right font-medium text-slate-500">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.recentOrders.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-400">No orders yet.</td></tr>
              ) : (
                data.recentOrders.map((o) => (
                  <tr key={o._id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link to={`/orders/${o._id}`} className="font-medium text-indigo-600 hover:underline">{o.orderNumber}</Link>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{o.itemCount}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[o.status] || 'bg-slate-100 text-slate-600'}`}>
                        {o.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{new Date(o.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right font-medium">{formatPaise(o.totalPaise)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ---------------- Neon Studio ---------------- */}
      <SectionTitle accent="bg-pink-500">Neon Studio</SectionTitle>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <MiniStat label="Fonts" value={neon?.fonts?.length} />
        <MiniStat label="Colours" value={neon?.colors?.length} />
        <MiniStat label="Sizes" value={neon?.sizes?.length} />
        <MiniStat label="Adapters" value={neon?.adapters?.length} />
        <MiniStat label="Scenes" value={neon?.scenes?.length} />
      </div>
      <div className="mt-3">
        <Link to="/neon" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:border-pink-200 hover:bg-pink-50">
          <Icon name="sparkle" className="h-4 w-4" /> Open Neon Studio
        </Link>
      </div>

      {/* ---------------- Name Plate Studio ---------------- */}
      <SectionTitle accent="bg-amber-500">Name Plate Studio</SectionTitle>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <MiniStat label="Templates" value={np.templates} />
        <MiniStat label="Categories" value={np.categories} />
        <MiniStat label="Fonts" value={np.fonts} />
        <MiniStat label="Colours" value={np.colors} />
        <MiniStat label="Elements" value={np.elements} />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {[
          ['/nameplate/dashboard', 'Studio', 'dashboard'],
          ['/nameplate/templates', 'Templates', 'layers'],
          ['/nameplate/c/fonts', 'Fonts', 'type'],
          ['/nameplate/c/colors', 'Colors', 'droplet'],
          ['/nameplate/c/elements', 'Elements', 'sparkle'],
          ['/nameplate/price-rules', 'Price rules', 'coupon'],
        ].map(([to, label, icon]) => (
          <Link key={to} to={to} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:border-amber-200 hover:bg-amber-50">
            <Icon name={icon} className="h-4 w-4" /> {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
