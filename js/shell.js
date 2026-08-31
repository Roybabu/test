/* Shared sidebar + topbar app shell. Injects markup into
   <div data-shell-sidebar></div> / <div data-shell-topbar></div> placeholders,
   reads the active page from <body data-active="..." data-crumbs="...">, and
   wires the mobile drawer + light/dark theme toggle. Plain script, no build step —
   matches the rest of this site's pages. */
(function(){
  'use strict';

  var NAV = [
    { key:'advisor-desk', text:'Advisor Desk', href:'index.html',
      icon:'<path d="M3 9.5 12 3l9 6.5"/><path d="M5 8.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V8.5"/>' },
    { key:'claimwire', text:'Claim.Wire', href:'claimwire.html',
      icon:'<path d="M22 2 11 13"/><path d="m22 2-7 20-4-9-9-4z"/>' },
    { key:'garage-finder', text:'Garage Finder', href:'garage-finder.html',
      icon:'<circle cx="12" cy="10" r="3"/><path d="M12 21s7-6.5 7-11.5A7 7 0 0 0 5 9.5C5 14.5 12 21 12 21z"/>' },
    { key:'admin', text:'Submissions', href:'admin.html',
      icon:'<path d="M12 3 4 6v6c0 5 3.5 8.5 8 9 4.5-.5 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/>' }
  ];

  function svg(icon){ return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + icon + '</svg>'; }

  function renderSidebar(active){
    var links = NAV.map(function(item){
      var isActive = item.key === active ? ' is-active' : '';
      return '<a class="nav-link' + isActive + '" href="' + item.href + '">' + svg(item.icon) + '<span>' + item.text + '</span></a>';
    }).join('');
    return (
      '<aside class="d-sidebar">' +
        '<a class="brand" href="index.html">' +
          '<span class="brand-logo">' + svg('<path d="M9 12l2 2 4-4"/><path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"/>') + '</span>' +
          '<span><span class="brand-name">Claims Suite</span><br><span class="brand-sub">Advisor tools</span></span>' +
        '</a>' +
        '<nav class="nav-section">' +
          '<div class="nav-label">Tools</div>' +
          links +
        '</nav>' +
      '</aside>'
    );
  }

  function renderTopbar(crumbs){
    var parts = (crumbs || '').split('|').map(function(s){ return s.trim(); }).filter(Boolean);
    var crumbHtml = parts.map(function(p, i){
      var sep = i > 0 ? '<svg class="sep" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>' : '';
      var cls = i === parts.length - 1 ? ' class="current"' : '';
      return sep + '<span' + cls + '>' + p + '</span>';
    }).join('');
    return (
      '<header class="d-topbar">' +
        '<div class="crumbs">' +
          '<button class="hamburger" data-drawer-toggle aria-label="Open navigation">' +
            svg('<line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>') +
          '</button>' +
          crumbHtml +
        '</div>' +
        '<div class="topbar-actions">' +
          '<button class="icon-btn" id="shellThemeToggle" aria-label="Toggle dark mode">' +
            svg('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>') +
          '</button>' +
        '</div>' +
      '</header>'
    );
  }

  function initTheme(){
    var STORAGE_KEY = 'claims-suite-theme';
    var root = document.documentElement;
    var btn = document.getElementById('shellThemeToggle');
    if (!btn) return;
    btn.addEventListener('click', function(){
      var current = root.getAttribute('data-theme');
      var isDark = current ? current === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
      var next = isDark ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem(STORAGE_KEY, next); } catch(e){}
    });
  }

  function initDrawer(){
    var shell = document.querySelector('.shell');
    var toggle = document.querySelector('[data-drawer-toggle]');
    if (!shell || !toggle) return;
    toggle.addEventListener('click', function(){
      shell.classList.toggle('is-drawer-open');
    });
    document.addEventListener('click', function(e){
      if (shell.classList.contains('is-drawer-open') && !shell.querySelector('.d-sidebar').contains(e.target) && e.target !== toggle && !toggle.contains(e.target)){
        shell.classList.remove('is-drawer-open');
      }
    });
  }

  function mount(active, crumbs){
    var sidebarSlot = document.querySelector('[data-shell-sidebar]');
    var topbarSlot = document.querySelector('[data-shell-topbar]');
    active = active || document.body.getAttribute('data-active') || '';
    crumbs = crumbs || document.body.getAttribute('data-crumbs') || '';
    if (sidebarSlot) sidebarSlot.outerHTML = renderSidebar(active);
    if (topbarSlot) topbarSlot.outerHTML = renderTopbar(crumbs);
    initTheme();
    initDrawer();
  }

  /* Exposed for pages whose content (and shell placeholders) are injected
     into the DOM after page load — e.g. Garage Finder's design modules,
     mounted asynchronously by core-v4.js — so they can call this explicitly
     once their own markup is in place, instead of relying on the
     DOMContentLoaded auto-mount below (which would find no placeholders yet). */
  window.GFShell = { mount: mount };

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', function(){ mount(); });
  } else {
    mount();
  }
})();
