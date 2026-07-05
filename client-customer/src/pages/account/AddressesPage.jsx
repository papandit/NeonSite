import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAddresses } from '../../hooks/useAddresses';

export default function AddressesPage() {
  const { addresses, add, remove } = useAddresses();
  const [showForm, setShowForm] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const onSubmit = (data) => {
    add(data);
    reset();
    setShowForm(false);
  };

  const field = (name, label, opts = {}) => (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <input className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm" {...register(name, opts)} />
      {errors[name] && <p className="mt-1 text-xs text-red-600">{errors[name].message}</p>}
    </div>
  );

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Saved addresses</h2>
        <button onClick={() => setShowForm((s) => !s)} className="rounded-full bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700">
          {showForm ? 'Cancel' : '+ Add address'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit(onSubmit)} className="mb-6 space-y-4 rounded-xl border border-gray-200 bg-white p-5">
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
          <button type="submit" className="rounded-full bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">Save address</button>
        </form>
      )}

      {addresses.length === 0 ? (
        <p className="text-sm text-gray-400">No saved addresses yet.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {addresses.map((a) => (
            <div key={a.id} className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="font-medium">{a.name}</div>
              <div className="text-sm text-gray-600">{a.line1}{a.line2 ? `, ${a.line2}` : ''}</div>
              <div className="text-sm text-gray-600">{a.city}, {a.state} {a.pincode}</div>
              <div className="text-sm text-gray-500">{a.phone}</div>
              <button onClick={() => remove(a.id)} className="mt-2 text-xs text-red-600 hover:underline">Remove</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
