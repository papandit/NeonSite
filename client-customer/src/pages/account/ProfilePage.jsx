import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { selectUser } from '../../store/authSlice';

const card = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } };

export default function ProfilePage() {
  const user = useSelector(selectUser);
  const rows = [
    ['Name', user?.name, '👤'],
    ['Email', user?.email, '✉️'],
  ];
  return (
    <div>
      <h2 className="mb-5 font-display text-xl font-medium text-gray-900">Profile</h2>
      <motion.div
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.08 } } }}
        className="grid gap-4 sm:grid-cols-2"
      >
        {rows.map(([label, value, icon]) => (
          <motion.div
            key={label}
            variants={card}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="flex items-start gap-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-lg">{icon}</span>
            <div className="min-w-0">
              <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</dt>
              <dd className="mt-1 truncate text-lg font-semibold text-gray-900">{value || '—'}</dd>
            </div>
          </motion.div>
        ))}
      </motion.div>
      <p className="mt-6 text-sm text-gray-400">Saved designs and profile editing arrive in a later pass.</p>
    </div>
  );
}
