// Orchestrates the live editor: config-driven panels + Fabric canvas + the
// server-priced sticky bar. On "Add to cart" it generates the preview, uploads
// it (server-signed), stores the preview URL on the design, and stashes a
// pending cart item (the real cart POST lands in Phase 4).

import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import FabricCanvas from './FabricCanvas';
import CustomizationPanels from './CustomizationPanels';
import PriceBar from './PriceBar';
import { useQuote } from './useQuote';
import { initDesign, setPreview, selectDesignDocument, selectPricing } from '../store/designSlice';
import { uploadPreview } from '../services/pricing';
import { apiErrorMessage } from '../services/api';

const PENDING_KEY = 'nc_pending_cart_item';

export default function Configurator({ product }) {
  const dispatch = useDispatch();
  const design = useSelector(selectDesignDocument);
  const pricing = useSelector(selectPricing);
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
      // Phase 4 will POST this to /api/cart. For now, stash it.
      localStorage.setItem(
        PENDING_KEY,
        JSON.stringify({ productId: product._id, quantity: 1, designDocument: finalDesign })
      );
      setAdded(true);
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not prepare your design'));
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
        {added && (
          <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
            <p className="font-medium">Design ready and preview saved! 🎉</p>
            <p className="mt-1 text-green-700">
              Your preview was uploaded and stored on the design. Cart &amp; checkout arrive in
              Phase 4.
            </p>
            {design.render.previewImageUrl && (
              <img
                src={design.render.previewImageUrl}
                alt="preview"
                className="mt-3 max-h-32 rounded border border-green-200"
              />
            )}
          </div>
        )}
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
