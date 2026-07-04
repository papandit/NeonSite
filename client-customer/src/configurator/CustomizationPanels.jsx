// Renders ONLY the panels the product's customizationConfig enables. Selecting
// an option dispatches to the design slice. Pricing shown here is display-only
// (the sticky PriceBar shows the server-authoritative total).

import { useDispatch, useSelector } from 'react-redux';
import { setSelection, setText, toggleIcon, selectSelections, selectIcons, selectText } from '../store/designSlice';
import { formatPaise } from '../utils/money';

const SINGLE_PANELS = [
  ['material', 'Material'],
  ['size', 'Size'],
  ['font', 'Font'],
  ['color', 'Colour'],
  ['background', 'Background'],
  ['border', 'Border'],
  ['mountType', 'Mount'],
];

function OptionChip({ option, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition ${
        selected ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
      }`}
    >
      {option.meta?.hex && (
        <span className="inline-block h-3.5 w-3.5 rounded-full border border-black/10" style={{ background: option.meta.hex }} />
      )}
      <span>{option.name}</span>
      {option.priceDeltaPaise > 0 && (
        <span className={selected ? 'text-indigo-100' : 'text-gray-400'}>+{formatPaise(option.priceDeltaPaise)}</span>
      )}
    </button>
  );
}

export default function CustomizationPanels({ product }) {
  const dispatch = useDispatch();
  const selections = useSelector(selectSelections);
  const icons = useSelector(selectIcons);
  const text = useSelector(selectText);
  const cfg = product.customizationConfig || {};

  const textValue = (field) => text.find((t) => t.field === field)?.value ?? '';
  const iconSelected = (id) => icons.some((i) => i.optionId === id);

  return (
    <div className="space-y-6">
      {/* Text fields first — they’re what the customer cares about most */}
      {(cfg.textFields || []).length > 0 && (
        <div className="space-y-3">
          {cfg.textFields.map((tf) => (
            <div key={tf.key}>
              <label className="flex items-center justify-between text-sm font-medium text-gray-700">
                <span>
                  {tf.label}
                  {tf.required && <span className="ml-1 text-indigo-500">*</span>}
                </span>
                <span className="text-xs text-gray-400">
                  {textValue(tf.key).length}/{tf.maxLength}
                </span>
              </label>
              <input
                type="text"
                maxLength={tf.maxLength}
                value={textValue(tf.key)}
                onChange={(e) => dispatch(setText({ field: tf.key, value: e.target.value }))}
                placeholder={tf.label}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          ))}
        </div>
      )}

      {/* Single-select option panels */}
      {SINGLE_PANELS.map(([panel, label]) => {
        const p = cfg[panel];
        if (!p?.enabled || !p.options?.length) return null;
        const selectedId = selections[panel]?.optionId;
        return (
          <div key={panel}>
            <h4 className="mb-2 text-sm font-semibold text-gray-900">
              {label}
              {p.required && <span className="ml-1 text-indigo-500">*</span>}
            </h4>
            <div className="flex flex-wrap gap-2">
              {p.options.map((opt) => (
                <OptionChip
                  key={opt._id}
                  option={opt}
                  selected={selectedId === opt._id}
                  onClick={() => dispatch(setSelection({ panel, option: opt }))}
                />
              ))}
            </div>
          </div>
        );
      })}

      {/* Icons (multi-select up to max) */}
      {cfg.icons?.enabled && cfg.icons.options?.length > 0 && (
        <div>
          <h4 className="mb-2 text-sm font-semibold text-gray-900">
            Icons <span className="text-xs font-normal text-gray-400">(up to {cfg.icons.max} — {icons.length} selected)</span>
          </h4>
          <div className="flex flex-wrap gap-2">
            {cfg.icons.options.map((opt) => {
              const sel = iconSelected(opt._id);
              const atMax = !sel && icons.length >= cfg.icons.max;
              return (
                <button
                  key={opt._id}
                  type="button"
                  disabled={atMax}
                  onClick={() => dispatch(toggleIcon({ option: opt, max: cfg.icons.max }))}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition ${
                    sel ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                  } ${atMax ? 'cursor-not-allowed opacity-40' : ''}`}
                >
                  {opt.name}
                  {opt.priceDeltaPaise > 0 && (
                    <span className={sel ? 'text-indigo-100' : 'text-gray-400'}>+{formatPaise(opt.priceDeltaPaise)}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
