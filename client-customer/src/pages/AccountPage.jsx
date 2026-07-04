import { useSelector } from 'react-redux';
import { selectUser } from '../store/authSlice';

export default function AccountPage() {
  const user = useSelector(selectUser);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-bold">My Account</h1>
      <p className="mt-1 text-sm text-gray-600">
        This is a protected route — you can only see it while signed in.
      </p>

      <dl className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <dt className="text-xs font-medium uppercase text-gray-400">Name</dt>
          <dd className="mt-1 text-lg font-semibold">{user?.name}</dd>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <dt className="text-xs font-medium uppercase text-gray-400">Email</dt>
          <dd className="mt-1 text-lg font-semibold">{user?.email}</dd>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <dt className="text-xs font-medium uppercase text-gray-400">Role</dt>
          <dd className="mt-1 text-lg font-semibold capitalize">{user?.role}</dd>
        </div>
      </dl>

      <p className="mt-8 text-sm text-gray-500">
        Orders, saved designs, and addresses arrive in Phase 4.
      </p>
    </div>
  );
}
