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

    // Waitlist → Power Automate (HTTP trigger) via form POST into hidden iframe (avoids browser CORS on Logic Apps URLs).
    var form = document.getElementById('waitlistForm');
    if (form) {
      var submitBtn = form.querySelector('button[type="submit"]');
      var feedbackEl = document.getElementById('waitlistFeedback');
      form.addEventListener('submit', function (e) {
        e.preventDefault();

        var hook =
          (typeof window.JIVAN_POWER_AUTOMATE_URL === 'string' && window.JIVAN_POWER_AUTOMATE_URL.trim()) || '';
        var hp = document.getElementById('waitlist-company');

        if (hp && String(hp.value || '').trim() !== '') {
          if (feedbackEl) {
            feedbackEl.textContent = '';
          }
          return;
        }

        if (!hook) {
          if (feedbackEl) {
            feedbackEl.textContent =
              'Waitlist is not connected yet. Please email talk2us@jivanwellness.life or try again later.';
          }
          return;
        }

        if (typeof form.reportValidity === 'function' && !form.reportValidity()) {
          return;
        }

        if (submitBtn) {
          submitBtn.textContent = 'Sending...';
          submitBtn.disabled = true;
        }
        if (feedbackEl) {
          feedbackEl.textContent = '';
        }

        form.action = hook;
        form.target = 'jivan-pa-iframe';

        form.submit();

        form.reset();
        if (feedbackEl) {
          feedbackEl.textContent =
            'Thank you — you are on the list. We will be in touch. If you do not hear from us, email talk2us@jivanwellness.life.';
        }
        if (submitBtn) {
          submitBtn.textContent = 'Join the waitlist';
          submitBtn.disabled = false;
        }
      });
    }
  });
})();
