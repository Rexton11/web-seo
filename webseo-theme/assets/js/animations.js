/**
 * Motion layer — scroll reveals, kinetic headings, counters,
 * magnetic buttons, cursor-spotlight cards, hero glow & tilt.
 */
(function () {
    'use strict';

    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ── Grain overlay ────────────────────────── */
    var grain = document.createElement('div');
    grain.className = 'grain-overlay';
    grain.setAttribute('aria-hidden', 'true');
    document.body.appendChild(grain);

    /* ── Kinetic hero headings ────────────────── */
    document.querySelectorAll('.js-kinetic').forEach(function (el) {
        var text = el.textContent.trim();
        if (!text) return;
        var words = text.split(/\s+/);
        el.textContent = '';
        words.forEach(function (word, i) {
            var wrap = document.createElement('span');
            wrap.className = 'kinetic-word-wrap';
            var span = document.createElement('span');
            span.className = 'kinetic-word';
            span.style.setProperty('--i', i);
            span.textContent = word;
            wrap.appendChild(span);
            el.appendChild(wrap);
            el.appendChild(document.createTextNode(' '));
        });
    });

    /* ── Scroll reveal ─────────────────────────── */
    var revealEls = document.querySelectorAll('[data-reveal]');
    if (revealEls.length) {
        if (reduced || !('IntersectionObserver' in window)) {
            revealEls.forEach(function (el) { el.classList.add('is-visible'); });
        } else {
            var io = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-visible');
                        io.unobserve(entry.target);
                    }
                });
            }, { threshold: .15, rootMargin: '0px 0px -40px 0px' });
            revealEls.forEach(function (el) { io.observe(el); });
        }
    }

    /* ── Number counters (e.g. "120+", "98%") ──── */
    function animateCounter(el) {
        var raw = el.textContent.trim();
        var match = raw.match(/^(\D*?)([\d\s]+(?:[.,]\d+)?)(\D*)$/);
        if (!match) return;
        var prefix = match[1];
        var numStr = match[2].replace(/\s/g, '').replace(',', '.');
        var suffix = match[3];
        var target = parseFloat(numStr);
        if (isNaN(target)) return;
        var decimals = (numStr.split('.')[1] || '').length;
        var duration = 1400;
        var start = null;

        function step(ts) {
            if (!start) start = ts;
            var p = Math.min((ts - start) / duration, 1);
            var eased = 1 - Math.pow(1 - p, 3);
            el.textContent = prefix + (target * eased).toFixed(decimals) + suffix;
            if (p < 1) requestAnimationFrame(step);
            else el.textContent = raw;
        }
        requestAnimationFrame(step);
    }
    var counters = document.querySelectorAll('.hero-trust__value');
    if (counters.length && !reduced && 'IntersectionObserver' in window) {
        var cIo = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    animateCounter(entry.target);
                    cIo.unobserve(entry.target);
                }
            });
        }, { threshold: .6 });
        counters.forEach(function (el) { cIo.observe(el); });
    }

    if (reduced) return;

    /* ── Magnetic buttons ──────────────────────── */
    document.querySelectorAll('[data-magnetic]').forEach(function (btn) {
        btn.addEventListener('mousemove', function (e) {
            var r = btn.getBoundingClientRect();
            var x = e.clientX - r.left - r.width / 2;
            var y = e.clientY - r.top - r.height / 2;
            btn.style.transform = 'translate(' + (x * .25) + 'px,' + (y * .35) + 'px)';
        });
        btn.addEventListener('mouseleave', function () {
            btn.style.transform = '';
        });
    });

    /* ── Card spotlight (cursor-follow glow) ───── */
    document.querySelectorAll('.card, .pricing-card, .testimonial-card, .service-cat-card').forEach(function (card) {
        card.addEventListener('mousemove', function (e) {
            var r = card.getBoundingClientRect();
            card.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
            card.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
        });
    });

    /* ── Hero cursor glow ──────────────────────── */
    document.querySelectorAll('.hero-glow').forEach(function (glow) {
        var parent = glow.closest('section');
        if (!parent) return;
        parent.addEventListener('mousemove', function (e) {
            var r = parent.getBoundingClientRect();
            glow.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
            glow.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
        });
    });

    /* ── Card tilt ──────────────────────────────── */
    document.querySelectorAll('[data-tilt]').forEach(function (card) {
        card.addEventListener('mousemove', function (e) {
            var r = card.getBoundingClientRect();
            var px = (e.clientX - r.left) / r.width - .5;
            var py = (e.clientY - r.top) / r.height - .5;
            card.style.transform = 'perspective(600px) rotateX(' + (py * -6) + 'deg) rotateY(' + (px * 6) + 'deg)';
        });
        card.addEventListener('mouseleave', function () {
            card.style.transform = '';
        });
    });
})();
