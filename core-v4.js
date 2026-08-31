/* ============================================================================
   CORE
   ----------------------------------------------------------------------------
   Everything the six designs share:

     • builds the public workshop list from the authenticated publication API
     • loads whichever design the visitor picked and swaps it on demand
     • the design picker in the bottom-right corner
     • the "+ Add workshop" form and sending submissions to submit.php

   Each design brings its own header, filter controls and card layout. This
   file never draws a card.
   ========================================================================== */

(function(){
  'use strict';

  /* ------------------------------------------------------------------------
     WHICH DESIGN LOADS FIRST
     Change to any id below: board, jobcard, index, blocks, splitdesk, neu
     ------------------------------------------------------------------------ */
  var DEFAULT_DESIGN = 'board';

  /* Set to false to hide the picker and lock the site to DEFAULT_DESIGN. */
  var SHOW_PICKER = true;

  /* Where visitor submissions go. Set to '' to switch submissions off. */
  var SUBMIT_ENDPOINT = 'submit.php';

  /* Loaded design modules are kept here after a successful import. The
     manifest below contains only lightweight metadata; it does not load any
     design implementation. */
  window.GF_DESIGNS = window.GF_DESIGNS || {};

  var DESIGN_MANIFEST = {
    board:     {name:'Board',     note:'Industrial dispatch board, plate strip', file:'design-1-board.js', css:'css/design-1-board.css', swatch:'#00713C'},
    jobcard:   {name:'Jobcard',   note:'Carbon-copy repair order, ruled form', file:'design-2-jobcard.js', css:'css/design-2-jobcard.css', swatch:'#1E2A63'},
    index:     {name:'Index',     note:'Printed directory, A-Z rail', file:'design-6-index.js', css:'css/design-6-index.css', swatch:'#1E2FA0'},
    blocks:    {name:'Blocks',    note:'Swiss colour blocks, band toolbar', file:'design-7-blocks.js', css:'css/design-7-blocks.css', swatch:'#E23E2C'},
    splitdesk: {name:'Splitdesk', note:'List left, full record right', file:'design-8-splitdesk.js', css:'css/design-8-splitdesk.css', swatch:'#0E5C55'},
    neu:       {name:'Neu',       note:'Neumorphism, carved surfaces — animated & interactive', file:'design-9-neu.js', css:'css/design-9-neu.css', swatch:'#4A57C4'},
    adminator: {name:'Adminator', note:'Dashboard KPI cards, sidebar shell, table directory', file:'design-10-adminator.js', css:'css/design-10-adminator.css', swatch:'#2563EB'}
  };

  var designModules = {};
  var designLoads = {};

  /* Each design owns only the font families it actually declares. Font CSS is
     loaded with the design stylesheet instead of shipping ten Google Fonts
     stylesheets in the initial HTML. IBM Plex is self-hosted for Jobcard. */
  var DESIGN_FONT_CSS = {
    board: 'https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800&family=Roboto+Mono:wght@400;500&display=swap',
    jobcard: 'css/fonts/jobcard.css',
    index: 'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Inter:wght@400;500;600&display=swap',
    blocks: 'https://fonts.googleapis.com/css2?family=Anton&family=Archivo:wght@400;500;600;700&display=swap',
    splitdesk: 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=DM+Mono:wght@400;500&display=swap',
    neu: 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap',
    adminator: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Inter+Tight:wght@500;600;700&family=JetBrains+Mono:wght@400;500&display=swap'
  };

  var designFontLoads = {};
  var designFontReady = {};

  function designMeta(id){ return DESIGN_MANIFEST[id] || null; }

  function loadDesignFonts(id, priority){
    if (designFontReady[id]) return Promise.resolve(true);
    if (designFontLoads[id]) return designFontLoads[id];
    var href = DESIGN_FONT_CSS[id];
    if (!href) return Promise.resolve(true);
    var el = document.createElement('link');
    el.rel = 'stylesheet';
    el.href = href;
    el.setAttribute('data-gf-fonts', id);
    if (priority === 'initial') el.setAttribute('fetchpriority', 'high');
    else el.setAttribute('fetchpriority', 'low');
    var promise = new Promise(function(resolve){
      function done(ok){
        designFontReady[id] = !!ok;
        el.removeEventListener('load', onload);
        el.removeEventListener('error', onerror);
        resolve(!!ok);
      }
      function onload(){ done(true); }
      function onerror(){ done(false); }
      el.addEventListener('load', onload);
      el.addEventListener('error', onerror);
    });
    designFontLoads[id] = promise;
    document.head.appendChild(el);
    return promise;
  }

  function known(id){ return ORDER.indexOf(id) !== -1 && !!designMeta(id); }

  function loadDesign(id){
    if (designModules[id]) return Promise.resolve(designModules[id]);
    if (designLoads[id]) return designLoads[id];

    var meta = designMeta(id);
    if (!meta) return Promise.reject(new Error('Unknown design: ' + id));

    var url = './designs/' + meta.file + '?v=' + ASSET_V;
    var promise = import(url).then(function(mod){
      var d = mod && (mod.default || mod.design);
      if (!d || d.id !== id || typeof d.start !== 'function') {
        throw new Error('Design module \"' + id + '\" has an invalid export.');
      }
      designModules[id] = d;
      window.GF_DESIGNS[id] = d;
      delete designLoads[id];
      return d;
    }).catch(function(err){
      delete designLoads[id];
      throw err;
    });

    designLoads[id] = promise;
    return promise;
  }

  /* Bump this whenever you re-upload changed files, so returning visitors
     get the new ones instead of a cached copy. */
  var ASSET_V = '6';

  var ORDER = ['board','jobcard','index','blocks','splitdesk','neu','adminator'];

  var EMIRATES = ['Abu Dhabi','Dubai','Sharjah','Ajman',
                  'Ras Al Khaimah','Fujairah','Umm Al Quwain'];

  /* ======================================================================
     DATA
     ====================================================================== */
  var workshops = [];
  var insurers = (typeof insurerData !== 'undefined' ? insurerData : [])
    .map(function(r){ return r && r.name; })
    .filter(function(n){ return n && n !== 'Insurer name as it should appear'; });
  insurers = insurers.filter(function(n, i){ return insurers.indexOf(n) === i; }).sort();

  function norm(w, type){
    return {
      id: w.id || '', type: type, name: w.name || '', emirate: w.emirate || '',
      address: w.address || '', phone: w.phone || '', hours: w.hours || '', notes: w.notes || '',
      makes: w.makes || [], insurers: type === 'nonagency' ? (w.insurers || []) : [],
      pending: !!w.pending, duplicateReview: !!w.duplicateReview,
      submissionId: w.submissionId || '',
      lastVerified: w.lastVerified || '',
      verificationStatus: ['verified','outdated','review'].indexOf(w.verificationStatus) !== -1 ? w.verificationStatus : 'review',
      source: w.source || 'Existing directory data'
    };
  }

  var LOCAL_KEY = 'gf_local_workshops';

  /* Unsent add/edit form contents, kept so navigating away or closing the
     sheet by accident does not lose typing. Cleared only on a successful
     submit or when the visitor clears the form themselves. */
  var DRAFT_PREFIX = 'gf_form_draft_';
  var draftKey = null;
  function readDraft(key){ try { return JSON.parse(localStorage.getItem(DRAFT_PREFIX + key) || 'null'); } catch(e){ return null; } }
  function writeDraft(key, data){ try { localStorage.setItem(DRAFT_PREFIX + key, JSON.stringify(data)); } catch(e){} }
  function dropDraft(key){ try { localStorage.removeItem(DRAFT_PREFIX + key); } catch(e){} }
  function readLocal(){ try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]'); } catch(e){ return []; } }
  function writeLocal(list){ try { localStorage.setItem(LOCAL_KEY, JSON.stringify(list)); } catch(e){} }
  function normalizeIdentityText(s){ return String(s || '').normalize('NFKC').toLowerCase().replace(/\s+/g,' ').trim().replace(/[^\p{L}\p{N}\s]/gu,'').replace(/\s+/g,' '); }
  function normalizeIdentityPhone(s){ var digits=String(s||'').replace(/\D/g,'').replace(/^00/,''); if(digits.indexOf('971')===0)return '971'+(digits.charAt(3)==='0'?digits.slice(4):digits.slice(3)); if(digits.charAt(0)==='0')return '971'+digits.slice(1); return digits; }
  function identityKey(w){ return [normalizeIdentityText(w&&w.name),normalizeIdentityText(w&&w.emirate),normalizeIdentityPhone(w&&w.phone),normalizeIdentityText(w&&w.address)].join('|'); }
  function stableWorkshopId(w){ if(w&&w.id)return String(w.id); var input=identityKey(w),hash=2166136261; for(var i=0;i<input.length;i++){hash^=input.charCodeAt(i);hash=Math.imul(hash,16777619)>>>0;} return 'ws_'+('00000000'+hash.toString(16)).slice(-8); }
  function exactIdentityMatch(a,b){ if(a&&b&&a.id&&b.id)return String(a.id)===String(b.id); return identityKey(a)===identityKey(b); }
  function uncertainIdentityMatch(a,b){ if(!a||!b)return false; return normalizeIdentityText(a.name)===normalizeIdentityText(b.name)&&normalizeIdentityText(a.emirate)===normalizeIdentityText(b.emirate)&&!exactIdentityMatch(a,b); }
  function isPublished(w){ for(var i=0;i<workshops.length;i++) if(exactIdentityMatch(workshops[i],w)) return true; return false; }
  function publishedIdentityReview(w){ for(var i=0;i<workshops.length;i++) if(uncertainIdentityMatch(workshops[i],w)) return true; return false; }

  function initializePublishedData(publishedRows){
    workshops = (Array.isArray(publishedRows)?publishedRows:[]).map(function(w){
      return norm(w, w.type === 'nonagency' ? 'nonagency' : 'agency');
    });
    var mine=readLocal(), stillMine=mine.filter(function(w){
      if(isPublished(w)) return false;
      w.id=stableWorkshopId(w); w.duplicateReview=publishedIdentityReview(w); return true;
    });
    if(stillMine.length!==mine.length) writeLocal(stillMine);
    var kept=[];
    stillMine.forEach(function(w){
      for(var i=0;i<kept.length;i++) if(exactIdentityMatch(kept[i],w)) return;
      w.pending=true; kept.push(w); workshops.push(norm(w,w.type==='nonagency'?'nonagency':'agency'));
    });
    workshops.sort(function(a,b){return a.name.localeCompare(b.name);});
    window.GF_DATA={workshops:workshops,insurers:insurers,emirates:EMIRATES};
  }

  function fetchPublishedData(){
    return fetch('submit.php?action=published',{cache:'no-store',headers:{'Accept':'application/json'}})
      .then(function(res){ if(!res.ok) throw new Error('Published workshop API returned HTTP '+res.status); return res.json(); })
      .then(function(data){ if(!data||data.ok!==true||!Array.isArray(data.workshops)) throw new Error('Published workshop API returned invalid data.'); initializePublishedData(data.workshops); })
      .catch(function(apiErr){
        /* submit.php only runs on a PHP host (e.g. InfinityFree). Static hosts
           such as GitHub Pages cannot execute it, so the request above either
           fails outright or returns the raw PHP source instead of JSON. Fall
           back to the static snapshot checked into data/published-workshops.json
           so the directory still renders, read-only, on a static host. */
        return fetch('data/published-workshops.json',{cache:'no-store',headers:{'Accept':'application/json'}})
          .then(function(res){ if(!res.ok) throw apiErr; return res.json(); })
          .then(function(rows){
            if(!Array.isArray(rows)) throw apiErr;
            SUBMIT_ENDPOINT = ''; // no backend to send submissions to; hides the add-workshop button
            initializePublishedData(rows);
          })
          .catch(function(){ throw apiErr; });
      });
  }

  /* ======================================================================
     MOUNTING A DESIGN
     ====================================================================== */
  var stage  = null;
  var link   = null;
  var current = DEFAULT_DESIGN;
  var pendingRemember = false;
  var KEY = 'gf_design';

  var mountSeq = 0;
  var currentDesign = null;
  var destroyActiveInsurerPicker = null;
  var cancelPendingMount = null;

  function mount(id, remember){
    if (!known(id)) id = known(DEFAULT_DESIGN) ? DEFAULT_DESIGN : ORDER[0];

    var seq = ++mountSeq;
    var previous = currentDesign;

    /* Invalidate/cancel any asynchronous CSS callback belonging to the
       previous mount before starting this one. */
    if (cancelPendingMount){
      cancelPendingMount();
      cancelPendingMount = null;
    }

    if (previous && typeof previous.destroy === 'function'){
      try {
        previous.destroy();
      } catch (err) {
        console.error('Design "' + previous.id + '" failed to destroy:', err);
      }
    }

    if (destroyActiveInsurerPicker){
      try {
        destroyActiveInsurerPicker();
      } catch (err) {
        console.error('Insurer picker cleanup failed:', err);
      }
      destroyActiveInsurerPicker = null;
    }

    currentDesign = null;
    current = id;
    pendingRemember = !!remember;

    document.body.removeAttribute('style');
    document.body.className = '';
    document.documentElement.removeAttribute('style');
    stage.className = '';
    stage.innerHTML = '';

    /* Only the selected design implementation is imported here. The module
       is cached after a successful import, while a pending import is shared
       by repeated selections of the same design. */
    loadDesign(id).then(function(d){
      /* A later selection has superseded this asynchronous import. Never
         allow a stale module to mutate the DOM or become current. */
      if (seq !== mountSeq) return;

      currentDesign = d;

      function paint(){
        if (seq !== mountSeq || currentDesign !== d) return;

        activate(id, seq);
        stage.innerHTML = d.html;

        try {
          d.start();
        } catch (err) {
          console.error('Design "' + id + '" failed to start:', err);
        }

        finish();
      }

      Promise.all([waitForSheet(id, seq), loadDesignFonts(id, 'initial')]).then(function(){
        /* A stylesheet/font callback from an old mount may finish its own
           cache bookkeeping, but it can never paint or activate the design. */
        if (seq !== mountSeq || currentDesign !== d) return;
        paint();
      });
    }).catch(function(err){
      if (seq !== mountSeq) return;
      console.error('Design "' + id + '" failed to load:', err);
      stage.innerHTML = '<div class="gf-design-error" role="alert">Could not load this design. Please choose another design.</div>';
      pendingRemember = false;
      currentDesign = null;
    });
  }

  function finish(){
    var d = window.GF_DESIGNS[current];
    document.title = 'Garage Finder — ' + d.name;
    window.scrollTo(0, 0);
    paintPicker();
    mountAddButton();
    enhanceControls();

    /* Each design arrives its own way — see the animation block in
       shared.css. The class is removed as soon as the animation ends,
       because a lingering transform on #stage would trap any
       position:fixed child inside it (the Index design's A–Z rail). */
    playEntrance(d.id);

    /* The current design is interactive now; begin fetching unused styles
       only after this first mount has completed. */
    warmRemainingStyles();

    if (pendingRemember){
      pendingRemember = false;
      try { localStorage.setItem(KEY, current); } catch (e) {}
      try { history.replaceState(null, '', '#' + current); } catch (e) { location.hash = current; }
    }
  }



  /* ======================================================================
     STYLESHEETS
     ----------------------------------------------------------------------
     Only the stylesheet for the currently selected design is loaded during
     the initial mount. It is fetched at high priority and the mount waits
     for it before painting that design, so the first design never flashes
     unstyled or inherits rules from another design.

     Once the first interface is interactive, the remaining design
     stylesheets are requested lazily at low priority and kept inactive.
     Their load callbacks may update their own cache record, but they can
     never activate a stylesheet or mutate the current design. Mounts are
     still protected by mountSeq, just like asynchronous design imports.
     ====================================================================== */
  var sheets = {};
  var stylesWarmupStarted = false;

  function sheetFor(id, priority){
    if (sheets[id]) {
      if (priority === 'initial') sheets[id].el.setAttribute('fetchpriority', 'high');
      return sheets[id];
    }
    var d = designMeta(id);
    if (!d) return null;

    var href = d.css + '?v=' + ASSET_V;
    var el = document.createElement('link');
    el.rel = 'stylesheet';
    el.href = href;
    el.media = 'not all';
    el.setAttribute('data-design', id);
    el.setAttribute('data-gf-design-sheet', 'true');
    el.setAttribute('fetchpriority', priority === 'initial' ? 'high' : 'low');

    var rec = {el: el, ready: false, failed: false, loaded: false, promise: null};
    rec.promise = new Promise(function(resolve){
      function done(ok){
        rec.ready = true;
        rec.loaded = !!ok;
        rec.failed = !ok;
        el.removeEventListener('load', onload);
        el.removeEventListener('error', onerror);
        resolve(rec);
      }
      function onload(){ done(true); }
      function onerror(){ done(false); }
      el.addEventListener('load', onload);
      el.addEventListener('error', onerror);
    });

    sheets[id] = rec;
    document.head.appendChild(el);
    return rec;
  }

  function waitForSheet(id, seq){
    var rec = sheetFor(id, 'initial');
    if (!rec) return Promise.resolve(null);
    if (rec.ready || rec.el.sheet) { rec.ready=true; rec.loaded=true; return Promise.resolve(rec); }
    var timeout = new Promise(function(resolve){
      window.setTimeout(function(){
        if (!rec.ready) rec.timedOut=true;
        resolve(rec);
      }, 2500);
    });
    return Promise.race([rec.promise, timeout]).then(function(result){
      /* The mount token is checked by the caller immediately before paint.
         A stale stylesheet can therefore finish later without taking over. */
      return result;
    });
  }

  function activate(id, seq){
    if (seq != null && seq !== mountSeq) return;
    for (var other in sheets){
      if (Object.prototype.hasOwnProperty.call(sheets, other) && other !== id){
        sheets[other].el.media = 'not all';
      }
    }
    var rec = sheets[id];
    if (rec && (!rec.failed) && (rec.ready || rec.timedOut)) rec.el.media = 'all';
  }

  function warmRemainingStyles(){
    if (stylesWarmupStarted) return;
    stylesWarmupStarted = true;

    function loadRest(){
      for (var i = 0; i < ORDER.length; i++){
        var id = ORDER[i];
        if (id === current) continue;
        if (!sheets[id]) sheetFor(id, 'lazy');
        loadDesignFonts(id, 'lazy');
      }
    }

    if (typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(loadRest, {timeout: 1500});
    } else {
      window.setTimeout(loadRest, 0);
    }
  }

  /* ======================================================================
     SEARCH SUGGESTIONS + INSURER PICKER
     ----------------------------------------------------------------------
     Both attach to whatever the mounted design already renders — the
     search box (#q) and the insurer select (#ins) — so no design file
     needs to know they exist. The markup carries neutral class hooks and
     each design's own stylesheet dresses them in its own language.

     Both panels are positioned against the viewport rather than inside the
     design's layout, so they cannot disturb it.
     ====================================================================== */

  function workshopsOnPanel(name){
    return countOnPanel(name);
  }

  /* Escape any value before it is interpolated into HTML. Prefer textContent
     / DOM APIs when building UI from scratch; use this when a template string
     is unavoidable. Covers text nodes and double-quoted attributes. */
  const esc = window.GF_SECURITY.escapeHTML;
  window.GF_esc = esc;

  /* ======================================================================
     SHARED DESIGN API  (window.GF)
     ----------------------------------------------------------------------
     Designs are pure presenters. All data, filtering, phone normalisation,
     maps links and copy-to-clipboard live here once. A design should only:
       • own its shell HTML and CSS
       • call GF.filter() / GF.phoneLines() / GF.mapsHref() / …
       • render the returned list in its own visual language
     ====================================================================== */
  var SHORT_EMIRATE = {
    'Abu Dhabi': 'AUH', Dubai: 'DXB', Sharjah: 'SHJ', Ajman: 'AJM',
    'Ras Al Khaimah': 'RAK', Fujairah: 'FUJ', 'Umm Al Quwain': 'UAQ'
  };

  function fullAddress(w){
    var a = (w.address || '').trim();
    if (!a) return w.emirate || '';
    if (!w.emirate) return a;
    return a.toLowerCase().indexOf(String(w.emirate).toLowerCase()) !== -1
      ? a : a + ', ' + w.emirate;
  }

  function mapsHref(w){
    return 'https://www.google.com/maps/search/?api=1&query=' +
      encodeURIComponent((w.name || '') + ', ' + fullAddress(w) + ', United Arab Emirates');
  }

  function parsePhones(str){
    return String(str || '')
      .split(/\s*(?:,|;|\/|\bor\b|\||\n)\s*/i)
      .map(function(s){ return s.trim(); })
      .filter(function(s){ return s.replace(/\D/g, '').length >= 6; });
  }

  function telHref(p){
    var d = String(p || '').replace(/\D/g, '');
    if (d.indexOf('00') === 0) d = d.slice(2);
    if (d.indexOf('971') === 0){
      d = d.slice(3);
      if (d.charAt(0) === '0') d = d.slice(1);
      d = '971' + d;
    } else if (d.charAt(0) === '0'){
      d = '971' + d.slice(1);
    }
    return d ? 'tel:+' + d : '';
  }

  function firstTel(str){
    var list = parsePhones(str);
    return list.length ? telHref(list[0]) : '';
  }

  function phoneLines(str, cls){
    var list = parsePhones(str);
    if (!list.length) return '';
    return '<span class="tel-lines">' + list.map(function(p){
      return '<a class="tel-line ' + (cls || '') + '" href="' + telHref(p) + '">' + esc(p) + '</a>';
    }).join('') + '</span>';
  }

  function searchHay(w){
    return (
      (w.name || '') + ' ' +
      (w.address || '') + ' ' +
      (w.emirate || '') + ' ' +
      (w.makes || []).join(' ') + ' ' +
      (w.insurers || []).join(' ')
    ).toLowerCase();
  }

  /* state: { emirate, type, insurer, q } — any field may be omitted or 'all'/'' */
  function filterWorkshops(list, state){
    state = state || {};
    var em  = state.emirate || 'all';
    var ty  = state.type    || 'all';
    var ins = state.insurer || 'all';
    var q   = (state.q || '').trim().toLowerCase();
    return (list || window.GF_DATA.workshops).filter(function(w){
      if (em  !== 'all' && w.emirate !== em) return false;
      if (ty  !== 'all' && w.type    !== ty) return false;
      if (ins !== 'all' && !(w.insurers && w.insurers.indexOf(ins) !== -1)) return false;
      if (q && searchHay(w).indexOf(q) === -1) return false;
      return true;
    });
  }

  function countOnPanel(name, list){
    list = list || window.GF_DATA.workshops;
    var n = 0;
    for (var i = 0; i < list.length; i++){
      if (list[i].insurers && list[i].insurers.indexOf(name) !== -1) n++;
    }
    return n;
  }

  function countInEmirate(name, list){
    list = list || window.GF_DATA.workshops;
    var n = 0;
    for (var i = 0; i < list.length; i++){
      if (list[i].emirate === name) n++;
    }
    return n;
  }

  function detailsText(w){
    var out = [
      w.name || '',
      w.type === 'agency' ? 'Agency workshop' : 'Non-agency workshop',
      fullAddress(w)
    ];
    if (w.phone) out.push('Phone: ' + w.phone);
    if (w.makes && w.makes.length) out.push('Makes: ' + w.makes.join(', '));
    if (w.insurers && w.insurers.length) out.push('Insurer panels: ' + w.insurers.join(', '));
    out.push(mapsHref(w));
    return out.join('\n');
  }

  function flashCopied(btn){
    var label = btn.getAttribute('data-label') || btn.textContent;
    btn.setAttribute('data-label', label);
    btn.textContent = 'Copied';
    setTimeout(function(){ btn.textContent = label; }, 1500);
  }

  function legacyCopy(text, btn){
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.className = 'gf-copy-buffer';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); flashCopied(btn); } catch (e) {}
    document.body.removeChild(ta);
  }

  function copyDetails(btn, w){
    var text = detailsText(w);
    if (navigator.clipboard && window.isSecureContext){
      navigator.clipboard.writeText(text).then(function(){ flashCopied(btn); })
        .catch(function(){ legacyCopy(text, btn); });
    } else {
      legacyCopy(text, btn);
    }
  }

  /* Wire [data-copy="<index>"] buttons inside a container.
     index refers into the array passed as list (usually the filtered list). */
  function wireCopy(container, list){
    if (!container || container.getAttribute('data-gf-copy')) return function(){};
    container.setAttribute('data-gf-copy', '1');

    function onCopyClick(e){
      var b = e.target.closest('[data-copy]');
      if (!b) return;
      e.preventDefault();
      var idx = Number(b.getAttribute('data-copy'));
      var src = list || window.GF_DATA.workshops;
      if (src[idx]) copyDetails(b, src[idx]);
    }

    container.addEventListener('click', onCopyClick);
    return function(){
      container.removeEventListener('click', onCopyClick);
      container.removeAttribute('data-gf-copy');
    };
  }

  /* ---------- lifecycle cleanup helper ---------- */
  function createCleanup(){
    var cleanups = [];

    return {
      listen: function(target, event, handler, options){
        target.addEventListener(event, handler, options);
        cleanups.push(function(){
          target.removeEventListener(event, handler, options);
        });
      },

      add: function(fn){
        if (typeof fn === 'function') cleanups.push(fn);
      },

      destroy: function(){
        while (cleanups.length){
          var cleanup = cleanups.pop();
          try {
            cleanup();
          } catch (err) {
            console.error('Cleanup failed:', err);
          }
        }
      }
    };
  }

  function pendingBadge(w){
    if (!w || !w.pending) return '';
    var badge = '<span class="gf-pending-badge">Awaiting review</span>';
    /* Editing needs the server-side submission id, which only exists once
       the submit call has come back. A copy saved before that (or by an
       older build) shows the badge without the button. */
    if (!w.submissionId) return badge;
    return badge + '<button type="button" class="gf-pending-edit" data-edit-pending="' + esc(w.id) + '">Edit</button>';
  }

  window.GF = {
    esc:           esc,
    emirates:      EMIRATES,
    shortEmirate:  SHORT_EMIRATE,
    fullAddress:   fullAddress,
    mapsHref:      mapsHref,
    parsePhones:   parsePhones,
    telHref:       telHref,
    firstTel:      firstTel,
    phoneLines:    phoneLines,
    searchHay:     searchHay,
    filter:        filterWorkshops,
    countOnPanel:  countOnPanel,
    countInEmirate: countInEmirate,
    detailsText:   detailsText,
    copyDetails:   copyDetails,
    wireCopy:      wireCopy,
    createCleanup: createCleanup,
    pendingBadge:  pendingBadge
  };

  /* ---------- what the search box can suggest ---------- */
  var suggestIndex = null;
  /* "Al Quoz Industrial Area 3", "Al Quoz Ind Area 4" and "Al Quoz 2" are
     all the same area for suggestion purposes — strip the numbered
     sub-area/parenthetical noise so they collapse to one "Al Quoz" entry
     instead of cluttering the list with near-duplicates. */
  function normalizeArea(area){
    return String(area || '')
      .replace(/\s*[-–(].*$/,'')
      .replace(/\s+(industrial\s+)?(ind\.?\s+)?area\s*(no\.?\s*)?\d+\s*$/i,'')
      .replace(/\s+(no\.?\s*)?\d+\s*$/i,'')
      .trim();
  }

  function buildSuggestIndex(){
    if (suggestIndex) return suggestIndex;
    var seen = {}, out = [];
    function add(text, kind){
      if (!text) return;
      var key = kind + '|' + String(text).toLowerCase();
      if (seen[key]) return;
      seen[key] = 1;
      out.push({text: String(text), kind: kind});
    }
    window.GF_DATA.workshops.forEach(function(w){
      add(w.name, 'workshop');
      (w.makes || []).forEach(function(m){ add(m, 'make'); });
      add(w.emirate, 'emirate');
      /* the area is the useful part of an address — "Al Quoz Industrial
         Area 3, Dubai" is worth suggesting as "Al Quoz" */
      if (w.address){
        var area = normalizeArea(w.address.split(',')[0].trim());
        if (area.length > 2 && area.length < 46) add(area, 'area');
      }
    });
    suggestIndex = out;
    return out;
  }

  /* The search box is rebuilt every time a design mounts, so nothing is
     attached to the element itself. One set of delegated listeners on the
     document handles whichever #q happens to be on the page. */
  var suggestBox = null;
  var suggestActive = -1;

  function suggestEl(){
    if (suggestBox && suggestBox.isConnected) return suggestBox;
    suggestBox = document.createElement('div');
    suggestBox.id = 'gfSuggest';
    suggestBox.className = 'gf-sugg';
    suggestBox.hidden = true;
    document.body.appendChild(suggestBox);

    suggestBox.addEventListener('mousedown', function(e){ e.preventDefault(); });
    suggestBox.addEventListener('click', function(e){
      var b = e.target.closest('.gf-sugg-row');
      if (!b) return;
      var input = document.getElementById('q');
      if (!input) return;
      input.value = b.getAttribute('data-v');
      hideSuggest();
      input.dispatchEvent(new Event('input', {bubbles:true}));   // let the design filter
      input.focus();
    });
    return suggestBox;
  }

  function hideSuggest(){
    if (suggestBox) suggestBox.hidden = true;
    suggestActive = -1;
  }

  function placeSuggest(input){
    var box = suggestEl();
    var r = input.getBoundingClientRect();
    box.style.left  = Math.round(r.left) + 'px';
    box.style.top   = Math.round(r.bottom + 6) + 'px';
    box.style.width = Math.round(r.width) + 'px';
  }

  function drawSuggest(input){
    var q = (input.value || '').trim().toLowerCase();
    if (!q){ hideSuggest(); return; }

    var all = buildSuggestIndex(), starts = [], has = [];
    for (var i = 0; i < all.length; i++){
      var l = all[i].text.toLowerCase();
      if (l.indexOf(q) === 0) starts.push(all[i]);
      else if (l.indexOf(q) !== -1) has.push(all[i]);
    }
    var hits = starts.concat(has).slice(0, 8);
    var box = suggestEl();

    if (!hits.length){
      box.innerHTML = '<p class="gf-sugg-none">Nothing matching that.</p>';
    } else {
      box.innerHTML = hits.map(function(h, k){
        return '<button class="gf-sugg-row" type="button" data-v="' + esc(h.text) + '"' +
               (k === suggestActive ? ' aria-selected="true"' : '') + '>' +
               '<span class="gf-sugg-txt">' + esc(h.text) + '</span>' +
               '<span class="gf-sugg-kind">' + h.kind + '</span></button>';
      }).join('');
    }
    placeSuggest(input);
    box.hidden = false;
  }

  function isSearchBox(el){
    return el && el.id === 'q' && stage && stage.contains(el);
  }

  document.addEventListener('input', function(e){
    if (!isSearchBox(e.target)) return;
    suggestActive = -1;
    drawSuggest(e.target);
  });
  document.addEventListener('focusin', function(e){
    if (isSearchBox(e.target)) drawSuggest(e.target);
  });
  document.addEventListener('keydown', function(e){
    if (!isSearchBox(e.target)) return;
    var box = suggestBox;
    if (!box || box.hidden) return;
    var rows = box.querySelectorAll('.gf-sugg-row');
    if (!rows.length) return;

    if (e.key === 'ArrowDown' || e.key === 'ArrowUp'){
      e.preventDefault();
      suggestActive = (suggestActive + (e.key === 'ArrowDown' ? 1 : -1) + rows.length) % rows.length;
      drawSuggest(e.target);
    } else if (e.key === 'Enter' && suggestActive >= 0){
      e.preventDefault();
      e.target.value = rows[suggestActive].getAttribute('data-v');
      hideSuggest();
      e.target.dispatchEvent(new Event('input', {bubbles:true}));
    } else if (e.key === 'Escape'){
      hideSuggest();
    }
  });
  document.addEventListener('click', function(e){
    if (isSearchBox(e.target)) return;
    if (e.target.closest && e.target.closest('#gfSuggest')) return;
    hideSuggest();
  });
  window.addEventListener('scroll', function(){
    var input = document.getElementById('q');
    if (suggestBox && !suggestBox.hidden && input) placeSuggest(input);
  }, true);
  window.addEventListener('resize', function(){
    var input = document.getElementById('q');
    if (suggestBox && !suggestBox.hidden && input) placeSuggest(input);
  });

  /* ---------- insurer picker over the design's own <select> ---------- */
  function attachInsurerPicker(sel){
    if (!sel || sel.dataset.gfPicker) return;
    sel.dataset.gfPicker = '1';
    sel.style.display = 'none';           // keep it: the design still listens to it

    var trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'gf-ins-trigger';
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.innerHTML =
      '<span class="gf-ins-label">Insurer panel</span>' +
      '<span class="gf-ins-value">All insurers</span>' +
      '<span class="gf-ins-chev" aria-hidden="true">▾</span>';
    sel.parentNode.insertBefore(trigger, sel.nextSibling);

    var sheet = document.createElement('div');
    sheet.className = 'gf-ins-sheet';
    sheet.hidden = true;
    sheet.innerHTML =
      '<div class="gf-ins-scrim" data-close></div>' +
      '<div class="gf-ins-panel" role="dialog" aria-modal="true" aria-label="Insurer panel">' +
        '<div class="gf-ins-grab"></div>' +
        '<div class="gf-ins-top"><h2>Insurer panel</h2>' +
          '<button class="gf-ins-x" type="button" data-close aria-label="Close">&times;</button></div>' +
        '<div class="gf-ins-search"><input type="search" placeholder="Search insurers" autocomplete="off"></div>' +
        '<div class="gf-ins-list" role="listbox"></div>' +
      '</div>';
    document.body.appendChild(sheet);

    var search = sheet.querySelector('.gf-ins-search input');
    var list   = sheet.querySelector('.gf-ins-list');
    var value  = trigger.querySelector('.gf-ins-value');

    function draw(){
      var q = search.value.trim().toLowerCase();
      var rows = [];
      var withCount = [];
      var without = [];

      window.GF_DATA.insurers.forEach(function(n){
        if (q && n.toLowerCase().indexOf(q) === -1) return;
        var c = workshopsOnPanel(n);
        if (c > 0) withCount.push({name: n, count: c});
        else without.push(n);
      });

      // Active panels first, sorted by workshop count (desc) then name
      withCount.sort(function(a, b){
        return b.count - a.count || a.name.localeCompare(b.name);
      });
      without.sort(function(a, b){ return a.localeCompare(b); });

      if (!q){
        rows.push('<button class="gf-ins-row" type="button" role="option" data-v="all" aria-selected="' +
          (sel.value === 'all') + '"><span class="gf-ins-name">All insurers</span>' +
          '<span class="gf-ins-n">' + window.GF_DATA.workshops.length + '</span></button>');
        if (withCount.length) rows.push('<div class="gf-ins-sep" role="separator"></div>');
      }

      withCount.forEach(function(item){
        rows.push('<button class="gf-ins-row" type="button" role="option" data-v="' + esc(item.name) + '"' +
          ' aria-selected="' + (sel.value === item.name) + '">' +
          '<span class="gf-ins-name">' + esc(item.name) + '</span>' +
          '<span class="gf-ins-n">' + item.count + '</span></button>');
      });

      if (without.length){
        if (!q && withCount.length) rows.push('<div class="gf-ins-sep" role="separator"></div>');
        if (!q) rows.push('<div class="gf-ins-group">Other insurers</div>');
        without.forEach(function(n){
          rows.push('<button class="gf-ins-row" type="button" role="option" data-v="' + esc(n) + '"' +
            ' aria-selected="' + (sel.value === n) + '" data-empty="1">' +
            '<span class="gf-ins-name">' + esc(n) + '</span>' +
            '<span class="gf-ins-n">0</span></button>');
        });
      }

      list.innerHTML = rows.length ? rows.join('') : '<p class="gf-ins-none">No insurer by that name.</p>';
    }
    function open(){
      sheet.hidden = false;
      search.value = '';
      draw();
      setTimeout(function(){ try { search.focus({preventScroll:true}); } catch(e){} }, 60);
    }
    function close(){ sheet.hidden = true; }
    function pick(v){
      sel.value = v;
      value.textContent = v === 'all' ? 'All insurers' : v;
      trigger.classList.toggle('is-set', v !== 'all');
      sel.dispatchEvent(new Event('change', {bubbles:true}));   // the design re-renders
      close();
    }

    var cleanup = createCleanup();

    function onTriggerClick(){ open(); }
    function onSearchInput(){ draw(); }
    function onSheetClick(e){
      if (e.target.closest('[data-close]')){ close(); return; }
      var r = e.target.closest('.gf-ins-row');
      if (r) pick(r.getAttribute('data-v'));
    }
    function onPickerKeyDown(e){
      if (e.key === 'Escape' && !sheet.hidden) close();
    }

    cleanup.listen(trigger, 'click', onTriggerClick);
    cleanup.listen(search, 'input', onSearchInput);
    cleanup.listen(sheet, 'click', onSheetClick);
    cleanup.listen(document, 'keydown', onPickerKeyDown);

    /* The picker is core-owned and is recreated for each mounted design.
       Keep exactly one cleanup handle so repeated mounts cannot accumulate
       document Escape listeners. */
    function destroyPicker(){
      cleanup.destroy();
      if (sheet.parentNode) sheet.parentNode.removeChild(sheet);
      if (trigger.parentNode) trigger.parentNode.removeChild(trigger);
      sel.dataset.gfPicker = '';
      if (destroyActiveInsurerPicker === destroyPicker) {
        destroyActiveInsurerPicker = null;
      }
    }

    destroyActiveInsurerPicker = destroyPicker;
  }

  /* Called after every mount, on whatever markup the design produced. */
  function enhanceControls(){
    hideSuggest();
    if (destroyActiveInsurerPicker){
      try {
        destroyActiveInsurerPicker();
      } catch (err) {
        console.error('Insurer picker cleanup failed:', err);
      }
      destroyActiveInsurerPicker = null;
    }
    [].forEach.call(document.querySelectorAll('.gf-ins-sheet'), function(s){ s.remove(); });
    /* Neu builds its own inline insurer list instead of the shared
       bottom-sheet picker — see design-9-neu.js. */
    if (current !== 'neu') attachInsurerPicker(stage.querySelector('#ins'));
  }

  /* ======================================================================
     ENTRANCE ANIMATION
     ====================================================================== */
  var entranceTimer = null;

  function playEntrance(id){
    if (!stage) return;
    stage.className = '';
    if (entranceTimer){ clearTimeout(entranceTimer); entranceTimer = null; }

    // restart the animation even when the same design is remounted
    void stage.offsetWidth;
    stage.className = 'gf-in-' + id;

    var cleared = false;
    function clear(){
      if (cleared) return;
      cleared = true;
      stage.className = '';
      stage.removeEventListener('animationend', onEnd);
    }
    function onEnd(e){
      if (e.target === stage) clear();
    }
    stage.addEventListener('animationend', onEnd);

    // belt and braces: clear even if animationend never fires
    entranceTimer = setTimeout(clear, 1200);
  }

  /* ======================================================================
     PICKER
     ====================================================================== */
  function paintPicker(){
    var num = document.getElementById('gfNum');
    if (!num) return;
    var i = ORDER.indexOf(current);
    num.textContent = (i + 1) + '/' + ORDER.length;
    var cur = designModules[current] || designMeta(current);
    document.getElementById('gfName').textContent = cur ? cur.name : '';
    Array.prototype.forEach.call(document.querySelectorAll('#gfList .item'), function(b){
      b.setAttribute('aria-current', b.getAttribute('data-id') === current ? 'true' : 'false');
    });
  }

  function buildPicker(){
    if (!SHOW_PICKER) return;
    if (!ORDER.length) return;
    var wrap = document.createElement('div');
    wrap.id = 'gfPicker';
    wrap.innerHTML =
      '<div id="gfMenu" hidden><h3>Choose a design</h3><div id="gfList">' +
      ORDER.map(function(id, i){
        var d = designMeta(id);
        if (!d) return '';
        return '<button class="item" type="button" data-id="' + esc(id) + '" aria-current="false">' +
                 '<span class="sw" style="background:' + esc(d.swatch) + '"></span>' +
                 '<span><strong>' + (i+1) + '. ' + esc(d.name) + '</strong><small>' + esc(d.note) + '</small></span>' +
               '</button>';
      }).join('') +
      '</div><p class="hint">Each design is its own page. Your choice is remembered on this device. Press [ and ] to cycle.</p></div>' +
      '<button id="gfToggle" type="button" aria-expanded="false">' +
        '<span class="n" id="gfNum"></span><span id="gfName"></span></button>';
    document.body.appendChild(wrap);

    var menu = document.getElementById('gfMenu');
    var toggle = document.getElementById('gfToggle');

    toggle.addEventListener('click', function(){
      var open = menu.hidden;
      menu.hidden = !open;
      toggle.setAttribute('aria-expanded', String(open));
    });
    document.getElementById('gfList').addEventListener('click', function(e){
      var b = e.target.closest('.item'); if (!b) return;
      mount(b.getAttribute('data-id'), true);
      menu.hidden = true;
      toggle.setAttribute('aria-expanded', 'false');
    });
    document.addEventListener('click', function(e){
      if (!menu.hidden && !e.target.closest('#gfPicker')){
        menu.hidden = true;
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
    document.addEventListener('keydown', function(e){
      if (e.key === 'Escape'){ menu.hidden = true; toggle.setAttribute('aria-expanded','false'); return; }
      if (e.target.matches('input, select, textarea')) return;
      if (document.getElementById('gfAdd') && !document.getElementById('gfAdd').hidden) return;
      if (e.key === '[' || e.key === ']'){
        var i = ORDER.indexOf(current);
        mount(ORDER[(i + (e.key === ']' ? 1 : -1) + ORDER.length) % ORDER.length], true);
      }
    });
  }


  /* ======================================================================
     PHONE NUMBERS — call, WhatsApp, copy
     Designs render a workshop's phone as a single tel: link, even when the
     record holds several numbers. Clicks are intercepted here so every
     design gets one sheet listing each number separately.
     ====================================================================== */

  function parsePhones(str){
    return String(str || '')
      .split(/\s*(?:,|;|\/|\bor\b|\||\n)\s*/i)
      .map(function(s){ return s.trim(); })
      .filter(function(s){ return (s.replace(/\D/g, '').length >= 6); });
  }

  /* UAE numbers to international form, for tel: and wa.me links. */
  function intlDigits(num){
    var d = String(num || '').replace(/\D/g, '');
    if (d.indexOf('00') === 0) d = d.slice(2);
    if (d.indexOf('971') === 0){
      var rest = d.slice(3);
      if (rest.charAt(0) === '0') rest = rest.slice(1);   // drop the trunk 0
      return '971' + rest;
    }
    if (d.charAt(0) === '0')    return '971' + d.slice(1);
    if (d.length === 9 && d.charAt(0) === '5') return '971' + d;
    return d;
  }
  function isMobile(num){ return /^9715\d{8}$/.test(intlDigits(num)); }

  function copyText(text, btn){
    var done = function(){
      var was = btn.textContent;
      btn.textContent = 'Copied';
      setTimeout(function(){ btn.textContent = was; }, 1400);
    };
    if (navigator.clipboard && window.isSecureContext){
      navigator.clipboard.writeText(text).then(done).catch(function(){ legacyCopy(text, done); });
    } else { legacyCopy(text, done); }
  }
  function legacyCopy(text, done){
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.className = 'gf-copy-buffer';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); done(); } catch (e) {}
    document.body.removeChild(ta);
  }

  function openCallSheet(numbers, title){
    var box = document.getElementById('gfCall');
    if (!box){
      box = document.createElement('div');
      box.id = 'gfCall';
      document.body.appendChild(box);
      box.addEventListener('click', function(e){
        if (e.target === box) box.hidden = true;
        var close = e.target.closest('#gfCallClose');
        if (close) box.hidden = true;
        var copy = e.target.closest('[data-copynum]');
        if (copy){ copyText(copy.getAttribute('data-copynum'), copy); }
      });
    }
    box.innerHTML =
      '<div class="gf-sheet" role="dialog" aria-modal="true" aria-label="Call this workshop">' +
        '<div class="gf-sheet-top"><h2>' + (title || 'Call') + '</h2>' +
          '<button type="button" id="gfCallClose" aria-label="Close">&times;</button></div>' +
        (numbers.length > 1
          ? '<p class="gf-sheet-note">' + numbers.length + ' numbers on file — pick one.</p>'
          : '') +
        numbers.map(function(n){
          var intl = intlDigits(n);
          return '<div class="gf-num">' +
            '<span class="gf-num-txt">' + n + '</span>' +
            '<div class="gf-num-acts">' +
              '<a class="gf-num-btn is-call" href="tel:' + (intl ? '+' + intl : n.replace(/\s/g,'')) + '">Call</a>' +
              (isMobile(n)
                ? '<a class="gf-num-btn is-wa" href="https://wa.me/' + intl + '" target="_blank" rel="noopener">WhatsApp</a>'
                : '<span class="gf-num-btn is-off" title="Not a mobile number">WhatsApp</span>') +
              '<button type="button" class="gf-num-btn" data-copynum="' + n.replace(/"/g, '&quot;') + '">Copy</button>' +
            '</div>' +
          '</div>';
        }).join('') +
      '</div>';
    box.hidden = false;
  }

  /* Any tel: link in any design opens the sheet instead of dialling blind. */
  document.addEventListener('click', function(e){
    var a = e.target.closest && e.target.closest('a[href^="tel:"]');
    if (!a) return;
    if (a.closest('#gfCall')) return;          // the sheet's own Call button
    e.preventDefault();

    var raw = decodeURIComponent(a.getAttribute('href').slice(4));
    var digits = raw.replace(/\D/g, '').slice(-9);

    /* Find the workshop this number belongs to, so every number it has is
       offered — designs often render them all as one link. */
    var found = null;
    for (var i = 0; i < window.GF_DATA.workshops.length && !found; i++){
      var w = window.GF_DATA.workshops[i];
      if (w.phone && w.phone.replace(/\D/g, '').indexOf(digits) !== -1) found = w;
    }
    var nums = found ? parsePhones(found.phone) : parsePhones(raw);
    if (!nums.length) nums = [raw];
    openCallSheet(nums, found ? found.name : 'Call');
  });

  /* ======================================================================
     TYPE-AHEAD for the comma-separated fields
     ====================================================================== */
  function attachSuggest(input, listFn, label){
    if (!input) return;
    var wrap = document.createElement('div');
    wrap.className = 'gf-sugg gf-add-sugg';
    wrap.id = input.id + 'Sugg';
    wrap.setAttribute('role', 'listbox');
    input.parentNode.insertBefore(wrap, input.nextSibling);

    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-autocomplete', 'list');
    input.setAttribute('aria-controls', wrap.id);
    input.setAttribute('aria-expanded', 'false');
    function setExpanded(open){ input.setAttribute('aria-expanded', open ? 'true' : 'false'); }

    function normalizeList(){
      return (listFn() || []).map(function(item){
        // Support both the current insurer object format and legacy string lists.
        if (item && typeof item === 'object') return String(item.name || '').trim();
        return String(item || '').trim();
      }).filter(Boolean).filter(function(n, i, arr){
        return arr.indexOf(n) === i;
      });
    }

    function segments(){ return input.value.split(','); }
    function currentTerm(){ return segments()[segments().length - 1].trim(); }
    function close(){ wrap.replaceChildren(); setExpanded(false); }

    function choose(value){
      var segs = segments();
      segs[segs.length - 1] = ' ' + value;
      input.value = segs.join(',').replace(/^\s+/, '') + ', ';
      close();
      input.focus();
      check(true);
      saveDraft();
    }

    function render(){
      var term = currentTerm().toLowerCase();
      if (!term){ close(); return; }

      var all = normalizeList();
      var chosen = segments().slice(0, -1).map(function(s){ return s.trim().toLowerCase(); });
      var starts = [], has = [];

      all.forEach(function(n){
        var l = n.toLowerCase();
        if (chosen.indexOf(l) !== -1) return;
        if (l.indexOf(term) === 0) starts.push(n);
        else if (l.indexOf(term) !== -1) has.push(n);
      });

      var hits = starts.concat(has).slice(0, 8);
      if (!hits.length){
        wrap.replaceChildren();
        var none = document.createElement('p');
        none.className = 'gf-sugg-none';
        none.textContent = 'No ' + label + ' by that name. Check the spelling, or ask the site owner to add it.';
        wrap.appendChild(none);
        return;
      }

      wrap.replaceChildren();
      hits.forEach(function(n){
        var button = document.createElement('button');
        button.type = 'button';
        button.className = 'gf-sugg-row gf-add-sugg-item';
        button.setAttribute('role', 'option');
        button.dataset.v = n;
        button.textContent = n;
        wrap.appendChild(button);
      });
      setExpanded(true);
    }

    // Only completed comma-separated values are validated while typing.
    // A partial term such as "tokio" or "merce" must not be shown as invalid
    // when it matches an available suggestion.
    function check(forceCurrent){
      var all = normalizeList();
      var lower = all.map(function(n){ return n.toLowerCase(); });
      var segs = segments();
      var current = currentTerm();
      var completed = segs.slice(0, -1).map(function(s){ return s.trim(); }).filter(Boolean);
      if (forceCurrent && current) completed.push(current);

      var bad = completed.filter(function(s){
        return lower.indexOf(s.toLowerCase()) === -1;
      });

      var currentLower = current.toLowerCase();
      var currentHasMatch = !current || lower.some(function(n){
        return n.indexOf(currentLower) !== -1;
      });

      var note = input.parentNode.querySelector('.gf-unknown');
      if (!note){
        note = document.createElement('p');
        note.className = 'gf-unknown';
        input.parentNode.appendChild(note);
      }

      if (bad.length || (forceCurrent && current && !currentHasMatch)){
        note.hidden = false;
        note.textContent = 'Not on the ' + label + ' list: ' + bad.concat(
          (!bad.length && current ? [current] : [])
        ).join(', ') + ' — it will not match any filter until the site owner adds it.';
      } else {
        note.hidden = true;
      }
    }

    input.addEventListener('input', function(){ render(); check(false); });
    input.addEventListener('focus', render);
    input.addEventListener('blur', function(){ check(true); });

    wrap.addEventListener('click', function(e){
      var b = e.target.closest('.gf-add-sugg-item');
      if (b) choose(b.getAttribute('data-v'));
    });

    input.addEventListener('keydown', function(e){
      var first = wrap.querySelector('.gf-add-sugg-item');
      if (e.key === 'Enter' && first){
        e.preventDefault();
        choose(first.getAttribute('data-v'));
      }
      if (e.key === 'Escape') close();
    });

    document.addEventListener('click', function(e){
      if (!e.target.closest || (!e.target.closest('.gf-add-sugg') && e.target !== input)) close();
    });
  }

  function allMakes(){
    var seen = {}, out = [];
    window.GF_DATA.workshops.forEach(function(w){
      (w.makes || []).forEach(function(m){
        var k = m.toLowerCase();
        if (!seen[k]){ seen[k] = 1; out.push(m); }
      });
    });
    return out.sort();
  }

  /* ======================================================================
     ADD WORKSHOP
     One shared form, so every design offers it and the payload matches
     submit.php exactly.
     ====================================================================== */
  function mountAddButton(){
    if (!SUBMIT_ENDPOINT) return;
    if (document.getElementById('gfAddBtn')) return;
    var b = document.createElement('button');
    b.id = 'gfAddBtn';
    b.type = 'button';
    b.textContent = '+ Add workshop';
    b.addEventListener('click', function(){ openAdd(null); });
    document.body.appendChild(b);
  }

  /* Every card for a pending (not-yet-approved) workshop carries an
     "Edit" button (see GF.pendingBadge). Since designs are swapped out
     and re-rendered constantly, this is one delegated listener rather
     than something each design has to wire up itself. */
  var editingId = null;
  var editingSubmissionId = '';
  document.addEventListener('click', function(e){
    var b = e.target.closest && e.target.closest('[data-edit-pending]');
    if (!b) return;
    var id = b.getAttribute('data-edit-pending');
    var w = (window.GF_DATA.workshops || []).filter(function(x){ return x.pending && x.id === id; })[0];
    if (!w) return;
    openAdd(w);
  });

  function field(label, id, ph, tag){
    return '<label class="gf-f"><span>' + label + '</span>' +
      (tag === 'textarea'
        ? '<textarea id="' + id + '" rows="3" placeholder="' + ph + '"></textarea>'
        : '<input id="' + id + '" placeholder="' + ph + '">') + '</label>';
  }

  function openAdd(editWorkshop){
    editingId = editWorkshop ? editWorkshop.id : null;
    editingSubmissionId = editWorkshop ? (editWorkshop.submissionId || '') : '';
    var box = document.getElementById('gfAdd');
    if (!box){
      box = document.createElement('div');
      box.id = 'gfAdd';
      box.innerHTML =
        '<div class="gf-sheet" role="dialog" aria-modal="true" aria-label="Add a workshop">' +
          '<div class="gf-sheet-top"><h2 id="gfSheetTitle">Add a workshop</h2>' +
            '<button type="button" id="gfAddClose" aria-label="Close">&times;</button></div>' +
          '<p class="gf-sheet-note" id="gfSheetNote">This is sent to the site owner for review. It shows in your own list straight away, marked as awaiting review, and disappears from your device once the owner publishes it. <button type="button" id="gfClearMine" class="gf-linkbtn">Clear my saved additions</button></p>' +
          '<label class="gf-f"><span>Type</span><select id="gfType">' +
            '<option value="agency">Agency (dealer workshop)</option>' +
            '<option value="nonagency">Non-agency</option></select></label>' +
          field('Workshop name', 'gfName2', 'e.g. Al Habtoor Motors Service Centre') +
          '<label class="gf-f"><span>Emirate</span><select id="gfEmirate">' +
            EMIRATES.map(function(e){ return '<option>' + e + '</option>'; }).join('') +
          '</select></label>' +
          field('Address', 'gfAddress', 'Area, street') +
          field('Phone', 'gfPhone', 'e.g. 04 123 4567') +
          field('Opening hours', 'gfHours', 'e.g. Sat–Thu 8am–7pm') +
          '<div id="gfMakesWrap">' + field('Car makes', 'gfMakes', 'Start typing — pick from the list. Separate several with commas') + '</div>' +
          '<div id="gfInsWrap" hidden>' + field('Insurer panels', 'gfIns', 'Start typing — pick from the list. Separate several with commas') + '</div>' +
          field('Notes', 'gfNotes', 'Anything worth knowing before dispatch', 'textarea') +
          '<p class="gf-msg" id="gfMsg" hidden></p>' +
          '<div class="gf-sheet-acts">' +
            '<button type="button" class="gf-secondary" id="gfClearForm">Clear form</button>' +
            '<button type="button" class="gf-secondary" id="gfCancel">Cancel</button>' +
            '<button type="button" class="gf-primary" id="gfSave">Send for review</button>' +
          '</div>' +
        '</div>';
      document.body.appendChild(box);

      document.getElementById('gfAddClose').addEventListener('click', closeAdd);
      document.getElementById('gfCancel').addEventListener('click', closeAdd);
      box.addEventListener('click', function(e){ if (e.target === box) closeAdd(); });
      document.getElementById('gfType').addEventListener('change', function(e){
        var non = e.target.value === 'nonagency';
        document.getElementById('gfInsWrap').hidden = !non;
        document.getElementById('gfMakesWrap').hidden = non;
      });
      attachSuggest(document.getElementById('gfIns'),
                    function(){ return window.GF_DATA.insurers; }, 'insurer');
      attachSuggest(document.getElementById('gfMakes'), allMakes, 'car make');
      document.getElementById('gfSave').addEventListener('click', save);

      /* Any keystroke or dropdown change stores the draft, so leaving the
         page (or closing the sheet) never costs the visitor their typing. */
      box.addEventListener('input', saveDraft);
      box.addEventListener('change', saveDraft);

      document.getElementById('gfClearForm').addEventListener('click', function(){
        if (!confirm('Clear everything you have typed in this form?')) return;
        fillForm(null);
        if (draftKey) dropDraft(draftKey);
        document.getElementById('gfMsg').hidden = true;
        document.getElementById('gfName2').focus();
      });

      document.getElementById('gfClearMine').addEventListener('click', function(){
        writeLocal([]);
        window.GF_DATA.workshops = window.GF_DATA.workshops.filter(function(x){ return !x.pending; });
        say('Cleared. Anything still awaiting review is gone from this device only — the owner still has your submission.', true);
        setTimeout(function(){ closeAdd(); mount(current, false); }, 1200);
      });
    }

    /* Reset/populate the form every time the sheet opens, whether this is
       a fresh add or an edit of an existing pending submission — the box
       itself is created once and reused. */
    var isEdit = !!editWorkshop;
    document.getElementById('gfSheetTitle').textContent = isEdit ? 'Edit your submission' : 'Add a workshop';
    document.getElementById('gfSheetNote').firstChild.textContent = isEdit
      ? 'Changes are sent back for review. It stays blurred and marked as awaiting review until the owner approves it. '
      : 'This is sent to the site owner for review. It shows in your own list straight away, marked as awaiting review, and disappears from your device once the owner publishes it. ';
    document.getElementById('gfClearMine').hidden = isEdit;
    document.getElementById('gfSave').textContent = isEdit ? 'Save changes' : 'Send for review';
    document.getElementById('gfMsg').hidden = true;

    /* Drafts are scoped: a half-typed new workshop and a half-typed edit of
       an existing submission are kept apart, so neither overwrites the other. */
    draftKey = isEdit ? ('edit_' + editingId) : 'new';
    var draft = readDraft(draftKey);
    fillForm(draft || (editWorkshop ? {
      type:    editWorkshop.type,
      name:    editWorkshop.name || '',
      emirate: editWorkshop.emirate,
      address: editWorkshop.address || '',
      phone:   editWorkshop.phone || '',
      hours:   editWorkshop.hours || '',
      makes:   (editWorkshop.makes || []).join(', '),
      ins:     (editWorkshop.insurers || []).join(', '),
      notes:   editWorkshop.notes || ''
    } : null));

    box.hidden = false;
    if (draft) say('Picked up where you left off. Use Clear form to start over.', true);
    document.getElementById('gfName2').focus();
  }

  /* Writes a plain object into the form, or resets it when passed nothing. */
  function fillForm(d){
    d = d || {};
    var type = d.type === 'nonagency' ? 'nonagency' : 'agency';
    document.getElementById('gfType').value    = type;
    document.getElementById('gfName2').value   = d.name    || '';
    document.getElementById('gfEmirate').value = d.emirate || EMIRATES[0];
    document.getElementById('gfAddress').value = d.address || '';
    document.getElementById('gfPhone').value   = d.phone   || '';
    document.getElementById('gfHours').value   = d.hours   || '';
    document.getElementById('gfMakes').value   = d.makes   || '';
    document.getElementById('gfIns').value     = d.ins     || '';
    document.getElementById('gfNotes').value   = d.notes   || '';
    var nonAg = type === 'nonagency';
    document.getElementById('gfInsWrap').hidden   = !nonAg;
    document.getElementById('gfMakesWrap').hidden = nonAg;
  }

  /* Reads the form back out and stores it against the current draft key. */
  function saveDraft(){
    if (!draftKey) return;
    var box = document.getElementById('gfAdd');
    if (!box || box.hidden) return;
    writeDraft(draftKey, {
      type:    document.getElementById('gfType').value,
      name:    document.getElementById('gfName2').value,
      emirate: document.getElementById('gfEmirate').value,
      address: document.getElementById('gfAddress').value,
      phone:   document.getElementById('gfPhone').value,
      hours:   document.getElementById('gfHours').value,
      makes:   document.getElementById('gfMakes').value,
      ins:     document.getElementById('gfIns').value,
      notes:   document.getElementById('gfNotes').value
    });
  }

  function closeAdd(){
    /* Deliberately does not discard the draft — closing the sheet, hitting
       Cancel or navigating away all keep whatever was typed. Only a
       successful submit or the Clear form button removes it. */
    saveDraft();
    var box = document.getElementById('gfAdd');
    if (box) box.hidden = true;
    editingId = null;
    editingSubmissionId = '';
    draftKey = null;
  }

  function list(v){
    return String(v || '').split(',').map(function(s){ return s.trim(); }).filter(Boolean);
  }

  function say(text, ok){
    var m = document.getElementById('gfMsg');
    m.hidden = false;
    m.textContent = text;
    m.className = 'gf-msg ' + (ok ? 'is-ok' : 'is-bad');
  }

  function save(){
    var isEdit = !!editingId;
    var type = document.getElementById('gfType').value;
    var w = {
      type:     type,
      name:     document.getElementById('gfName2').value.trim(),
      emirate:  document.getElementById('gfEmirate').value,
      address:  document.getElementById('gfAddress').value.trim(),
      phone:    document.getElementById('gfPhone').value.trim(),
      hours:    document.getElementById('gfHours').value.trim(),
      notes:    document.getElementById('gfNotes').value.trim(),
      makes:    type === 'agency'    ? list(document.getElementById('gfMakes').value) : [],
      insurers: type === 'nonagency' ? list(document.getElementById('gfIns').value)   : []
    };
    if (!w.name){ say('A workshop name is required.', false); return; }

    var btn = document.getElementById('gfSave');
    btn.disabled = true;

    if (isEdit){
      btn.textContent = 'Saving…';
      var editedId = editingId;
      var editedSubmissionId = editingSubmissionId;
      fetch(SUBMIT_ENDPOINT, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ action: 'edit-own', id: editedSubmissionId, workshop: w })
      })
      .then(function(r){ return r.json(); })
      .then(function(res){
        if (res && res.ok){
          dropDraft('edit_' + editedId);
          say('Saved. Still awaiting review with your updated details.', true);
          // Keep the locally-cached copy in step with what the server now has,
          // so a page reload before publication still shows the edited version.
          var saved = readLocal().map(function(x){
            if (x.id !== editedId) return x;
            var updated = Object.assign({}, x, w);
            updated.id = editedId;
            return updated;
          });
          writeLocal(saved);
        } else {
          say((res && res.error) || 'Could not save your changes.', false);
        }
      })
      .catch(function(){
        say('Could not reach the server. Your changes were not saved.', false);
      })
      .then(function(){
        btn.disabled = false;
        btn.textContent = 'Save changes';
        setTimeout(function(){
          closeAdd();
          fetchPublishedData()
            .then(function(){ mount(current, false); })
            .catch(function(){ mount(current, false); });
        }, 1200);
      });
      return;
    }

    // show it to this visitor immediately, without creating a second copy
    w.id = stableWorkshopId(w);
    w.duplicateReview = publishedIdentityReview(w);
    var saved = readLocal().filter(function(x){ return !exactIdentityMatch(x, w); });
    saved.push(w);
    writeLocal(saved);
    window.GF_DATA.workshops = window.GF_DATA.workshops.filter(function(x){
      return !(x.pending && exactIdentityMatch(x, w));
    });
    var added = norm(w, type);
    added.pending = true;
    window.GF_DATA.workshops.push(added);
    window.GF_DATA.workshops.sort(function(a, b){ return a.name.localeCompare(b.name); });

    btn.textContent = 'Sending…';

    fetch(SUBMIT_ENDPOINT, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ action: 'submit', workshop: Object.assign({}, w, {kind: 'new', target: ''}) })
    })
    .then(function(r){ return r.json(); })
    .then(function(res){
      if (res && res.ok){
        dropDraft('new');
        say('Sent for review. It now shows in your list, blurred and marked Awaiting review, until the owner approves it.', true);
      }
      else say((res && res.error) || 'The server rejected it, but it is saved on this device.', false);
    })
    .catch(function(){
      say('Could not reach the server. It is saved on this device only.', false);
    })
    .then(function(){
      btn.disabled = false;
      btn.textContent = 'Send for review';
      setTimeout(function(){
        closeAdd();
        // Re-fetch so the list is rebuilt cleanly (deduplication, localStorage merge)
        // before the design re-renders. Without this, the pending entry added above
        // stays in GF_DATA.workshops AND is pushed again from localStorage on next mount.
        fetchPublishedData()
          .then(function(){ mount(current, false); })
          .catch(function(){ mount(current, false); });
      }, 1200);
    });
  }

  /* ======================================================================
     START
     ====================================================================== */
  function boot(){
    stage = document.getElementById('stage');
    stage.replaceChildren();
    var loading = document.createElement('div');
    loading.className = 'published-loading';
    loading.setAttribute('role', 'status');
    loading.setAttribute('aria-live', 'polite');

    var loadingImage = document.createElement('img');
    loadingImage.src = 'assets/workshop-loader.svg';
    loadingImage.width = 96;
    loadingImage.height = 96;
    loadingImage.alt = '';
    loadingImage.decoding = 'async';

    var loadingLabel = document.createElement('span');
    loadingLabel.className = 'published-loading-label';
    loadingLabel.textContent = 'Loading workshops';

    loading.append(loadingImage, loadingLabel);
    stage.appendChild(loading);
    fetchPublishedData().then(function(){
      if (mountSeq === 0) {
        buildPicker();
        var fromHash=(location.hash||'').replace('#','');
        var saved=null; try{saved=localStorage.getItem(KEY)}catch(e){}
        mount(known(fromHash)?fromHash:(known(saved)?saved:DEFAULT_DESIGN),false);
        window.addEventListener('hashchange',function(){mount((location.hash||'').replace('#',''),false);});
      }
    }).catch(function(err){
      console.error(err);
      stage.innerHTML='<div class="gf-design-error" role="alert">Could not load the published workshop directory. Please try again later.</div>';
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
