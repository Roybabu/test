# Deployment

Upload the **contents of this folder** to the web root (for example `public_html/`).
Do not upload the outer `test-main` directory as a nested directory.

Required public entry points:
- `index.html` (Advisor Desk — site home page)
- `garage-finder.html`, `core-v4.js`, `security-v4.js`, `submit.php` (Garage Finder)
- `claimwire.html`, `claimwire.js`, `data/data-claimwire-playbooks.js` (Claim.Wire)
- `data/data-insurers.js` (shared by Garage Finder and Claim.Wire)
- `data/published-workshops.json` (Garage Finder)

Garage Finder loads insurer metadata from `data/data-insurers.js` and workshop
records from `submit.php?action=published`. It does **not** load
`data-agency.js` or `data-nonagency.js` directly — those are edited by hand
and read server-side by `submit.php`.

`core-v4.js` and `security-v4.js` are the live engine and escaping helper.
There is no unversioned `core.js` / `security.js` in this repo any more — an
earlier version of the site loaded those, and the `-v4` filenames exist
specifically so a browser holding an old cached copy under the old filename
never gets served in place of the current code (a new filename is always a
cache miss, regardless of cache headers). If you ever see a bare `core.js`
or `security.js` reappear in a diff, it's a leftover from an old branch/zip,
not something to restore.

After deployment, hard refresh the browser on `garage-finder.html` and
confirm the Network tab contains:
- `core-v4.js`
- `security-v4.js`
- `submit.php?action=published`

It should NOT request:
- `core.js` / `security.js`
- `data-agency.js` / `data-nonagency.js`

Keep the `data/.htaccess` file in place. It protects server-side JSON state.
Use HTTPS in production and configure the server-side admin secret before
using the admin API.
