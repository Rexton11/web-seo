/**
 * Header — scroll effect + burger menu
 */
(function () {
    'use strict';

    const header = document.getElementById('header');
    const burger = document.getElementById('burger');
    const mobileMenu = document.getElementById('mobileMenu');

    /* Scroll effect */
    let ticking = false;
    function onScroll() {
        if (!ticking) {
            requestAnimationFrame(function () {
                header.classList.toggle('scrolled', window.scrollY > 60);
                ticking = false;
            });
            ticking = true;
        }
    }
    window.addEventListener('scroll', onScroll, { passive: true });

    /* Burger toggle */
    if (burger && mobileMenu) {
        burger.addEventListener('click', function () {
            const isOpen = mobileMenu.classList.toggle('open');
            burger.classList.toggle('active', isOpen);
            burger.setAttribute('aria-expanded', isOpen);
            mobileMenu.setAttribute('aria-hidden', !isOpen);
            document.body.style.overflow = isOpen ? 'hidden' : '';
        });

        /* Close on link click */
        mobileMenu.querySelectorAll('a').forEach(function (link) {
            link.addEventListener('click', function () {
                mobileMenu.classList.remove('open');
                burger.classList.remove('active');
                burger.setAttribute('aria-expanded', 'false');
                mobileMenu.setAttribute('aria-hidden', 'true');
                document.body.style.overflow = '';
            });
        });
    }
})();


/* Mobile drill-down menu */
document.querySelectorAll('[data-goto]').forEach(function (btn) {
    btn.addEventListener('click', function () {
        var target = this.getAttribute('data-goto');
        var nav = this.closest('.mobile-nav');
        nav.querySelectorAll('.mob-level').forEach(function (lv) {
            lv.classList.remove('active');
        });
        var next = nav.querySelector('[data-level="' + target + '"]');
        if (next) next.classList.add('active');
    });
});
