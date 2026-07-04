// Tiny slug helper — lowercase, spaces/underscores -> hyphens, strip the rest.

/**
 * @param {string} input
 * @returns {string}
 */
export function slugify(input) {
  return String(input || '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // strip accents
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // drop non-alphanumerics
    .replace(/[\s_-]+/g, '-') // collapse whitespace/underscores to a single hyphen
    .replace(/^-+|-+$/g, ''); // trim leading/trailing hyphens
}

export default slugify;
