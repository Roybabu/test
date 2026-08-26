/* Split Desk — List left, full record right
   This design's page: its own header, its own filter controls, its own
   cards. It reads the shared workshop list from window.GF_DATA and
   registers itself with core-v4.js. */

var design = {
  id: "splitdesk",
  name: "Split Desk",
  note: "List left, full record right",
  swatch: "#0E5C55",
  css: "css/design-8-splitdesk.css",
  html: "<div class=\"desk\">\n  <section>\n    <div class=\"head\">\n      <h1>Garage Finder</h1>\n      <p>UAE workshop directory</p>\n      <p class=\"head-nav\"><a href=\"index.html\">\u2190 Advisor Desk</a> \u00b7 <a href=\"claimwire.html\">Insurer claim steps \u2192</a></p>\n    </div>\n\n    <div class=\"tools\">\n      <input id=\"q\" type=\"search\" placeholder=\"Search name, area or make\" autocomplete=\"off\">\n      <div class=\"toolrow\" id=\"types\">\n        <button class=\"tab\" type=\"button\" data-type=\"all\" aria-pressed=\"true\">All</button>\n        <button class=\"tab\" type=\"button\" data-type=\"agency\" aria-pressed=\"false\">Agency</button>\n        <button class=\"tab\" type=\"button\" data-type=\"nonagency\" aria-pressed=\"false\">Non-agency</button>\n      </div>\n      <div class=\"toolrow\" id=\"em\"></div>\n      <div class=\"toolrow\">\n        <select id=\"ins\"></select>\n      </div>\n    </div>\n\n    <p class=\"tally\" id=\"tally\">6 workshops</p>\n    <div class=\"list\" id=\"list\"></div>\n  </section>\n\n  <aside class=\"pane\" id=\"pane\"></aside>\n  <p class=\"foot\"></p>\n</div>",
  start: function(){
const GF = window.GF || {};
const cleanup = GF.createCleanup();
const esc = GF.esc || window.GF_esc || function(s){
  return String(s == null ? '' : s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
};
const WORKSHOPS = window.GF_DATA.workshops;
const EMIRATES = GF.emirates || ["Abu Dhabi","Dubai","Sharjah","Ajman","Ras Al Khaimah","Fujairah","Umm Al Quwain"];
const INSURERS = window.GF_DATA.insurers;
let state = {emirate:"all", type:"all", insurer:"all", q:"", selected:0};

const listEl = document.getElementById('list');
const paneEl = document.getElementById('pane');
const emEl = document.getElementById('em');
const insEl = document.getElementById('ins');

/* Tabs, matching the type filter directly above it. */
emEl.innerHTML = ['all'].concat(EMIRATES).map(e =>
  `<button class="tab" type="button" data-em="${esc(e)}" aria-pressed="${e === 'all'}">${e === 'all' ? 'All emirates' : e}</button>`
).join('');
insEl.innerHTML = '<option value="all">All insurer panels</option>' + INSURERS.map(i => `<option>${esc(i)}</option>`).join('');

function renderPane(w){
  if (!w){
    paneEl.className = 'pane';
    paneEl.innerHTML = `<h2>Nothing selected</h2>
      <p class="where">Pick a workshop from the list to see its full record here.</p>`;
    return;
  }
  const isAg = w.type === 'agency';
  paneEl.className = 'pane' + (isAg ? '' : ' is-nonagency') + (w.pending ? ' gf-is-pending' : '');
  const listBlock = isAg
    ? `<div><p class="dt">Makes handled</p><div class="taglist">${w.makes.map(m=>`<span class="tagx">${esc(m)}</span>`).join('')}</div></div>`
    : `<div><p class="dt">Insurer panels</p><div class="taglist">${w.insurers.map(i=>`<span class="tagx">${esc(i)}</span>`).join('')}</div></div>`;
  paneEl.innerHTML = `
    <span class="pane-kind">${isAg ? 'Agency' : 'Non-agency'}</span>
    <h2>${esc(w.name)}</h2>
      ${GF.pendingBadge(w)}
    <p class="where"><a href="${GF.mapsHref(w)}" target="_blank" rel="noopener">${esc(w.address)}</a> · ${esc(w.emirate)}</p>
    <div class="dl">
      <div><p class="dt">Telephone</p>
        <p class="dd mono ${w.phone?'':'blank'}">${w.phone
          ? GF.phoneLines(w.phone)
          : 'No number on file'}</p></div>
      ${listBlock}
      <div><p class="dt">Notes</p><p class="dd">${esc(w.notes)}</p></div>
    </div>
    <div class="pane-actions">
      ${w.phone ? `<a class="act is-primary" href="${GF.firstTel(w.phone)}">Call</a>` : `<span class="act is-off">No number</span>`}
      <a class="act" href="${GF.mapsHref(w)}" target="_blank" rel="noopener">Map</a>
      <button class="act" type="button" data-copy="${WORKSHOPS.indexOf(w)}">Copy details</button>
    </div>
    <p class="pane-hint">Use ↑ ↓ in the list to move between workshops.</p>`;
}
function render(){
  const list = GF.filter(WORKSHOPS, state);
  document.getElementById('tally').textContent = list.length === 1 ? '1 workshop' : list.length + ' workshops';
  if (state.selected >= list.length) state.selected = 0;
  if (!list.length){
    listEl.innerHTML = `<div class="emptylist"><strong>No matches</strong>Widen the emirate or clear the insurer panel.</div>`;
    renderPane(null);
    return;
  }
  listEl.innerHTML = list.map((w,i) => `
    <button class="rowbtn ${w.type==='nonagency'?'is-nonagency':''} ${w.pending?'gf-is-pending-row':''}" type="button"
            data-i="${i}" aria-current="${i===state.selected}">
      <span class="dot"></span>
      <span class="rowtext"><strong>${esc(w.name)}</strong><span>${esc(w.address)}</span></span>
      <span class="rowmeta">${esc(w.emirate)}</span>
    </button>`).join('');
  renderPane(list[state.selected]);
}
function onListelClick1(e){
  const b = e.target.closest('.rowbtn'); if(!b) return;
  state.selected = Number(b.dataset.i); render();
}
cleanup.listen(listEl, 'click', onListelClick1);
function onListelKeydown2(e){
  if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
  e.preventDefault();
  const rows = [...listEl.querySelectorAll('.rowbtn')];
  if (!rows.length) return;
  state.selected = (state.selected + (e.key === 'ArrowDown' ? 1 : -1) + rows.length) % rows.length;
  render();
  listEl.querySelectorAll('.rowbtn')[state.selected].focus();
}
cleanup.listen(listEl, 'keydown', onListelKeydown2);
function onGetelementbyidTypesClick3(e){
  const b = e.target.closest('.tab'); if(!b) return;
  state.type = b.dataset.type; state.selected = 0;
  document.querySelectorAll('#types .tab').forEach(x => x.setAttribute('aria-pressed', x===b));
  render();
}
cleanup.listen(document.getElementById('types'), 'click', onGetelementbyidTypesClick3);
function onEmelClick4(e){
  const b = e.target.closest('.tab'); if (!b) return;
  state.emirate = b.dataset.em; state.selected = 0;
  emEl.querySelectorAll('.tab').forEach(x => x.setAttribute('aria-pressed', x === b));
  render();
}
cleanup.listen(emEl, 'click', onEmelClick4);
function onInsurerChange(e){ state.insurer = e.target.value; state.selected = 0; render(); }
cleanup.listen(insEl, 'change', onInsurerChange);
function onQueryInput(e){ state.q = e.target.value; state.selected = 0; render(); }
cleanup.listen(document.getElementById('q'), 'input', onQueryInput);
GF.wireCopy(paneEl, WORKSHOPS);
render();
  },
  destroy: function(){
    cleanup.destroy();
  }
};

export default design;
