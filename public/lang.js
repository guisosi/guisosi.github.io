// language: a manual choice always wins, the browser decides the first visit
(function () {
  var KEY = 'lang';
  var store;
  try {
    store = window.localStorage;
    store.getItem(KEY);
  } catch (e) {
    return; // no storage, no redirect: it could never be undone
  }

  // EN · PT links remember the choice
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[data-lang]');
    if (!a) return;
    try {
      store.setItem(KEY, a.getAttribute('data-lang'));
    } catch (err) {}
  });

  // crawlers index both versions through hreflang
  if (/bot|crawl|spider|slurp|preview/i.test(navigator.userAgent)) return;

  var here = /^\/pt(\/|$)/.test(location.pathname) ? 'pt' : 'en';
  var want = store.getItem(KEY);
  if (want !== 'en' && want !== 'pt') {
    var first = (navigator.languages && navigator.languages[0]) || navigator.language || '';
    want = /^pt\b/i.test(first) ? 'pt' : 'en';
    try {
      store.setItem(KEY, want);
    } catch (e) {
      return;
    }
  }
  if (want === here) return;

  var link = document.querySelector('link[rel="alternate"][hreflang="' + (want === 'pt' ? 'pt-BR' : 'en') + '"]');
  if (!link) return;
  // path only, so it never leaves this origin
  var path = new URL(link.href, location.href).pathname;
  if (path === location.pathname) return;
  location.replace(path + location.search + location.hash);
})();
