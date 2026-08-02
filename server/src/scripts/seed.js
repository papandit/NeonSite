// Seeds a full, testable catalog: 6 categories (with banners) + subcategories,
// options across every collection, ~24 products (with images + ratings across
// categories), and coupons. The "Premium Wooden Name Plate" demo product is kept
// (slug premium-wooden-name-plate) so existing links/tests still work.
//
// Run: npm run seed   (wipes catalog collections; leaves users/orders intact)

import { connectDB, disconnectDB } from '../db/connect.js';
import Category from '../models/Category.js';
import SubCategory from '../models/SubCategory.js';
import Product from '../models/Product.js';
import Coupon from '../models/Coupon.js';
import Banner from '../models/Banner.js';
import {
  Material, Size, Color, Font, Border, Background, MountType, Icon,
} from '../models/options/registry.js';

const r = (rupees) => Math.round(rupees * 100);
const img = (seed, size = 700) => `https://picsum.photos/seed/nukkad-${seed}/${size}/${size}`;

// 6 categories, each with subcategories.
const CATS = [
  { name: 'Wooden Name Plates', subs: ['Premium Wooden', 'Rustic Wood', 'Engraved Wood'] },
  { name: 'Acrylic & LED', subs: ['LED Backlit', 'Frosted Acrylic'] },
  { name: 'Metal & Steel', subs: ['Brass', 'Stainless Steel'] },
  { name: 'Resin Art', subs: ['Ocean Resin', 'Floral Resin'] },
  { name: 'Modern & Minimal', subs: ['Geometric', 'Typographic'] },
  { name: 'Office & Professional', subs: ['Door Signs', 'Desk Plates'] },
];

// ~24 products: [name, categoryName, subName, priceRupees, rating]
const PRODUCTS = [
  ['Premium Wooden Name Plate', 'Wooden Name Plates', 'Premium Wooden', 1499, 4.8],
  ['Rustic Teak Name Board', 'Wooden Name Plates', 'Rustic Wood', 1799, 4.6],
  ['Engraved Oak Family Sign', 'Wooden Name Plates', 'Engraved Wood', 1999, 4.9],
  ['Classic Walnut Plate', 'Wooden Name Plates', 'Premium Wooden', 1299, 4.4],
  ['Handcrafted Sheesham Board', 'Wooden Name Plates', 'Rustic Wood', 1699, 4.5],

  ['LED Backlit Name Plate', 'Acrylic & LED', 'LED Backlit', 2499, 4.7],
  ['Frosted Acrylic Door Sign', 'Acrylic & LED', 'Frosted Acrylic', 1599, 4.3],
  ['RGB Glow Name Board', 'Acrylic & LED', 'LED Backlit', 2999, 4.9],
  ['Minimal Clear Acrylic', 'Acrylic & LED', 'Frosted Acrylic', 1399, 4.2],

  ['Brass Engraved Plate', 'Metal & Steel', 'Brass', 2799, 4.8],
  ['Stainless Steel Door Plate', 'Metal & Steel', 'Stainless Steel', 2199, 4.5],
  ['Antique Brass Family Sign', 'Metal & Steel', 'Brass', 3299, 4.9],
  ['Matte Steel Nameplate', 'Metal & Steel', 'Stainless Steel', 1899, 4.1],

  ['Ocean Wave Resin Plate', 'Resin Art', 'Ocean Resin', 2599, 4.9],
  ['Floral Resin Name Board', 'Resin Art', 'Floral Resin', 2399, 4.7],
  ['Galaxy Resin Sign', 'Resin Art', 'Ocean Resin', 2899, 4.8],
  ['Amber Bloom Resin Plate', 'Resin Art', 'Floral Resin', 2099, 4.3],

  ['Geometric Modern Plate', 'Modern & Minimal', 'Geometric', 1699, 4.6],
  ['Typographic Name Sign', 'Modern & Minimal', 'Typographic', 1499, 4.4],
  ['Monochrome Minimal Plate', 'Modern & Minimal', 'Geometric', 1599, 4.5],
  ['Bold Line Nameplate', 'Modern & Minimal', 'Typographic', 1799, 4.2],

  ['Executive Desk Plate', 'Office & Professional', 'Desk Plates', 1299, 4.7],
  ['Glass Office Door Sign', 'Office & Professional', 'Door Signs', 2299, 4.8],
  ['Professional Brass Desk Name', 'Office & Professional', 'Desk Plates', 2599, 4.6],
  ['Cabin Door Name Plate', 'Office & Professional', 'Door Signs', 1399, 4.3],
];

async function run() {
  await connectDB();

  // This seed is DESTRUCTIVE: it wipes the catalogue and rebuilds it from the
  // placeholder list above (picsum photos, invented products). That is fine on
  // a fresh machine and disastrous on a store with real products, so it only
  // runs when you ask for it explicitly.
  if (process.env.SEED_DEMO !== '1') {
    const products = await Product.countDocuments();
    console.log(
      `Refusing to run: this wipes the catalogue (${products} products) and replaces it with demo data.\n` +
      'Set SEED_DEMO=1 to confirm you want that.',
    );
    await disconnectDB();
    process.exit(0);
  }

  console.log('🧹  Clearing catalog collections…');
  await Promise.all([
    Category.deleteMany({}), SubCategory.deleteMany({}), Product.deleteMany({}), Coupon.deleteMany({}), Banner.deleteMany({}),
    Material.deleteMany({}), Size.deleteMany({}), Color.deleteMany({}), Font.deleteMany({}),
    Border.deleteMany({}), Background.deleteMany({}), MountType.deleteMany({}), Icon.deleteMany({}),
  ]);

  // --- Categories + subcategories ---
  const catByName = {};
  const subByKey = {}; // `${catName}::${subName}` -> doc
  for (let i = 0; i < CATS.length; i += 1) {
    const c = CATS[i];
    const cat = await Category.create({ name: c.name, sortOrder: i + 1, banner: img(`cat-${i}`, 600) });
    catByName[c.name] = cat;
    for (let j = 0; j < c.subs.length; j += 1) {
      const sub = await SubCategory.create({ name: c.subs[j], category: cat._id, sortOrder: j + 1, banner: img(`sub-${i}-${j}`, 600) });
      subByKey[`${c.name}::${c.subs[j]}`] = sub;
    }
  }

  // --- Options ---
  const materials = await Material.create([
    { name: 'Wood', priceDeltaPaise: r(300) },
    { name: 'Acrylic', priceDeltaPaise: r(200) },
    { name: 'Brass', priceDeltaPaise: r(800) },
    { name: 'Steel', priceDeltaPaise: r(600) },
    { name: 'Resin', priceDeltaPaise: r(500) },
  ]);
  const sizes = await Size.create([
    { name: '10 x 6 in', priceDeltaPaise: r(0), meta: { widthMm: 254, heightMm: 152 } },
    { name: '12 x 8 in', priceDeltaPaise: r(200), meta: { widthMm: 305, heightMm: 203 } },
    { name: '18 x 12 in', priceDeltaPaise: r(500), meta: { widthMm: 457, heightMm: 305 } },
    { name: '24 x 18 in', priceDeltaPaise: r(1200), meta: { widthMm: 610, heightMm: 457 } },
  ]);
  const colors = await Color.create([
    { name: 'Golden', priceDeltaPaise: r(250), meta: { hex: '#C8A04D' } },
    { name: 'Silver', priceDeltaPaise: r(250), meta: { hex: '#C0C0C0' } },
    { name: 'Black', priceDeltaPaise: r(0), meta: { hex: '#1A1A1A' } },
    { name: 'Walnut', priceDeltaPaise: r(0), meta: { hex: '#5C4033' } },
    { name: 'Saffron', priceDeltaPaise: r(100), meta: { hex: '#D4541F' } },
    { name: 'Ivory', priceDeltaPaise: r(0), meta: { hex: '#F4ECE1' } },
  ]);
  const fonts = await Font.create([
    { name: 'Playfair Display', meta: { family: 'Playfair Display', fileUrl: '', format: '' } },
    { name: 'Fraunces', meta: { family: 'Fraunces', fileUrl: '', format: '' } },
    { name: 'Nunito', meta: { family: 'Nunito', fileUrl: '', format: '' } },
    { name: 'Great Vibes', priceDeltaPaise: r(100), meta: { family: 'Great Vibes', fileUrl: '', format: '' } },
  ]);
  const borders = await Border.create([
    { name: 'None', priceDeltaPaise: r(0) },
    { name: 'Classic', priceDeltaPaise: r(150) },
    { name: 'Luxury', priceDeltaPaise: r(300) },
  ]);
  const backgrounds = await Background.create([
    { name: 'Plain', priceDeltaPaise: r(0), meta: { type: 'color', value: '#FFFFFF' } },
    { name: 'Walnut Texture', priceDeltaPaise: r(0), meta: { type: 'texture', value: '' } },
    { name: 'Marble', priceDeltaPaise: r(200), meta: { type: 'texture', value: '' } },
    { name: 'Parchment', priceDeltaPaise: r(0), meta: { type: 'color', value: '#F4ECE1' } },
  ]);
  const mounts = await MountType.create([
    { name: 'Wall Mount', priceDeltaPaise: r(0) },
    { name: 'Table Stand', priceDeltaPaise: r(150) },
    { name: 'Adhesive', priceDeltaPaise: r(50) },
  ]);
  const icons = await Icon.create([
    { name: 'Ganesh', priceDeltaPaise: r(150), meta: { group: 'Religious', svgUrl: '' } },
    { name: 'Om', priceDeltaPaise: r(100), meta: { group: 'Religious', svgUrl: '' } },
    { name: 'Family', priceDeltaPaise: r(100), meta: { group: 'Family', svgUrl: '' } },
    { name: 'Star', priceDeltaPaise: r(50), meta: { group: 'Nature', svgUrl: '' } },
    { name: 'Leaf', priceDeltaPaise: r(50), meta: { group: 'Nature', svgUrl: '' } },
  ]);

  const ids = (docs) => docs.map((d) => d._id);
  const stdConfig = {
    material: { enabled: true, required: true, options: ids(materials) },
    size: { enabled: true, required: true, options: ids(sizes) },
    font: { enabled: true, required: false, options: ids(fonts) },
    color: { enabled: true, required: false, options: ids(colors) },
    background: { enabled: true, required: false, options: ids(backgrounds) },
    border: { enabled: true, required: false, options: ids(borders) },
    mountType: { enabled: true, required: false, options: ids(mounts) },
    icons: { enabled: true, required: false, options: ids(icons), max: 2 },
    textFields: [
      { key: 'familyName', label: 'Family Name', required: true, maxLength: 24 },
      { key: 'subtitle', label: 'Subtitle', required: false, maxLength: 40 },
    ],
  };

  // --- Products ---
  let count = 0;
  for (let i = 0; i < PRODUCTS.length; i += 1) {
    const [name, catName, subName, price, rating] = PRODUCTS[i];
    await Product.create({
      name,
      category: catByName[catName]._id,
      subCategory: subByKey[`${catName}::${subName}`]?._id,
      description: `${name} — a handcrafted, fully customizable piece. Choose material, size, font, colour, border, background, mount and up to two icons.`,
      images: [img(`prod-${i}`), img(`prod-${i}-b`)],
      basePricePaise: r(price),
      rating,
      status: 'active',
      customizationConfig: stdConfig,
    });
    count += 1;
  }

  // --- Coupons ---
  await Coupon.create([
    { code: 'WELCOME10', type: 'percentage', percent: 10, maxDiscountPaise: r(300), minSubtotalPaise: r(500), status: 'active' },
    { code: 'FLAT200', type: 'flat', valuePaise: r(200), minSubtotalPaise: r(1500), status: 'active' },
    { code: 'FESTIVE15', type: 'percentage', percent: 15, maxDiscountPaise: r(500), minSubtotalPaise: r(2000), status: 'active' },
  ]);

  // --- Home hero banners (editable in Admin -> Banners) ---
  await Banner.create([
    { title: 'Handcrafted name plates, designed by you', link: '/products', placement: 'home_hero', sortOrder: 1, status: 'active', imageUrl: 'https://picsum.photos/seed/nukkad-hero-1/1600/500' },
    { title: 'Festive collection — up to 15% off', link: '/products?sort=rating', placement: 'home_hero', sortOrder: 2, status: 'active', imageUrl: 'https://picsum.photos/seed/nukkad-hero-2/1600/500' },
    { title: 'New: Resin & LED name boards', link: '/products', placement: 'home_hero', sortOrder: 3, status: 'active', imageUrl: 'https://picsum.photos/seed/nukkad-hero-3/1600/500' },
  ]);

  console.log('\n✅  Seed complete:');
  console.log(`   Categories:    ${await Category.countDocuments()} (with subcategories: ${await SubCategory.countDocuments()})`);
  console.log(`   Products:      ${count}`);
  console.log(`   Options:       materials ${materials.length}, sizes ${sizes.length}, colors ${colors.length}, fonts ${fonts.length}, borders ${borders.length}, backgrounds ${backgrounds.length}, mounts ${mounts.length}, icons ${icons.length}`);
  console.log(`   Coupons:       WELCOME10, FLAT200, FESTIVE15`);

  await disconnectDB();
  process.exit(0);
}

run().catch((err) => {
  console.error('❌  Seed failed:', err);
  process.exit(1);
});
