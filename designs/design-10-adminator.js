/* Adminator — KPI stat row, sidebar + topbar app shell, table-based directory.
   Same GF helper contract as every other design (window.GF / window.GF_DATA),
   plus js/shell.js for the shared sidebar+topbar chrome — see js/shell.js and
   designs/design-6-index.js (the simplest existing design) for the pattern
   this follows. */

var activeCleanup = null;

var design = {
  id: "adminator",
  name: "Adminator",
  note: "Dashboard KPI cards, sidebar shell, table directory",
  swatch: "#2563EB",
  css: "css/design-10-adminator.css",
  html: "<div class=\"shell\">\n<div data-shell-sidebar></div>\n<div class=\"main\">\n<div data-shell-topbar></div>\n<main class=\"content\">\n\n  <div class=\"gfa-head\">\n    <span class=\"eyebrow\">United Arab Emirates</span>\n    <h1 class=\"gfa-title\">Garage Finder</h1>\n    <p class=\"gfa-sub\">Agency and non-agency repair workshops, filterable by emirate, type and insurer panel.</p>\n  </div>\n\n  <section class=\"grid\" aria-label=\"Directory totals\">\n    <article class=\"col-3 kpi-card\">\n      <div class=\"kpi-top\"><div class=\"kpi-icon primary\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\"><path d=\"M3 21h18\"/><path d=\"M5 21V7l7-4 7 4v14\"/><path d=\"M9 21v-6h6v6\"/></svg></div></div>\n      <div class=\"kpi-value\" id=\"f-total\">0</div>\n      <div class=\"kpi-label\">Workshops listed</div>\n    </article>\n    <article class=\"col-3 kpi-card\">\n      <div class=\"kpi-top\"><div class=\"kpi-icon success\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\"><path d=\"m9 12 2 2 4-4\"/><circle cx=\"12\" cy=\"12\" r=\"9\"/></svg></div></div>\n      <div class=\"kpi-value\" id=\"f-agency\">0</div>\n      <div class=\"kpi-label\">Agency</div>\n    </article>\n    <article class=\"col-3 kpi-card\">\n      <div class=\"kpi-top\"><div class=\"kpi-icon warning\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\"><path d=\"M14.7 6.3a1 1 0 0 0 1.4 1.4l3.6-3.6a5 5 0 0 1-6.7 6.7l-6.9 6.9a2 2 0 0 1-2.8-2.8l6.9-6.9a5 5 0 0 1 6.7-6.7z\"/></svg></div></div>\n      <div class=\"kpi-value\" id=\"f-non\">0</div>\n      <div class=\"kpi-label\">Non-agency</div>\n    </article>\n    <article class=\"col-3 kpi-card\">\n      <div class=\"kpi-top\"><div class=\"kpi-icon purple\"><svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.8\"><path d=\"M12 21s7-6.5 7-11.5A7 7 0 0 0 5 9.5C5 14.5 12 21 12 21z\"/><circle cx=\"12\" cy=\"10\" r=\"3\"/></svg></div></div>\n      <div class=\"kpi-value\" id=\"f-em\">0</div>\n      <div class=\"kpi-label\">Emirates covered</div>\n    </article>\n  </section>\n\n  <section class=\"card gfa-directory\">\n    <div class=\"card-head\">\n      <div class=\"card-title-wrap\"><span class=\"eyebrow\">Directory</span><h2 class=\"card-title\">All workshops</h2></div>\n      <span class=\"card-action\" id=\"gfa-count\"></span>\n    </div>\n    <div class=\"gfa-controls\">\n      <div class=\"gfa-search\">\n        <svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"><circle cx=\"11\" cy=\"11\" r=\"7\"/><path d=\"m21 21-4.3-4.3\"/></svg>\n        <input id=\"q\" type=\"search\" placeholder=\"Look up a name, area or make…\" autocomplete=\"off\">\n      </div>\n      <div class=\"gfa-filters\" id=\"types\">\n        <button type=\"button\" class=\"is-active\" data-type=\"all\" aria-pressed=\"true\">All</button>\n        <button type=\"button\" data-type=\"agency\" aria-pressed=\"false\">Agency</button>\n        <button type=\"button\" data-type=\"nonagency\" aria-pressed=\"false\">Non-agency</button>\n      </div>\n      <select id=\"em\" class=\"gfa-select\" aria-label=\"Filter by emirate\"></select>\n      <select id=\"ins\" class=\"gfa-select\" aria-label=\"Filter by insurer panel\"></select>\n    </div>\n    <div class=\"table-wrap\" style=\"overflow-x:auto\">\n      <table class=\"table\">\n        <thead><tr><th>Workshop</th><th>Type</th><th>Emirate</th><th>Panel / makes</th><th>Phone</th><th></th></tr></thead>\n        <tbody id=\"list\"></tbody>\n      </table>\n    </div>\n    <p class=\"gfa-empty\" id=\"empty\" hidden>No workshops match these filters. Try widening the emirate or panel, or clearing the search.</p>\n  </section>\n\n</main>\n</div>\n</div>",
  start: function(){
    var GF = window.GF || {};
    var cleanup = GF.createCleanup();
    activeCleanup = cleanup;
    var esc = GF.esc || window.GF_esc || function(s){
      return String(s == null ? '' : s)
        .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
        .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
    };
    var WORKSHOPS = window.GF_DATA.workshops;
    var EMIRATES = GF.emirates || ["Abu Dhabi","Dubai","Sharjah","Ajman","Ras Al Khaimah","Fujairah","Umm Al Quwain"];
    var INSURERS = window.GF_DATA.insurers;
    var state = { emirate: "all", type: "all", insurer: "all", q: "" };

    if (window.GFShell) window.GFShell.mount('garage-finder', 'Claims Suite | Garage Finder');

    var listEl = document.getElementById('list');
    var emEl = document.getElementById('em');
    var insEl = document.getElementById('ins');
    var typesEl = document.getElementById('types');
    var emptyEl = document.getElementById('empty');
    var countEl = document.getElementById('gfa-count');

    emEl.innerHTML = '<option value="all">All emirates</option>' + EMIRATES.map(function(e){ return '<option>' + esc(e) + '</option>'; }).join('');
    insEl.innerHTML = '<option value="all">All panels</option>' + INSURERS.map(function(i){ return '<option>' + esc(i) + '</option>'; }).join('');

    document.getElementById('f-total').textContent = WORKSHOPS.length;
    document.getElementById('f-agency').textContent = WORKSHOPS.filter(function(w){ return w.type === 'agency'; }).length;
    document.getElementById('f-non').textContent = WORKSHOPS.filter(function(w){ return w.type === 'nonagency'; }).length;
    document.getElementById('f-em').textContent = new Set(WORKSHOPS.map(function(w){ return w.emirate; })).size;

    function render(){
      var list = GF.filter(WORKSHOPS, state).sort(function(a, b){ return a.name.localeCompare(b.name); });
      countEl.textContent = list.length + (list.length === 1 ? ' workshop' : ' workshops');

      if (!list.length){
        listEl.innerHTML = '';
        emptyEl.hidden = false;
        return;
      }
      emptyEl.hidden = true;

      listEl.innerHTML = list.map(function(w){
        var detail = w.type === 'agency'
          ? esc((w.makes || []).join(' · '))
          : esc((w.insurers || []).join(' · '));
        var phone = w.phone
          ? '<span class="gfa-phone">' + GF.phoneLines(w.phone) + '</span>'
          : '<span class="gfa-phone blank">no number on file</span>';
        return (
          '<tr class="' + (w.pending ? 'gf-is-pending' : '') + '">' +
            '<td><span class="gfa-name">' + esc(w.name) + '</span>' + GF.pendingBadge(w) +
              '<a class="gfa-addr" href="' + GF.mapsHref(w) + '" target="_blank" rel="noopener">' + esc(w.address) + '</a></td>' +
            '<td><span class="tag ' + (w.type === 'agency' ? 't-agency' : 't-nonagency') + '">' + (w.type === 'agency' ? 'Agency' : 'Non-agency') + '</span></td>' +
            '<td>' + esc(w.emirate) + '</td>' +
            '<td><span class="gfa-detail">' + detail + '</span></td>' +
            '<td>' + phone + '</td>' +
            '<td><div class="gfa-row-acts">' +
              (w.phone ? '<a class="gfa-ibtn" href="' + GF.firstTel(w.phone) + '">Call</a>' : '<span class="gfa-ibtn is-off">Call</span>') +
              '<a class="gfa-ibtn" href="' + GF.mapsHref(w) + '" target="_blank" rel="noopener">Map</a>' +
              '<button class="gfa-ibtn" type="button" data-copy="' + WORKSHOPS.indexOf(w) + '">Copy</button>' +
            '</div></td>' +
          '</tr>'
        );
      }).join('');
    }

    function onTypesClick(e){
      var b = e.target.closest('button'); if (!b) return;
      state.type = b.getAttribute('data-type');
      typesEl.querySelectorAll('button').forEach(function(x){
        var active = x === b;
        x.classList.toggle('is-active', active);
        x.setAttribute('aria-pressed', active);
      });
      render();
    }
    cleanup.listen(typesEl, 'click', onTypesClick);
    function onEmChange(e){ state.emirate = e.target.value; render(); }
    cleanup.listen(emEl, 'change', onEmChange);
    function onInsChange(e){ state.insurer = e.target.value; render(); }
    cleanup.listen(insEl, 'change', onInsChange);
    function onQueryInput(e){ state.q = e.target.value; render(); }
    cleanup.listen(document.getElementById('q'), 'input', onQueryInput);
    cleanup.add(GF.wireCopy(listEl, WORKSHOPS));

    render();
  },
  destroy: function(){
    if (activeCleanup){
      activeCleanup.destroy();
      activeCleanup = null;
    }
  }
};

export default design;
