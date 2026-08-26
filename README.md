# Advisor Desk / Garage Finder / Claim.Wire — upload guide

Upload **every file in this folder** into the same folder on your server.
Paths are relative, so there is nothing to configure.

This repo now serves three linked pages from one site, cross-linked from
each page's masthead/nav:

| Page | File | What it is |
|---|---|---|
| **Advisor Desk** | `index.html` | The site's home page — shift board, scripts/docs index, escalation matrix, ops feed |
| **Garage Finder** | `garage-finder.html` | UAE workshop directory (agency + non-agency), the original app this repo was built around |
| **Claim.Wire** | `claimwire.html` | Per-insurer claim registration steps, contacts, and a Gmail-compose form |

`index.html` being Advisor Desk (not Garage Finder) matters for hosting:
static hosts like GitHub Pages serve whatever is named `index.html` as the
site root, so Advisor Desk is what visitors land on by default.

## Folder layout

```
garage-finder-site/
├── index.html          Advisor Desk — site home page
├── garage-finder.html  Garage Finder — workshop directory (public entry for that tool)
├── claimwire.html      Claim.Wire — claim registration wizard
├── admin.html          Garage Finder's review entry
├── submit.php          Garage Finder's form endpoint
├── core-v4.js          Garage Finder's shared engine (window.GF)
├── security-v4.js      Garage Finder's shared HTML-escaping helper (window.GF_SECURITY)
├── advisor-desk.js     Advisor Desk's page script
├── claimwire.js        Claim.Wire's page script
├── README.md
│
├── data/                          workshop + insurer data (edit these)
│   ├── data-agency.js
│   ├── data-nonagency.js
│   ├── data-insurers.js           master insurer list — also the source for Claim.Wire's dropdown (via claimwireId)
│   └── data-claimwire-playbooks.js  Claim.Wire's per-insurer contacts/SLAs/directories
│
├── css/                all stylesheets
│   ├── shared.css      Garage Finder's picker + add-workshop form
│   ├── admin.css / styles.css   Garage Finder's admin page
│   ├── design-*.css    Garage Finder's six designs
│   ├── advisor-desk.css
│   └── claimwire.css
│
├── designs/            one JS file per Garage Finder visual theme
│   └── design-*.js
│
├── admin/
│   └── admin.js
│
└── docs/               setup notes, logo lists, legacy
```

## Architecture

```
core-v4.js
│
├── data          (agency + non-agency + insurers → GF_DATA)
├── filtering     (GF.filter)
├── search        (GF.searchHay + shared suggest)
├── phone         (GF.parsePhones / phoneLines / firstTel / telHref)
├── maps          (GF.fullAddress / mapsHref)
├── copy          (GF.detailsText / copyDetails / wireCopy)
├── submission    (add form + submit.php)
├── esc           (GF.esc — every data value before innerHTML)
│
└── design renderer
      ├── Board / Job Card / Index / …
      └── each design owns only its shell HTML, CSS, and card markup
```

Designs are presenters. Shared behaviour lives once in `core-v4.js` and is
exposed as `window.GF`. Do not re-implement phone, maps, filter or copy logic
inside a design file.

Advisor Desk and Claim.Wire are simpler and self-contained: each is one HTML
file, one CSS file and one JS file, with no shared engine between them beyond
`data/data-insurers.js`, which Claim.Wire reads for its insurer list (see
"One insurer list, two consumers" below).


## What each file is

| File | What it is | Edit it? |
|---|---|---|
| `index.html` | Advisor Desk (site home page) — loads `css/advisor-desk.css` + `advisor-desk.js` | Occasionally |
| `garage-finder.html` | Garage Finder's loader shell — loads everything below it | Rarely |
| `claimwire.html` | Claim.Wire — loads `css/claimwire.css`, `data/data-insurers.js`, `data/data-claimwire-playbooks.js`, `claimwire.js` | Occasionally |
| `data/data-agency.js` | Agency (dealer) workshops | **Yes — often** |
| `data/data-nonagency.js` | Non-agency workshops + their insurer panels | **Yes — often** |
| `data/data-insurers.js` | Master list of insurers — set `claimwireId` on an entry to give it a Claim.Wire playbook | Occasionally |
| `data/data-claimwire-playbooks.js` | Claim.Wire's per-insurer contacts, SLAs, portal links, directories, keyed by `claimwireId` | **Yes — often** |
| `core-v4.js` | Garage Finder's shared engine: builds the list, runs the design picker, sends submissions | Rarely |
| `security-v4.js` | Garage Finder's HTML-escaping helper, shared with the admin page | Rarely |
| `shared.css` | Garage Finder's design picker and the add-workshop form | Rarely |
| `design-1-board.css` / `.js` … `design-9-neu.css` / `.js` | Garage Finder's six designs — one pair of files each | When changing a look |
| `submit.php` | Receives Garage Finder visitor submissions | **Set your key once** |
| `admin.html` / `admin.js` / `admin.css` | Garage Finder's private review page | No |
| `FILE-1-goes-in-DATA-folder.txt` | Rename to `.htaccess`, put inside `data/` | Once |
| `FILE-2-goes-in-HTDOCS-folder.txt` | Rename to `.htaccess`, put next to `garage-finder.html` | Once |
| `LOGO-FILENAMES*.txt` | Reference lists for logo filenames | No |

## One insurer list, two consumers

`data/data-insurers.js` is the single canonical insurer list. Garage Finder
uses every entry's `name` to filter workshops by panel. Claim.Wire only
shows insurers that have a `claimwireId` field set — that id is also the key
into `SEED_PLAYBOOKS` in `data/data-claimwire-playbooks.js`, where the actual
claims contacts/SLAs/directory live.

**To give an insurer a Claim.Wire playbook:** add `claimwireId: "some-id"` to
its entry in `data-insurers.js`, then add a matching `"some-id": { ... }`
entry to `SEED_PLAYBOOKS` in `data-claimwire-playbooks.js`. Treat an existing
`claimwireId` as a stable identifier once set — renaming it breaks the
matching playbook entry and anyone's locally-saved edits to that insurer
(Claim.Wire's per-insurer overrides live in each visitor's own browser
storage, keyed by this id).

## Setup — do this once

1. Open `submit.php` and change `ADMIN_KEY` at the top to something only you
   know. That is the password for the review page.
2. Create a folder called `data` next to `garage-finder.html`, writable by
   the web server (`chmod 755`, or `775`/`777` on stricter hosts). `submit.php`
   creates it automatically if it is allowed to.
3. Rename `FILE-1-goes-in-DATA-folder.txt` to `.htaccess` and put it inside
   `data/`. Rename `FILE-2-goes-in-HTDOCS-folder.txt` to `.htaccess` and put
   it next to `garage-finder.html`.
4. Open `admin.html`, enter your key, and confirm it loads.

**No PHP on your host?** The site detects this automatically — see
[Hosting on GitHub Pages](#hosting-on-github-pages) below. To remove the
dead weight instead of relying on the fallback, delete `submit.php`,
`admin.html`, `admin.js` and `admin.css`, then open `core-v4.js` and set
`SUBMIT_ENDPOINT` to `''`. The directory still works — the add button just
disappears.

## Hosting on GitHub Pages

The site can be served from two places at once:

- **InfinityFree** (or any PHP host) — full read/write. `submit.php` serves
  the live published dataset and accepts visitor submissions.
- **GitHub Pages** (or any static host) — read-only. GitHub Pages cannot run
  `submit.php`, so `core-v4.js` detects that the request failed or came back
  as non-JSON (raw PHP source) and falls back to fetching
  `data/published-workshops.json` directly as a static file. The directory
  renders normally; the **+ Add workshop** button hides itself since there is
  no backend to send submissions to.

Because `submit.php` reads and writes that same `data/published-workshops.json`
file on the PHP host, keeping the GitHub repo in sync with what is published
on InfinityFree (redeploy or copy the file over after approving submissions)
keeps both copies of the site showing the same workshops.

To enable it: push this repo to GitHub, then in **Settings → Pages** choose
**Deploy from a branch**, pick `main` and `/ (root)`. No build step is
needed — everything here is static HTML/CSS/JS. `admin.html` will not work
on GitHub Pages, since review/approval requires `submit.php`; use it on the
InfinityFree copy only.

## The six designs

Each design is a complete page of its own: its own header, its own filter
controls, its own card layout. Two files per design, and they share nothing,
so editing one cannot break another.

| # | id | Character |
|---|---|---|
| 1 | `board` | Industrial dispatch board, number-plate strip with counts |
| 2 | `jobcard` | Carbon-copy repair order on ruled ledger paper |
| 3 | `index` | Printed directory, letter dividers, A–Z jump rail |
| 4 | `blocks` | Swiss colour blocks, black band toolbar |
| 5 | `splitdesk` | List on the left, full record on the right |
| 6 | `neu` | Neumorphism — carved surfaces, animated logo, saved workshops, grid/list toggle |

### Choosing the design visitors see first

Open `core-v4.js` and change:

```js
var DEFAULT_DESIGN = 'board';
```

### Locking the site to one design

In `core-v4.js`:

```js
var SHOW_PICKER = false;
```

The picker disappears and everyone sees `DEFAULT_DESIGN`.

### Removing a design entirely

Delete its two files, then remove its `<script>` line from `index.html` and
its id from the `ORDER` list near the top of `core-v4.js`.

## Design entrance animations

Each design arrives in a way that suits what it is, rather than blinking in:

| Design | How it arrives |
|---|---|
| Board | Plates and rows flap over, like a split-flap departure board |
| Job Card | The sheet feeds up through a platen |
| Index | A page turning open from the left |
| Blocks | A colour wipe across, then tiles pop in |
| Split Desk | It just settles — deliberately the quietest of the six |
| Neu | Surfaces rise into focus out of a soft blur |

All six stylesheets are loaded when the page opens, sitting inactive until
chosen, so switching never has to wait for a download — that wait was what
produced the flash of unstyled page and stray shapes from the previous
design. Result cards stagger in behind the page itself. The animation lives in
`shared.css` under **DESIGN ENTRANCE ANIMATIONS**; each is a separate block
you can shorten, change or delete without touching the others. Anyone whose
device asks for reduced motion gets a plain fade instead.

## Calling a workshop

Tapping a phone number anywhere on the site opens a small sheet instead of
dialling straight away. Each number the workshop has is listed on its own
row with three buttons:

- **Call** — dials that number
- **WhatsApp** — opens a chat, shown only for UAE mobile numbers (05x /
  +9715x). Landlines show it greyed out, because WhatsApp cannot reach them.
- **Copy** — copies just that number

The sheet opens even when there is only one number, so a copy button is
always one tap away. 33 of the 103 workshops that have a phone number carry
more than one, and 55 have a WhatsApp-capable mobile.

## Type-ahead on the add form

**Insurer panels** and **Car makes** both suggest as you type. Pick from the
list and it is inserted with a comma, ready for the next one, so several
entries stay comma-separated. If what you typed is not on the list, the form
says so plainly rather than accepting a name that will never match a filter.
Insurer suggestions come from `data/data-insurers.js`; car makes are gathered from
the workshops already in your data files.

## Editing the workshop lists

Exactly as before — open `data/data-agency.js` or `data/data-nonagency.js` in a plain
text editor. Each workshop is one block:

```js
  {
    name:    "Gargash Enterprises — Mercedes-Benz (Dubai)",
    makes:   ["Mercedes-Benz", "Maybach"],
    emirate: "Dubai",
    address: "14 19th St, Al Quoz Industrial Area 3, Dubai",
    phone:   "",
    notes:   "Verify the nearest branch before dispatch."
  },
```

Four things break the page:

1. Every value goes inside `"double quotes"`.
2. Every line inside `{ }` ends with a comma — except the last.
3. Every closing `}` is followed by a comma.
4. Leave an unknown field as `""` rather than deleting the line.

If a data file has a typo, a red bar names the file. Press **F12 → Console**
for the line number.

## Insurer names must match exactly

A name in `insurers: [...]` in `data/data-nonagency.js` must match the `name:` in
`data/data-insurers.js` character for character, brackets included — for example
`"GIG Gulf (formerly AXA Gulf)"`. All 219 workshops currently match.

## How submissions work

A visitor taps **+ Add workshop** and sends it. Three things happen:

1. It appears in their own list straight away, marked *awaiting review*.
2. A copy is appended to `data/pending-submissions.json`.
3. Nothing in `data/data-agency.js` or `data/data-nonagency.js` changes. Only you edit
   those, from the review page.

Merging a submission in is unchanged: open `admin.html`, unlock with your
key, copy the formatted block, paste it into the right data file, then click
**Mark merged**.

### If you see a workshop listed twice

Each published workshop has a stable `id`. New submissions derive the same
kind of identifier from normalized **name + emirate + phone + address**.
Comparison normalizes case, whitespace, punctuation and phone formatting.
An exact normalized identity (or the same stable id) is treated as a
duplicate automatically.

A record with the same normalized name and emirate but different phone or
address is **not** discarded. It is retained and marked **possible duplicate —
review** in the admin page so the owner can decide whether it is the same
workshop. Fuzzy/prefix name matching is no longer used.

### One difference from the previous version

Visitors can **add** a workshop but no longer **edit** an existing one from
the public page. The add form is shared across all six designs; per-design
edit controls were not rebuilt. Your review page still handles edit-type
submissions if any are already pending.

## Production security and publication workflow

- Set a strong `ADMIN_KEY` in `submit.php` before deployment; never commit the production key.
- Serve the application over HTTPS. HSTS is emitted only for HTTPS requests.
- The public directory consumes `submit.php?action=published`; `data/published-workshops.json` is the server-side published dataset.
- Visitor submissions remain pending until an administrator approves them. Only approved submissions can be published.
- `data/admin-audit-log.json` records administrator actions without credentials or admin keys.
- `data/pending-submissions.json` and `data/workshop-verification.json` are blocked from direct HTTP access by `.htaccess`.
