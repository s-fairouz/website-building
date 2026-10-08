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

function maker({ handle, name, location, bio, philosophy, status, remaining = null, total = null, hair, skin, top }) {
  return {
    system: { handle, url: `/pages/artist/${handle}` },
    name: field(name),
    location: field(location),
    bio: field(bio),
    philosophy: field(philosophy),
    commission_status: field(status),
    slots_remaining: field(remaining),
    slots_total: field(total),
    instagram: field(`https://www.instagram.com/${handle.replace('-', '')}`),
    portrait: field(picture(`/mock/maker/${HAIR[hair]}-${SKIN[skin]}-${top}.svg`, name)),
  };
}

const makers = [
  maker({
    handle: 'elena-marsh', name: 'Elena Marsh', location: 'Hebden Bridge, England',
    status: 'Limited', remaining: 2, total: 5, hair: 'brown', skin: 'light', top: 'C3D4C5',
    bio: 'Elena trained as a costume maker and spent ten years sewing for theatre before she made her first doll. She works at a table by the window, one doll at a time, and names each one before she embroiders its face.',
    philosophy: 'Unbleached cotton for bodies, linen for clothes, and wool she cards herself for stuffing. Nothing synthetic touches a doll that leaves her table.',
  }),
  maker({
    handle: 'ines-faure', name: 'Inès Faure', location: 'Honfleur, France',
    status: 'Open', hair: 'black', skin: 'tan', top: 'E8C5BE',
    bio: 'Inès learned to sew from her grandmother, who made dolls from flour sacks. She still cuts every pattern by hand and keeps her grandmother’s scissors on the bench.',
    philosophy: 'Normandy linen, cotton thread and plant dyes she mixes in small pots. Colours vary a little from batch to batch, and she likes it that way.',
  }),
  maker({
    handle: 'sam-okafor', name: 'Sam Okafor', location: 'Leeds, England',
    status: 'Waitlist', hair: 'black', skin: 'deep', top: 'C9A67E',
    bio: 'Sam makes the pocket dolls. He started by sewing one for his daughter’s coat pocket, then one for every child on her street.',
    philosophy: 'Offcuts from the larger dolls, so very little is wasted. Each pocket doll uses fabric from at least three others.',
  }),
];

// Colours. On Shopify each of these is a "color" metaobject with a name and a swatch.
const colors = Object.fromEntries(
  Object.entries(DRESS).map(([name, hex]) => [name, { system: { handle: name.toLowerCase() }, name: field(name), swatch: field(`#${hex}`) }])
);

let nextId = 1000;

function doll({ handle, title, type, price, compare = null, hair, skin, style, dresses, available = true, description, optionName = 'Dress color', madeBy, leadTime, personalizable = false, stock = null, height = null, size }) {
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
    vendor: 'Hazelwick Dolls',
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
        colors: field(dresses.map((dress) => colors[dress])),
      },
    },
  };
}

const products = [
  doll({
    handle: 'wren', title: 'Wren', type: 'Cloth doll', price: 6400,
    hair: 'brown', skin: 'light', style: 'pigtails', dresses: ['Rosehip', 'Chambray', 'Moss'],
    madeBy: 'elena-marsh', leadTime: [4, 6], personalizable: true, height: 38, size: 'Full size',
    description: '<p>Wren is 38 cm tall, with yarn pigtails you can re-tie and a smock that comes off for washing. She sits up on her own and fits a child’s arm from wrist to elbow.</p>',
  }),
  doll({
    handle: 'odile', title: 'Odile', type: 'Cloth doll', price: 7200,
    hair: 'black', skin: 'tan', style: 'bun', dresses: ['Butter'],
    madeBy: 'elena-marsh', leadTime: [4, 6], personalizable: true, height: 40, size: 'Full size',
    description: '<p>Odile is 40 cm tall and wears her hair in a hand-wound bun. Her butter-yellow dress has a white collar and fastens with two snaps at the back.</p>',
  }),
  doll({
    handle: 'pim', title: 'Pim', type: 'Pocket doll', price: 2800,
    hair: 'ginger', skin: 'light', style: 'short', dresses: ['Moss'],
    madeBy: 'sam-okafor', leadTime: [2, 3], stock: 3, height: 18, size: 'Pocket size',
    description: '<p>Pim is 18 cm tall, small enough for a coat pocket or a school bag. Clothes are sewn on, so there is nothing to lose.</p>',
  }),
  doll({
    handle: 'marguerite', title: 'Marguerite', type: 'Cloth doll', price: 7800, compare: 9200,
    hair: 'blonde', skin: 'light', style: 'long', dresses: ['Chambray', 'Rosehip'],
    madeBy: 'ines-faure', leadTime: [5, 8], personalizable: true, height: 40, size: 'Full size',
    description: '<p>Marguerite is 40 cm tall with long wool hair that can be brushed and plaited. This is the last batch in this fabric.</p>',
  }),
  doll({
    handle: 'tansy', title: 'Tansy', type: 'Pocket doll', price: 2800,
    hair: 'black', skin: 'brown', style: 'pigtails', dresses: ['Rosehip'],
    madeBy: 'sam-okafor', leadTime: [2, 3], stock: 5, height: 18, size: 'Pocket size',
    description: '<p>Tansy is 18 cm tall, with two tight pigtails and a rosehip-red dress. Clothes are sewn on, so there is nothing to lose.</p>',
  }),
  doll({
    handle: 'bram', title: 'Bram', type: 'Cloth doll', price: 6400, available: false,
    hair: 'black', skin: 'tan', style: 'short', dresses: ['Chambray'],
    madeBy: 'elena-marsh', leadTime: [4, 6], personalizable: true, height: 38, size: 'Full size',
    description: '<p>Bram is 38 cm tall and wears a chambray smock with a white collar. The next batch is being sewn now.</p>',
  }),
  doll({
    handle: 'juno', title: 'Juno', type: 'Cloth doll', price: 7200,
    hair: 'black', skin: 'deep', style: 'bun', dresses: ['Butter', 'Moss'],
    madeBy: 'ines-faure', leadTime: [5, 8], personalizable: true, height: 40, size: 'Full size',
    description: '<p>Juno is 40 cm tall with a hand-wound bun. Her dress has a white collar and fastens with two snaps at the back.</p>',
  }),
  doll({
    handle: 'spare-smock', title: 'Spare smock', type: 'Doll clothes', price: 1800, optionName: 'Color',
    hair: 'brown', skin: 'light', style: 'pigtails', dresses: ['Rosehip', 'Chambray', 'Moss', 'Butter'],
    madeBy: 'ines-faure', leadTime: [2, 3], size: 'Fits 38 to 40 cm dolls',
    description: '<p>An extra smock for any 38 to 40 cm doll. Cotton, with a white collar and two snaps at the back.</p>',
  }),
];

function collection(handle, title, description, list) {
  return { handle, title, description, url: `/collections/${handle}`, products: list, products_count: list.length, all_products_count: list.length };
}

const byType = (type) => products.filter((product) => product.type === type);

// An array so templates can loop over it, with each collection also reachable by handle.
const collections = [
  collection('all', 'The Heirloom Doll Collection', '', products),
  collection('cloth-dolls', 'Cloth dolls', '<p>Our full-size dolls, 38 to 40 cm tall, with clothes that come off.</p>', byType('Cloth doll')),
  collection('pocket-dolls', 'Pocket dolls', '<p>Small 18 cm dolls made to travel.</p>', byType('Pocket doll')),
  collection('doll-clothes', 'Doll clothes', '<p>Spare outfits for full-size dolls.</p>', byType('Doll clothes')),
];

// Each maker's profile points at a collection of their own work.
for (const item of makers) {
  const works = products.filter((product) => product.metafields.custom.artist.value === item);
  item.collection = field(collection(item.system.handle, item.name.value, '', works));
  collections.push(item.collection.value);
}

collections.forEach((item) => { collections[item.handle] = item; });

const pages = {
  about: {
    title: 'About Hazelwick',
    template_suffix: 'about',
    content: '<p>Hazelwick is a small group of makers who sell under one roof. It started with dolls sewn for our own children and kept going when their friends asked for one.</p><p>Everything is made in batches of ten or so, and we only use materials we would give to our own family: cotton, linen, wool felt and carded wool.</p>',
  },
  makers: {
    title: 'Our makers',
    template_suffix: 'makers',
    content: '<p>Three people make everything in this shop. Each works alone, in small batches, under their own name.</p>',
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
      { title: 'Cloth dolls', url: '/collections/cloth-dolls' },
      { title: 'Pocket dolls', url: '/collections/pocket-dolls' },
      { title: 'Makers', url: '/pages/makers' },
      { title: 'About', url: '/pages/about' },
    ],
  },
  footer: {
    links: [
      { title: 'Questions and answers', url: '/pages/faq' },
      { title: 'Shipping and returns', url: '/pages/shipping-returns' },
      { title: 'Contact us', url: '/pages/contact' },
      { title: 'About', url: '/pages/about' },
    ],
  },
};

const shop = { name: 'Hazelwick Dolls', currency: 'USD', customer_accounts_enabled: true, metaobjects: { artist: { values: makers } } };

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
  index: { hero: { product: 'wren' } },
};

function findVariant(id) {
  for (const product of products) {
    const variant = product.variants.find((item) => String(item.id) === String(id));
    if (variant) return { product, variant };
  }
  return null;
}

module.exports = { products, collections, pages, linklists, shop, routes, previewSettings, makers, findVariant, dollSvg, makerSvg };
