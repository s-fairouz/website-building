# Product photos for the preview

The preview shows the photos in this folder; a doll without one falls back to a drawing. The eight files here are the photos you supplied, cropped to fit the cards. `bram.jpg` is a closer crop of the pair in `spare-smock.jpg`, because there were seven different photos for eight products.

## How to name the files

Name each file after the product's handle (the last part of its web address):

| File | Used for |
| --- | --- |
| `wren.jpg` | Wren's main photo |
| `wren-2.jpg` | Optional second photo, shown when hovering the card |
| `wren-3.jpg` to `wren-6.jpg` | Optional extra detail photos for the product page |

The `-2` and `-3` files here are close-ups cut from each main photo (face and outfit), so they are a little soft. Replace them with real close-ups when you have them.

`.jpg`, `.png` and `.webp` all work. Portrait photos at a 4:5 ratio (for example 1200 × 1500) fit the cards without cropping. Restart the preview (`npm run preview`) after adding files.

Handles in the preview: `wren`, `odile`, `pim`, `marguerite`, `tansy`, `bram`, `juno`, `spare-smock`.

On a real Shopify store none of this applies: upload photos to each product in the admin, and the second photo becomes the hover shot automatically.

## Prompts for generating photos like yours

These are written to match the photo you supplied: a crocheted yarn doll sitting on a windowsill in daylight. They produce pictures of dolls that do not exist, which is fine for designing the store, but **replace them with photos of your actual dolls before you sell anything**: a product photo has to show the product the customer will receive.

Keep the same closing lines on every prompt so the set looks like one shoot. If your image tool accepts a reference image, give it `wren.jpg` as the style reference.

**Shared closing lines (add to every prompt)**

> Photographed on a dark grey windowsill beside a window, soft overcast daylight from the right, blurred city greenery outside, shallow depth of field, shot on a phone camera at eye level with the doll. Natural colours, no text, no logos, no people. Portrait orientation, 4:5 aspect ratio, realistic photograph.

**Main photo, full-size doll**

> A handmade crocheted amigurumi doll, about 30 cm tall, sitting on the edge of the sill with legs dangling. Tight single-crochet stitches in pale peach cotton yarn for the skin, small black safety eyes set wide apart, soft orange embroidered blush, no mouth. Shaggy shoulder-length hair made of loose dark-brown yarn strands with an uneven fringe. Wearing a white ribbed knit top, a long open mustard-yellow knitted cardigan and wide coral-pink knitted trousers. A small ceramic pot with a green plant beside it.

Change the hair and clothes per doll, for example:

- "black yarn hair in a top bun, sage-green cardigan, cream trousers"
- "long honey-blonde yarn hair, dusty-blue cardigan, white knitted dress"
- "short ginger yarn hair, cream cardigan, sage-green dungarees"
- "two dark-brown yarn pigtails, deep brown cotton-yarn skin, coral knitted dress"

**Main photo, pocket doll**

> A tiny handmade crocheted amigurumi doll, about 12 cm tall, sitting on the windowsill leaning against a small ceramic plant pot. Tight crochet stitches, small black safety eyes, orange blush, short yarn hair, a simple knitted sage-green dress. A wooden thread spool beside it for scale.

**Hover photo, stitch detail**

> Extreme close-up of a crocheted amigurumi doll's face and shoulder. Individual single-crochet stitches in pale peach cotton yarn, a glossy black safety eye, soft orange blush, loose strands of dark-brown yarn hair falling across the forehead, the ribbed collar of a mustard knitted cardigan.

**Hover photo, gift packaging**

> A crocheted amigurumi doll lying in an open kraft-paper gift box lined with cream tissue paper, a small round wooden name tag on a cotton string beside it, a sprig of dried flowers, the box on the same dark windowsill.

**Maker portrait**

> A craftsperson's hands holding a crochet hook and a half-finished amigurumi doll's head in pale peach cotton yarn, a ball of yarn and small scissors on a wooden table by a window. Face not shown.

**Midjourney settings:** add `--ar 4:5 --style raw` to the end of each prompt, and `--sref` followed by the address of your photo to match its look.
