import { useSelector } from 'react-redux';
import { selectUser } from '../store/authSlice';

const CARDS = [
  ['Categories & options', 'Phase 1', 'CRUD for catalog + every option collection.'],
  ['Products', 'Phase 1', 'Product Builder writing customizationConfig.'],
  ['Orders', 'Phase 5', 'Order management, status machine, design review.'],
  ['Metrics', 'Phase 5', 'Sales, revenue, pending orders.'],
];

export default function DashboardPage() {
  const user = useSelector(selectUser);

  return (
    <div>
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="mt-1 text-sm text-slate-600">
        Welcome, {user?.name}. Admin operations arrive in later phases — the shell,
        auth, and role guard are live.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CARDS.map(([title, phase, desc]) => (
          <div
            key={title}
            className="rounded-xl border border-slate-200 bg-white p-5"
          >
            <div className="text-xs font-medium text-indigo-600">{phase}</div>
            <div className="mt-1 font-semibold">{title}</div>
            <p className="mt-1 text-sm text-slate-600">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
