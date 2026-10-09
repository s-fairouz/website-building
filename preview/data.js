// Mock shop data for the local preview. None of this is uploaded to Shopify:
// on a real store, products, pages, menus and makers come from the Shopify admin.

const DRESS = { Rosehip: 'E0787C', Chambray: '9FB1C4', Moss: '9DAF8B', Butter: 'C9AE3E' };
const HAIR = { brown: '6B4A36', black: '2B2522', ginger: 'B8693A', blonde: 'D9B46A' };
const SKIN = { light: 'F0D2B8', tan: 'D6A680', brown: '9A6A4A', deep: '6E4A36' };
const STYLE = { pigtails: 0, bun: 1, long: 2, short: 3 };

const picture = (src, alt) => ({ src, alt, width: 400, height: 500, aspect_ratio: 0.8 });

// Draws a crocheted yarn doll so the preview has pictures without any photo files:
// stitch texture on the body and clothes, loose yarn strands for hair, an open cardigan.
function dollSvg(hair, dress, skin, style) {
  const h = `#${hair}`;
  const s = `#${skin}`;
  const d = `#${dress}`;
  const cardigan = '#EFE3D0';
  const ink = '#2B2522';

  // A shape drawn twice: once in its colour, once with a stitch pattern over it.
  const textured = (shape, fill, pattern) => shape(fill) + shape(`url(#${pattern})`);
  // Evenly spaced strands of yarn; t runs from 0 to 1 across them.
  const strands = (count, path) =>
    Array.from({ length: count }, (_, i) => `<path d="${path(i / (count - 1))}"/>`).join('');
  const mirror = (x, flip) => (flip ? 400 - x : x);

  const fringe = strands(9, (t) => {
    const x = 138 + t * 124;
    return `M200 64 Q${x} 74 ${x + (t - 0.5) * 14} ${116 + Math.sin(t * 9) * 7}`;
  });
  const side = (flip, length) =>
    strands(5, (t) => {
      const wobble = Math.sin(t * 8) * 6;
      return `M${mirror(124, flip)} 96 Q${mirror(104 - t * 14, flip)} ${150 + t * 10} ${mirror(112 - t * 18 + wobble, flip)} ${length - t * 14}`;
    });
  const bunch = (flip) =>
    strands(6, (t) => `M${mirror(120, flip)} 138 Q${mirror(82 - t * 6, flip)} ${150 + t * 22} ${mirror(70 + t * 34, flip)} ${214 + Math.cos(t * 6) * 8}`);

  const hairStyle = [
    bunch(false) + bunch(true),
    `<circle cx="200" cy="48" r="32" fill="${h}" stroke="none"/>` + side(false, 176) + side(true, 176),
    side(false, 300) + side(true, 300),
    side(false, 192) + side(true, 192),
  ][style];

  const leg = (x) => textured((fill) => `<rect x="${x}" y="368" width="30" height="100" rx="15" fill="${fill}"/>`, s, 'crochet');
  const sleeve = (x, angle, pivot) =>
    textured((fill) => `<rect x="${x}" y="230" width="30" height="118" rx="15" fill="${fill}" transform="rotate(${angle} ${pivot} 240)"/>`, cardigan, 'knit');
  const front = (flip) =>
    textured(
      (fill) => `<path d="M${mirror(150, flip)} 224 Q${mirror(128, flip)} 300 ${mirror(112, flip)} 384 L${mirror(158, flip)} 392 Q${mirror(168, flip)} 300 ${mirror(176, flip)} 222 Z" fill="${fill}"/>`,
      cardigan,
      'knit'
    );

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500">
  <defs>
    <pattern id="knit" width="14" height="11" patternUnits="userSpaceOnUse">
      <path d="M1 2 L7 9 L13 2" fill="none" stroke="#000" stroke-opacity=".09" stroke-width="2" stroke-linecap="round"/>
    </pattern>
    <pattern id="crochet" width="9" height="8" patternUnits="userSpaceOnUse">
      <path d="M1 5 Q4.5 0 8 5" fill="none" stroke="#000" stroke-opacity=".08" stroke-width="1.4"/>
    </pattern>
  </defs>
  ${leg(160)}${leg(210)}
  <ellipse cx="172" cy="470" rx="22" ry="12" fill="${s}"/>
  <ellipse cx="228" cy="470" rx="22" ry="12" fill="${s}"/>
  ${sleeve(135, 24, 150)}${sleeve(235, -24, 250)}
  ${textured((fill) => `<path d="M150 225 Q200 205 250 225 L300 390 Q200 420 100 390 Z" fill="${fill}"/>`, d, 'knit')}
  ${front(false)}${front(true)}
  <circle cx="106" cy="346" r="15" fill="${s}"/>
  <circle cx="294" cy="346" r="15" fill="${s}"/>
  ${textured((fill) => `<circle cx="200" cy="140" r="82" fill="${fill}"/>`, s, 'crochet')}
  <path d="M119 134 Q126 54 200 54 Q274 54 281 134 Q244 94 200 98 Q156 94 119 134Z" fill="${h}"/>
  <g fill="none" stroke="${h}" stroke-width="12" stroke-linecap="round">${fringe}${hairStyle}</g>
  <ellipse cx="170" cy="152" rx="4.5" ry="6.5" fill="${ink}"/>
  <ellipse cx="230" cy="152" rx="4.5" ry="6.5" fill="${ink}"/>
  <ellipse cx="158" cy="173" rx="12" ry="8" fill="#E8937A" opacity=".5"/>
  <ellipse cx="242" cy="173" rx="12" ry="8" fill="#E8937A" opacity=".5"/>
</svg>`;
}

// A plain head-and-shoulders figure standing in for a maker's studio portrait.
function makerSvg(hair, skin, top) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500">
  <path d="M40 500 Q50 350 200 340 Q350 350 360 500 Z" fill="#${top}"/>
  <rect x="172" y="270" width="56" height="90" rx="24" fill="#${skin}"/>
  <circle cx="200" cy="205" r="92" fill="#${skin}"/>
  <path d="M106 215 Q98 100 200 100 Q302 100 294 215 Q262 150 200 152 Q138 150 106 215Z" fill="#${hair}"/>
</svg>`;
}

// Makers. On Shopify each of these is an "artist" metaobject, which is why
// every field is read as field.value.
const field = (value) => ({ value });

function maker({ handle, name, location, bio, philosophy, status, remaining = null, total = null, hair, skin, top, pieces, specialty, makes }) {
  return {
    system: { handle, url: `/pages/artist/${handle}` },
    name: field(name),
    location: field(location),
    bio: field(bio),
    philosophy: field(philosophy),
    commission_status: field(status),
    slots_remaining: field(remaining),
    slots_total: field(total),
    pieces_made: field(pieces),
    specialty: field(specialty),
    makes: field(makes),
    instagram: field(`https://www.instagram.com/${handle.replace('-', '')}`),
    portrait: field(picture(`/mock/maker/${HAIR[hair]}-${SKIN[skin]}-${top}.svg`, name)),
  };
}

const makers = [
  maker({
    handle: 'isabelle', name: 'Isabelle', location: 'Lyon, France',
    status: 'Limited', remaining: 2, total: 5, hair: 'brown', skin: 'light', top: 'C3D4C5', pieces: 47, specialty: 'All eight companions', makes: 'Buni, Zara, Ted, Pachi, Tenta, Wooly, Rey, Lambi',
    bio: 'Isabelle trained as a costume maker and spent ten years sewing for theatre before she made her first doll. She works at a table by the window, one doll at a time, and names each one before she embroiders its face.',
    philosophy: 'Unbleached cotton for bodies, linen for clothes, and wool she cards herself for stuffing. Nothing synthetic touches a doll that leaves her table.',
  }),
];

// Colours. On Shopify each of these is a "color" metaobject with a name and a swatch.
const colors = Object.fromEntries(
  Object.entries(DRESS).map(([name, hex]) => [name, { system: { handle: name.toLowerCase() }, name: field(name), swatch: field(`#${hex}`) }])
);

// Body fabrics a doll can be made in. Like colours, each is a "color" metaobject on Shopify.
const fabrics = [
  ['Terracotta flowers', 'C87840'],
  ['Sky-blue stars', 'B8D4E8'],
  ['Powder-pink moons', 'EDD8D8'],
  ['Watercolour floral', 'D4C0B0'],
  ['Flowering foxes', 'EAE4D8'],
  ['Polar-blue minky', '8EC4D8'],
].map(([name, hex]) => ({ system: { handle: name.toLowerCase().replace(/\W+/g, '-') }, name: field(name), swatch: field(`#${hex}`) }));

// How a doll is made. The same sample record is used for every doll in the preview.
const MAKING = {
  materials: 'Oeko-Tex certified cotton',
  technique: 'Crocheted by hand',
  making_time: 'About 4½ hours',
  stitches: 'About 840, placed one by one',
  making_steps: ['Body crocheted, 2 hours', 'Parts assembled, 1½ hours', 'Name embroidered in gold thread', 'Checked and boxed'],
};

let nextId = 1000;

function doll({ handle, title, type, price, compare = null, hair, skin, style, dresses, available = true, description, optionName = 'Dress color', madeBy, leadTime, personalizable = false, stock = null, height = null, size, tone = null, making = Boolean(height) }) {
  const single = dresses.length === 1;
  const images = dresses.map((dress) =>
    picture(`/mock/doll/${HAIR[hair]}-${DRESS[dress]}-${SKIN[skin]}-${STYLE[style]}.svg`, `${title} in ${dress.toLowerCase()}`)
  );
  const variants = dresses.map((dress, i) => ({
    id: ++nextId,
    title: single ? 'Default Title' : dress,
    option1: single ? 'Default Title' : dress,
    options: [single ? 'Default Title' : dress],
    price,
    compare_at_price: compare,
    available,
    // Stock is only counted for ready-made pieces; made-to-order dolls leave it untracked.
    inventory_management: stock === null ? null : 'shopify',
    inventory_quantity: stock,
    featured_image: images[i],
  }));

  return {
    id: ++nextId,
    object_type: 'product',
    handle,
    title,
    type,
    vendor: 'Kwaii Dolls',
    url: `/products/${handle}`,
    description,
    price,
    price_min: price,
    price_max: price,
    price_varies: false,
    compare_at_price: compare,
    available,
    featured_image: images[0],
    images,
    variants,
    has_only_default_variant: single,
    options_with_values: single ? [] : [{ name: optionName, position: 1, values: dresses, selected_value: dresses[0] }],
    selected_or_first_available_variant: variants[0],
    tags: [],
    metafields: {
      custom: {
        artist: field(makers.find((item) => item.system.handle === madeBy)),
        personalizable: field(personalizable),
        lead_time_min_days: field(leadTime[0]),
        lead_time_max_days: field(leadTime[1]),
        height_cm: field(height),
        size: field(size),
        colors: field(tone ? [{ system: { handle }, name: field(tone[0]), swatch: field(`#${tone[1]}`) }] : dresses.map((dress) => colors[dress])),
        fabrics: field(making ? fabrics : []),
        ...Object.fromEntries(Object.entries(MAKING).map(([key, value]) => [key, field(making ? value : null)])),
      },
    },
  };
}

const products = [
  // The eight companions: the whole catalogue, and the choices on the order journey page.
  ...[
    ['buni', 'Buni', 'Rabbit', 3400, 'Cream and terracotta', 'F4EEE4'],
    ['zara', 'Zara', 'Giraffe', 3600, 'Golden mustard', 'D4921C'],
    ['ted', 'Ted', 'Bear', 3400, 'Glacier blue', '8EC4D8'],
    ['pachi', 'Pachi', 'Elephant', 3600, 'Pearl blue-grey', 'B8C4C8'],
    ['tenta', 'Tenta', 'Octopus', 3600, 'Blue-grey', 'C0CCDA'],
    ['wooly', 'Wooly', 'Lamb', 3500, 'Old rose', 'D4907A'],
    ['rey', 'Rey', 'Zebra', 3600, 'Bright terracotta', 'C87840'],
    ['lambi', 'Lambi', 'Doe', 3600, 'Rose terracotta', 'C4826A'],
  ].map(([handle, title, type, price, toneName, toneHex, madeBy = 'isabelle']) =>
    doll({
      handle, title, type, price, tone: [toneName, toneHex],
      hair: 'brown', skin: 'light', style: 'short', dresses: ['Butter'],
      madeBy, leadTime: [5, 7], personalizable: true, making: true,
      description: `<p>${title} the ${type.toLowerCase()}, crocheted by hand.</p>`,
    })
  ),
  // The charge for an embroidered name: a product of its own, kept out of the catalogue.
  doll({
    handle: 'name-embroidery', title: 'Name embroidery', type: 'Add-on', price: 400,
    hair: 'brown', skin: 'light', style: 'short', dresses: ['Butter'],
    madeBy: null, leadTime: [null, null],
    description: '<p>A name embroidered by hand on the doll. Ordered together with a doll.</p>',
  }),
];

// Product types that are sold but not listed in the catalogue.
const HIDDEN_TYPES = ['Add-on'];

function collection(handle, title, description, list) {
  return { handle, title, description, url: `/collections/${handle}`, products: list, products_count: list.length, all_products_count: list.length };
}

// An array so templates can loop over it, with each collection also reachable by handle.
const collections = [
  collection('all', 'The Heirloom Doll Collection', '', products.filter((product) => !HIDDEN_TYPES.includes(product.type))),
];

// Each maker's profile points at a collection of their own work.
for (const item of makers) {
  const works = products.filter((product) => product.metafields.custom.artist.value === item);
  item.collection = field(collection(item.system.handle, item.name.value, '', works));
  collections.push(item.collection.value);
}

collections.forEach((item) => { collections[item.handle] = item; });

const pages = {
  certificate: {
    title: 'Adoption certificate',
    template_suffix: 'certificate',
    content: '',
  },
  adopt: {
    title: 'Adopt a doll',
    template_suffix: 'adopt',
    content: '',
  },
  about: {
    title: 'About Kwaii',
    template_suffix: 'about',
    content: '<p>Kwaii is a small workshop in Lyon. Every doll is crocheted by hand by Isabelle, one at a time, and made to order.</p><p>We only use materials we would give to our own family: certified cotton yarn, soft muslin and plush that small hands can hold on to.</p>',
  },
  makers: {
    title: 'Our maker',
    template_suffix: 'makers',
    content: '<p>One person makes everything in this shop. She works alone, in small batches, under her own name.</p>',
  },
  contact: {
    title: 'Contact us',
    template_suffix: 'contact',
    content: '<p>Ask about an order, a repair or a custom doll. We reply within two working days.</p>',
  },
  faq: {
    title: 'Questions and answers',
    template_suffix: 'faq',
    content: '',
  },
  'shipping-returns': {
    title: 'Shipping and returns',
    template_suffix: null,
    content: '<h2>Shipping</h2><p>Each doll is made to order and ships within about a week. Postage is calculated at checkout from your address.</p><h2>Returns</h2><p>Unused dolls can be returned within 30 days for a refund. Send us a message first and we will email a returns label.</p><h2>Repairs</h2><p>Loved dolls come apart sometimes. Post yours back and we will restitch it for the cost of postage.</p>',
  },
};

const linklists = {
  'main-menu': {
    links: [
      { title: 'All dolls', url: '/collections/all' },
      { title: 'Adopt', url: '/pages/adopt' },
      { title: 'Certificate', url: '/pages/certificate' },
      { title: 'Makers', url: '/pages/makers' },
      { title: 'About', url: '/pages/about' },
    ],
  },
  footer: {
    links: [
      { title: 'Adoption certificate', url: '/pages/certificate' },
      { title: 'Questions and answers', url: '/pages/faq' },
      { title: 'Shipping and returns', url: '/pages/shipping-returns' },
      { title: 'Contact us', url: '/pages/contact' },
      { title: 'Instagram', url: 'https://www.instagram.com/' },
      { title: 'About', url: '/pages/about' },
    ],
  },
};

const shop = { name: 'Kwaii Dolls', currency: 'USD', customer_accounts_enabled: true, metaobjects: { artist: { values: makers } } };

const routes = {
  root_url: '/',
  account_url: '/account',
  cart_url: '/cart',
  cart_add_url: '/cart/add',
  cart_change_url: '/cart/change',
  cart_update_url: '/cart/update',
  search_url: '/search',
  predictive_search_url: '/search/suggest',
  collections_url: '/collections',
  all_products_collection_url: '/collections/all',
};

// Section settings a merchant would pick in the theme editor, keyed by template then section.
const previewSettings = {
  index: { hero: { product: 'lambi' } },
};

function findVariant(id) {
  for (const product of products) {
    const variant = product.variants.find((item) => String(item.id) === String(id));
    if (variant) return { product, variant };
  }
  return null;
}

module.exports = { products, collections, pages, linklists, shop, routes, previewSettings, makers, HIDDEN_TYPES, findVariant, dollSvg, makerSvg };
