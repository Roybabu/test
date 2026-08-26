/* Blocks — Swiss colour blocks, band toolbar
   This design's page: its own header, its own filter controls, its own
   cards. It reads the shared workshop list from window.GF_DATA and
   registers itself with core-v4.js. */

var design = {
  id: "blocks",
  name: "Blocks",
  note: "Swiss colour blocks, band toolbar",
  swatch: "#E23E2C",
  css: "css/design-7-blocks.css",
  html: "<div class=\"frame\">\n  <header class=\"mast\">\n    <h1>Garage<br>Finder<span>.</span></h1>\n    <div class=\"mast-side\">United Arab<br>Emirates<br>Workshops<div class=\"mast-nav\"><a href=\"index.html\">\u2190 Advisor Desk</a><a href=\"claimwire.html\">Insurer claim steps \u2192</a></div></div>\n  </header>\n\n  <div class=\"band\">\n    <div class=\"band-row\">\n      <span class=\"band-label\">Search</span>\n      <div class=\"band-body\"><input id=\"q\" type=\"search\" placeholder=\"Name, area or make\" autocomplete=\"off\"></div>\n    </div>\n    <div class=\"band-row\">\n      <span class=\"band-label\">Type</span>\n      <div class=\"band-body\" id=\"types\">\n        <button class=\"blk\" type=\"button\" data-type=\"all\" aria-pressed=\"true\">All</button>\n        <button class=\"blk\" type=\"button\" data-type=\"agency\" aria-pressed=\"false\">Agency</button>\n        <button class=\"blk\" type=\"button\" data-type=\"nonagency\" aria-pressed=\"false\">Non-agency</button>\n      </div>\n    </div>\n    <div class=\"band-row\">\n      <span class=\"band-label\">Emirate</span>\n      <div class=\"band-body\" id=\"emirates\"></div>\n    </div>\n    <div class=\"band-row\">\n      <span class=\"band-label\">Panel</span>\n      <div class=\"band-body\"><select id=\"ins\"></select></div>\n    </div>\n  </div>\n\n  <p class=\"count\" id=\"count\">6 workshops</p>\n  <div class=\"grid\" id=\"grid\"></div>\n  <p class=\"foot\"></p>\n</div>",
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
let state = {emirate:"all", type:"all", insurer:"all", q:""};

const gridEl = document.getElementById('grid');
const emEl = document.getElementById('emirates');
const insEl = document.getElementById('ins');

insEl.innerHTML = '<option value="all">All insurer panels</option>' + INSURERS.map(i => `<option>${esc(i)}</option>`).join('');
emEl.innerHTML = `<button class="blk" type="button" data-emirate="all" aria-pressed="true">All</button>` +
  EMIRATES.map(e => `<button class="blk" type="button" data-emirate="${esc(e)}" aria-pressed="false">${e}</button>`).join('');

function render(){
  const list = GF.filter(WORKSHOPS, state);
  document.getElementById('count').textContent = list.length === 1 ? '1 workshop' : list.length + ' workshops';
  if (!list.length){
    gridEl.innerHTML = `<div class="void"><h2>Nothing here</h2><p>No workshop matches this combination — change the emirate or clear the panel.</p></div>`;
    return;
  }
  gridEl.innerHTML = list.map(w => {
    const items = (w.type === 'agency' ? w.makes : w.insurers).map(t => `<span class="mark">${esc(t)}</span>`).join('');
    return `<article class="tile ${w.pending?'gf-is-pending':''}">
      <div class="tile-head" data-emirate="${esc(w.emirate)}">
        <p class="tile-kind">${w.type==='agency'?'Agency':'Non-agency'} · ${esc(w.emirate)}</p>
        <h2>${esc(w.name)}</h2>
        ${GF.pendingBadge(w)}
      </div>
      <div class="tile-body">
        <div class="kv"><b>Address</b><a href="${GF.mapsHref(w)}" target="_blank" rel="noopener">${esc(w.address)}</a></div>
        <div class="marks">${items}</div>
      </div>
      <div class="tel ${w.phone?'':'blank'}">${w.phone
        ? GF.phoneLines(w.phone)
        : 'No number on file'}</div>
      <div class="tile-acts">
        ${w.phone ? `<a class="tbtn" href="${GF.firstTel(w.phone)}">Call</a>` : `<span class="tbtn is-off">Call</span>`}
        <a class="tbtn" href="${GF.mapsHref(w)}" target="_blank" rel="noopener">Map</a>
        <button class="tbtn" type="button" data-copy="${WORKSHOPS.indexOf(w)}">Copy</button>
      </div>
    </article>`;
  }).join('');
}
function onGetelementbyidTypesClick1(e){
  const b = e.target.closest('.blk'); if(!b) return;
  state.type = b.dataset.type;
  document.querySelectorAll('#types .blk').forEach(x => x.setAttribute('aria-pressed', x===b));
  render();
}
cleanup.listen(document.getElementById('types'), 'click', onGetelementbyidTypesClick1);
function onEmelClick2(e){
  const b = e.target.closest('.blk'); if(!b) return;
  state.emirate = b.dataset.emirate;
  document.querySelectorAll('#emirates .blk').forEach(x => x.setAttribute('aria-pressed', x===b));
  render();
}
cleanup.listen(emEl, 'click', onEmelClick2);
function onInsurerChange(e){ state.insurer = e.target.value; render(); }
cleanup.listen(insEl, 'change', onInsurerChange);
function onQueryInput(e){ state.q = e.target.value; render(); }
cleanup.listen(document.getElementById('q'), 'input', onQueryInput);
GF.wireCopy(gridEl, WORKSHOPS);
render();
  },
  destroy: function(){
    cleanup.destroy();
  }
};

export default design;
