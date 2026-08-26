/* Board — Industrial dispatch board, plate strip
   This design's page: its own header, its own filter controls, its own
   cards. It reads the shared workshop list from window.GF_DATA and
   registers itself with core-v4.js. */

var design = {
  id: "board",
  name: "Board",
  note: "Industrial dispatch board, plate strip",
  swatch: "#00713C",
  css: "css/design-1-board.css",
  html: "<div class=\"masthead\">\n  <div class=\"masthead-in\">\n    <h1 class=\"wordmark\">Garage<em>.</em>Finder</h1>\n    <span class=\"masthead-note\">UAE \u00b7 Agency &amp; Non-Agency</span>\n    <div class=\"masthead-nav\">\n      <a class=\"mh-link\" href=\"index.html\">\u2190 Advisor Desk</a>\n      <a class=\"mh-link\" href=\"claimwire.html\">Insurer claim steps \u2192</a>\n    </div>\n  </div>\n</div>\n\n<div class=\"shell\">\n  <p class=\"strip-label\">Select emirate</p>\n  <div class=\"plates\" id=\"plates\"></div>\n\n  <div class=\"controls\">\n    <div class=\"field\">\n      <label class=\"field-label\" for=\"q\">Search name, area or make</label>\n      <input id=\"q\" type=\"search\" placeholder=\"e.g. Al Quoz, Nissan, Gargash\" autocomplete=\"off\">\n    </div>\n    <div class=\"field\">\n      <label class=\"field-label\" for=\"ins\">Insurer panel</label>\n      <select id=\"ins\"></select>\n    </div>\n  </div>\n  <div class=\"segrow\" id=\"segrow\">\n    <button class=\"seg\" type=\"button\" data-type=\"all\" aria-pressed=\"true\">All</button>\n    <button class=\"seg\" type=\"button\" data-type=\"agency\" aria-pressed=\"false\">Agency</button>\n    <button class=\"seg\" type=\"button\" data-type=\"nonagency\" aria-pressed=\"false\">Non-agency</button>\n  </div>\n\n  <p class=\"tally\" id=\"tally\">6 workshops</p>\n  <div class=\"rows\" id=\"rows\"></div>\n\n  <p class=\"foot\"></p>\n</div>",
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
const SHORT = GF.shortEmirate || {};
const INSURERS = window.GF_DATA.insurers;

let state = {emirate:"all", type:"all", insurer:"all", q:""};

const platesEl = document.getElementById('plates');
const rowsEl = document.getElementById('rows');
const tallyEl = document.getElementById('tally');
const insEl = document.getElementById('ins');

insEl.innerHTML = '<option value="all">All insurers</option>' +
  INSURERS.map(i => `<option value="${esc(i)}">${esc(i)}</option>`).join('');

function buildPlates(){
  const all = `<button class="plate" type="button" data-emirate="all" aria-pressed="${state.emirate==='all'}">
      <span class="plate-emirate">UAE</span><span class="plate-count">${WORKSHOPS.length}</span></button>`;
  platesEl.innerHTML = all + EMIRATES.map(e => {
    const n = GF.countInEmirate(e, WORKSHOPS);
    return `<button class="plate" type="button" data-emirate="${esc(e)}" aria-pressed="${state.emirate===e}">
      <span class="plate-emirate">${esc(SHORT[e])}</span><span class="plate-count">${n}</span></button>`;
  }).join('');
}

function render(){
  buildPlates();
  const list = GF.filter(WORKSHOPS, state);
  tallyEl.textContent = list.length === 1 ? '1 workshop' : list.length + ' workshops';
  if (!list.length){
    rowsEl.innerHTML = `<div class="empty"><strong>Nothing matches these filters</strong>Clear the insurer or search box and try again.</div>`;
    return;
  }
  rowsEl.innerHTML = list.map(w => {
    const otherTags = w.makes.map(m => `<span class="tag">${esc(m)}</span>`)
      .concat(w.insurers.map(i => `<span class="tag is-panel">${esc(i)}</span>`))
      .join('');
    return `<article class="row ${w.type === 'nonagency' ? 'is-nonagency' : ''} ${w.pending ? 'gf-is-pending' : ''}">
      <div class="row-flag"></div>
      <div class="row-main">
        <h2 class="row-name">${esc(w.name)}</h2>
        ${GF.pendingBadge(w)}
        <p class="row-addr"><a class="maplink" href="${GF.mapsHref(w)}" target="_blank" rel="noopener">${esc(w.address)}</a></p>
        <div class="tags tags-location"><span class="tag">${esc(w.emirate)}</span></div>
        ${otherTags ? `<div class="tags tags-panel">${otherTags}</div>` : ''}
      </div>
      <div class="row-side">
        <span class="kind">${w.type === 'agency' ? 'Agency' : 'Non-agency'}</span>
        ${w.phone
          ? GF.phoneLines(w.phone, 'tel-link')
          : `<span class="tel is-empty">No number on file</span>`}
        <div class="row-acts">
          ${w.phone ? `<a class="act" href="${GF.firstTel(w.phone)}">Call</a>` : `<span class="act is-off">Call</span>`}
          <a class="act" href="${GF.mapsHref(w)}" target="_blank" rel="noopener">Map</a>
          <button class="act" type="button" data-copy="${WORKSHOPS.indexOf(w)}">Copy</button>
        </div>
      </div>
    </article>`;
  }).join('');
}

function onPlateselClick1(e){
  const b = e.target.closest('.plate'); if (!b) return;
  state.emirate = b.dataset.emirate; render();
}

cleanup.listen(platesEl, 'click', onPlateselClick1);
function onGetelementbyidSegrowClick2(e){
  const b = e.target.closest('.seg'); if (!b) return;
  state.type = b.dataset.type;
  document.querySelectorAll('.seg').forEach(s => s.setAttribute('aria-pressed', s === b));
  render();
}
cleanup.listen(document.getElementById('segrow'), 'click', onGetelementbyidSegrowClick2);
function onInsurerChange(e){ state.insurer = e.target.value; render(); }
cleanup.listen(insEl, 'change', onInsurerChange);
function onQueryInput(e){ state.q = e.target.value; render(); }
cleanup.listen(document.getElementById('q'), 'input', onQueryInput);

cleanup.add(GF.wireCopy(rowsEl, WORKSHOPS));
render();
  },
  destroy: function(){
    cleanup.destroy();
  }
};

export default design;
