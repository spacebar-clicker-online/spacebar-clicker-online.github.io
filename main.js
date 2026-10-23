/* Site-wide: mobile menu, theme toggle, footer year. */
(function () {
  var root = document.documentElement;
  var themeBtn = document.getElementById('themeToggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var cur = root.getAttribute('data-theme');
      if (!cur) cur = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      var next = cur === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('sbc_theme', next); } catch (e) {}
      themeBtn.blur();
      document.dispatchEvent(new CustomEvent('themechange'));
    });
  }
  var menuBtn = document.getElementById('menuToggle');
  var menu = document.getElementById('menu');
  if (menuBtn && menu) {
    menuBtn.addEventListener('click', function () {
      var open = menu.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', String(open));
    });
  }
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
})();
