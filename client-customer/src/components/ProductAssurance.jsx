// The trust block under a product's buy button: quality badges, the story
// highlight reel, and the order -> ready -> delivered timeline.
//
// The highlight circles and the express-shipping note are admin-editable
// (Site content > highlights / shipping); a highlight with no image is skipped
// and an empty list hides the whole reel.

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const badgeIc = 'h-6 w-6';
const ShieldIcon = () => (
  <svg className={badgeIc} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l7 3v6c0 4.4-3 8-7 9-4-1-7-4.6-7-9V6z" /><path d="M9.5 12l2 2 3.5-3.5" /></svg>
);
const RosetteIcon = () => (
  <svg className={badgeIc} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="9" r="6" /><circle cx="12" cy="9" r="2.6" /><path d="M8.5 14l-1.5 7 5-2.6 5 2.6-1.5-7" /></svg>
);
const SparkIcon = () => (
  <svg className={badgeIc} viewBox="0 0 24 24" fill="currentColor"><path d="M13 2l1.7 4.9L19.5 8.6l-4.8 1.7L13 15.2l-1.7-4.9L6.5 8.6l4.8-1.4z" /><path d="M18.6 14.4l.8 2.3 2.3.8-2.3.8-.8 2.3-.8-2.3-2.3-.8 2.3-.8z" opacity=".65" /></svg>
);
const QUALITY = [
  { label: '2 Year Warranty', icon: <ShieldIcon /> },
  { label: 'Top-Notch Quality', icon: <RosetteIcon /> },
  { label: 'Flawless Finishing', icon: <SparkIcon /> },
];

const stepIc = 'h-6 w-6';
const CartIcon = () => (
  <svg className={stepIc} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 4h2l2.2 10.4a2 2 0 0 0 2 1.6h7.2a2 2 0 0 0 2-1.55L20 8H6" /><circle cx="10" cy="19" r="1.4" /><circle cx="17" cy="19" r="1.4" /></svg>
);
const BagCheckIcon = () => (
  <svg className={stepIc} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 7h14l-1 13H6z" /><path d="M9 7a3 3 0 0 1 6 0" /><path d="M9.5 13.5l2 2 3.5-3.5" /></svg>
);
const DeliveryIcon = () => (
  <svg className={stepIc} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 6h11v10H4z" /><path d="M9.5 9.5l2 2 2.5-2.5" /><path d="M15 10h3l3 3v3h-6z" /><circle cx="8" cy="19" r="1.5" /><circle cx="17.5" cy="19" r="1.5" /></svg>
);

// Order today -> made in 2-4 days -> delivered in 10-12.
const fmt = (d) => d.toLocaleDateString('en-IN', { month: 'short', day: '2-digit' });
function timeline() {
  const day = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d; };
  return [
    { icon: <CartIcon />, title: 'Order Today', when: fmt(day(0)) },
    { icon: <BagCheckIcon />, title: 'Order Ready', when: `${fmt(day(2))} - ${fmt(day(4))}` },
    { icon: <DeliveryIcon />, title: 'Estimated Delivery', when: `${fmt(day(9))} - ${fmt(day(11))}` },
  ];
}

const Tile = ({ children }) => (
  <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">{children}</span>
);

export default function ProductAssurance({ highlights, shipping }) {
  const reel = (highlights || []).filter((h) => h?.image);
  const steps = timeline();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="mt-6 space-y-5"
    >
      {/* Quality badges */}
      <div className="grid grid-cols-3 gap-2 rounded-2xl border border-gray-200 bg-white px-3 py-5 text-center">
        {QUALITY.map((b) => (
          <div key={b.label}>
            <Tile>{b.icon}</Tile>
            <div className="mt-2.5 text-[13px] font-medium leading-snug text-gray-700">{b.label}</div>
          </div>
        ))}
      </div>

      {/* Story reel — gradient-ringed circles, scrolls sideways on small screens */}
      {reel.length > 0 && (
        <div className="-mx-1 flex gap-4 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {reel.map((h, i) => {
            const Wrapper = h.link ? Link : 'div';
            return (
              <Wrapper
                key={i}
                {...(h.link ? { to: h.link } : {})}
                className="w-[86px] shrink-0 text-center sm:w-24"
              >
                <span className="block rounded-full bg-linear-to-tr from-amber-400 via-fuchsia-500 to-indigo-500 p-[3px] transition hover:scale-105">
                  <span className="block rounded-full bg-white p-[2px]">
                    <img src={h.image} alt={h.label || ''} loading="lazy" className="aspect-square w-full rounded-full object-cover" />
                  </span>
                </span>
                <span className="mt-2 block text-[13px] font-semibold text-gray-800">{h.label}</span>
              </Wrapper>
            );
          })}
        </div>
      )}

      {/* Shipping timeline */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <div className="px-4 py-4 text-center">
          <div className="text-lg font-semibold text-gray-900">{shipping?.heading || 'Free Shipping'}</div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {steps.map((s) => (
              <div key={s.title}>
                <Tile>{s.icon}</Tile>
                <div className="mt-2.5 text-[13px] font-semibold leading-snug text-gray-900">{s.title}</div>
                <div className="mt-0.5 text-xs text-gray-500">{s.when}</div>
              </div>
            ))}
          </div>
        </div>
        {shipping?.express && (
          <p className="border-t border-gray-200 bg-indigo-50 px-4 py-2.5 text-center text-[13px] text-indigo-800">
            {shipping.express}
          </p>
        )}
      </div>
    </motion.div>
  );
}
