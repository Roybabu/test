/* Neu — Neumorphism, carved surfaces, animated & interactive
   This design's page: its own header, its own filter controls, its own
   cards. It reads the shared workshop list from window.GF_DATA and
   registers itself with core-v4.js.

   Extras beyond the shared engine: a grid/list view toggle, collapsible
   filters, per-visitor "saved" workshops (starred, kept in localStorage
   on this device only), and a count-up animation on the stat tiles —
   all built from inline SVG and CSS, no external image/gif requests. */

const ICON = {
  search: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>',
  filter: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16M7 12h10M10 18h4"/></svg>',
  grid: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linejoin="round"><rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/></svg>',
  list: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round"><path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/></svg>',
  pin: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linejoin="round"><path d="M12 21s7-6.1 7-11.5A7 7 0 0 0 5 9.5C5 14.9 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.4"/></svg>',
  phone: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 3.5h3l1.5 4.5-2.2 1.8a13 13 0 0 0 5.9 5.9l1.8-2.2 4.5 1.5v3c0 1.1-.9 2-2 2C11.9 20 4 12.1 4 5.5c0-1.1.9-2 2-2z"/></svg>',
  copy: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>',
  star: '<svg viewBox="0 0 24 24" stroke-width="1.8" stroke-linejoin="round"><path d="M12 3.5l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17.4l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/></svg>'
};

const design = {
  id: "neu",
  name: "Neu",
  note: "Neumorphism, carved surfaces — animated & interactive",
  swatch: "#4A57C4",
  css: "css/design-9-neu.css",
  html: `<div class="slab">
  <header class="top">
    <img class="emblem" src="logo.svg" alt="Garage Finder" width="62" height="62">
    <div class="top-text">
      <h1>Garage Finder</h1>
      <p>Agency &amp; non-agency workshops across the UAE</p>
    </div>
    <nav class="top-nav">
      <a class="top-link" href="index.html">← Advisor Desk</a>
      <a class="top-link" href="claimwire.html">Insurer claim steps →</a>
    </nav>
  </header>

  <div class="meters">
    <div class="meter"><b id="m-total">0</b><span>Workshops</span></div>
    <div class="meter"><b id="m-ag">0</b><span>Agency</span></div>
    <div class="meter"><b id="m-non">0</b><span>Non-agency</span></div>
    <div class="meter"><b id="m-em">0</b><span>Emirates</span></div>
  </div>

  <div class="toolbar">
    <button class="filterstoggle" id="filtersToggle" type="button" aria-expanded="true" aria-controls="console">
      ${ICON.filter}<span>Filters</span><span class="fcount" id="fcount" hidden>0</span>
    </button>
    <button class="viewtoggle" id="viewToggle" type="button" aria-pressed="false" title="Switch to grid view">
      <span class="vt-list-wrap">${ICON.list}</span><span class="vt-grid-wrap">${ICON.grid}</span>
    </button>
  </div>

  <div class="console is-open" id="console">
    <div class="probe">
      ${ICON.search}
      <input id="q" type="search" placeholder="Search name, area or make" autocomplete="off">
    </div>

    <div class="set">
      <p class="setname">Type</p>
      <div class="keys" id="types">
        <button class="key" type="button" data-type="all" aria-pressed="true">All</button>
        <button class="key" type="button" data-type="agency" aria-pressed="false">Agency</button>
        <button class="key" type="button" data-type="nonagency" aria-pressed="false">Non-agency</button>
      </div>
    </div>

    <div class="set">
      <p class="setname">Emirate</p>
      <div class="keys" id="emirates"></div>
    </div>

    <div class="set">
      <p class="setname">Insurer panel</p>
      <select class="dial" id="ins" hidden></select>
      <button class="dial insdrop" id="insDropBtn" type="button" aria-haspopup="listbox" aria-expanded="false" aria-controls="insDropList">
        <span id="insDropLabel">All insurer panels</span><span class="insdrop-chev" aria-hidden="true">▾</span>
      </button>
      <div class="insdrop-list" id="insDropList" role="listbox" hidden></div>
    </div>
  </div>

  <div class="listbar"><p class="readout" id="readout">0 workshops</p></div>
  <div id="list"></div>
  <p class="foot"></p>
</div>`,
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

const listEl = document.getElementById('list');
const emEl = document.getElementById('emirates');
const insEl = document.getElementById('ins');
const insDropBtn = document.getElementById('insDropBtn');
const insDropLabel = document.getElementById('insDropLabel');
const insDropList = document.getElementById('insDropList');
const viewBtn = document.getElementById('viewToggle');
const filtersBtn = document.getElementById('filtersToggle');
const consoleEl = document.getElementById('console');
const fcountEl = document.getElementById('fcount');

insEl.innerHTML = '<option value="all">All insurer panels</option>' + INSURERS.map(i => `<option>${esc(i)}</option>`).join('');
emEl.innerHTML = `<button class="key" type="button" data-emirate="all" aria-pressed="true">All</button>` +
  EMIRATES.map(e => `<button class="key" type="button" data-emirate="${esc(e)}" aria-pressed="false">${e}</button>`).join('');

/* ---- insurer panel: an inline scrollable list, not a separate sheet ---- */
insDropList.innerHTML = ['<button type="button" class="insdrop-item" role="option" data-v="all" aria-selected="true">All insurer panels</button>']
  .concat(INSURERS.map(i => `<button type="button" class="insdrop-item" role="option" data-v="${esc(i)}" aria-selected="false">${esc(i)}</button>`))
  .join('');
function closeInsDrop(){ insDropList.hidden = true; insDropBtn.setAttribute('aria-expanded', 'false'); }
function openInsDrop(){ insDropList.hidden = false; insDropBtn.setAttribute('aria-expanded', 'true'); }
function onInsDropBtnClick(){ insDropList.hidden ? openInsDrop() : closeInsDrop(); }
cleanup.listen(insDropBtn, 'click', onInsDropBtnClick);
function onInsDropListClick(e){
  const b = e.target.closest('.insdrop-item'); if (!b) return;
  const v = b.getAttribute('data-v');
  insEl.value = v;
  insDropLabel.textContent = v === 'all' ? 'All insurer panels' : v;
  insDropList.querySelectorAll('.insdrop-item').forEach(x => x.setAttribute('aria-selected', String(x === b)));
  closeInsDrop();
  state.insurer = v;
  render();
}
cleanup.listen(insDropList, 'click', onInsDropListClick);
function onDocClickCloseInsDrop(e){
  if (!insDropList.hidden && !e.target.closest('.set')) closeInsDrop();
}
cleanup.listen(document, 'click', onDocClickCloseInsDrop);

/* ---- saved (starred) workshops — this device only ---- */
const FAV_KEY = 'gf_neu_favs';
function readFavs(){ try { return new Set(JSON.parse(localStorage.getItem(FAV_KEY) || '[]')); } catch(e){ return new Set(); } }
function writeFavs(set){ try { localStorage.setItem(FAV_KEY, JSON.stringify(Array.from(set))); } catch(e){} }
let favs = readFavs();
function favKey(w, idx){ return String(w.id || idx); }

/* ---- grid / list view, remembered on this device ---- */
const VIEW_KEY = 'gf_neu_view';
function applyView(mode){
  listEl.classList.toggle('is-grid', mode === 'grid');
  viewBtn.setAttribute('aria-pressed', mode === 'grid' ? 'true' : 'false');
  viewBtn.setAttribute('title', mode === 'grid' ? 'Switch to list view' : 'Switch to grid view');
}
let savedView = 'list';
try { savedView = localStorage.getItem(VIEW_KEY) || 'list'; } catch(e){}
applyView(savedView);
function onViewToggle(){
  const mode = listEl.classList.contains('is-grid') ? 'list' : 'grid';
  applyView(mode);
  try { localStorage.setItem(VIEW_KEY, mode); } catch(e){}
}
cleanup.listen(viewBtn, 'click', onViewToggle);

/* ---- collapsible filters ---- */
function onFiltersToggle(){
  const open = !consoleEl.classList.contains('is-open');
  consoleEl.classList.toggle('is-open', open);
  filtersBtn.setAttribute('aria-expanded', String(open));
}
cleanup.listen(filtersBtn, 'click', onFiltersToggle);

/* ---- count-up animation for the stat tiles ---- */
function animateCount(el, target){
  if (!el) return;
  const dur = 700;
  let t0 = null;
  function step(ts){
    if (t0 == null) t0 = ts;
    const p = Math.min(1, (ts - t0) / dur);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(target * eased);
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}
animateCount(document.getElementById('m-total'), WORKSHOPS.length);
animateCount(document.getElementById('m-ag'), WORKSHOPS.filter(w => w.type === 'agency').length);
animateCount(document.getElementById('m-non'), WORKSHOPS.filter(w => w.type === 'nonagency').length);
animateCount(document.getElementById('m-em'), new Set(WORKSHOPS.map(w => w.emirate)).size);

function initials(n){ return n.replace(/[^A-Za-z ]/g,' ').trim().split(/\s+/).slice(0,2).map(x=>x[0]).join('').toUpperCase(); }

function activeFilterCount(){
  let n = 0;
  if (state.type !== 'all') n++;
  if (state.emirate !== 'all') n++;
  if (state.insurer !== 'all') n++;
  if (state.q.trim()) n++;
  return n;
}

function render(){
  const list = GF.filter(WORKSHOPS, state);
  document.getElementById('readout').textContent = list.length === 1 ? '1 workshop' : list.length + ' workshops';

  const n = activeFilterCount();
  fcountEl.hidden = n === 0;
  fcountEl.textContent = n;

  if (!list.length){
    listEl.innerHTML = `<div class="hollow"><h2>Nothing matches</h2>
      <p>Widen the emirate, or set the insurer panel back to all.</p></div>`;
    return;
  }
  listEl.innerHTML = list.map(w => {
    const isAg = w.type === 'agency';
    const idx = WORKSHOPS.indexOf(w);
    const isFav = favs.has(favKey(w, idx));
    const items = (isAg ? w.makes : w.insurers).map(t => `<span class="cap">${esc(t)}</span>`).join('');
    const call = w.phone
      ? `<a class="press go" href="${GF.firstTel(w.phone)}">${ICON.phone}Call</a>`
      : `<span class="press off">${ICON.phone}No number</span>`;
    return `<article class="unit ${isAg?'':'is-nonagency'} ${isFav?'is-fav':''} ${w.pending?'gf-is-pending':''}">
      <button class="favbtn" type="button" data-fav="${idx}" aria-pressed="${isFav}" aria-label="${isFav?'Remove from saved workshops':'Save this workshop'}">${ICON.star}</button>
      <div class="unit-top">
        <span class="knob">${esc(initials(w.name))}</span>
        <div>
          <h2>${esc(w.name)}</h2>
          ${GF.pendingBadge(w)}
          <span class="stamp">${isAg?'Agency':'Non-agency'}</span>
        </div>
      </div>
      <div class="well well-address">
        <p>${ICON.pin}Address</p>
        <a class="where" href="${GF.mapsHref(w)}" target="_blank" rel="noopener">${esc(GF.fullAddress(w))}</a>
      </div>
      <div class="well">
        <p>${isAg?'Makes handled':'Insurer panels'}</p>
        <div class="caps">${items}</div>
      </div>
      <div class="unit-actions">
        ${call}
        <a class="press" href="${GF.mapsHref(w)}" target="_blank" rel="noopener">${ICON.pin}Map</a>
        <button class="press" type="button" data-copy="${idx}">${ICON.copy}Copy</button>
      </div>
    </article>`;
  }).join('');
}

function onTypesClick(e){
  const b = e.target.closest('.key'); if(!b) return;
  state.type = b.dataset.type;
  document.querySelectorAll('#types .key').forEach(x => x.setAttribute('aria-pressed', x===b));
  render();
}
cleanup.listen(document.getElementById('types'), 'click', onTypesClick);

function onEmelClick(e){
  const b = e.target.closest('.key'); if(!b) return;
  state.emirate = b.dataset.emirate;
  document.querySelectorAll('#emirates .key').forEach(x => x.setAttribute('aria-pressed', x===b));
  render();
}
cleanup.listen(emEl, 'click', onEmelClick);

function onQueryInput(e){ state.q = e.target.value; render(); }
cleanup.listen(document.getElementById('q'), 'input', onQueryInput);

function onFavClick(e){
  const b = e.target.closest('.favbtn'); if(!b) return;
  const idx = Number(b.getAttribute('data-fav'));
  const w = WORKSHOPS[idx]; if(!w) return;
  const key = favKey(w, idx);
  const nowFav = !favs.has(key);
  if (nowFav) favs.add(key); else favs.delete(key);
  writeFavs(favs);
  const card = b.closest('.unit');
  if (card) card.classList.toggle('is-fav', nowFav);
  b.setAttribute('aria-pressed', String(nowFav));
  b.setAttribute('aria-label', nowFav ? 'Remove from saved workshops' : 'Save this workshop');
}
cleanup.listen(listEl, 'click', onFavClick);

cleanup.add(GF.wireCopy(listEl, WORKSHOPS));
render();
  },
  destroy: function(){
    cleanup.destroy();
  }
};

export default design;
