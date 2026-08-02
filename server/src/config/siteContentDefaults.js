// Default storefront content. This is the single source of truth for every
// piece of copy the customer site shows that isn't a product/category. The admin
// can override any of it (Settings.content); the public /api/settings endpoint
// merges the stored overrides over these defaults so a missing key never blanks
// out the site. Keep the shape in sync with the customer SiteSettings context.

export const DEFAULT_SITE_CONTENT = {
  hero: {
    heading: 'Custom name plates, designed by you',
    subheading:
      'Personalize material, size, font, colour and icons in a live editor — then we craft your exact design and deliver it.',
    ctaText: 'Start designing',
  },
  features: [
    { icon: '✍️', title: 'Made to order', desc: 'Every plate is handcrafted just for you.' },
    { icon: '🚚', title: 'Free shipping over ₹2000', desc: 'Fast, tracked delivery across India.' },
    { icon: '🎨', title: 'Live design preview', desc: 'See exactly what you get before you buy.' },
    { icon: '🔒', title: 'Secure checkout', desc: 'Razorpay-protected payments, always.' },
  ],
  howItWorks: [
    { step: '1', title: 'Pick a design', desc: 'Choose a name plate and open the live customizer.' },
    { step: '2', title: 'Make it yours', desc: 'Set material, size, font, colour, icons and your text.' },
    { step: '3', title: 'We craft & ship', desc: 'We produce your exact design and deliver it to your door.' },
  ],
  testimonials: [
    { name: 'Aarti S.', quote: 'The wooden plate looks stunning on our door. Exactly like the preview!' },
    { name: 'Rahul M.', quote: 'Loved the live editor — I could see my name in different fonts instantly.' },
    { name: 'Priya K.', quote: 'Premium quality and fast delivery. Highly recommend.' },
    { name: 'Imran Q.', quote: 'Ordered a brass plate for our office cabin — looks so professional.' },
    { name: 'Sneha D.', quote: 'The resin ocean design is gorgeous. Everyone asks where I got it.' },
    { name: 'Vikram N.', quote: 'Simple to customise and the finish is top-notch. Will order again.' },
  ],
  faqs: [
    { q: 'How long does delivery take?', a: 'Custom plates are made to order and typically ship in 5–7 business days.' },
    { q: 'Can I change my design after ordering?', a: 'Yes — there is a design review step before manufacturing where you approve the final artwork.' },
    { q: 'What materials are available?', a: 'Wood, acrylic, brass, steel and resin, with new options added regularly.' },
    { q: 'How do I customize my name plate?', a: 'Open any product and use the live editor to set material, size, font, colour, border, background, mount and icons — the price updates instantly.' },
    { q: 'Can I buy a plate without customizing?', a: 'Yes. Every product has an "Add to cart (as-is)" option that uses sensible defaults, or you can personalize it fully.' },
    { q: 'Do you offer bulk or corporate orders?', a: 'Absolutely — reach out via the support email for office and bulk pricing.' },
    { q: 'Do you ship across India?', a: 'Yes, we deliver pan-India with tracking. Shipping is free on orders over ₹2000.' },
    { q: 'What is your return policy?', a: 'Because each plate is personalised, we replace items only for manufacturing defects or shipping damage.' },
  ],
  // "How it's made" video section on the home page. `url` can be a hosted MP4 or
  // the bundled /neon-studio.mp4. Blank url hides the section.
  video: {
    heading: 'How to create your neon craft',
    subheading: 'A quick look at building your own custom neon — pick your text, font, colour and size, and we bring it to life.',
    url: '/neon-studio.mp4',
    ctaText: 'Create your neon',
    ctaLink: '/neon',
  },
  videoNameplate: {
    heading: 'How to create your name plate craft',
    subheading: 'See how easy it is to design your own name plate — choose a template, add your text, colour and symbol, and order.',
    url: '/nameplate-studio.mp4',
    ctaText: 'Create your name plate',
    ctaLink: '/nameplates',
  },
  // The long-form section under the Neon Studio customizer. Rendered with a
  // sticky sub-nav; any list left empty simply hides its section.
  neonInfo: {
    about: {
      heading: 'About your neon sign',
      body: 'Handcrafted with advanced 2nd-gen LED on high-quality 6mm transparent acrylic — energy-efficient, durable and easy to install. Twice as bright and 80% more energy-efficient than traditional neon, with adjustable brightness and an optional waterproof finish for outdoors.',
    },
    box: {
      heading: "What's in the box",
      body: 'Your sign ships ready to shine. Each one is mounted on clear acrylic with pre-drilled holes, and the stainless-steel mounting kit is included.',
      items: [
        'Neon sign on acrylic backing',
        'Mounting screw kit',
        '10 ft transparent cable',
        'Power adaptor + brightness controller',
        'Sticker sheet',
      ],
    },
    install: {
      heading: 'How to install',
      steps: [
        { title: 'Mark the spot', desc: 'Use a measuring tape to mark where your sign will sit.' },
        { title: 'Drill the holes', desc: 'Safely drill small holes on the wall at your marks.' },
        { title: 'Mount the sign', desc: 'Fix it in place with the stainless-steel mounting screws.' },
        { title: 'Power it up', desc: 'Connect the adaptor to the transparent cable — and glow.' },
      ],
    },
    compare: {
      heading: 'Go For the best!',
      usLabel: 'Us',
      themLabel: 'Them',
      rows: [
        'Top notch quality with flawless finishing',
        'Premium craftsmanship',
        'Easy repair or replacement, covered by a 2 year warranty',
        'IP67 technology — waterproof add-on for outdoor usage',
        '24/7 customer support',
      ],
    },
    reviews: [
      { name: 'Aditi R.', quote: 'The glow is gorgeous and it arrived beautifully packed. Installed in 20 minutes.' },
      { name: 'Karan M.', quote: 'Exactly like the live preview — the colour is spot on and it feels premium.' },
      { name: 'Neha S.', quote: 'Bought it for our café counter. Customers keep asking where we got it.' },
    ],
    faqs: [
      { q: 'How much does a custom neon sign cost?', a: 'Pricing starts from the Mini size and scales with the size and number of characters — the live estimate updates as you type.' },
      { q: 'How long will delivery take?', a: 'Every sign is handmade to order. Standard orders ship in 10–14 working days; express in 4–6.' },
      { q: 'What size will my sign be?', a: 'The height comes from the size you pick and the length grows with your text — the preview shows the exact measurements.' },
      { q: 'Does the neon sign buzz?', a: 'No. These are LED neon, so they are completely silent.' },
      { q: 'Is it safe for outdoors?', a: 'Ask us for the IP67 waterproof add-on and we will build it weather-ready.' },
      { q: 'Can you turn my logo into a neon sign?', a: 'Yes — send us your logo or artwork and we will share a mockup before production.' },
    ],
  },
  // FloRo is the upgraded RGBIC light line — same page, its own story.
  floroInfo: {
    about: {
      heading: 'About your FloRo sign',
      body: 'FloRo signs are handcrafted with 2nd-gen RGBIC LED on high-quality 6mm transparent acrylic. Set it to any colour, pick from 200+ dynamic flow effects, and control every glow from your phone — energy-efficient, durable and easy to install.',
    },
    box: {
      heading: "What's in the box",
      body: 'Your FloRo sign ships ready to shine, mounted on clear acrylic with pre-drilled holes and a stainless-steel mounting kit.',
      items: [
        'FloRo RGBIC sign on acrylic backing',
        'Mounting screw kit',
        '10 ft transparent cable',
        'Power adaptor + FloRo controller',
        'Sticker sheet',
      ],
    },
    install: {
      heading: 'How to install',
      steps: [
        { title: 'Mark the spot', desc: 'Use a measuring tape to mark where your sign will sit.' },
        { title: 'Drill the holes', desc: 'Safely drill small holes on the wall at your marks.' },
        { title: 'Mount the sign', desc: 'Fix it in place with the stainless-steel mounting screws.' },
        { title: 'Pair the app', desc: 'Connect the controller and set colours and flow effects from your phone.' },
      ],
    },
    compare: {
      heading: 'Glow smarter with FloRo',
      usLabel: 'FloRo',
      themLabel: 'Others',
      rows: [
        'Set it to any colour with RGBIC technology',
        '200+ dynamic flow modes and multi-colour effects',
        'Fully controllable from your smartphone',
        'Top notch quality with flawless finishing',
        'Easy repair or replacement, covered by a 2 year warranty',
        '24/7 customer support',
      ],
    },
    reviews: [
      { name: 'Rhea T.', quote: 'Being able to change the colour from my phone is the best part — every room, a new mood.' },
      { name: 'Sameer J.', quote: 'The flow effects look incredible on video. Worth the upgrade over plain neon.' },
      { name: 'Ananya B.', quote: 'Setup took minutes and the app just worked. Brilliant finish too.' },
    ],
    faqs: [
      { q: 'What is FloRo?', a: 'FloRo is an RGB neon sign made with revolutionary chromatic technology. That means you can now select from a countless range of shades and over 200+ flow modes to enjoy your neon sign in the best manner. That is not all — with FloRo you can even control the speed and brightness of your personalised neon sign, all with your smartphone app remote.' },
      { q: 'What are flow modes?', a: 'Flow modes are the best and most unique feature of FloRo colour-changing neon signs. All your FloRo signs come with over 200+ unique light settings that let you change the dynamics and colour effects of your sign. The colours of your sign, truly flow with FloRo!' },
      { q: 'I have my own design/logo. Can I get it customised into a FloRo neon sign?', a: 'Yes, we can customise your logo or any design into a FloRo RGB neon sign. Reach out to us on WhatsApp with your logo, reference image or design and we will share a virtual mockup of the FloRo neon sign with you.' },
      { q: 'How long will it take to deliver my FloRo neon sign?', a: 'All our unique custom neon signs are handmade after your order is received. That is why it takes around 2-3 weeks to deliver your FloRo to your doorstep. We provide free shipping on all orders, regardless of the total value.' },
      { q: 'Can you do a rush order?', a: 'Yes, we can make your order on priority and send it via express shipping at an additional cost. Since all our custom neon signs are made to order, it takes us around 10-12 days to deliver your rush order. To avail a priority order, you can state your preference during checkout.' },
      { q: 'If I customize a sign using the online neon sign maker, what will be its exact size?', a: 'The size of your customised neon sign depends on the font you choose. Generally the height of our large signs is between 14-16 inches and medium signs are around 11-13 inches. The length of the sign is determined by the number of letters and the font you use. For further details, refer to our size chart.' },
      { q: 'What are the small marks on my sign?', a: 'Since FloRo neon signs are handmade, sometimes there are small marks on the acrylic or glue marks where the PVC tube has been attached to the acrylic. In these rare instances where the marks are evident, they are always minor and invisible when the sign is switched on.' },
      { q: 'Does the neon sign buzz?', a: 'Nope! Bees buzz, FloRo neon signs do not.' },
      { q: 'How do I make sure that I mount my FloRo neon sign in a safe and secure manner?', a: 'Installation is always done best in a small group. Even though the weight of our high-quality neon signs is on the lighter side, we still recommend taking the help of 1 or 2 people so that it does not fall. Please also make sure the neon sign is mounted securely before plugging it in and using it.' },
      { q: 'Can you have quality LED neon signs without the cords?', a: 'FloRo signs come with a slim transparent cable which is required to power the neon sign. A few customers have hidden these by hard-wiring the cable into the wall with the help of an electrician. Please note that you may not be able to use your smart app if the controller is in the wall, because the receiver will not be able to read it.' },
    ],
  },
  // "Glow smarter" comparison shown under both light types.
  compare: {
    heading: 'Glow smarter with FloRo',
    usLabel: 'FloRo',
    themLabel: 'Others',
    rows: [
      'Set it to any colour with RGBIC technology',
      '200+ dynamic flow modes and multi-colour effects',
      'Fully controllable from your smartphone',
      'Top-notch quality with flawless finishing',
      'Easy repair or replacement, covered by a 2 year warranty',
      '24/7 customer support',
    ],
  },
  // Workshop / made-in-India story.
  crafted: {
    heading: '100% Homegrown, Expertly Crafted',
    // Blank line = paragraph break in the rendered panel.
    body: 'All our products are handmade in India with flawless finishing.\n\nThat enables us to create 100% customized signs as per your preference. Just reach out to us and we will take care of it!',
    // Up to 4 photos, laid out as a tilted 2x2 cross collage. These are
    // placeholders from the catalogue — replace with real workshop shots in
    // Admin > Settings > Site content.
    images: ['/crafted/craft-1.jpg', '/crafted/craft-2.jpg', '/crafted/craft-3.jpg', '/crafted/craft-4.jpg'],
  },
  // Closing assurance strip under the "expertly crafted" band. `icon` is one of
  // delivery | guarantee | handcrafted | rated.
  assurance: [
    { icon: 'delivery', title: 'Fast & Free delivery', desc: 'Express shipping available' },
    { icon: 'guarantee', title: 'Satisfaction Guaranteed', desc: '100% customer satisfaction rate' },
    { icon: 'handcrafted', title: 'Handcrafted To Perfection', desc: 'Premium quality neon signs and art' },
    { icon: 'rated', title: 'Rated Excellent', desc: '1500+ five star reviews' },
  ],
  // Story-reel circles + shipping note shown under the buy button on product
  // and name-plate pages. An entry with no image is skipped.
  // Empty on purpose: the reel is built from the catalogue (this product's
  // category, best sellers, most reviewed). Fill this in to override it with
  // campaign imagery instead.
  highlights: [],
  shipping: {
    heading: 'Free Shipping',
    express: 'Express Shipping option available at checkout ( 3-5 Working Days )',
  },
  promo: {
    heading: 'Ready to design yours?',
    subheading: 'Create a one-of-a-kind name plate in minutes — or grab a ready design as-is.',
    ctaText: 'Start designing',
  },
  newsletter: {
    heading: 'Join our list',
    subheading: 'Design ideas, new materials and offers — straight to your inbox.',
  },
  footer: {
    about: 'Handcrafted, personalized name plates and neon signs — designed by you, crafted to order by Daxon.',
    tagline: 'Custom name plates, crafted to order in India 🇮🇳',
  },
  // slug -> { title, intro, body }. `body` is plain text; blank lines separate
  // paragraphs. Empty by default — the customer InfoPage ships rich built-in
  // pages and only uses these when the admin fills one in.
  pages: {},
};

// Shallow-merge stored content over the defaults, deep-merging the singleton
// objects (hero/promo/newsletter/footer) so a partial override keeps its
// sibling defaults. Arrays and `pages` are replaced wholesale when present.
export function mergeSiteContent(stored = {}) {
  const d = DEFAULT_SITE_CONTENT;
  const s = stored || {};
  return {
    hero: { ...d.hero, ...(s.hero || {}) },
    features: Array.isArray(s.features) && s.features.length ? s.features : d.features,
    howItWorks: Array.isArray(s.howItWorks) && s.howItWorks.length ? s.howItWorks : d.howItWorks,
    testimonials: Array.isArray(s.testimonials) && s.testimonials.length ? s.testimonials : d.testimonials,
    faqs: Array.isArray(s.faqs) && s.faqs.length ? s.faqs : d.faqs,
    video: { ...d.video, ...(s.video || {}) },
    videoNameplate: { ...d.videoNameplate, ...(s.videoNameplate || {}) },
    neonInfo: {
      ...d.neonInfo,
      ...(s.neonInfo || {}),
      about: { ...d.neonInfo.about, ...(s.neonInfo?.about || {}) },
      box: { ...d.neonInfo.box, ...(s.neonInfo?.box || {}) },
      install: { ...d.neonInfo.install, ...(s.neonInfo?.install || {}) },
      compare: { ...d.neonInfo.compare, ...(s.neonInfo?.compare || {}) },
    },
    floroInfo: {
      ...d.floroInfo,
      ...(s.floroInfo || {}),
      about: { ...d.floroInfo.about, ...(s.floroInfo?.about || {}) },
      box: { ...d.floroInfo.box, ...(s.floroInfo?.box || {}) },
      install: { ...d.floroInfo.install, ...(s.floroInfo?.install || {}) },
      compare: { ...d.floroInfo.compare, ...(s.floroInfo?.compare || {}) },
    },
    compare: { ...d.compare, ...(s.compare || {}) },
    crafted: { ...d.crafted, ...(s.crafted || {}) },
    assurance: Array.isArray(s.assurance) && s.assurance.length ? s.assurance : d.assurance,
    highlights: Array.isArray(s.highlights) ? s.highlights : d.highlights,
    shipping: { ...d.shipping, ...(s.shipping || {}) },
    promo: { ...d.promo, ...(s.promo || {}) },
    newsletter: { ...d.newsletter, ...(s.newsletter || {}) },
    footer: { ...d.footer, ...(s.footer || {}) },
    pages: s.pages && typeof s.pages === 'object' ? s.pages : d.pages,
  };
}
