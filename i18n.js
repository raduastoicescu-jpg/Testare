/* Shared i18n engine for all pages */
(function () {
  var SUPPORTED = ['en', 'ro', 'it', 'de', 'fr', 'uk'];
  var DEFAULT = 'en';

  function getLang() {
    var s = localStorage.getItem('lang');
    if (s && SUPPORTED.indexOf(s) >= 0) return s;
    return DEFAULT;
  }

  function apply(lang) {
    var T = window.TRANS && (window.TRANS[lang] || window.TRANS[DEFAULT]) || {};

    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var k = el.getAttribute('data-i18n');
      if (T[k] != null) el.textContent = T[k];
    });

    document.querySelectorAll('[data-i18n-html]').forEach(function (el) {
      var k = el.getAttribute('data-i18n-html');
      if (T[k] != null) el.innerHTML = T[k];
    });

    ['placeholder', 'title', 'aria-label'].forEach(function (attr) {
      document.querySelectorAll('[data-i18n-' + attr + ']').forEach(function (el) {
        var k = el.getAttribute('data-i18n-' + attr);
        if (T[k] != null) el.setAttribute(attr, T[k]);
      });
    });

    document.documentElement.lang = lang;
  }

  function updateUI(lang) {
    var flags  = { en: 'gb', ro: 'ro', it: 'it', de: 'de', fr: 'fr', uk: 'ua' };
    var labels = { en: 'EN', ro: 'RO', it: 'IT', de: 'DE', fr: 'FR', uk: 'UA' };
    var el = document.getElementById('lang-current');
    if (el) el.innerHTML = '<span class="fi fi-' + (flags[lang] || lang) + '"></span> ' + (labels[lang] || lang.toUpperCase());
    document.querySelectorAll('.lang-btn').forEach(function (btn) {
      btn.classList.toggle('lang-active', btn.getAttribute('data-lang') === lang);
    });
  }

  window.setLang = function (code) {
    if (SUPPORTED.indexOf(code) < 0) return;
    localStorage.setItem('lang', code);
    apply(code);
    updateUI(code);
    var dd = document.getElementById('lang-dropdown');
    if (dd) dd.classList.add('hidden');
  };

  function init() {
    var lang = getLang();

    document.querySelectorAll('.lang-btn').forEach(function (btn) {
      btn.addEventListener('click', function () { window.setLang(btn.getAttribute('data-lang')); });
    });

    var toggle = document.getElementById('lang-toggle');
    if (toggle) {
      toggle.addEventListener('click', function (e) {
        e.stopPropagation();
        var dd = document.getElementById('lang-dropdown');
        if (dd) dd.classList.toggle('hidden');
      });
    }

    document.addEventListener('click', function () {
      var dd = document.getElementById('lang-dropdown');
      if (dd && !dd.classList.contains('hidden')) dd.classList.add('hidden');
    });

    apply(lang);
    updateUI(lang);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
