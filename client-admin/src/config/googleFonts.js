// A broad catalogue of Google Fonts family names (exact, for the CSS API). The
// font browser previews these on demand (fonts load dynamically when shown), so
// admins pick like in MS Word — no CSS family / name typing. This is a large
// curated subset of the Google Fonts library across every category.

export const GOOGLE_FONTS = [
  // Sans-serif
  'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Poppins', 'Inter', 'Raleway', 'Nunito',
  'Nunito Sans', 'Work Sans', 'Rubik', 'Mukta', 'Noto Sans', 'Ubuntu', 'Oswald', 'PT Sans',
  'Fira Sans', 'Manrope', 'DM Sans', 'Barlow', 'Karla', 'Cabin', 'Quicksand', 'Josefin Sans',
  'Titillium Web', 'Heebo', 'Hind', 'Assistant', 'Kanit', 'Signika', 'Exo 2', 'Archivo',
  'Sora', 'Outfit', 'Public Sans', 'Jost', 'Lexend', 'Figtree', 'Onest', 'Be Vietnam Pro',
  'Plus Jakarta Sans', 'Red Hat Display', 'Space Grotesk', 'Urbanist', 'Albert Sans', 'Mulish',
  'Maven Pro', 'Dosis', 'Comfortaa', 'Catamaran', 'Muli', 'Overpass', 'Saira', 'Prompt',
  // Serif
  'Merriweather', 'Playfair Display', 'Lora', 'PT Serif', 'Noto Serif', 'Roboto Slab', 'Bitter',
  'Crimson Text', 'Cormorant Garamond', 'EB Garamond', 'Libre Baskerville', 'Source Serif Pro',
  'Domine', 'Zilla Slab', 'Frank Ruhl Libre', 'Spectral', 'Vollkorn', 'Cardo', 'Arvo',
  'Bree Serif', 'Josefin Slab', 'Cinzel', 'Fraunces', 'DM Serif Display', 'DM Serif Text',
  'Marcellus', 'Prata', 'Cormorant', 'Sorts Mill Goudy', 'Old Standard TT', 'Rozha One',
  'Playfair Display SC', 'Alegreya', 'Bodoni Moda', 'Petrona',
  // Display
  'Bebas Neue', 'Anton', 'Righteous', 'Abril Fatface', 'Alfa Slab One', 'Fjalla One',
  'Archivo Black', 'Passion One', 'Bungee', 'Bungee Shade', 'Bungee Inline', 'Monoton',
  'Audiowide', 'Orbitron', 'Russo One', 'Bangers', 'Fredoka', 'Baloo 2', 'Titan One',
  'Luckiest Guy', 'Chewy', 'Bowlby One', 'Staatliches', 'Concert One', 'Ultra', 'Rye',
  'Fascinate', 'Faster One', 'Sail', 'Poiret One', 'Black Ops One', 'Press Start 2P',
  'Squada One', 'Teko', 'Saira Condensed', 'Special Elite', 'Cinzel Decorative', 'Monofett',
  'Rubik Mono One', 'Wallpoet', 'Iceberg', 'Nabla', 'Silkscreen', 'Rampart One', 'Bungee Spice',
  // Handwriting / script
  'Pacifico', 'Dancing Script', 'Great Vibes', 'Sacramento', 'Satisfy', 'Cookie', 'Allura',
  'Parisienne', 'Yellowtail', 'Lobster', 'Lobster Two', 'Courgette', 'Caveat', 'Permanent Marker',
  'Shadows Into Light', 'Kaushan Script', 'Marck Script', 'Rock Salt', 'Amatic SC', 'Tangerine',
  'Pinyon Script', 'Alex Brush', 'Kalam', 'Damion', 'Fredericka the Great', 'Indie Flower',
  'Handlee', 'Gloria Hallelujah', 'Patrick Hand', 'Homemade Apple', 'Gochi Hand',
  'Nanum Pen Script', 'Kristi', 'Cedarville Cursive', 'Zeyada', 'Norican', 'Bad Script',
  'Neucha', 'Charm', 'Petit Formal Script', 'Mr Dafoe', 'Herr Von Muellerhoff', 'Sofia',
  'Italianno', 'Pattaya', 'Style Script', 'Meddon', 'League Script', 'Neonderthaw', 'Tilt Neon',
  'Give You Glory', 'Shadows Into Light Two', 'Reenie Beanie', 'Covered By Your Grace',
  'Waiting for the Sunrise', 'Just Another Hand', 'Sacramento', 'Yesteryear', 'Qwigley',
  // Monospace
  'Roboto Mono', 'Source Code Pro', 'JetBrains Mono', 'Fira Code', 'Space Mono', 'IBM Plex Mono',
  'Inconsolata', 'Ubuntu Mono', 'VT323', 'Cousine', 'Nanum Gothic Coding',
];

// De-duplicated, sorted for the browser.
export const GOOGLE_FONTS_SORTED = [...new Set(GOOGLE_FONTS)].sort((a, b) => a.localeCompare(b));
