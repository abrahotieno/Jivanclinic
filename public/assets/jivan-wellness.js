(function () {
  document.addEventListener('DOMContentLoaded', function () {
    var year = document.getElementById('jivanYear');
    if (year) year.textContent = String(new Date().getFullYear());

    var btn = document.getElementById('jivanMenuBtn');
    var nav = document.getElementById('jivanMobileNav');
    var menuIcon = btn ? btn.querySelector('.jivan-menu-icon') : null;
    var closeIcon = btn ? btn.querySelector('.jivan-close-icon') : null;
    
    if (!btn || !nav) return;

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

    // Waitlist — POST JSON to /api/waitlist (Firebase Hosting → Cloud Function → Firestore)
    var form = document.getElementById('waitlistForm');
    if (form) {
      var submitBtn = form.querySelector('button[type="submit"]');
      var feedbackEl = document.getElementById('waitlistFeedback');
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var hp = document.getElementById('waitlist-company');
        var payload = {
          name: (document.getElementById('name') && document.getElementById('name').value) || '',
          email: (document.getElementById('email') && document.getElementById('email').value) || '',
          interest: (document.getElementById('interest') && document.getElementById('interest').value) || '',
          message: (document.getElementById('message') && document.getElementById('message').value) || '',
        };
        if (hp && hp.value) {
          payload._gotcha = hp.value;
        }
        if (submitBtn) {
          submitBtn.textContent = 'Sending...';
          submitBtn.disabled = true;
        }
        if (feedbackEl) {
          feedbackEl.textContent = '';
        }
        fetch('/api/waitlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
          .then(function (res) {
            return res.text().then(function (text) {
              var body = {};
              try {
                body = text ? JSON.parse(text) : {};
              } catch (_) {}
              return { ok: res.ok, status: res.status, body: body };
            });
          })
          .then(function (r) {
            if (r.ok && r.body && r.body.ok) {
              form.reset();
              if (feedbackEl) {
                feedbackEl.textContent = 'Thank you — you are on the list. We will be in touch.';
              }
            } else {
              var msg =
                (r.body && r.body.error) ? r.body.error : 'Something went wrong. Please try again or email us.';
              if (feedbackEl) {
                feedbackEl.textContent = msg;
              }
            }
          })
          .catch(function () {
            if (feedbackEl) {
              feedbackEl.textContent =
                'Could not send your details. Check your connection or email talk2us@jivanwellness.life.';
            }
          })
          .finally(function () {
            if (submitBtn) {
              submitBtn.textContent = 'Join the waitlist';
              submitBtn.disabled = false;
            }
          });
      });
    }
  });
})();
