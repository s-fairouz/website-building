# Hazelwick: a Shopify theme for a handmade doll shop

- `theme/` is the Shopify theme. This is the only folder that goes to Shopify.
- `preview/` is a local stand-in for Shopify so you can see the theme without a store. It uses made-up dolls from `preview/data.js`.

## Preview on your computer

```
npm install
npm run preview
```

Then open http://localhost:9292. Edit any file in `theme/` and refresh the page.

The preview imitates Shopify; it is not Shopify. Checkout, real payments and the theme editor only work on a real store.

## Put it on a Shopify store

1. Create a store at shopify.com (a free trial is enough to test).
2. Zip the **contents** of `theme/` (the `assets`, `config`, `layout` and other folders should be at the top level of the zip).
3. In the Shopify admin go to **Online Store > Themes > Add theme > Upload zip file**, then **Customize** to preview it.
4. Add your dolls under **Products**, and group them under **Products > Collections**.
5. Create four pages under **Online Store > Pages** and pick a template for each:

   | Page | Template |
   | --- | --- |
   | About | `about` |
   | Contact | `contact` |
   | Questions and answers | `faq` |
   | Shipping and returns | Default page |

6. Under **Content > Menus**, edit **Main menu** and **Footer menu** to link to your collections and pages.
7. In **Customize**, open the home page hero and choose a **Featured doll**.
8. For filters on collection and search pages, install Shopify's free **Search & Discovery** app and choose which filters to show.

## Makers

Each maker is a Shopify *metaobject*, and each product points to its maker. Set this up once in the admin:

1. **Settings > Custom data > Metaobjects > Add definition.** Name it `Artist` (the type must be `artist`) and add these fields, using exactly these keys:

   | Key | Type |
   | --- | --- |
   | `name` | Single line text |
   | `portrait` | File (image) |
   | `location` | Single line text |
   | `bio` | Multi-line text |
   | `philosophy` | Multi-line text (shown under "Materials") |
   | `commission_status` | Single line text, limited to the choices `Open`, `Limited`, `Waitlist` |
   | `slots_remaining`, `slots_total` | Integer (used when the status is `Limited`) |
   | `instagram` | URL |
   | `collection` | Collection (that maker's products) |

2. In the same definition, turn on **Web pages** and choose the `artist` template, so each maker gets a profile page.
3. Add your makers under **Content > Metaobjects**.
4. Create a page called "Makers" with the `makers` template, and link it from the main menu.

## Personalized and made-to-order products

Add these product metafields under **Settings > Custom data > Products** (namespace and key as shown):

| Namespace and key | Type | What it does |
| --- | --- | --- |
| `custom.artist` | Metaobject reference (Artist) | Shows "Handmade by …" with a link to the maker |
| `custom.personalizable` | True or false | Shows the engraving field on the product page |
| `custom.lead_time_min_days`, `custom.lead_time_max_days` | Integer | Shows "Currently dispatching in 4–6 business days" |
| `custom.height_cm` | Integer | Shows the height on the product page ("38 cm (15 in)") and on cards |
| `custom.size` | Single line text | Shows a size line on the product page, such as "Full size" |
| `custom.colors` | List of metaobject references (Color) | Shows the available colours, with a swatch for each |

For the colours, first add a metaobject definition called `Color` (the type must be `color`) with two fields: `name` (single line text) and `swatch` (color). Add one entry per colour under **Content > Metaobjects**, then pick the ones each doll comes in. When a colour's name matches a variant option exactly (say both are "Rosehip"), its swatch also appears on that button in the colour picker.

The drawing beside the height shows the doll against a 45 cm tape measure, so shoppers can compare sizes between dolls. It is drawn from `custom.height_cm`; there is nothing to upload.

Detail photos need no setup: every photo you upload to a product appears as a thumbnail under the main one.

The engraved name, gift-wrap choice and gift message all arrive with the order in the Shopify admin: the name on the line item, gift wrap under "Additional details", and the message as the order note.

The free-shipping amount shown in the cart drawer is a setting on the **Cart drawer** section in the theme editor. It only controls the message; the real shipping rate is set under **Settings > Shipping and delivery**.

## Catalog page

- **Title:** the big title is the collection's name in Shopify. To get "The Heirloom Doll Collection", create a collection with that name (give it the handle `all` if it should replace Shopify's built-in "all products" page).
- **Line above the title:** a setting on the **Collection** section in the theme editor.
- **Filter pills and the Filters drawer:** these show whatever filters you switch on in the free **Search & Discovery** app. Product type, availability and price are built in. For a "Can be engraved" pill, add the `custom.personalizable` metafield as a filter there.
- **Card badge:** "3 in stock" appears when Shopify tracks stock for the product and five or fewer are left; "Made to order" appears when the product has lead-time metafields.
- **Second photo on hover:** the product's second image.
- **"Add to cart" on a card:** shown for products with nothing to choose. Products with options or engraving show "Choose options" and go to the product page.

- **Search:** the search button in the header opens a panel that lists matching dolls as the shopper types, using Shopify's built-in predictive search. Pressing Enter still opens the full results page.
- **Header:** the announcement messages (up to three) and the menu are settings on the **Header** section. The orders icon appears only when customer accounts are switched on under **Settings > Customer accounts**.

Most photos in the preview are drawings. To try real photos, or to generate placeholder ones, see `preview/photos/README.md`.

## Languages

The theme speaks English and French. In the preview, French is at http://localhost:9292/fr, or use the language menu in the footer.

Translations live in two places:

- **Interface text** (buttons, labels, messages) is in `theme/locales/en.default.json` and `theme/locales/fr.json`. To add another language, copy `fr.json` to, say, `es.json` and translate the values.
- **Your content** (products, pages, menus, and text typed into the theme editor) is translated in the Shopify admin, not in the theme. `preview/content.fr.js` holds French versions for the preview only.

To turn French on in a real store:

1. Go to **Settings > Languages**, add French and publish it.
2. Install Shopify's free **Translate & Adapt** app and translate your products, pages, menus and theme text. You can paste the French text from `preview/content.fr.js`.

The language menu in the footer appears on its own once a second language is published.

## Where things are

| To change | Edit |
| --- | --- |
| Colours | Theme editor > Theme settings > Colors |
| Home page text, steps, FAQ answers | Theme editor (or the JSON files in `theme/templates/`) |
| Fonts, spacing, image backdrops | `theme/assets/base.css` |
| Variant picker, add to cart, cart drawer | `theme/assets/theme.js` |
| A section's markup | `theme/sections/` |
