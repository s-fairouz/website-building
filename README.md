# Kwaii: a Shopify theme for a handmade doll shop

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
| `custom.personalizable` | True or false | Shows the name field and thread choice on the product page |
| `custom.lead_time_min_days`, `custom.lead_time_max_days` | Integer | Shows "Currently dispatching in 4–6 business days" |
| `custom.height_cm` | Integer | Shows the height on the product page ("38 cm (15 in)") and on cards |
| `custom.size` | Single line text | Shows a size line on the product page, such as "Full size" |
| `custom.colors` | List of metaobject references (Color) | Shows the available colours, with a swatch for each |

For the colours, first add a metaobject definition called `Color` (the type must be `color`) with two fields: `name` (single line text) and `swatch` (color). Add one entry per colour under **Content > Metaobjects**, then pick the ones each doll comes in. When a colour's name matches a variant option exactly (say both are "Rosehip"), its swatch also appears on that button in the colour picker.

The drawing beside the height shows the doll against a 45 cm tape measure, so shoppers can compare sizes between dolls. It is drawn from `custom.height_cm`; there is nothing to upload.

Detail photos need no setup: every photo you upload to a product appears as a thumbnail under the main one.

The embroidered name, thread, body fabric, gift-wrap choice and gift message all arrive with the order in the Shopify admin: the name, thread and fabric on the line item, gift wrap under "Additional details", and the message as the order note.

The free-shipping amount shown in the cart drawer is a setting on the **Cart drawer** section in the theme editor. It only controls the message; the real shipping rate is set under **Settings > Shipping and delivery**.

More product metafields describe what a doll is made of and how. Each is optional; a line only shows when it is filled in.

| Namespace and key | Type | Shown as |
| --- | --- | --- |
| `custom.fabrics` | List of metaobject references (Color) | A "Body fabric" picker; the choice arrives on the order |
| `custom.materials` | Single line text | "Made of" |
| `custom.technique` | Single line text | "How it's made" |
| `custom.making_time` | Single line text | "Handwork" |
| `custom.stitches` | Single line text | "Stitches" |
| `custom.making_steps` | List of single line text | The steps under "How this doll was made", in order |

**Charging for a name.** Create a product called "Name embroidery" priced at what a name costs. In the theme editor, pick it as **Embroidery charge** on the **Product** section and on the home page's **Personalization** section. It is then added to the cart whenever a name is typed, and its price is shown under the doll's price. Leave it empty to embroider for free.

The lines under the price (delivery time, returns, what the doll comes with) are settings on the **Product** section.

Makers have one more optional field, `pieces_made` (integer), shown on their cards.

## Home page

The home page runs: hero, **Promises**, **Story**, **Companions**, makers, **Personalization**, **Reviews** and **Newsletter**. **Companions** shows up to eight products as cards, each drawn in its own colour until it has a photo; add one block per product and, if you like, a badge such as "Favourite of mums". The older **Featured collection** and **How a doll is made** sections are still in the theme and can be added back from the theme editor.

Makers have two more optional fields, `specialty` and `makes` (both single line text), shown on their cards. All their text is edited in the theme editor. Reviews are typed in by hand, one block each, so use your own customers' words. Newsletter sign-ups appear under **Customers** in the Shopify admin, tagged `newsletter`.

The sample text in these sections mentions an Oeko-Tex certification, suitability from birth, an adoption certificate and three customer quotes. Change or remove anything that is not true of your shop before you open it.

## Colours

Every page uses the palette cream (`#FAF7F2`, **Page background** in the theme settings) and every card is white (**Cards and panels**), with a fine edge and a soft shadow. Small tiles and notes inside a card take the page colour so they show on the white. The **Hero**, **Makers**, **Personalization** and **Newsletter** sections have a **Background** choice in the theme editor if you ever want one to stand out; leave it on "Same as the page" to keep the single ground.

## Order journey page

The **Order journey** section asks one question per screen (the doll, girl or boy, with or without arms, body fabric) while an order ticket beside it fills in with the choices and the total. The last two stops are the summary and the "Adopt" button. Without JavaScript the steps simply follow one another down the page. The preview shows it at `/pages/adopt`.

To use it on a store, create a page with the `adopt` template and link it from the main menu. Then, in the theme editor, add a **Doll** block for each doll to offer. Every title and description on the page is a setting you can reword.

The choices arrive on the order as line item properties (For, Shape, Body fabric). A name is not asked for here; name embroidery is offered on each doll's own product page. The "Free from $50" line is plain text: keep it in step with **Free shipping from** on the **Cart drawer** section, which this theme now sets to 50.

## Adoption certificate page

The **Adoption certificate** section lays a certificate out as a numbered workshop record: child and doll, number and date, gift message, what the doll is made of, the dated making steps, the maker and their signature. The preview shows it at `/pages/certificate`.

Create a page with the `certificate` template and pick the doll in the theme editor. The doll's materials, handwork time, stitches and maker come from the product; the names, number, dates and messages are typed into the section. It shows one certificate: a different one for every order needs an app.

## Catalog page

- **Title:** the big title is the collection's name in Shopify. To get "The Heirloom Doll Collection", create a collection with that name (give it the handle `all` if it should replace Shopify's built-in "all products" page).
- **Line above the title:** a setting on the **Collection** section in the theme editor.
- **Filter pills and the Filters drawer:** these show whatever filters you switch on in the free **Search & Discovery** app. Product type, availability and price are built in. For a "Can be embroidered" pill, add the `custom.personalizable` metafield as a filter there.
- **Card badge:** "3 in stock" appears when Shopify tracks stock for the product and five or fewer are left; "Made to order" appears when the product has lead-time metafields.
- **Second photo on hover:** the product's second image.
- **"Add to cart" on a card:** shown for products with nothing to choose. Products with options or a name field show "Choose options" and go to the product page.

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
