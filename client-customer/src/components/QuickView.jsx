import { Link } from 'react-router-dom';
import Modal from './Modal';
import Rating from './Rating';
import { formatPaise } from '../utils/money';

export default function QuickView({ product, onClose }) {
  return (
    <Modal open={Boolean(product)} onClose={onClose} maxWidth="max-w-2xl">
      {product && (
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="aspect-square overflow-hidden rounded-lg bg-slate-100">
            {product.images?.[0] ? (
              <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-slate-400">No image</div>
            )}
          </div>
          <div className="flex flex-col">
            {product.category?.name && <span className="text-xs text-gray-400">{product.category.name}</span>}
            <h2 className="mt-1 text-xl font-bold">{product.name}</h2>
            <div className="mt-2"><Rating value={product.rating || 0} showValue /></div>
            <div className="mt-4 text-2xl font-semibold">{formatPaise(product.basePricePaise)}</div>
            {product.description && (
              <p className="mt-3 line-clamp-4 text-sm text-gray-600">{product.description}</p>
            )}
            <div className="mt-auto pt-6">
              <Link
                to={`/products/${product.slug}`}
                onClick={onClose}
                className="block rounded-md bg-indigo-600 px-4 py-2.5 text-center text-sm font-medium text-white hover:bg-indigo-700"
              >
                Customize this plate
              </Link>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
