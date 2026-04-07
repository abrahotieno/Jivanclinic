(function () {
  document.addEventListener('DOMContentLoaded', function () {
    var year = document.getElementById('jivanYear');
    if (year) year.textContent = String(new Date().getFullYear());

    var btn = document.getElementById('jivanMenuBtn');
    var nav = document.getElementById('jivanMobileNav');
    var menuIcon = btn ? btn.querySelector('.jivan-menu-icon') : null;
    var closeIcon = btn ? btn.querySelector('.jivan-close-icon') : null;

    if (btn && nav) {
      function setOpen(open) {
        if (open) {
          nav.removeAttribute('hidden');
          nav.classList.add('is-open');
          if (menuIcon) menuIcon.setAttribute('hidden', '');
          if (closeIcon) closeIcon.removeAttribute('hidden');
        } else {
          nav.setAttribute('hidden', '');
          nav.classList.remove('is-open');
          if (menuIcon) menuIcon.removeAttribute('hidden');
          if (closeIcon) closeIcon.setAttribute('hidden', '');
        }
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      }

      btn.addEventListener('click', function () {
        setOpen(nav.hidden);
      });

      nav.querySelectorAll('a').forEach(function (link) {
        link.addEventListener('click', function () {
          setOpen(false);
        });
      });
    }

    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
      var id = anchor.getAttribute('href');
      if (id.length < 2) return;
      anchor.addEventListener('click', function (e) {
        var target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        var top = target.getBoundingClientRect().top + window.scrollY - 72;
        window.scrollTo({ top: top, behavior: 'smooth' });
      });
    });
  });
})();
