/* Job Card — Carbon-copy repair order, ruled form
   This design's page: its own header, its own filter controls, its own
   cards. It reads the shared workshop list from window.GF_DATA and
   registers itself with core.js. */

var design = {
  id: "jobcard",
  name: "Job Card",
  note: "Carbon-copy repair order, ruled form",
  swatch: "#1E2A63",
  css: "css/design-2-jobcard.css",
  html: "<div class=\"sheet\">\n  <header class=\"head\">\n    <div>\n      <h1>Workshop Dispatch Directory</h1>\n      <p class=\"head-sub\">United Arab Emirates · agency &amp; non-agency</p>\n      <p class=\"head-nav\"><a href=\"https://claude.ai/code/artifact/73fdd97e-17ea-4a8c-8adc-94031565262f\">\u2190 Advisor Desk</a> \u00b7 <a href=\"https://claude.ai/code/artifact/494a0234-80bc-4007-8e4a-b918dcc30b78\">Insurer claim steps \u2192</a></p>\n    </div>\n    <div class=\"formno\">Form GF-01<br>Rev. 09</div>\n  </header>\n\n  <div class=\"fields\">\n    <div class=\"wide\">\n      <label class=\"lbl\" for=\"q\">Search — name, area or make</label>\n      <input class=\"entry\" id=\"q\" type=\"search\" autocomplete=\"off\" placeholder=\"Al Quoz\">\n    </div>\n    <div class=\"wide\">\n      <span class=\"lbl\">Emirate</span>\n      <div class=\"ticks\" id=\"em\"></div>\n    </div>\n    <div>\n      <label class=\"lbl\" for=\"ins\">Insurer panel</label>\n      <select class=\"entry\" id=\"ins\"></select>\n    </div>\n    <div class=\"wide\">\n      <span class=\"lbl\">Workshop type</span>\n      <div class=\"ticks\" id=\"ticks\">\n        <label class=\"tick\"><input type=\"radio\" name=\"type\" value=\"all\" checked><span class=\"box\"></span><span class=\"txt\">All</span></label>\n        <label class=\"tick\"><input type=\"radio\" name=\"type\" value=\"agency\"><span class=\"box\"></span><span class=\"txt\">Agency</span></label>\n        <label class=\"tick\"><input type=\"radio\" name=\"type\" value=\"nonagency\"><span class=\"box\"></span><span class=\"txt\">Non-agency</span></label>\n      </div>\n    </div>\n  </div>\n\n  <div class=\"counter\" id=\"counter\">6 entries listed</div>\n  <div class=\"entries\" id=\"entries\"></div>\n</div>\n<p class=\"foot\"></p>",
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

const emEl = document.getElementById('em');
const insEl = document.getElementById('ins');
const listEl = document.getElementById('entries');
const countEl = document.getElementById('counter');

/* Ticked boxes, like the rest of this form — not a dropdown. */
emEl.innerHTML = ['all'].concat(EMIRATES).map(e =>
  `<button class="tick" type="button" data-em="${esc(e)}" aria-pressed="${e === 'all'}">
     <span class="box"></span><span class="txt">${e === 'all' ? 'All' : esc(e)}</span>
   </button>`).join('');
insEl.innerHTML = '<option value="all">All insurers</option>' + INSURERS.map(i => `<option>${esc(i)}</option>`).join('');

function pad(n){ return String(n).padStart(3,'0'); }

function render(){
  const list = GF.filter(WORKSHOPS, state);
  countEl.textContent = list.length === 1 ? '1 entry listed' : list.length + ' entries listed';
  if (!list.length){
    listEl.innerHTML = `<div class="void"><span class="stamp">No entries</span>
      <p>Nothing on file matches this combination. Widen the emirate or clear the insurer panel.</p></div>`;
    return;
  }
  listEl.innerHTML = list.map((w,i) => {
    const isAgency = w.type === 'agency';
    const third = isAgency
      ? `<div class="cell"><span class="lbl">Makes handled</span>
           <div class="val">${esc(w.makes.join(', '))}</div></div>`
      : `<div class="cell"><span class="lbl">Insurer panels</span>
           <ul class="panel-list">${w.insurers.map(p => `<li>${esc(p)}</li>`).join('')}</ul></div>`;
    return `<article class="card ${w.pending?'gf-is-pending':''}">
      <div class="card-top">
        <span class="card-no">${pad(i+1)}</span>
        <div>
          <h2 class="card-name">${esc(w.name)}</h2>
          ${GF.pendingBadge(w)}
          <span class="lbl">${esc(w.emirate)}</span>
        </div>
        <span class="stamp ${isAgency ? 'is-agency' : ''}">${isAgency ? 'Agency' : 'Non-agency'}</span>
      </div>
      <div class="grid">
        <div class="cell"><span class="lbl">Address</span>
          <div class="val"><a href="${GF.mapsHref(w)}" target="_blank" rel="noopener">${esc(w.address)}</a></div></div>
        ${third}
        <div class="cell"><span class="lbl">Telephone</span>
          <div class="val ${w.phone ? '' : 'is-blank'}">${w.phone
            ? GF.phoneLines(w.phone)
            : '— not on file —'}</div></div>
      </div>
      <div class="card-acts">
        ${w.phone ? `<a class="fbtn" href="${GF.firstTel(w.phone)}">Call</a>` : `<span class="fbtn is-off">Call</span>`}
        <a class="fbtn" href="${GF.mapsHref(w)}" target="_blank" rel="noopener">Open map</a>
        <button class="fbtn" type="button" data-copy="${WORKSHOPS.indexOf(w)}">Copy details</button>
      </div>
    </article>`;
  }).join('');
}

function onQueryInput(e){ state.q = e.target.value; render(); }

cleanup.listen(document.getElementById('q'), 'input', onQueryInput);
function onEmelClick1(e){
  const b = e.target.closest('.tick'); if (!b) return;
  state.emirate = b.dataset.em;
  emEl.querySelectorAll('.tick').forEach(x => x.setAttribute('aria-pressed', x === b));
  render();
}
cleanup.listen(emEl, 'click', onEmelClick1);
function onInsurerChange(e){ state.insurer = e.target.value; render(); }
cleanup.listen(insEl, 'change', onInsurerChange);
function onGetelementbyidTicksChange2(e){ state.type = e.target.value; render(); }
cleanup.listen(document.getElementById('ticks'), 'change', onGetelementbyidTicksChange2);

cleanup.add(GF.wireCopy(listEl, WORKSHOPS));
render();
  },
  destroy: function(){
    cleanup.destroy();
  }
};

export default design;
