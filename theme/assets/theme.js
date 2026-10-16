// Filters and sorting: reload the results as soon as a choice changes.
document.querySelectorAll('form[data-auto-submit]').forEach((form) => {
  form.addEventListener('change', () => form.submit());
});

// Language picker: switch as soon as a language is chosen.
document.querySelectorAll('.language-form').forEach((form) => {
  form.addEventListener('change', () => form.submit());
});

// Header menu: when the links do not fit beside the icons, fold them behind the menu button.
const siteHeader = document.querySelector('.site-header');
const siteNav = siteHeader && siteHeader.querySelector('.site-nav');

if (siteNav) {
  const overflows = () => siteNav.scrollWidth > siteNav.clientWidth + 1;
  const fitMenu = () => {
    // Measure with the links showing. Make room first; fold the menu only if that is not enough.
    siteHeader.classList.remove('is-tight', 'is-compact');
    if (!overflows()) return;
    siteHeader.classList.add('is-tight');
    if (!overflows()) return;
    siteHeader.classList.replace('is-tight', 'is-compact');
  };
  new ResizeObserver(fitMenu).observe(siteHeader);
  // Web fonts change the links' widths once they load.
  if (document.fonts) document.fonts.ready.then(fitMenu);
}

// Search panel: the header's search button opens it in place.
const searchDrawer = document.querySelector('[data-search-drawer]');

if (searchDrawer) {
  document.querySelectorAll('[data-open-search]').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      searchDrawer.showModal();
    });
  });

  searchDrawer.addEventListener('click', (event) => {
    // A click on the dialog element itself is a click on the backdrop.
    if (event.target === searchDrawer || event.target.closest('[data-close-dialog]')) searchDrawer.close();
  });
}

// Search field: show matching dolls under it while typing, without leaving the page.
document.querySelectorAll('[data-predictive-search]').forEach((form) => {
  const input = form.querySelector('input[type="search"]');
  const panel = form.querySelector('[data-results]');
  let timer;
  let request;

  const close = () => {
    panel.hidden = true;
  };

  const search = async () => {
    const terms = input.value.trim();
    if (request) request.abort();
    if (terms.length < 2) {
      panel.replaceChildren();
      close();
      return;
    }

    request = new AbortController();
    const params = new URLSearchParams({
      q: terms,
      'resources[type]': 'product',
      'resources[limit]': '5',
      section_id: 'predictive-search',
    });

    try {
      const response = await fetch(`${form.dataset.url}?${params}`, { signal: request.signal });
      if (!response.ok) throw new Error(response.status);
      const html = new DOMParser().parseFromString(await response.text(), 'text/html');
      const results = html.querySelector('[data-predictive-results]');
      if (!results) throw new Error('no results markup');
      panel.replaceChildren(results);
      panel.hidden = false;
    } catch (error) {
      // Suggestions are a convenience; pressing Enter still opens the full results page.
      if (error.name !== 'AbortError') close();
    }
  };

  input.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(search, 200);
  });
  input.addEventListener('focus', () => {
    if (panel.childElementCount > 0) panel.hidden = false;
  });
  form.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || panel.hidden) return;
    close();
    input.focus();
  });
  document.addEventListener('click', (event) => {
    if (!form.contains(event.target)) close();
  });
});

// Catalog controls

// Filter drawer. Newer browsers open it from the button's command attribute on their own.
const filterDrawer = document.querySelector('[data-filter-drawer]');

if (filterDrawer) {
  if (!('command' in HTMLButtonElement.prototype)) {
    document.querySelectorAll('[data-open-filters]').forEach((button) => {
      button.addEventListener('click', () => filterDrawer.showModal());
    });
  }

  filterDrawer.addEventListener('click', (event) => {
    // A click on the dialog element itself is a click on the backdrop.
    if (event.target === filterDrawer || event.target.closest('[data-close-dialog]')) filterDrawer.close();
  });
}

// Sort menu: close on Escape or a click elsewhere.
document.querySelectorAll('[data-dropdown]').forEach((dropdown) => {
  document.addEventListener('click', (event) => {
    if (!dropdown.contains(event.target)) dropdown.open = false;
  });
  dropdown.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || !dropdown.open) return;
    dropdown.open = false;
    dropdown.querySelector('summary').focus();
  });
});

// "See more dolls": brings the next page's cards into the grid without leaving the page.
// The address follows, so a refresh or a shared link shows the same page, and keyboard
// focus moves to the first new doll. If the page can't be fetched, the link is followed.
document.addEventListener('click', async (event) => {
  const link = event.target.closest('[data-load-more-link]');
  if (!link || link.getAttribute('aria-disabled') === 'true') return;
  const grid = document.querySelector('[data-load-more-grid]');
  if (!grid) return;
  event.preventDefault();

  const block = link.closest('[data-load-more]');
  const label = link.textContent;
  link.setAttribute('aria-disabled', 'true');
  link.textContent = link.dataset.textLoading;

  try {
    const response = await fetch(link.href);
    if (!response.ok) throw new Error(response.statusText);
    const next = new DOMParser().parseFromString(await response.text(), 'text/html');
    const cards = [...next.querySelectorAll('[data-load-more-grid] > li')];
    grid.append(...cards);
    const nextBlock = next.querySelector('[data-load-more]');
    if (nextBlock) block.replaceWith(nextBlock);
    else block.remove();
    history.replaceState(history.state, '', link.href);
    const first = cards[0] && cards[0].querySelector('a');
    if (first) first.focus();
  } catch {
    link.textContent = label;
    link.removeAttribute('aria-disabled');
    window.location.href = link.href;
  }
});

// Cart drawer

const drawer = document.querySelector('[data-cart-drawer]');

const renderCart = (html) => {
  const next = new DOMParser().parseFromString(html, 'text/html').querySelector('[data-cart-drawer-body]');
  drawer.querySelector('[data-cart-drawer-body]').replaceChildren(...next.childNodes);
  document.querySelectorAll('[data-cart-count]').forEach((count) => {
    count.textContent = next.dataset.itemCount;
  });
};

// Sends a cart change to Shopify and redraws the drawer from the section HTML it returns.
const updateCart = async (url, params) => {
  params.set('sections', 'cart-drawer');
  const response = await fetch(`${url}.js`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: params,
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.description || result.message);
  if (drawer && result.sections && result.sections['cart-drawer']) renderCart(result.sections['cart-drawer']);
  return result;
};

if (drawer) {
  // Redrawing replaces the drawer's contents, so put focus back where it was.
  const change = async (url, values) => {
    const focusedId = document.activeElement && document.activeElement.id;
    try {
      await updateCart(url, new URLSearchParams(values));
    } catch (error) {
      window.location.href = drawer.dataset.cartUrl;
      return;
    }
    const focused = focusedId && document.getElementById(focusedId);
    (focused || drawer.querySelector('[data-cart-close]')).focus();
  };

  drawer.addEventListener('click', (event) => {
    const remove = event.target.closest('[data-remove]');
    if (remove) change(drawer.dataset.changeUrl, { line: remove.dataset.remove, quantity: 0 });
    // A click on the dialog element itself is a click on the backdrop.
    if (event.target === drawer || event.target.closest('[data-cart-close]')) drawer.close();
  });

  drawer.addEventListener('change', (event) => {
    const field = event.target;
    if (field.matches('[data-line]')) {
      change(drawer.dataset.changeUrl, { line: field.dataset.line, quantity: field.value });
    } else if (field.matches('[data-cart-note]')) {
      change(drawer.dataset.updateUrl, { note: field.value });
    } else if (field.matches('[data-cart-attribute]')) {
      change(drawer.dataset.updateUrl, {
        [`attributes[${field.dataset.cartAttribute}]`]: field.checked ? field.value : '',
      });
    }
  });

  // The cart link opens the drawer, except on the cart page itself.
  document.querySelectorAll('[data-cart-open]').forEach((link) => {
    link.addEventListener('click', (event) => {
      if (document.body.classList.contains('template-cart')) return;
      event.preventDefault();
      drawer.showModal();
    });
  });
}

// Product cards: "Add to cart" adds the doll and opens the drawer without leaving the page.
// If that fails, the form posts normally and Shopify shows the cart or the reason.
document.addEventListener('submit', async (event) => {
  const form = event.target;
  const button = form.querySelector('[data-quick-add]');
  if (!button || !drawer) return;

  event.preventDefault();
  button.disabled = true;
  try {
    await updateCart(form.getAttribute('action'), new URLSearchParams(new FormData(form)));
    drawer.showModal();
  } catch (error) {
    form.submit();
  } finally {
    button.disabled = false;
  }
});

// Product page

const product = document.querySelector('[data-product]');

if (product) {
  const variants = JSON.parse(product.querySelector('[data-variants]').textContent);
  const prices = JSON.parse(product.querySelector('[data-variant-prices]').textContent);
  const text = product.dataset;
  const form = product.querySelector('form[action*="/cart/add"]');
  const idInput = form.querySelector('[name="id"]');
  const addButtons = product.querySelectorAll('[data-add]');
  const status = form.querySelector('[data-add-status]');
  const mainImage = product.querySelector('[data-product-image]');
  const buyBar = product.querySelector('[data-buy-bar]');

  const element = (tag, className, content) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (content) node.textContent = content;
    return node;
  };

  const showImage = (src, alt) => {
    if (!mainImage || !src) return;
    mainImage.src = src;
    mainImage.removeAttribute('srcset');
    if (alt !== undefined) mainImage.alt = alt;
  };

  const priceLine = (variant) => {
    const line = element('p', 'price');
    line.append(element('span', 'price__now', prices[variant.id].price));
    if (variant.compare_at_price > variant.price) {
      const was = element('s', 'price__was');
      was.append(element('span', 'visually-hidden', `${text.textWas} `), prices[variant.id].compare);
      line.append(' ', was);
    }
    return line;
  };

  const showVariant = (variant) => {
    const available = Boolean(variant && variant.available);
    addButtons.forEach((button) => {
      button.disabled = !available;
      button.textContent = available ? text.textAdd : text.textSoldOut;
    });
    status.textContent = '';
    if (!variant) return;

    idInput.value = variant.id;
    product.querySelectorAll('[data-price]').forEach((price) => price.replaceChildren(priceLine(variant)));
    if (variant.featured_image) showImage(variant.featured_image.src, variant.featured_image.alt || '');

    const url = new URL(window.location.href);
    url.searchParams.set('variant', variant.id);
    window.history.replaceState({}, '', url);
  };

  form.addEventListener('change', (event) => {
    if (!event.target.matches('[data-option-position]')) return;
    const chosen = [...form.querySelectorAll('[data-option-position]:checked')]
      .sort((a, b) => a.dataset.optionPosition - b.dataset.optionPosition)
      .map((input) => input.value);
    showVariant(variants.find((variant) => variant.options.every((value, i) => value === chosen[i])));
  });

  const thumbs = product.querySelectorAll('[data-thumb]');
  thumbs.forEach((thumb) => {
    thumb.addEventListener('click', () => {
      showImage(thumb.dataset.thumb, thumb.dataset.thumbAlt);
      // The ring follows the photo being shown.
      thumbs.forEach((other) => other.removeAttribute('aria-current'));
      thumb.setAttribute('aria-current', 'true');
    });
  });

  // Head colour and body fabrics: each choice's name is written beside its label, and the
  // small body sketches take the outside and inside fabrics' colours.
  const body = form.querySelector('[data-body]');
  const showChoices = () => {
    form.querySelectorAll('[data-choice]').forEach((choice) => {
      const input = choice.querySelector('input:checked');
      const name = choice.querySelector('[data-choice-name]');
      if (input && name) name.textContent = input.value;
    });
    if (!body) return;
    [['outer', '--cloth'], ['inner', '--lining']].forEach(([part, colour]) => {
      const input = body.querySelector(`[data-part="${part}"] input:checked`);
      if (input && input.dataset.hex) body.style.setProperty(colour, input.dataset.hex);
    });
  };
  form.addEventListener('change', (event) => {
    if (event.target.closest('[data-choice]')) showChoices();
  });
  showChoices();

  // The name: once something is typed, how many letters are left, warmer when only a few are.
  const typedName = form.querySelector('[data-name]');
  const nameCount = form.querySelector('[data-name-count]');
  if (typedName) {
    const showName = () => {
      if (!nameCount) return;
      const left = typedName.maxLength - typedName.value.length;
      nameCount.hidden = typedName.value.length === 0;
      nameCount.textContent = nameCount.dataset.textLeft.replace('[count]', left);
      nameCount.classList.toggle('is-low', left <= 3);
    };
    typedName.addEventListener('input', showName);
    showName();
  }

  // Quantity: the buttons either side of the number.
  const quantity = form.querySelector('[name="quantity"]');
  form.querySelectorAll('[data-step]').forEach((step) => {
    step.addEventListener('click', () => {
      quantity.value = Math.max(1, (parseInt(quantity.value, 10) || 1) + Number(step.dataset.step));
    });
  });

  // Adds the doll. When a name is typed and the shop charges for one, the charge goes in
  // the same request as its own cart line, carrying the name so the two stay together.
  const addDoll = async () => {
    const fields = new FormData(form);
    const nameField = form.querySelector('[data-name]');
    const name = nameField ? nameField.value.trim() : '';

    if (!name || !text.addonId) return updateCart(text.addUrl, new URLSearchParams(fields));

    const properties = {};
    for (const [key, value] of fields) {
      const match = key.match(/^properties\[(.+)\]$/);
      if (match && String(value).trim() !== '') properties[match[1]] = String(value).trim();
    }
    const nameLabel = nameField.name.match(/^properties\[(.+)\]$/)[1];
    const quantity = Math.max(1, parseInt(fields.get('quantity'), 10) || 1);
    const response = await fetch(`${text.addUrl}.js`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        items: [
          { id: Number(fields.get('id')), quantity, properties },
          { id: Number(text.addonId), quantity, properties: { [nameLabel]: name } },
        ],
        sections: 'cart-drawer',
      }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.description || result.message);
    if (drawer && result.sections && result.sections['cart-drawer']) renderCart(result.sections['cart-drawer']);
    return result;
  };

  // Add to cart without leaving the page, then open the drawer.
  // Without JavaScript the form posts normally and Shopify shows the cart page.
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    addButtons.forEach((button) => {
      button.disabled = true;
    });
    status.textContent = '';

    try {
      await addDoll();
      if (drawer) drawer.showModal();
      else window.location.href = text.cartUrl;
    } catch (error) {
      status.textContent = error.message || text.textError;
    } finally {
      addButtons.forEach((button) => {
        button.disabled = false;
      });
    }
  });

  // Show the phone buy bar only while the main button is off screen.
  if (buyBar && 'IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      buyBar.hidden = entry.isIntersecting;
    }).observe(form.querySelector('[data-add]'));
  }
}

// Cart page: the − and + buttons change a line's quantity and save the cart at once,
// so the "Update cart" button is only needed when the number is typed by hand.
document.querySelectorAll('[data-cart-page]').forEach((form) => {
  const update = form.querySelector('[data-cart-update]');
  const save = () => (form.requestSubmit ? form.requestSubmit(update) : form.submit());
  update.hidden = true;
  form.querySelectorAll('[data-cart-step]').forEach((step) => {
    step.addEventListener('click', () => {
      const input = step.parentElement.querySelector('input');
      input.value = Math.max(0, (parseInt(input.value, 10) || 0) + Number(step.dataset.cartStep));
      save();
    });
  });
  form.querySelectorAll('input[name="updates[]"]').forEach((input) => {
    input.addEventListener('change', save);
  });
});

// Adopt page: shows one step at a time, keeps the order ticket in step with the choices,
// and adds the doll (plus the name charge, when the switch is on) to the cart.
document.querySelectorAll('[data-journey]').forEach((journey) => {
  const form = journey.querySelector('form');
  const text = journey.dataset;
  const find = (selector) => journey.querySelector(selector);
  const steps = [...journey.querySelectorAll('[data-step]')];
  const stops = [...journey.querySelectorAll('[data-goto]')];
  const rail = find('[data-rail]');
  const nav = find('[data-flow-nav]');
  const back = find('[data-back]');
  const next = find('[data-next]');
  const adoptPane = find('[data-adopt-pane]');
  const ticket = find('[data-ticket]');
  const button = find('[data-journey-add]');
  const status = find('[data-journey-status]');
  const figure = find('[data-figure]');
  const look = find('[data-body]');
  const lookRows = [...journey.querySelectorAll('[data-look-part]')];
  const lookStep = steps.findIndex((step) => step.hasAttribute('data-look-step'));
  const wide = window.matchMedia('(min-width: 60rem)');
  let at = 0;
  let reached = 0;

  const chosen = (part) => {
    const input = journey.querySelector(`[data-recap-part="${part}"] input:checked:not(:disabled)`);
    return input ? input.value : '';
  };

  // Only the chosen companion's head colours are offered; the others are switched off so
  // they stay out of the order. Moving to another companion picks its first colour.
  const offerHeads = (model) => {
    journey.querySelectorAll('[data-heads-for]').forEach((group) => {
      const own = Boolean(model) && group.dataset.headsFor === model.value;
      const inputs = [...group.querySelectorAll('input')];
      group.hidden = !own;
      inputs.forEach((input) => {
        input.disabled = !own;
      });
      if (own && inputs.length && !inputs.some((input) => input.checked)) inputs[0].checked = true;
    });
  };

  // While a row of the Colours card is pointed at or in use, the sketch outlines its piece
  // of the doll: the head, the outside or the inside.
  lookRows.forEach((row) => {
    const mark = () => {
      figure.dataset.choosing = row.dataset.lookPart;
    };
    const unmark = () => {
      if (figure.dataset.choosing === row.dataset.lookPart) delete figure.dataset.choosing;
    };
    row.addEventListener('pointerenter', mark);
    row.addEventListener('focusin', mark);
    row.addEventListener('pointerleave', () => {
      if (!row.contains(document.activeElement)) unmark();
    });
    row.addEventListener('focusout', (event) => {
      if (!row.contains(event.relatedTarget)) unmark();
    });
  });

  const update = () => {
    const model = journey.querySelector('[data-model]:checked');
    offerHeads(model);

    // The sketch: cloth in the outside fabric with a corner turned back to show the inside one,
    // arms and bow from the choices. The head stays plain until the Colours step is reached,
    // so choosing a companion does not colour it.
    const part = (name) => [...journey.querySelectorAll(`[data-recap-part="${name}"] input`)];
    const head = part('head').find((input) => input.checked && !input.disabled);
    if (reached >= lookStep && head && head.dataset.hex) figure.style.setProperty('--tone', head.dataset.hex);
    else figure.style.removeProperty('--tone');
    if (head && head.dataset.hex) look.style.setProperty('--tone', head.dataset.hex);
    const outer = part('outer').find((input) => input.checked);
    const inner = part('inner').find((input) => input.checked);
    // The card's small sketches take the same colours as the big one.
    [figure, look].forEach((drawing) => {
      if (!drawing) return;
      if (outer && outer.dataset.hex) drawing.style.setProperty('--cloth', outer.dataset.hex);
      if (inner && inner.dataset.hex) drawing.style.setProperty('--lining', inner.dataset.hex);
    });
    figure.dataset.arms = String(part('shape').findIndex((input) => input.checked) > 0);
    figure.dataset.for = part('for').findIndex((input) => input.checked) > 0 ? 'second' : 'first';

    // Each row of the Colours card names its chosen colour beside its label, and the ticket
    // lists the same three.
    lookRows.forEach((row) => {
      const name = chosen(row.dataset.lookPart);
      row.querySelector('[data-choice-name]').textContent = name;
      find(`[data-recap="${row.dataset.lookPart}"]`).textContent = name;
    });
    find('[data-recap="version"]').textContent = [chosen('for'), chosen('shape').toLowerCase()].filter(Boolean).join(', ');

    if (!model) return;
    const price = model.dataset.priceText;
    find('[data-recap="doll"]').textContent = [model.dataset.title, model.dataset.kind.toLowerCase()].filter(Boolean).join(', ');
    find('[data-price-doll]').textContent = model.dataset.priceText;
    journey.querySelectorAll('[data-total]').forEach((total) => {
      total.textContent = price;
    });
    find('[data-adopt-name]').textContent = model.dataset.title;
    button.textContent = button.dataset.label.replace('[price]', price);
  };

  // The ticket is always open beside the questions on a wide screen and on the last stop,
  // where it is the summary; on a phone it stays folded under the question until tapped.
  const settleTicket = () => {
    ticket.open = wide.matches || at >= steps.length - 1;
  };

  const show = (index, focus = true) => {
    at = Math.max(0, Math.min(index, steps.length - 1));
    reached = Math.max(reached, at);
    steps.forEach((step, i) => {
      step.hidden = i !== at;
    });
    stops.forEach((stop, i) => {
      stop.disabled = i > reached;
      if (i === at) stop.setAttribute('aria-current', 'step');
      else stop.removeAttribute('aria-current');
    });
    form.dataset.at = at + 1;
    back.hidden = at === 0;
    // On the last stop the adopt button stands in Continue's place, beside Back.
    next.hidden = at === steps.length - 1;
    button.hidden = at !== steps.length - 1;
    adoptPane.hidden = at !== steps.length - 1;
    settleTicket();
    update();
    if (focus) {
      steps[at].querySelector('.step-pane__title').focus({ preventScroll: true });
      journey.scrollIntoView({ block: 'start' });
    }
  };

  back.addEventListener('click', () => show(at - 1));
  next.addEventListener('click', () => show(at + 1));
  stops.forEach((stop, i) => {
    stop.addEventListener('click', () => show(i));
  });
  wide.addEventListener('change', settleTicket);

  form.addEventListener('input', update);
  update();
  // Only one set of head colours shows from here on, so its companion's name would only repeat.
  journey.querySelectorAll('[data-set-title]').forEach((title) => {
    title.hidden = true;
  });
  rail.hidden = false;
  nav.hidden = false;
  nav.append(button);
  show(0, false);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const model = journey.querySelector('[data-model]:checked');
    if (!model) return;
    button.disabled = true;
    status.textContent = '';

    const properties = {};
    for (const [key, value] of new FormData(form)) {
      const match = key.match(/^properties\[(.+)\]$/);
      if (match && String(value).trim() !== '') properties[match[1]] = String(value).trim();
    }
    const items = [{ id: Number(model.value), quantity: 1, properties }];

    try {
      const response = await fetch(`${text.addUrl}.js`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ items, sections: 'cart-drawer' }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.description || result.message);
      if (drawer && result.sections && result.sections['cart-drawer']) {
        renderCart(result.sections['cart-drawer']);
        drawer.showModal();
      } else {
        window.location.href = text.cartUrl;
      }
    } catch (error) {
      status.textContent = error.message || text.textError;
    } finally {
      button.disabled = false;
    }
  });
});
