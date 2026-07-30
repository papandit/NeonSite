// Long-form product content under the Neon Studio customizer: about, what's in
// the box, how to install, reviews and FAQs — with a sticky sub-nav that tracks
// the section you're reading. Every string comes from admin Site content, and a
// section with no content simply doesn't render.

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import NeonBoxDiagram from './NeonBoxDiagram';

const rise = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } } };

function Heading({ children }) {
  return <h2 className="font-display text-2xl font-medium text-emerald-400 sm:text-3xl">{children}</h2>;
}

export default function NeonInfoSections({ info }) {
  const about = info?.about || {};
  const box = info?.box || {};
  const install = info?.install || {};
  const reviews = info?.reviews || [];
  const faqs = info?.faqs || [];

  const sections = useMemo(() => [
    about.body && { id: 'neon-about', label: 'Product details' },
    (box.body || (box.items || []).length) && { id: 'neon-box', label: "What's in the box" },
    (install.steps || []).length && { id: 'neon-install', label: 'How to install' },
    reviews.length && { id: 'neon-reviews', label: 'Reviews' },
    faqs.length && { id: 'neon-faqs', label: 'FAQs' },
  ].filter(Boolean), [about, box, install, reviews, faqs]);

  const [active, setActive] = useState(sections[0]?.id || '');
  const [openFaq, setOpenFaq] = useState(null);
  const rootRef = useRef(null);

  // Highlight the section currently in view.
  useEffect(() => {
    if (!sections.length) return undefined;
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: 0 },
    );
    sections.forEach((s) => { const el = document.getElementById(s.id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, [sections]);

  if (!sections.length) return null;

  const go = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <div ref={rootRef} className="bg-[#0a0a0f] text-slate-300">
      {/* Sticky sub-nav */}
      {/* Sits flush under the 64px site header (h-16), which stays sticky. */}
      <nav className="sticky top-16 z-30 border-b border-white/10 bg-[#111117]/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4 py-2.5 [scrollbar-width:none] sm:justify-center [&::-webkit-scrollbar]:hidden">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => go(s.id)}
              className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition ${
                active === s.id ? 'bg-white text-slate-900' : 'text-slate-400 hover:text-white'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </nav>

      <div className="mx-auto max-w-5xl space-y-16 px-4 py-14">
        {/* About */}
        {about.body && (
          <motion.section id="neon-about" variants={rise} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} className="scroll-mt-32">
            <Heading>{about.heading}</Heading>
            <p className="mt-4 max-w-3xl leading-relaxed text-slate-400">{about.body}</p>
          </motion.section>
        )}

        {/* What's in the box */}
        {(box.body || (box.items || []).length > 0) && (
          <motion.section id="neon-box" variants={rise} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} className="scroll-mt-32">
            <Heading>{box.heading}</Heading>
            {box.body && <p className="mt-4 max-w-3xl leading-relaxed text-slate-400">{box.body}</p>}

            {/* Anatomy diagram — every part that ships, labelled */}
            <div className="mt-6">
              <NeonBoxDiagram />
            </div>

            {(box.items || []).length > 0 && (
              <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {box.items.map((it, i) => (
                  <li key={i} className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-xs text-emerald-400">✓</span>
                    <span className="text-sm text-slate-300">{it}</span>
                  </li>
                ))}
              </ul>
            )}
          </motion.section>
        )}

        {/* How to install */}
        {(install.steps || []).length > 0 && (
          <motion.section id="neon-install" variants={rise} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} className="scroll-mt-32">
            <Heading>{install.heading}</Heading>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {install.steps.map((st, i) => (
                <div key={i} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition hover:border-white/25">
                  {st.image ? (
                    <img src={st.image} alt={st.title} className="h-32 w-full object-cover" />
                  ) : (
                    <div className="flex h-32 items-center justify-center bg-linear-to-br from-indigo-500/20 to-fuchsia-500/10 font-display text-4xl text-white/70">
                      {i + 1}
                    </div>
                  )}
                  <div className="p-4">
                    <div className="text-sm font-semibold text-white">{st.title}</div>
                    {st.desc && <p className="mt-1 text-xs leading-relaxed text-slate-400">{st.desc}</p>}
                  </div>
                </div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Reviews */}
        {reviews.length > 0 && (
          <motion.section id="neon-reviews" variants={rise} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} className="scroll-mt-32">
            <Heading>Happy customers</Heading>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {reviews.map((r, i) => (
                <figure key={i} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <div className="text-amber-400" aria-label="5 out of 5">★★★★★</div>
                  <blockquote className="mt-3 text-sm leading-relaxed text-slate-300">“{r.quote}”</blockquote>
                  <figcaption className="mt-4 flex items-center gap-2 text-xs text-slate-400">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-500/25 font-semibold text-indigo-200">
                      {(r.name || '?').charAt(0).toUpperCase()}
                    </span>
                    {r.name}
                  </figcaption>
                </figure>
              ))}
            </div>
          </motion.section>
        )}

        {/* FAQs */}
        {faqs.length > 0 && (
          <motion.section id="neon-faqs" variants={rise} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.15 }} className="scroll-mt-32">
            <Heading>FAQs</Heading>
            <div className="mt-6 grid gap-x-10 md:grid-cols-2">
              {faqs.map((f, i) => {
                const open = openFaq === i;
                return (
                  <div key={i} className="border-b border-white/10">
                    <button onClick={() => setOpenFaq(open ? null : i)} className="flex w-full items-start justify-between gap-4 py-4 text-left">
                      <span className="text-sm font-medium text-white">{f.q}</span>
                      <span className={`mt-0.5 shrink-0 text-lg text-slate-500 transition-transform ${open ? 'rotate-45' : ''}`}>+</span>
                    </button>
                    <AnimatePresence initial={false}>
                      {open && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }} className="overflow-hidden">
                          <p className="pb-4 text-sm leading-relaxed text-slate-400">{f.a}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </motion.section>
        )}
      </div>
    </div>
  );
}
