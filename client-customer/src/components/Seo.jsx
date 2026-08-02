import { Helmet } from 'react-helmet-async';

// Per-page title + meta/OG tags. Full bot-prerendering is a deploy concern
// (documented in README); this gives crawlers correct titles/meta on hydrate.
export default function Seo({ title, description, image, path }) {
  const fullTitle = title ? `${title} · Daxon` : 'Daxon — Custom Neon Signs & Name Plates';
  const url = path ? `${window.location.origin}${path}` : undefined;
  return (
    <Helmet>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      <meta property="og:title" content={fullTitle} />
      {description && <meta property="og:description" content={description} />}
      {image && <meta property="og:image" content={image} />}
      <meta property="og:type" content="website" />
      {url && <meta property="og:url" content={url} />}
      {url && <link rel="canonical" href={url} />}
    </Helmet>
  );
}
