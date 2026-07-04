import { useSelector } from 'react-redux';
import { selectUser } from '../../store/authSlice';

export default function ProfilePage() {
  const user = useSelector(selectUser);
  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold">Profile</h2>
      <dl className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <dt className="text-xs font-medium uppercase text-gray-400">Name</dt>
          <dd className="mt-1 text-lg font-semibold">{user?.name}</dd>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <dt className="text-xs font-medium uppercase text-gray-400">Email</dt>
          <dd className="mt-1 text-lg font-semibold">{user?.email}</dd>
        </div>
      </dl>
      <p className="mt-6 text-sm text-gray-400">Saved designs and profile editing arrive in a later pass.</p>
    </div>
  );
}
