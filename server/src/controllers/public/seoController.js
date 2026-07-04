// SEO: dynamic sitemap.xml + robots.txt for the public storefront. (Admin is a
// separate app and is noindex.) Full bot-prerendering is a deploy-layer concern
// documented in the README; this provides crawlable URLs + meta lives client-side.

import asyncHandler from '../../utils/asyncHandler.js';
import config from '../../config/index.js';
import Product from '../../models/Product.js';
import Category from '../../models/Category.js';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const sitemap = asyncHandler(async (req, res) => {
  const site = config.siteUrl.replace(/\/$/, '');
  const [products, categories] = await Promise.all([
    Product.find({ status: 'active' }).select('slug updatedAt').lean(),
    Category.find({ status: 'active' }).select('slug').lean(),
  ]);

  const urls = [
    { loc: `${site}/` },
    { loc: `${site}/products` },
    ...categories.map((c) => ({ loc: `${site}/products?category=${esc(c.slug)}` })),
    ...products.map((p) => ({ loc: `${site}/products/${esc(p.slug)}`, lastmod: p.updatedAt?.toISOString() })),
  ];

  const body =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls
      .map((u) => `  <url><loc>${u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}</url>`)
      .join('\n') +
    `\n</urlset>\n`;

  res.set('Content-Type', 'application/xml');
  return res.send(body);
});

export function robots(req, res) {
  const site = config.siteUrl.replace(/\/$/, '');
  res.set('Content-Type', 'text/plain');
  res.send(`User-agent: *\nAllow: /\nDisallow: /admin\n\nSitemap: ${site}/sitemap.xml\n`);
}
