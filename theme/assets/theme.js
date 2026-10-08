// Filters and sorting: reload the results as soon as a choice changes.
document.querySelectorAll('form[data-auto-submit]').forEach((form) => {
  form.addEventListener('change', () => form.submit());
});

// Language picker: switch as soon as a language is chosen.
document.querySelectorAll('.language-form').forEach((form) => {
  form.addEventListener('change', () => form.submit());
});

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

  product.querySelectorAll('[data-thumb]').forEach((thumb) => {
    thumb.addEventListener('click', () => showImage(thumb.dataset.thumb, thumb.dataset.thumbAlt));
  });

  // Add to cart without leaving the page, then open the drawer.
  // Without JavaScript the form posts normally and Shopify shows the cart page.
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    addButtons.forEach((button) => {
      button.disabled = true;
    });
    status.textContent = '';

    try {
      await updateCart(text.addUrl, new URLSearchParams(new FormData(form)));
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
