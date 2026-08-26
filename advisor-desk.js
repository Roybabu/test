(function(){
  // clock
  var clockEl = document.getElementById('clock');
  function tick(){
    var d = new Date();
    var h = String(d.getHours()).padStart(2,'0');
    var m = String(d.getMinutes()).padStart(2,'0');
    clockEl.textContent = h + ':' + m + ' local';
  }
  tick(); setInterval(tick, 1000 * 15);

  // index filter + search combined
  var chips = document.querySelectorAll('#idxFilters .chip');
  var cards = document.querySelectorAll('#idxGrid .idx-card');
  var searchInput = document.getElementById('indexSearch');
  var resultCount = document.getElementById('resultCount');
  var noResults = document.getElementById('noResults');
  var noResultsQuery = document.getElementById('noResultsQuery');
  var activeFilter = 'all';

  function applyFilters(){
    var q = searchInput.value.trim().toLowerCase();
    var shown = 0;
    cards.forEach(function(card){
      var cat = card.getAttribute('data-cat');
      var text = card.textContent.toLowerCase();
      var matchesFilter = activeFilter === 'all' || cat === activeFilter;
      var matchesSearch = q === '' || text.indexOf(q) !== -1;
      var visible = matchesFilter && matchesSearch;
      card.style.display = visible ? '' : 'none';
      if(visible) shown++;
    });
    resultCount.textContent = shown + (shown === 1 ? ' entry' : ' entries');
    if(shown === 0){
      noResults.classList.add('shown');
      noResultsQuery.textContent = q || '(filtered)';
    } else {
      noResults.classList.remove('shown');
    }
  }

  chips.forEach(function(chip){
    chip.addEventListener('click', function(){
      chips.forEach(function(c){ c.classList.remove('active'); });
      chip.classList.add('active');
      activeFilter = chip.getAttribute('data-filter');
      applyFilters();
    });
  });
  searchInput.addEventListener('input', applyFilters);

  // "/" focuses search, like most reference tools
  document.addEventListener('keydown', function(e){
    if(e.key === '/' && document.activeElement !== searchInput){
      e.preventDefault();
      searchInput.focus();
    }
  });

  // feed tabs
  var tabs = document.querySelectorAll('#feedTabs .feed-tab');
  var feedItems = document.querySelectorAll('#feedList .feed-item');
  tabs.forEach(function(tab){
    tab.addEventListener('click', function(){
      tabs.forEach(function(t){ t.classList.remove('active'); });
      tab.classList.add('active');
      var f = tab.getAttribute('data-feed');
      feedItems.forEach(function(item){
        item.style.display = (f === 'all' || item.getAttribute('data-feed') === f) ? '' : 'none';
      });
    });
  });
})();
