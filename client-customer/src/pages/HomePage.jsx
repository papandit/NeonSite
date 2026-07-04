import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <div className="text-center max-w-2xl mx-auto">
        <span className="inline-block rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
          Phase 0 · Foundation
        </span>
        <h1 className="mt-4 text-4xl sm:text-5xl font-bold tracking-tight">
          Design your own <span className="text-indigo-600">name plate</span>
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          Pick a material, size, font and finish — see it live, and we craft it to order.
          The storefront and editor arrive in the next phases.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            to="/register"
            className="rounded-md bg-indigo-600 px-5 py-3 text-white font-medium hover:bg-indigo-700"
          >
            Get started
          </Link>
          <Link
            to="/login"
            className="rounded-md border border-gray-300 px-5 py-3 font-medium text-gray-700 hover:bg-gray-50"
          >
            Sign in
          </Link>
        </div>
      </div>

      <div className="mt-16 grid gap-4 sm:grid-cols-3">
        {[
          ['Catalog', 'Phase 1–2', 'Browse products & customization options.'],
          ['Live editor', 'Phase 3', 'Design on a canvas with server-priced quotes.'],
          ['Checkout', 'Phase 4', 'Cart, coupons, Razorpay, and order tracking.'],
        ].map(([title, phase, desc]) => (
          <div key={title} className="rounded-xl border border-gray-200 bg-white p-6">
            <div className="text-xs font-medium text-indigo-600">{phase}</div>
            <div className="mt-1 text-lg font-semibold">{title}</div>
            <p className="mt-1 text-sm text-gray-600">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
