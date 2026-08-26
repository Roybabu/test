/* Index — Printed directory, A-Z rail
   This design's page: its own header, its own filter controls, its own
   cards. It reads the shared workshop list from window.GF_DATA and
   registers itself with core.js. */

var design = {
  id: "index",
  name: "Index",
  note: "Printed directory, A-Z rail",
  swatch: "#1E2FA0",
  css: "css/design-6-index.css",
  html: "<div class=\"book\">\n  <header class=\"title\">\n    <div class=\"title-top\">\n      <p class=\"eyebrow\">United Arab Emirates · Edition 9</p>\n      <p class=\"title-nav\"><a href=\"index.html\">\u2190 Advisor Desk</a><a href=\"claimwire.html\">Insurer claim steps \u2192</a></p>\n    </div>\n    <h1>The Workshop Index</h1>\n    <p>Agency and non-agency repair workshops, listed by name, with the emirate and insurer panels each one sits on.</p>\n    <div class=\"figures\">\n      <div class=\"fig\"><strong id=\"f-total\">6</strong><span>Entries</span></div>\n      <div class=\"fig\"><strong id=\"f-agency\">3</strong><span>Agency</span></div>\n      <div class=\"fig\"><strong id=\"f-non\">3</strong><span>Non-agency</span></div>\n      <div class=\"fig\"><strong id=\"f-em\">3</strong><span>Emirates</span></div>\n    </div>\n  </header>\n\n  <div class=\"find\">\n    <input id=\"q\" type=\"search\" placeholder=\"Look up a name, area or make…\" autocomplete=\"off\">\n  </div>\n\n  <div class=\"filters\">\n    <div class=\"fset\">\n      <span class=\"fset-label\">Type</span>\n      <span id=\"types\">\n        <button class=\"link\" type=\"button\" data-type=\"all\" aria-pressed=\"true\">All</button>\n        <button class=\"link\" type=\"button\" data-type=\"agency\" aria-pressed=\"false\">Agency</button>\n        <button class=\"link\" type=\"button\" data-type=\"nonagency\" aria-pressed=\"false\">Non-agency</button>\n      </span>\n    </div>\n    <div class=\"fset\">\n      <span class=\"fset-label\">Emirate</span>\n      <span id=\"em\"></span>\n    </div>\n    <div class=\"fset\">\n      <span class=\"fset-label\">Panel</span>\n      <select id=\"ins\"></select>\n    </div>\n  </div>\n\n  <div id=\"list\"></div>\n  <p class=\"colophon\"></p>\n</div>\n\n<nav class=\"rail\" id=\"rail\" aria-label=\"Jump to letter\"></nav>",
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
const ALPHA = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('');
let state = {emirate:"all", type:"all", insurer:"all", q:""};

const listEl = document.getElementById('list');
const railEl = document.getElementById('rail');
const emEl = document.getElementById('em');
const insEl = document.getElementById('ins');

/* Underlined text, set like the rest of the page — not a dropdown. */
emEl.innerHTML = ['all'].concat(EMIRATES).map(e =>
  `<button class="link" type="button" data-em="${esc(e)}" aria-pressed="${e === 'all'}">${e === 'all' ? 'All' : esc(e)}</button>`
).join('');
insEl.innerHTML = '<option value="all">All panels</option>' + INSURERS.map(i => `<option>${esc(i)}</option>`).join('');

document.getElementById('f-total').textContent = WORKSHOPS.length;
document.getElementById('f-agency').textContent = WORKSHOPS.filter(w=>w.type==='agency').length;
document.getElementById('f-non').textContent = WORKSHOPS.filter(w=>w.type==='nonagency').length;
document.getElementById('f-em').textContent = new Set(WORKSHOPS.map(w=>w.emirate)).size;

function render(){
  const list = GF.filter(WORKSHOPS, state).sort((a,b) => a.name.localeCompare(b.name));
  const present = new Set(list.map(w => w.name[0].toUpperCase()));

  railEl.innerHTML = ALPHA.map(L =>
    `<button type="button" class="${present.has(L)?'has':''}" data-letter="${L}" ${present.has(L)?'':'disabled'}>${L}</button>`
  ).join('');

  if (!list.length){
    listEl.innerHTML = `<div class="blankpage"><h2>No entry under these terms</h2>
      <p>Clear the panel filter, or widen the emirate, and look again.</p></div>`;
    return;
  }
  let html = '', current = '';
  list.forEach(w => {
    const L = w.name[0].toUpperCase();
    if (L !== current){
      current = L;
      const n = list.filter(x => x.name[0].toUpperCase() === L).length;
      html += `<div class="letter" id="L-${L}"><span>${L}</span><i></i><em>${n} ${n===1?'entry':'entries'}</em></div>`;
    }
    const detail = w.type === 'agency'
      ? `<div class="list"><b>Makes handled</b>${esc(w.makes.join(' · '))}</div>`
      : `<div class="list"><b>Insurer panels</b>${esc(w.insurers.join(' · '))}</div>`;
    html += `<article class="item ${w.type==='nonagency'?'is-nonagency':''} ${w.pending?'gf-is-pending':''}">
      <div>
        <h2>${esc(w.name)}</h2>
        ${GF.pendingBadge(w)}
        <p class="addr"><a href="${GF.mapsHref(w)}" target="_blank" rel="noopener">${esc(w.address)}</a>, ${esc(w.emirate)}</p>
        ${detail}
      </div>
      <div class="side">
        <span class="kindmark">${w.type==='agency'?'Agency':'Non-agency'}</span>
        <span class="tel ${w.phone?'':'blank'}">${w.phone
          ? GF.phoneLines(w.phone)
          : 'no number on file'}</span>
        <div class="item-acts">
          ${w.phone ? `<a class="ibtn" href="${GF.firstTel(w.phone)}">Call</a>` : `<span class="ibtn is-off">Call</span>`}
          <a class="ibtn" href="${GF.mapsHref(w)}" target="_blank" rel="noopener">Map</a>
          <button class="ibtn" type="button" data-copy="${WORKSHOPS.indexOf(w)}">Copy details</button>
        </div>
      </div>
    </article>`;
  });
  listEl.innerHTML = html;
}
function onRailelClick1(e){
  const b = e.target.closest('button'); if(!b || b.disabled) return;
  const t = document.getElementById('L-' + b.dataset.letter);
  if (t) t.scrollIntoView({block:'start'});
}
cleanup.listen(railEl, 'click', onRailelClick1);
function onGetelementbyidTypesClick2(e){
  const b = e.target.closest('.link'); if(!b) return;
  state.type = b.dataset.type;
  document.querySelectorAll('#types .link').forEach(x => x.setAttribute('aria-pressed', x===b));
  render();
}
cleanup.listen(document.getElementById('types'), 'click', onGetelementbyidTypesClick2);
function onEmelClick3(e){
  const b = e.target.closest('.link'); if (!b) return;
  state.emirate = b.dataset.em;
  emEl.querySelectorAll('.link').forEach(x => x.setAttribute('aria-pressed', x === b));
  render();
}
cleanup.listen(emEl, 'click', onEmelClick3);
function onInsurerChange(e){ state.insurer = e.target.value; render(); }
cleanup.listen(insEl, 'change', onInsurerChange);
function onQueryInput(e){ state.q = e.target.value; render(); }
cleanup.listen(document.getElementById('q'), 'input', onQueryInput);
cleanup.add(GF.wireCopy(listEl, WORKSHOPS));
render();
  },
  destroy: function(){
    cleanup.destroy();
  }
};

export default design;
