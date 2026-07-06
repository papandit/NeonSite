import { useNavigate, useParams, Link } from 'react-router-dom';
import Seo from '../components/Seo';
import { useSiteSettings } from '../context/SiteSettings';

// Full content for the footer Quick Links — each a proper, detailed page.
const CONTENT = {
  'about-us': {
    title: 'About Us',
    intro:
      'OWM NameCraft Ecom is a made-to-order name-plate studio by Onewebmart. We blend old-world craftsmanship with a modern, live design experience so every plate that leaves our workshop is genuinely one of a kind.',
    sections: [
      { heading: 'Our story', body: [
        'What began as a small workshop crafting wooden door signs has grown into a full customization studio. We noticed customers wanted more than a name on a board — they wanted to see and shape the final piece before it was ever made.',
        'So we built a live editor: choose your material, size, font, colour, background, border, mount and icons, and watch the price and preview update instantly. No surprises, no guesswork.',
      ] },
      { heading: 'What we make', body: [
        'Handcrafted name plates in wood, brass, stainless steel, acrylic, LED and resin — for homes, apartments, offices, cabins and gifting.',
        'Every order is produced to your exact approved design and finished by hand before dispatch.',
      ] },
      { heading: 'Why customers choose us', body: [
        'Live design preview, server-accurate pricing, a human design-review step before manufacturing, and pan-India delivery with tracking.',
      ] },
    ],
  },
  'about-product': {
    title: 'About Our Products',
    intro:
      'Each NameCraft plate is a customizable, made-to-order product. You control every element — and we craft it to last.',
    sections: [
      { heading: 'Materials', body: [
        'Wood (teak, oak, walnut, sheesham), brass, stainless steel, acrylic, LED-backlit acrylic and resin. Each material has its own character, finish and price.',
      ] },
      { heading: 'What you can customize', body: [
        'Your name and a subtitle, material, size (from compact to large), font, colour, background, border style, mount type (wall, stand or adhesive), and up to a couple of decorative icons.',
        'The live editor shows a preview as you go; the final print file is regenerated at high resolution server-side for manufacturing.',
      ] },
      { heading: 'Quality & care', body: [
        'Weather-considered finishes for outdoor use, sturdy mounts, and hand-inspection before packing. Wipe with a soft, dry cloth to keep your plate looking its best.',
      ] },
    ],
  },
  'privacy-policy': {
    title: 'Privacy Policy',
    intro:
      'Your privacy matters. This policy explains what we collect, why, and the choices you have.',
    sections: [
      { heading: 'Information we collect', body: [
        'Account details (name, email), order details (shipping address, phone), and your design choices. We collect only what is needed to create and deliver your order.',
      ] },
      { heading: 'How we use it', body: [
        'To process and deliver orders, provide customer support, send order and status updates, and improve our products and service.',
      ] },
      { heading: 'Payments', body: [
        'Payments are processed securely by Razorpay. We do not see or store your full card, UPI or netbanking credentials on our servers.',
      ] },
      { heading: 'Sharing', body: [
        'We share data only with service providers who help us operate (payment, shipping, email) and only as needed. We never sell your personal data.',
      ] },
      { heading: 'Your rights', body: [
        'You may request access to, correction of, or deletion of your personal data by contacting support@namecraft.local.',
      ] },
    ],
  },
  'refund-and-return-policy': {
    title: 'Refund and Return Policy',
    intro:
      'Because every plate is personalised and made to order, our return policy is specific — please read it before ordering.',
    sections: [
      { heading: 'Eligibility', body: [
        'We accept returns or replacements only for manufacturing defects or items damaged in transit. Personalised items cannot be returned for change of mind, spelling entered incorrectly, or colour perception on screen.',
      ] },
      { heading: 'How to request', body: [
        'Contact us within 7 days of delivery at support@namecraft.local with your order number and clear photos of the issue.',
      ] },
      { heading: 'Resolution', body: [
        'Approved cases receive a free replacement or a full refund to the original payment method. Refunds are typically processed within 5–7 business days after approval.',
      ] },
      { heading: 'Cancellations', body: [
        'Orders can be cancelled before they enter the manufacturing stage. Once production begins, cancellation may not be possible as the item is unique to you.',
      ] },
    ],
  },
  'shipping-and-delivery': {
    title: 'Shipping and Delivery',
    intro: 'Made-to-order, shipped with care and tracking across India.',
    sections: [
      { heading: 'Processing time', body: [
        'Custom plates are produced to order and usually ready to ship in 5–7 business days after your design is approved.',
      ] },
      { heading: 'Shipping charges', body: [
        'A flat shipping fee applies to most orders, and shipping is FREE on orders above ₹2000. The exact amount is shown at checkout.',
      ] },
      { heading: 'Tracking & delivery', body: [
        'Every order ships with a tracking number. Delivery timelines vary by location, typically 2–6 days after dispatch.',
      ] },
      { heading: 'Delays', body: [
        'Festive seasons, remote pincodes or courier disruptions can occasionally add a day or two. We will keep you updated by email.',
      ] },
    ],
  },
  'terms-of-service': {
    title: 'Terms of Service Agreement',
    intro:
      'By using this website and placing an order, you agree to the following terms.',
    sections: [
      { heading: 'Orders & approval', body: [
        'The design you approve at checkout is final for production. Please review your spelling, options and preview carefully before paying.',
      ] },
      { heading: 'Pricing', body: [
        'All prices are in INR and computed server-side; the price shown at checkout is authoritative. We may update prices, options and availability at any time.',
      ] },
      { heading: 'Intellectual property', body: [
        'Site content, designs and branding belong to Onewebmart. You retain rights to the personal text you provide for your plate.',
      ] },
      { heading: 'Liability', body: [
        'We are not liable for indirect or consequential losses. Our maximum liability for any order is limited to the amount paid for that order.',
      ] },
      { heading: 'Governing law', body: [
        'These terms are governed by the laws of India, with jurisdiction in Gujarat.',
      ] },
    ],
  },
  'contact-us': {
    title: 'Contact Us',
    intro:
      'Questions about an order, a bulk enquiry, or a custom idea? We would love to help.',
    sections: [
      { heading: 'Reach us', body: [
        'Email: support@namecraft.local',
        'Phone/WhatsApp: +91-00000-00000',
        'Hours: Mon–Sat, 10:00–18:00 IST',
      ] },
      { heading: 'Bulk & corporate', body: [
        'Planning name plates for an office, event or gifting? Email us with quantities and we will share custom pricing.',
      ] },
      { heading: 'Response time', body: [
        'We usually reply within one business day.',
      ] },
    ],
  },
};

function humanize(slug) {
  return (slug || '').split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// An admin-authored page stores plain text; blank lines separate paragraphs.
// Turn it into the same { title, intro, sections[] } shape the renderer expects.
function fromAdminPage(slug, p) {
  const paras = (p.body || '').split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);
  return {
    title: p.title || humanize(slug),
    intro: p.intro || '',
    sections: paras.length ? [{ heading: '', body: paras }] : [],
  };
}

export default function InfoPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { settings } = useSiteSettings();

  // Admin override (Settings › Site content › Pages) wins; else the built-in
  // rich page; else a graceful "coming soon" stub.
  const override = settings.content?.pages?.[slug];
  const page = override
    ? fromAdminPage(slug, override)
    : CONTENT[slug] || { title: humanize(slug), intro: 'Content coming soon.', sections: [] };

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Seo title={page.title} description={page.intro} path={`/p/${slug}`} />

      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
        Back
      </button>

      <h1 className="font-display text-3xl font-medium text-gray-900 sm:text-4xl">{page.title}</h1>
      {page.intro && <p className="mt-4 text-lg leading-relaxed text-gray-600">{page.intro}</p>}

      <div className="mt-8 space-y-8">
        {page.sections.map((s, i) => (
          <section key={i}>
            {s.heading && <h2 className="font-display text-xl font-medium text-gray-900">{s.heading}</h2>}
            <div className="mt-2 space-y-2 text-gray-600">
              {s.body.map((p, j) => (
                <p key={j} className="leading-relaxed">{p}</p>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-12 border-t border-gray-200 pt-6">
        <Link to="/products" className="rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">
          Browse products
        </Link>
      </div>
    </div>
  );
}
