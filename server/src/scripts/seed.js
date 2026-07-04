// Seeds a complete, testable catalog: 2 categories, a subcategory, options
// across EVERY collection (real prices in paise), and ONE fully-configured
// demo product ("Premium Wooden Name Plate") that drives all downstream testing.
//
// Run: npm run seed   (wipes catalog collections first; leaves users intact)

import { connectDB, disconnectDB } from '../db/connect.js';
import Category from '../models/Category.js';
import SubCategory from '../models/SubCategory.js';
import Product from '../models/Product.js';
import Coupon from '../models/Coupon.js';
import {
  Material,
  Size,
  Color,
  Font,
  Border,
  Background,
  MountType,
  Icon,
} from '../models/options/registry.js';

const r = (rupees) => Math.round(rupees * 100); // rupees -> integer paise

async function run() {
  await connectDB();

  console.log('🧹  Clearing catalog collections…');
  await Promise.all([
    Category.deleteMany({}),
    SubCategory.deleteMany({}),
    Product.deleteMany({}),
    Coupon.deleteMany({}),
    Material.deleteMany({}),
    Size.deleteMany({}),
    Color.deleteMany({}),
    Font.deleteMany({}),
    Border.deleteMany({}),
    Background.deleteMany({}),
    MountType.deleteMany({}),
    Icon.deleteMany({}),
  ]);

  // --- Categories ---
  const [wooden, ledCat] = await Category.create([
    { name: 'Wooden Name Plates', sortOrder: 1 },
    { name: 'Acrylic & LED', sortOrder: 2 },
  ]);
  const premiumSub = await SubCategory.create({
    name: 'Premium Wooden',
    category: wooden._id,
    sortOrder: 1,
  });

  // --- Options (real prices in paise) ---
  const materials = await Material.create([
    { name: 'Wood', priceDeltaPaise: r(300) },
    { name: 'Acrylic', priceDeltaPaise: r(200) },
    { name: 'Brass', priceDeltaPaise: r(800) },
  ]);

  const sizes = await Size.create([
    { name: '12 x 8 in', priceDeltaPaise: r(0), meta: { widthMm: 305, heightMm: 203 } },
    { name: '18 x 12 in', priceDeltaPaise: r(500), meta: { widthMm: 457, heightMm: 305 } },
    { name: '24 x 18 in', priceDeltaPaise: r(1200), meta: { widthMm: 610, heightMm: 457 } },
  ]);

  const colors = await Color.create([
    { name: 'Golden', priceDeltaPaise: r(250), meta: { hex: '#C8A04D' } },
    { name: 'Silver', priceDeltaPaise: r(250), meta: { hex: '#C0C0C0' } },
    { name: 'Black', priceDeltaPaise: r(0), meta: { hex: '#1A1A1A' } },
    { name: 'Walnut', priceDeltaPaise: r(0), meta: { hex: '#5C4033' } },
  ]);

  const fonts = await Font.create([
    { name: 'Playfair Display', priceDeltaPaise: r(0), meta: { family: 'Playfair Display', fileUrl: '', format: '' } },
    { name: 'Roboto', priceDeltaPaise: r(0), meta: { family: 'Roboto', fileUrl: '', format: '' } },
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
  ]);

  const mounts = await MountType.create([
    { name: 'Wall Mount', priceDeltaPaise: r(0) },
    { name: 'Table Stand', priceDeltaPaise: r(150) },
  ]);

  const icons = await Icon.create([
    { name: 'Ganesh', priceDeltaPaise: r(150), meta: { group: 'Religious', svgUrl: '' } },
    { name: 'Om', priceDeltaPaise: r(100), meta: { group: 'Religious', svgUrl: '' } },
    { name: 'Family', priceDeltaPaise: r(100), meta: { group: 'Family', svgUrl: '' } },
    { name: 'Star', priceDeltaPaise: r(50), meta: { group: 'Nature', svgUrl: '' } },
  ]);

  const ids = (docs) => docs.map((d) => d._id);

  // --- Demo product (fully configured) ---
  const product = await Product.create({
    name: 'Premium Wooden Name Plate',
    category: wooden._id,
    subCategory: premiumSub._id,
    description:
      'A handcrafted wooden name plate, fully customizable — material, size, font, ' +
      'colour, border, background, mount and up to two icons.',
    images: [],
    basePricePaise: r(1499),
    status: 'active',
    customizationConfig: {
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
    },
  });

  // --- Coupons ---
  await Coupon.create([
    { code: 'WELCOME10', type: 'percentage', percent: 10, maxDiscountPaise: r(300), minSubtotalPaise: r(500), status: 'active' },
    { code: 'FLAT200', type: 'flat', valuePaise: r(200), minSubtotalPaise: r(1500), status: 'active' },
  ]);

  console.log('\n✅  Seed complete:');
  console.log(`   Coupons:       WELCOME10 (10% off, cap ₹300), FLAT200 (₹200 off over ₹1500)`);
  console.log(`   Categories:    ${await Category.countDocuments()}`);
  console.log(`   SubCategories: ${await SubCategory.countDocuments()}`);
  console.log(
    `   Options:       materials ${materials.length}, sizes ${sizes.length}, ` +
      `colors ${colors.length}, fonts ${fonts.length}, borders ${borders.length}, ` +
      `backgrounds ${backgrounds.length}, mounts ${mounts.length}, icons ${icons.length}`
  );
  console.log(`   Demo product:  "${product.name}" (slug: ${product.slug})`);
  console.log(`   Base price:    ₹${(product.basePricePaise / 100).toFixed(2)}\n`);

  await disconnectDB();
  process.exit(0);
}

run().catch((err) => {
  console.error('❌  Seed failed:', err);
  process.exit(1);
});
