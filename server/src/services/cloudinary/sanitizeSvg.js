// SVG sanitization before storing icons (defence against SVG-borne XSS/script).
// Uses DOMPurify in SVG profile, then a couple of belt-and-braces checks.

import DOMPurify from 'isomorphic-dompurify';

/**
 * @param {Buffer|string} input raw SVG
 * @returns {string} sanitized SVG markup
 * @throws if the input isn't a usable <svg>
 */
export function sanitizeSvg(input) {
  const raw = Buffer.isBuffer(input) ? input.toString('utf8') : String(input);

  const clean = DOMPurify.sanitize(raw, {
    USE_PROFILES: { svg: true, svgFilters: true },
    // Never allow scripting or external refs inside an uploaded icon.
    FORBID_TAGS: ['script', 'foreignObject', 'a', 'use'],
    FORBID_ATTR: ['onload', 'onerror', 'onclick', 'href', 'xlink:href'],
  });

  if (!clean || !/<svg[\s>]/i.test(clean)) {
    throw new Error('Uploaded file is not a valid SVG after sanitization');
  }
  return clean;
}

export default sanitizeSvg;
