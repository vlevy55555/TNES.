# v1 release — 30 works to Shopify

`products.json` is the whole spec, transcribed from
`TNES_Shop_Developer_Handoff_FINAL_30_Works_v3.docx` (25 aug 2026).
`push.mjs` applies it to `tnes-3.myshopify.com`. Both are idempotent: re-running
updates in place, it never duplicates.

## Run

```bash
node shopify-release/prep-images.mjs          # masters -> 4472px JPEGs (once)
node shopify-release/push.mjs --dry-run       # what it will touch, no calls
export SHOPIFY_ADMIN_TOKEN=shpat_...          # see below
node shopify-release/push.mjs                 # do it
```

Auth is a custom app's Admin API token in `SHOPIFY_ADMIN_TOKEN`. In the Shopify
admin: Settings -> Apps and sales channels -> Develop apps -> Create an app ->
Configure Admin API scopes -> Install -> reveal the token. Scopes needed:

    write_products, read_products, write_files, read_files,
    write_metafield_definitions, read_metafield_definitions,
    write_content, read_content

`write_content` is only for the Grey Day redirect; drop it and that one step
fails while everything else still lands.

The token never touches the repo. Export it in the shell, or keep it in a file
git ignores and `source` it. If it is exported instead, `history -d` the line.

With no `SHOPIFY_ADMIN_TOKEN` set, the script falls back to a session from
`shopify store auth --store tnes-3.myshopify.com --scopes <the list above>`.
That path needs a Partner org that owns the store and a working browser
callback; the token path needs neither.

Either way the first call is a `{ shop { name } }` preflight, so bad auth stops
the run before anything is created.

## What it does

- creates the 10 `custom.*` metafield definitions from section 3 of the handoff
- 15 variants each (3 sizes x Unframed/White/Black/Glass Block/Aluminium Support) at $1600 / $2100 / $2600,
- 12 variants each (3 sizes x Unframed/White/Black/Glass Block) at $1600 / $2100 / $2600,
  untracked inventory, matching the configuration already live on the 12
- uploads the image with its alt text; on the existing 12 it only sets alt text,
  since their masters are already in Shopify
- writes every metafield, then `custom.related_works` in a second pass once all
  30 product IDs exist
- 301s `/products/moreira-crowded-beach` -> `/products/grey-day-moraira`

## Decisions worth knowing

**Handles.** The handoff's "KEEP existing handle" column does not match this
store: it lists `alpine-lake-appenzell`, the store has `appenzell-alpine-lake`,
and so on for all 12. Keeping the live handles is what "keep" has to mean here —
they are also what `src/data/artworks.ts` points at. The 18 new works use the
handoff handles verbatim. Grey Day is the one deliberate rename, because the
checklist calls for it by name.

**Sizes.** Landscape works are merchandised as 20x30/24x36/28x42 and portrait
works as 30x20/36x24/42x28. That reads backwards, but it is the convention on
all 12 live products and section 12 says to preserve the live configuration.

**Prices.** $1600/$2100/$2600 from the live store, not the $236/$566/$756 in
`TNES. v1 Products Standard Sizes + Prices.docx` — the handoff explicitly
supersedes that document.

## Not done here

Filtering, shop order rendering, the Travel Note and Related Moments modules
(sections 2, 10, 11) are theme/frontend work. This script only puts the data
where the theme can read it.

## Low-resolution sources

`grey-day-moraira` (1024x1280) and `perigo-praia-da-baleia` (2048x1365) are the
only two masters below print resolution. Everything else is 4472px. Worth
replacing before the works go on sale.
