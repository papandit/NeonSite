import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { useAddresses } from '../../hooks/useAddresses';
import { toast } from '../../lib/toast';

export default function AddressesPage() {
  const { addresses, add, remove } = useAddresses();
  const [showForm, setShowForm] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const onSubmit = (data) => {
    add(data);
    reset();
    setShowForm(false);
    toast.success('Address saved');
  };

  const onRemove = (id) => {
    remove(id);
    toast.info('Address removed');
  };

  const field = (name, label, opts = {}) => (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <input className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" {...register(name, opts)} />
      {errors[name] && <p className="mt-1 text-xs text-red-600">{errors[name].message}</p>}
    </div>
  );

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-medium text-gray-900">Saved addresses</h2>
          <p className="text-sm text-gray-400">{addresses.length} saved · used to speed up checkout</p>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-indigo-600/20 transition hover:-translate-y-0.5 hover:bg-indigo-700"
        >
          {showForm ? 'Cancel' : '+ Add address'}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {showForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            onSubmit={handleSubmit(onSubmit)}
            className="mb-6 overflow-hidden"
          >
            <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="grid gap-4 sm:grid-cols-2">
                {field('name', 'Full name', { required: 'Required' })}
                {field('phone', 'Phone', { required: 'Required' })}
              </div>
              {field('line1', 'Address line 1', { required: 'Required' })}
              {field('line2', 'Address line 2')}
              <div className="grid gap-4 sm:grid-cols-3">
                {field('city', 'City', { required: 'Required' })}
                {field('state', 'State', { required: 'Required' })}
                {field('pincode', 'Pincode', { required: 'Required' })}
              </div>
              <button type="submit" className="rounded-full bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700">Save address</button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {addresses.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white/60 px-6 py-16 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-2xl">📍</div>
          <p className="font-medium text-gray-700">No saved addresses yet</p>
          <p className="mt-1 text-sm text-gray-400">Add one to check out faster next time.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {addresses.map((a, i) => (
            <motion.div
              key={a.id}
              whileHover={{ y: -4 }}
              transition={{ type: 'spring', stiffness: 300, damping: 22 }}
              className="group relative rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-lg">🏠</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">{a.name}</span>
                    {i === 0 && <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-indigo-700">Default</span>}
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-gray-600">
                    {a.line1}{a.line2 ? `, ${a.line2}` : ''}<br />
                    {a.city}, {a.state} {a.pincode}
                  </p>
                  <p className="mt-1.5 text-sm text-gray-400">📞 {a.phone}</p>
                </div>
              </div>
              <button
                onClick={() => onRemove(a.id)}
                className="mt-3 rounded-full px-2.5 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50"
              >
                Remove
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
