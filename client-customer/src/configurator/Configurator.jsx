// Orchestrates the live editor: config-driven panels + Fabric canvas + the
// server-priced sticky bar. On "Add to cart" it generates the preview, uploads
// it (server-signed), stores the preview URL on the design, and stashes a
// pending cart item (the real cart POST lands in Phase 4).

import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import FabricCanvas from './FabricCanvas';
import CustomizationPanels from './CustomizationPanels';
import PriceBar from './PriceBar';
import { useQuote } from './useQuote';
import { initDesign, setPreview, selectDesignDocument, selectPricing } from '../store/designSlice';
import { uploadPreview } from '../services/pricing';
import { addToCart } from '../store/cartSlice';
import { selectIsAuthenticated } from '../store/authSlice';
import { apiErrorMessage } from '../services/api';

export const PENDING_KEY = 'nc_pending_cart_item';

export default function Configurator({ product }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const design = useSelector(selectDesignDocument);
  const pricing = useSelector(selectPricing);
  const isAuthed = useSelector(selectIsAuthenticated);
  const canvasRef = useRef(null);

  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState(null);

  // Fresh design whenever the product changes.
  useEffect(() => {
    dispatch(initDesign(product));
    setAdded(false);
  }, [dispatch, product]);

  const { status, errors, priceUpdated } = useQuote(product._id);

  const handleAddToCart = async () => {
    setAdding(true);
    setError(null);
    try {
      // 1. Generate + server-upload the preview, store its URL on the design.
      const dataUrl = canvasRef.current?.toDataURL();
      let previewUrl = null;
      if (dataUrl) {
        const res = await uploadPreview(dataUrl); // server-signed
        previewUrl = res.url;
        dispatch(setPreview(previewUrl));
      }
      const finalDesign = {
        ...design,
        render: { ...design.render, previewImageUrl: previewUrl },
      };
      const payload = { productId: product._id, quantity: 1, designDocument: finalDesign };

      // 2. Add to cart if logged in; otherwise stash + send to login.
      if (isAuthed) {
        await dispatch(addToCart(payload)).unwrap();
        navigate('/cart');
      } else {
        localStorage.setItem(PENDING_KEY, JSON.stringify(payload));
        navigate('/login', { state: { from: { pathname: `/products/${product.slug}` } } });
      }
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not add to cart'));
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      {/* Canvas */}
      <div>
        <FabricCanvas ref={canvasRef} />
        <p className="mt-2 text-center text-xs text-gray-400">
          Live preview — drag text or icons to reposition. The final print file is regenerated
          server-side.
        </p>
        {error && <div className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
      </div>

      {/* Panels + price bar */}
      <div className="flex flex-col gap-6">
        <CustomizationPanels product={product} />
        <PriceBar
          pricing={pricing}
          status={status}
          errors={errors}
          priceUpdated={priceUpdated}
          onAddToCart={handleAddToCart}
          adding={adding}
          added={added}
        />
      </div>
    </div>
  );
}
