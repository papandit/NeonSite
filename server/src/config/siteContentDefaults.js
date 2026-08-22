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
  // Deliberately mixed lengths — the wall is a masonry, and six quotes of
  // identical length just look like a plain grid.
  testimonials: [
    { name: 'Aarti S.', rating: 5, source: 'Google Review', date: 'Jul 2026', quote: 'The wooden plate looks stunning on our door. Exactly like the preview!' },
    { name: 'Rahul M.', rating: 5, source: 'Google Review', date: 'Jul 2026', quote: 'This was my second time ordering, and once again they did an amazing job. They made a beautiful nameplate for my parents, and the quality and finish are outstanding. What I appreciated most was how patient and helpful the team was throughout the process — they guided me through every decision from the design to the colours and fonts, and made sure I was completely happy with the final choice before anything went to production. Great quality, excellent service, and a team that genuinely cares.' },
    { name: 'Priya K.', rating: 5, source: 'Google Review', date: 'Jun 2026', quote: 'Premium quality and fast delivery. Highly recommend.' },
    { name: 'Imran Q.', rating: 5, source: 'Google Review', date: 'Jun 2026', quote: 'Ordered a brass plate for our office cabin — looks so professional. The engraving is crisp and it has held up perfectly through a monsoon.' },
    { name: 'Sneha D.', rating: 5, source: 'Google Review', date: 'Jun 2026', quote: 'The resin ocean design is gorgeous. Everyone asks where I got it.' },
    { name: 'Vikram N.', rating: 5, source: 'Google Review', date: 'May 2026', quote: 'Simple to customise and the finish is top-notch. Will order again.' },
    { name: 'Anirudh D.', rating: 5, source: 'Google Review', date: 'May 2026', quote: 'I ordered the wooden nameplate and honestly the photos do not do it justice. The wood finish, the craftsmanship and the intricate detailing are beautiful, and the final product looks even better than the pictures. It has added a warm and elegant touch to the entrance of our home.' },
    { name: 'Disha V.', rating: 5, source: 'Google Review', date: 'May 2026', quote: 'I absolutely loved the frames. The quality is up to the mark. Packaging was appropriate as well. Would love to order more stuff from them!' },
    { name: 'Aditya G.', rating: 5, source: 'Google Review', date: 'Apr 2026', quote: '10/10 recommend. Amazing service and the same plan has come out beautifully! I reached out to them on WhatsApp and they were super quick to reply and the order forward. They shared cut, time and colour options just which I finalised. My pen name was also on the board — they were so nice to share some more options from their end with some added that will make it more personalised. Absolutely loved the name plate, very good quality and exactly what I pictured.' },
    { name: 'Meera S.', rating: 5, source: 'Google Review', date: 'Apr 2026', quote: 'Thank you so much for creating such a stunning and eye-catching board for us! The design is superb and the product quality is outstanding. The team was highly professional, extremely responsive, and provided excellent customer service. Keep up the great work, and all the best to your team.' },
    { name: 'Kavya R.', rating: 5, source: 'Google Review', date: 'Apr 2026', quote: 'Loved the name plate. The process is also good.' },
    { name: 'Nikhil P.', rating: 5, source: 'Google Review', date: 'Mar 2026', quote: 'Our two-year-long search for the perfect nameplate ended here. We got the nameplate made to our daughter’s handwriting — the service was great. The team helped with the quick designing and multiple revisions. The quality is so good. Highly recommend them by the way if you are looking for something special and unique for your home.' },
    { name: 'Jaya A.', rating: 5, source: 'Google Review', date: 'Mar 2026', quote: 'Very beautiful and aesthetic name plate, with beautiful finishing — everyone liked it and will buy more products.' },
    { name: 'Sonia S.', rating: 5, source: 'Google Review', date: 'Mar 2026', quote: 'I bought a wall art and a nameplate from them. Initially I was a little nervous because I was purchasing through an Instagram advertisement, but the team stayed in constant touch with me throughout the process. They patiently addressed all my queries and concerns, and reassured me about the quality of the products. When I received both the items, I was extremely happy. The wall art and the nameplate look absolutely beautiful. The quality, craftsmanship and finishing are excellent.' },
    { name: 'Yash P.', rating: 5, source: 'Google Review', date: 'Feb 2026', quote: 'Loved the product 😍' },
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
  // The dark scrolling ribbon of promises on the home page. `icon` is one of
  // delivery | warranty | rating | quality | value | install.
  marquee: [
    { icon: 'delivery', label: '100% Timely Delivery' },
    { icon: 'warranty', label: '2 Year Warranty' },
    { icon: 'rating', label: '4.8 Rating by 20K+ Customers' },
    { icon: 'quality', label: 'Top-Notch Quality' },
    { icon: 'value', label: 'Value for Money' },
    { icon: 'install', label: '2 Mins Installation' },
  ],
  // "Join our community on Instagram" — a strip of vertical clips/photos on the
  // home page. Up to 15 tiles; only the ones with media render, so a half-full
  // list never leaves gaps. `link` opens the reel.
  // Customer videos on the home page. The key is still `instagram` because
  // that is what is already stored in every Settings document; the section
  // itself is admin-uploaded clips, since an Instagram embed cannot autoplay.
  instagram: {
    heading: 'Happy customers',
    followers: 'Real walls, real installs — filmed by the people who ordered them.',
    profileUrl: '',
    items: [],
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
  // The footer's Quick Links pages. Kept here, not in the customer bundle,
  // so the admin editor can load the live text and edit it — an editor that
  // starts empty means retyping the whole policy to change one line.
  // `body`: blank line = new paragraph, a line starting '## ' = a heading.
  pages: {
    "about-us": {
      title: "About Us",
      intro: "Daxon is a venture and brand under the mother company Dax Signs, founded in 2006. Daxon has over 20 years of experience in the manufacturing industry.",
      body: "## Who we are\n\nWith a setup of 19 machines and 10,500 sq. ft of working space, we have built a strong reputation over the years for high-quality, customized and prefixed products of all kinds and sizes.\n\nDaxon is an e-commerce venture which intends to deliver creative and artistic home décor products. We offer high-quality, premium and affordable pieces of art in the form of neon signs, name plates and various other home decor products.\n\nOur professional and highly creative team designs, researches, explores and manufactures high-quality, affordable products to make your home and life more beautiful — bringing positive vibes, serenity and blissfulness to your doorstep.\n\n## Made in India\n\nAll our products are made in India by our own Indian craftsmen and artisans, with a great deal of love and passion. Your trust, love and support inspire us in creating these works of art at Daxon.\n\nWe look forward to making your online orders as easy as possible, and our team will ensure delivery right to your doorstep.\n\n## Our vision\n\nTo be a leading manufacturer of innovative and impactful artefacts that enhance our brand identity with exceptional design and quality.\n\n## Our mission\n\nTo deliver top-notch, tailor-made artefacts that exceed our clients’ expectations by combining cutting-edge technology, skilled craftsmanship and unparalleled customer service. We aim to empower businesses to stand out and leave a lasting impression with every product we create.\n\n## Clients served\n\nWe are proud to have served over 5,000 clients across a wide range of industries — from retail to corporate and hospitality — continuously building lasting partnerships through trust, quality and innovation.",
    },
    "about-product": {
      title: "About Our Products",
      intro: "Each NameCraft plate is a customizable, made-to-order product. You control every element — and we craft it to last.",
      body: "## Materials\n\nWood (teak, oak, walnut, sheesham), brass, stainless steel, acrylic, LED-backlit acrylic and resin. Each material has its own character, finish and price.\n\n## What you can customize\n\nYour name and a subtitle, material, size (from compact to large), font, colour, background, border style, mount type (wall, stand or adhesive), and up to a couple of decorative icons.\n\nThe live editor shows a preview as you go; the final print file is regenerated at high resolution server-side for manufacturing.\n\n## Quality & care\n\nWeather-considered finishes for outdoor use, sturdy mounts, and hand-inspection before packing. Wipe with a soft, dry cloth to keep your plate looking its best.",
    },
    "privacy-policy": {
      title: "Privacy Policy",
      intro: "Your privacy matters. This policy explains what we collect, why, and the choices you have.",
      body: "## Information we collect\n\nAccount details (name, email), order details (shipping address, phone), and your design choices. We collect only what is needed to create and deliver your order.\n\n## How we use it\n\nTo process and deliver orders, provide customer support, send order and status updates, and improve our products and service.\n\n## Payments\n\nPayments are processed securely by Razorpay. We do not see or store your full card, UPI or netbanking credentials on our servers.\n\n## Sharing\n\nWe share data only with service providers who help us operate (payment, shipping, email) and only as needed. We never sell your personal data.\n\n## Your rights\n\nYou may request access to, correction of, or deletion of your personal data by contacting support@namecraft.local.",
    },
    "refund-and-return-policy": {
      title: "Refund and Return Policy",
      intro: "Because every plate is personalised and made to order, our return policy is specific — please read it before ordering.",
      body: "## Eligibility\n\nWe accept returns or replacements only for manufacturing defects or items damaged in transit. Personalised items cannot be returned for change of mind, spelling entered incorrectly, or colour perception on screen.\n\n## How to request\n\nContact us within 7 days of delivery at support@namecraft.local with your order number and clear photos of the issue.\n\n## Resolution\n\nApproved cases receive a free replacement or a full refund to the original payment method. Refunds are typically processed within 5–7 business days after approval.\n\n## Cancellations\n\nOrders can be cancelled before they enter the manufacturing stage. Once production begins, cancellation may not be possible as the item is unique to you.",
    },
    "shipping-and-delivery": {
      title: "Shipping and Delivery",
      intro: "Made-to-order, shipped with care and tracking across India.",
      body: "## Processing time\n\nCustom plates are produced to order and usually ready to ship in 5–7 business days after your design is approved.\n\n## Shipping charges\n\nA flat shipping fee applies to most orders, and shipping is FREE on orders above ₹2000. The exact amount is shown at checkout.\n\n## Tracking & delivery\n\nEvery order ships with a tracking number. Delivery timelines vary by location, typically 2–6 days after dispatch.\n\n## Delays\n\nFestive seasons, remote pincodes or courier disruptions can occasionally add a day or two. We will keep you updated by email.",
    },
    "terms-of-service": {
      title: "Terms of Service Agreement",
      intro: "By using this website and placing an order, you agree to the following terms.",
      body: "## Orders & approval\n\nThe design you approve at checkout is final for production. Please review your spelling, options and preview carefully before paying.\n\n## Pricing\n\nAll prices are in INR and computed server-side; the price shown at checkout is authoritative. We may update prices, options and availability at any time.\n\n## Intellectual property\n\nSite content, designs and branding belong to Daxon. You retain rights to the personal text you provide for your plate.\n\n## Liability\n\nWe are not liable for indirect or consequential losses. Our maximum liability for any order is limited to the amount paid for that order.\n\n## Governing law\n\nThese terms are governed by the laws of India, with jurisdiction in Gujarat.",
    },
    "contact-us": {
      title: "Contact Us",
      intro: "Questions about an order, a bulk enquiry, or a custom idea? We would love to help.",
      body: "## Reach us\n\nEmail: support@namecraft.local\n\nPhone/WhatsApp: +91-00000-00000\n\nHours: Mon–Sat, 10:00–18:00 IST\n\n## Bulk & corporate\n\nPlanning name plates for an office, event or gifting? Email us with quantities and we will share custom pricing.\n\n## Response time\n\nWe usually reply within one business day.",
    },
  },
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
    marquee: Array.isArray(s.marquee) ? s.marquee : d.marquee,
    instagram: { ...d.instagram, ...(s.instagram || {}) },
    promo: { ...d.promo, ...(s.promo || {}) },
    newsletter: { ...d.newsletter, ...(s.newsletter || {}) },
    footer: { ...d.footer, ...(s.footer || {}) },
    // Merged per slug, not wholesale: the editor sends only the pages it is
    // holding, and a wholesale replace would drop every page it did not send.
    pages: { ...d.pages, ...(s.pages && typeof s.pages === 'object' ? s.pages : {}) },
  };
}
