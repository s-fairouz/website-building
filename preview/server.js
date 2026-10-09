// Local preview for the theme in ../theme.
//
// Shopify renders Liquid on its own servers, so this stands in for it: it renders
// the same theme files with LiquidJS, mock data from ./data.js and small stand-ins
// for the Shopify-only tags and filters the theme uses. It is close to the real
// thing, not identical; check the theme on a Shopify store before going live.

const http = require('http');
const fs = require('fs');
const path = require('path');
const { Liquid } = require('liquidjs');
const data = require('./data');

const THEME = path.join(__dirname, '..', 'theme');
const PORT = process.env.PORT || 9292;

const read = (...parts) => fs.readFileSync(path.join(THEME, ...parts), 'utf8');
const money = (cents) => '$' + (Number(cents || 0) / 100).toFixed(2);
const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

// Languages: like Shopify, the first is the default and the others live under a URL prefix.
const LOCALES = [
  { iso_code: 'en', endonym_name: 'English', root_url: '' },
  { iso_code: 'fr', endonym_name: 'français', root_url: '/fr' },
];
const themeStrings = (code) => JSON.parse(read('locales', code === 'en' ? 'en.default.json' : `${code}.json`));

// Stands in for Shopify's Translate & Adapt app: swaps shop content for its
// translation (from content.<language>.js) and adds the language prefix to links.
const UNTRANSLATED = new Set(['handle', 'param_name', 'src', 'template_suffix']);
const localized = new WeakSet();

function localize(input, locale) {
  if (!locale.root_url) return input;
  const dictionary = require(`./content.${locale.iso_code}.js`);
  const copies = new WeakMap();

  const translate = (value, key) => {
    if (UNTRANSLATED.has(key)) return value;
    if (key === 'url' || (key && (key.startsWith('url_') || key.endsWith('_url')))) {
      return value.startsWith('/') ? (locale.root_url + value).replace(/\/$/, '') : value;
    }
    const alt = key === 'alt' && value.match(/^(.+) in (\w+)$/);
    if (alt) {
      const color = alt[2][0].toUpperCase() + alt[2].slice(1);
      return alt[1] + dictionary[' in '] + (dictionary[color] || color).toLowerCase();
    }
    return dictionary[value] ?? value;
  };

  const walk = (value, key) => {
    if (typeof value === 'string') return translate(value, key);
    if (value === null || typeof value !== 'object' || localized.has(value)) return value;
    if (copies.has(value)) return copies.get(value);
    const copy = Array.isArray(value) ? [] : {};
    copies.set(value, copy);
    localized.add(copy);
    for (const name of Object.keys(value)) {
      // A filter option's value goes back in the URL, so it has to stay as it is.
      // So does anything the shopper typed.
      const keep = (name === 'value' && 'param_name' in value) || ['properties', 'attributes', 'note'].includes(name);
      copy[name] = keep ? value[name] : walk(value[name], name);
    }
    return copy;
  };

  return walk(input);
}

const engine = new Liquid({
  root: path.join(THEME, 'snippets'),
  partials: path.join(THEME, 'snippets'),
  extname: '.liquid',
  cache: false,
});

// Real photos: drop wren.jpg into preview/photos, named after the product handle,
// and it replaces the drawn doll. wren-2.jpg, wren-3.jpg and so on are extra detail
// photos; the second one is also the hover shot on cards.
const PHOTOS = path.join(__dirname, 'photos');
const photoFiles = fs.existsSync(PHOTOS) ? fs.readdirSync(PHOTOS).filter((name) => /\.(jpe?g|png|webp)$/i.test(name)) : [];

for (const product of data.products) {
  const photos = ['', '-2', '-3', '-4', '-5', '-6']
    .map((suffix) => photoFiles.find((name) => path.parse(name).name === product.handle + suffix))
    .filter(Boolean)
    .map((name) => ({ src: `/photos/${name}`, alt: product.title, width: 1200, height: 1500, aspect_ratio: 0.8 }));
  if (photos.length === 0) {
    // A companion without a photo has no picture at all, as on a real store, so the theme
    // shows its own sketch in the companion's colour instead of the stand-in doll drawing.
    if (!data.HIDDEN_TYPES.includes(product.type)) {
      product.images = [];
      product.featured_image = null;
      for (const variant of product.variants) variant.featured_image = null;
    }
    continue;
  }
  product.images = photos;
  product.featured_image = photos[0];
  for (const variant of product.variants) variant.featured_image = photos[0];
}

// A maker's photo is named maker-<handle>, for example maker-isabelle.jpg. Without one the
// preview draws a plain stand-in figure.
for (const maker of data.makers) {
  const name = photoFiles.find((file) => path.parse(file).name === `maker-${maker.system.handle}`);
  if (name) maker.portrait.value = { src: `/photos/${name}`, alt: maker.name.value, width: 1200, height: 1500, aspect_ratio: 0.8 };
}

// Shopify filters

engine.registerFilter('t', function (key, ...args) {
  const code = this.context.globals.request.locale.iso_code;
  const values = Object.fromEntries(args.filter(Array.isArray));
  const find = (strings) => key.split('.').reduce((node, part) => (node ? node[part] : undefined), strings);
  let text = find(themeStrings(code)) ?? find(themeStrings('en'));
  if (text && typeof text === 'object') {
    text = text[new Intl.PluralRules(code).select(Number(values.count))] ?? text.other;
  }
  if (typeof text !== 'string') return `Translation missing: ${code}.${key}`;
  return text.replace(/{{\s*(\w+)\s*}}/g, (_, name) => escapeHtml(values[name] ?? ''));
});
engine.registerFilter('money', money);
engine.registerFilter('money_without_currency', (cents) => (Number(cents || 0) / 100).toFixed(2));
engine.registerFilter('asset_url', (name) => `/assets/${name}`);
engine.registerFilter('stylesheet_tag', (url) => `<link rel="stylesheet" href="${url}">`);
engine.registerFilter('image_url', (image) => (image ? image.src || String(image) : ''));
engine.registerFilter('pluralize', (count, one, many) => (Number(count) === 1 ? one : many));
engine.registerFilter('default_pagination', () => '');
engine.registerFilter('default_errors', (errors) => (errors ? String(errors) : ''));
engine.registerFilter(
  'placeholder_svg_tag',
  (name, className) =>
    `<svg class="${className || ''}" viewBox="0 0 400 500" role="img" aria-label="Placeholder image">` +
    '<circle cx="200" cy="170" r="80"/><path d="M150 260h100l55 170H95z"/></svg>'
);

// Shopify tags

function blockTag(name, render) {
  engine.registerTag(name, {
    parse(token, remainTokens) {
      this.args = token.args;
      this.templates = [];
      const stream = this.liquid.parser
        .parseStream(remainTokens)
        .on(`tag:end${name}`, () => stream.stop())
        .on('template', (template) => this.templates.push(template))
        .on('end', () => {
          throw new Error(`tag ${name} not closed`);
        });
      stream.start();
    },
    *render(ctx, emitter) {
      yield* render.call(this, ctx, emitter);
    },
  });
}

blockTag('style', function* (ctx, emitter) {
  emitter.write('<style>');
  yield this.liquid.renderer.renderTemplates(this.templates, ctx, emitter);
  emitter.write('</style>');
});

blockTag('paginate', function* (ctx, emitter) {
  ctx.push({ paginate: { current_page: 1, pages: 1, parts: [] } });
  yield this.liquid.renderer.renderTemplates(this.templates, ctx, emitter);
  ctx.pop();
});

blockTag('form', function* (ctx, emitter) {
  const type = (this.args.match(/['"]([\w-]+)['"]/) || [])[1];
  const className = (this.args.match(/class:\s*['"]([^'"]*)['"]/) || [])[1];
  const id = (this.args.match(/\bid:\s*['"]([^'"]*)['"]/) || [])[1];
  const { locale, path: currentPath } = ctx.globals.request;
  const action =
    locale.root_url +
    ({ product: '/cart/add', contact: '/contact', customer: '/contact', cart: '/cart', localization: '/localization' }[type] || '/');
  // Shopify reloads the page with ?contact_posted=true (or customer_posted for sign-ups) after a form is sent.
  const posted = Boolean(ctx.getAll()[`${type}_posted`]);

  emitter.write(
    `<form method="post" action="${action}"${id ? ` id="${id}"` : ''}${className ? ` class="${className}"` : ''} accept-charset="UTF-8">` +
      `<input type="hidden" name="form_type" value="${type}">` +
      (type === 'localization' ? `<input type="hidden" name="return_to" value="${escapeHtml(currentPath)}">` : '')
  );
  ctx.push({ form: { 'posted_successfully?': posted, errors: null } });
  yield this.liquid.renderer.renderTemplates(this.templates, ctx, emitter);
  ctx.pop();
  emitter.write('</form>');
});

engine.registerTag('section', {
  parse(token) {
    this.name = token.args.replace(/['"\s]/g, '');
  },
  *render(ctx) {
    return yield renderSection(this.name, this.name, {}, ctx.getAll());
  },
});

// Sections and settings

function loadSection(type) {
  const source = read('sections', `${type}.liquid`);
  const match = source.match(/{%-?\s*schema\s*-?%}([\s\S]*?){%-?\s*endschema\s*-?%}/);
  return {
    source: match ? source.replace(match[0], '') : source,
    schema: match ? JSON.parse(match[1]) : {},
  };
}

// Turns stored setting values into what Liquid sees: defaults filled in, and
// handles swapped for the collection, product or menu they point to.
function resolveSettings(definitions = [], values = {}, ctx) {
  const settings = {};
  for (const definition of definitions) {
    if (!definition.id) continue;
    let value = values[definition.id] ?? definition.default ?? null;
    if (typeof value === 'string' && value.startsWith('shopify://')) value = `/${value.slice('shopify://'.length)}`;
    if (value !== null) {
      if (definition.type === 'url' && value.startsWith('/')) value = ctx.request.locale.root_url + value;
      else if (definition.type === 'collection') value = ctx.collections[value] || null;
      else if (definition.type === 'product') value = data.products.find((product) => product.handle === value) || null;
      else if (definition.type === 'link_list') value = ctx.linklists[value] || null;
      else if (definition.type === 'image_picker') value = null;
    }
    settings[definition.id] = value;
  }
  return localize(settings, ctx.request.locale);
}

async function renderSection(id, type, config, ctx) {
  const { source, schema } = loadSection(type);
  const blocks = (config.block_order || []).map((blockId) => {
    const block = config.blocks[blockId];
    const definition = (schema.blocks || []).find((item) => item.type === block.type) || {};
    return {
      id: blockId,
      type: block.type,
      settings: resolveSettings(definition.settings, block.settings, ctx),
      shopify_attributes: '',
    };
  });
  const section = { id, settings: resolveSettings(schema.settings, config.settings, ctx), blocks };
  // Shop-wide objects go in as globals so snippets can see them too, as on Shopify.
  const html = await engine.parseAndRender(source, { section }, { globals: ctx });
  return `<div id="shopify-section-${id}" class="shopify-section">${html}</div>`;
}

// Everything Liquid can see on a page: the shop's content in the visitor's language, plus the request.
function buildContext(template, requestPath, locale, globals = {}) {
  // "page.faq" is the page template with suffix faq; "metaobject/artist" is the artist metaobject template.
  const [name, suffix = null] = template.split(/[./]/);
  const linklists = Object.fromEntries(
    Object.entries(data.linklists).map(([handle, list]) => [
      handle,
      { links: list.links.map((link) => ({ ...link, active: link.url === requestPath })) },
    ])
  );
  const content = {
    shop: data.shop,
    routes: data.routes,
    cart: buildCart(),
    collections: data.collections,
    pages: data.pages,
    linklists,
    page_title: data.shop.name,
    ...globals,
  };
  const ctx = {
    ...localize(content, locale),
    request: { locale, path: requestPath },
    localization: { available_languages: LOCALES, language: locale },
    template: { name, suffix },
    canonical_url: `http://localhost:${PORT}${locale.root_url}${requestPath}`,
  };
  const themeSettings = JSON.parse(read('config', 'settings_schema.json')).flatMap((group) => group.settings || []);
  ctx.settings = resolveSettings(themeSettings, JSON.parse(read('config', 'settings_data.json')).current, ctx);
  return ctx;
}

// Shopify's section rendering: returns the HTML of the named sections, keyed by id.
async function renderSections(ids, requestPath, locale, globals = {}) {
  const ctx = buildContext('index', requestPath, locale, globals);
  const sections = {};
  for (const id of ids) sections[id] = await renderSection(id, id, {}, ctx);
  return sections;
}

async function renderPage(template, requestPath, locale, globals = {}) {
  const ctx = buildContext(template, requestPath, locale, globals);
  const json = JSON.parse(read('templates', `${template}.json`));
  const overrides = data.previewSettings[template] || {};
  let body = '';
  for (const id of json.order) {
    const config = json.sections[id];
    const settings = { ...config.settings, ...overrides[id] };
    body += await renderSection(`template--${id}`, config.type, { ...config, settings }, ctx);
  }

  return engine.parseAndRender(
    read('layout', 'theme.liquid'),
    { content_for_layout: body, content_for_header: '<!-- Shopify adds its own scripts here -->' },
    { globals: ctx }
  );
}

// Cart (kept in memory, shared by everyone using this preview)

const cartLines = [];
const cartExtras = { note: '', attributes: {} };

// Reads fields named like properties[Engraved name] or attributes[Gift wrap] from a posted form.
// When a name is sent twice (a hidden input plus a checkbox), the last one wins, as on Shopify.
function bracketFields(form, group) {
  const fields = {};
  for (const [name, value] of form) {
    const match = name.match(new RegExp(`^${group}\\[(.+)\\]$`));
    if (match) fields[match[1]] = value;
  }
  return fields;
}

function setCartExtras(form) {
  if (form.has('note')) cartExtras.note = form.get('note');
  Object.assign(cartExtras.attributes, bracketFields(form, 'attributes'));
}

function buildCart() {
  const items = cartLines.map((line, index) => {
    const { product, variant } = data.findVariant(line.id);
    return {
      id: variant.id,
      product,
      variant,
      url: `${product.url}?variant=${variant.id}`,
      image: variant.featured_image || product.featured_image,
      quantity: line.quantity,
      properties: line.properties,
      final_price: variant.price,
      final_line_price: variant.price * line.quantity,
      url_to_remove: `/cart/change?line=${index + 1}&quantity=0`,
    };
  });
  return {
    items,
    item_count: items.reduce((sum, item) => sum + item.quantity, 0),
    total_price: items.reduce((sum, item) => sum + item.final_line_price, 0),
    currency: { iso_code: data.shop.currency },
    note: cartExtras.note,
    attributes: cartExtras.attributes,
  };
}

function setLineQuantity(index, quantity) {
  if (!cartLines[index]) return;
  if (quantity > 0) cartLines[index].quantity = quantity;
  else cartLines.splice(index, 1);
}

function addToCart(id, quantity, properties) {
  const found = data.findVariant(id);
  if (!found) return 'We could not find that product.';
  if (!found.variant.available) return `${found.product.title} is sold out.`;
  // The same doll with a different engraving is a separate line.
  const key = JSON.stringify(properties);
  const line = cartLines.find((item) => String(item.id) === String(id) && JSON.stringify(item.properties) === key);
  if (line) line.quantity += quantity;
  else cartLines.push({ id: found.variant.id, quantity, properties });
  return null;
}

// Filters and sorting

const SORTS = {
  'title-ascending': (a, b) => a.title.localeCompare(b.title),
  'price-ascending': (a, b) => a.price - b.price,
  'price-descending': (a, b) => b.price - a.price,
};

function applyFacets(products, query, basePath) {
  // The page address with one filter choice switched on or off, as Shopify's url_to_add / url_to_remove.
  const urlWith = (param, value, on) => {
    const next = new URLSearchParams(query);
    const others = next.getAll(param).filter((item) => item !== value);
    next.delete(param);
    for (const item of others) next.append(param, item);
    if (on) next.append(param, value);
    const search = next.toString();
    return basePath + (search ? `?${search}` : '');
  };
  const choice = (label, param, value, count) => ({
    label,
    value,
    param_name: param,
    active: query.getAll(param).includes(value),
    count,
    url_to_add: urlWith(param, value, true),
    url_to_remove: urlWith(param, value, false),
  });

  const cents = (key) => {
    const value = parseFloat(query.get(key));
    return Number.isFinite(value) ? Math.round(value * 100) : null;
  };
  const availability = query.getAll('filter.v.availability');
  const types = query.getAll('filter.p.product_type');
  const engravable = query.getAll(ENGRAVABLE).includes('1');
  const min = cents('filter.v.price.gte');
  const max = cents('filter.v.price.lte');
  const canEngrave = (product) => Boolean(product.metafields.custom.personalizable.value);

  const tests = {
    availability: (product) => !availability.length || availability.includes(product.available ? '1' : '0'),
    type: (product) => !types.length || types.includes(product.type),
    engravable: (product) => !engravable || canEngrave(product),
    price: (product) => (min === null || product.price >= min) && (max === null || product.price <= max),
  };
  const matches = (product, except) => Object.entries(tests).every(([key, test]) => key === except || test(product));

  const list = (label, key, param, options, valueOf) => {
    const values = options.map(([optionLabel, value]) =>
      choice(optionLabel, param, value, products.filter((product) => matches(product, key) && valueOf(product) === value).length)
    );
    return { label, type: 'list', param_name: param, values, active_values: values.filter((value) => value.active) };
  };

  // A yes/no filter built on the "personalizable" product metafield.
  const engraveChoice = choice(
    'Can be embroidered',
    ENGRAVABLE,
    '1',
    products.filter((product) => matches(product, 'engravable') && canEngrave(product)).length
  );

  const filters = [
    list('Availability', 'availability', 'filter.v.availability', [['In stock', '1'], ['Sold out', '0']], (product) => (product.available ? '1' : '0')),
    list('Type', 'type', 'filter.p.product_type', [...new Set(products.map((product) => product.type))].map((type) => [type, type]), (product) => product.type),
    {
      label: 'Can be embroidered',
      type: 'boolean',
      param_name: ENGRAVABLE,
      true_value: engraveChoice,
      active_values: engraveChoice.active ? [engraveChoice] : [],
    },
    {
      label: 'Price',
      type: 'price_range',
      param_name: 'filter.v.price',
      active_values: [],
      min_value: { param_name: 'filter.v.price.gte', value: min },
      max_value: { param_name: 'filter.v.price.lte', value: max },
      range_max: Math.max(0, ...products.map((product) => product.price)),
    },
  ];

  const sortBy = query.get('sort_by');
  const results = products.filter((product) => matches(product));
  if (SORTS[sortBy]) results.sort(SORTS[sortBy]);
  return { results, filters, sort_by: sortBy || null };
}

// Matches every typed word against a product's name, type and description, in the visitor's language too.
function searchProducts(terms, locale) {
  const words = terms.toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  return data.products.filter((product) => {
    const fields = { title: product.title, type: product.type, description: product.description };
    const text = Object.values({ ...fields, translated: Object.values(localize(fields, locale)).join(' ') })
      .join(' ')
      .toLowerCase();
    return words.every((word) => text.includes(word));
  });
}

const ENGRAVABLE = 'filter.p.m.custom.personalizable';

const SORT_NAMES = [
  { value: 'title-ascending', name: 'Name, A to Z' },
  { value: 'price-ascending', name: 'Price, low to high' },
  { value: 'price-descending', name: 'Price, high to low' },
];

// Routes

function readBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      // A doll with a name is sent as JSON; every other form sends ordinary form fields.
      const form = new URLSearchParams(body);
      form.json = /json/.test(req.headers['content-type'] || '') ? JSON.parse(body) : null;
      resolve(form);
    });
  });
}

async function handle(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  let requestPath = decodeURIComponent(url.pathname).replace(/(.)\/+$/, '$1');
  const query = url.searchParams;

  let locale = LOCALES[0];
  for (const candidate of LOCALES) {
    const prefix = candidate.root_url;
    if (prefix && (requestPath === prefix || requestPath.startsWith(`${prefix}/`))) {
      locale = candidate;
      requestPath = requestPath.slice(prefix.length) || '/';
    }
  }

  const send = (status, body, type = 'text/html; charset=utf-8') => {
    res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store' });
    res.end(body);
  };
  const json = (status, body) => send(status, JSON.stringify(body), 'application/json');
  const redirect = (location) => {
    res.writeHead(303, { Location: locale.root_url + location });
    res.end();
  };
  const page = async (template, globals, status = 200) =>
    send(status, await renderPage(template, requestPath, locale, { customer_posted: query.get('customer_posted') === 'true', ...globals }));
  const notFound = () => page('404', { page_title: 'Page not found' }, 404);

  let match;

  if (requestPath.startsWith('/assets/')) {
    const file = path.join(THEME, 'assets', path.basename(requestPath));
    if (!fs.existsSync(file)) return send(404, 'Not found', 'text/plain');
    const type = { '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml' }[path.extname(file)];
    return send(200, fs.readFileSync(file), type || 'application/octet-stream');
  }

  if ((match = requestPath.match(/^\/mock\/doll\/(\w+)-(\w+)-(\w+)-(\d)\.svg$/))) {
    return send(200, data.dollSvg(match[1], match[2], match[3], Number(match[4])), 'image/svg+xml');
  }

  if (requestPath.startsWith('/photos/')) {
    const name = path.basename(requestPath);
    if (!photoFiles.includes(name)) return send(404, 'Not found', 'text/plain');
    const types = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };
    return send(200, fs.readFileSync(path.join(PHOTOS, name)), types[path.extname(name).toLowerCase()]);
  }

  if ((match = requestPath.match(/^\/mock\/maker\/(\w+)-(\w+)-(\w+)\.svg$/))) {
    return send(200, data.makerSvg(match[1], match[2], match[3]), 'image/svg+xml');
  }

  // The cart as JSON, with any sections the theme asked to have re-rendered.
  const cartJson = async (params, extra = {}) => {
    const cart = buildCart();
    const body = { ...extra, item_count: cart.item_count, total_price: cart.total_price };
    const ids = (params.get('sections') || '').split(',').filter(Boolean);
    if (ids.length) body.sections = await renderSections(ids, requestPath, locale);
    return json(200, body);
  };

  if (req.method === 'POST') {
    const form = await readBody(req);

    // Several items at once: a doll and the charge for its embroidered name.
    if (requestPath === '/cart/add.js' && form.json) {
      for (const item of form.json.items || []) {
        const error = addToCart(item.id, Math.max(1, parseInt(item.quantity, 10) || 1), item.properties || {});
        if (error) return json(422, { status: 422, message: 'Cart Error', description: error });
      }
      return cartJson(new URLSearchParams({ sections: form.json.sections || '' }));
    }

    if (requestPath === '/cart/add.js' || requestPath === '/cart/add') {
      const properties = Object.fromEntries(
        Object.entries(bracketFields(form, 'properties')).filter(([, value]) => value.trim() !== '')
      );
      const error = addToCart(form.get('id'), Math.max(1, parseInt(form.get('quantity'), 10) || 1), properties);
      if (requestPath === '/cart/add') return redirect('/cart');
      if (error) return json(422, { status: 422, message: 'Cart Error', description: error });
      return cartJson(form, { id: Number(form.get('id')) });
    }

    if (requestPath === '/cart/change.js') {
      setLineQuantity(parseInt(form.get('line'), 10) - 1, Math.max(0, parseInt(form.get('quantity'), 10) || 0));
      return cartJson(form);
    }

    if (requestPath === '/cart/update.js') {
      setCartExtras(form);
      return cartJson(form);
    }

    if (requestPath === '/cart') {
      setCartExtras(form);
      // Work from the last line up so removing one doesn't shift the ones still to do.
      form
        .getAll('updates[]')
        .map((value, index) => [index, Math.max(0, parseInt(value, 10) || 0)])
        .reverse()
        .forEach(([index, quantity]) => setLineQuantity(index, quantity));
      return redirect(form.has('checkout') ? '/checkout' : '/cart');
    }

    if (requestPath === '/localization') {
      const target = LOCALES.find((item) => item.iso_code === form.get('locale_code')) || LOCALES[0];
      const location = (target.root_url + (form.get('return_to') || '/')).replace(/(.)\/$/, '$1');
      res.writeHead(303, { Location: location });
      return res.end();
    }

    // A newsletter sign-up goes back to the page it was sent from.
    if (requestPath === '/contact' && form.get('form_type') === 'customer') {
      const from = new URL(req.headers.referer || '/', `http://${req.headers.host}`);
      res.writeHead(303, { Location: `${from.pathname}?customer_posted=true#newsletter` });
      return res.end();
    }

    if (requestPath === '/contact') return redirect('/pages/contact?contact_posted=true#contact-form');
    return notFound();
  }

  if (requestPath === '/') return page('index');

  if (requestPath === '/collections') return page('list-collections', { page_title: 'Collections' });

  if ((match = requestPath.match(/^\/collections\/([\w-]+)$/))) {
    const base = data.collections[match[1]];
    if (!base) return notFound();
    const { results, filters, sort_by } = applyFacets(base.products, query, requestPath);
    const collection = {
      ...base,
      products: results,
      products_count: results.length,
      filters,
      sort_by,
      default_sort_by: 'manual',
      sort_options: [{ value: 'manual', name: 'Featured' }, ...SORT_NAMES],
    };
    return page('collection', { collection, page_title: base.title });
  }

  if ((match = requestPath.match(/^(?:\/collections\/[\w-]+)?\/products\/([\w-]+)$/))) {
    const base = data.products.find((item) => item.handle === match[1]);
    if (!base) return notFound();
    const selected = base.variants.find((variant) => String(variant.id) === query.get('variant')) || base.variants[0];
    const product = {
      ...base,
      selected_or_first_available_variant: selected,
      options_with_values: base.options_with_values.map((option) => ({ ...option, selected_value: selected.option1 })),
    };
    return page('product', { product, page_title: base.title });
  }

  if (requestPath === '/cart') return page('cart', { page_title: 'Your cart' });

  if (requestPath === '/cart.js') return cartJson(query);

  if (requestPath === '/cart/change') {
    setLineQuantity(parseInt(query.get('line'), 10) - 1, Math.max(0, parseInt(query.get('quantity'), 10) || 0));
    return redirect('/cart');
  }

  if ((match = requestPath.match(/^\/pages\/artist\/([\w-]+)$/))) {
    const metaobject = data.makers.find((item) => item.system.handle === match[1]);
    if (!metaobject) return notFound();
    return page('metaobject/artist', { metaobject, page_title: metaobject.name.value });
  }

  // Results as you type: the theme asks for the predictive-search section's HTML.
  if (requestPath === '/search/suggest') {
    const terms = (query.get('q') || '').trim();
    const limit = parseInt(query.get('resources[limit]'), 10) || 10;
    const predictive_search = {
      performed: terms !== '',
      terms,
      resources: { products: searchProducts(terms, locale).slice(0, limit) },
    };
    const id = query.get('section_id') || 'predictive-search';
    const sections = await renderSections([id], requestPath, locale, { predictive_search });
    return send(200, sections[id]);
  }

  if (requestPath === '/search') {
    const terms = (query.get('q') || '').trim();
    const found = searchProducts(terms, locale);
    const { results, filters, sort_by } = applyFacets(found, query, requestPath);
    const search = {
      performed: terms !== '',
      terms,
      results,
      results_count: results.length,
      filters,
      sort_by,
      sort_options: [{ value: 'relevance', name: 'Relevance' }, ...SORT_NAMES.slice(1)],
    };
    return page('search', { search, page_title: terms ? `Search: ${terms}` : 'Search' });
  }

  if ((match = requestPath.match(/^\/pages\/([\w-]+)$/))) {
    const found = data.pages[match[1]];
    if (!found) return notFound();
    const template = found.template_suffix ? `page.${found.template_suffix}` : 'page';
    return page(template, { page: found, page_title: found.title, contact_posted: query.get('contact_posted') === 'true' });
  }

  if (requestPath === '/account') {
    return send(200, '<p style="font: 1.1rem/1.6 system-ui; max-width: 36em; margin: 4rem auto; padding: 0 1.25rem">Customer accounts are hosted by Shopify, so the local preview stops here. On a real store this is where shoppers sign in to see their orders and delivery status. <a href="/">Back to the shop</a></p>');
  }

  if (requestPath === '/checkout') {
    return send(200, '<p style="font: 1.1rem/1.6 system-ui; max-width: 36em; margin: 4rem auto; padding: 0 1.25rem">Checkout is hosted by Shopify, so the local preview stops here. <a href="/cart">Back to the cart</a></p>');
  }

  return notFound();
}

http
  .createServer((req, res) => {
    handle(req, res).catch((error) => {
      console.error(error);
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end(`Preview error on ${req.url}\n\n${error.stack}`);
    });
  })
  .listen(PORT, () => {
    console.log(`Preview running at http://localhost:${PORT}`);
  });
