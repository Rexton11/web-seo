/**
 * Main — filter tabs, smooth scroll
 */
(function () {
    'use strict';

    /* ── Filter tabs ─────────────────────────── */
    document.querySelectorAll('.filter-tabs').forEach(function (wrapper) {
        var tabs = wrapper.querySelectorAll('.filter-tab');
        var items = wrapper.parentElement.querySelectorAll('.filterable');

        tabs.forEach(function (tab) {
            tab.addEventListener('click', function () {
                tabs.forEach(function (t) { t.classList.remove('active'); });
                tab.classList.add('active');

                var filter = tab.getAttribute('data-filter');

                items.forEach(function (item) {
                    if (filter === 'all') {
                        item.style.display = '';
                    } else {
                        var cats = item.getAttribute('data-categories') || '';
                        item.style.display = cats.indexOf(filter) !== -1 ? '' : 'none';
                    }
                });
            });
        });
    });

    /* ── Smooth scroll for anchor links ──────── */
    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
        link.addEventListener('click', function (e) {
            var target = document.querySelector(this.getAttribute('href'));
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
})();

/* ── Slider arrows (generic) ──────────────── */
document.querySelectorAll('.slider-arrow').forEach(function (btn) {
    btn.addEventListener('click', function () {
        var dir = parseInt(this.getAttribute('data-dir'), 10);
        var sel = this.getAttribute('data-slider');
        var wrapper = this.closest('.testimonials-wrapper, .steps-wrapper');
        var slider = sel ? wrapper.querySelector(sel) : wrapper.querySelector('.testimonials-slider');
        if (!slider) return;
        var firstChild = slider.children[0];
        var scrollAmount = firstChild ? firstChild.offsetWidth + 24 : 400;
        slider.scrollBy({ left: dir * scrollAmount, behavior: 'smooth' });
    });
});

/* ── Mega menu open/close with delay ────── */
(function () {
    var closeTimer = null;
    var DELAY = 300;

    document.querySelectorAll('.nav-item--mega').forEach(function (item) {
        item.addEventListener('mouseenter', function () {
            if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; }
            item.classList.add('open');
        });
        item.addEventListener('mouseleave', function () {
            closeTimer = setTimeout(function () { item.classList.remove('open'); }, DELAY);
        });

        var mega = item.querySelector('.mega-menu');
        if (mega) {
            mega.addEventListener('mouseenter', function () {
                if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; }
                item.classList.add('open');
            });
            mega.addEventListener('mouseleave', function () {
                closeTimer = setTimeout(function () { item.classList.remove('open'); }, DELAY);
            });
        }
    });
})();

/* ── Mega menu category hover ────────────── */
document.querySelectorAll('.mega-menu__cat').forEach(function (cat) {
    cat.addEventListener('mouseenter', function () {
        var slug = this.getAttribute('data-cat');
        var menu = this.closest('.mega-menu');
        menu.querySelectorAll('.mega-menu__cat').forEach(function (c) { c.classList.remove('active'); });
        menu.querySelectorAll('.mega-menu__panel').forEach(function (p) { p.classList.remove('active'); });
        this.classList.add('active');
        var panel = menu.querySelector('.mega-menu__panel[data-cat="' + slug + '"]');
        if (panel) panel.classList.add('active');
    });
});
