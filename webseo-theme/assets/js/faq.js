/**
 * FAQ Accordion
 */
(function () {
    'use strict';

    document.addEventListener('click', function (e) {
        var btn = e.target.closest('.faq-question');
        if (!btn) return;

        var item = btn.closest('.faq-item');
        var answer = item.querySelector('.faq-answer');
        var isActive = item.classList.contains('active');

        /* Close all siblings in same .faq-list */
        var list = item.closest('.faq-list');
        if (list) {
            list.querySelectorAll('.faq-item.active').forEach(function (open) {
                if (open !== item) {
                    open.classList.remove('active');
                    open.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
                    open.querySelector('.faq-answer').style.maxHeight = '0';
                }
            });
        }

        /* Toggle current */
        item.classList.toggle('active', !isActive);
        btn.setAttribute('aria-expanded', !isActive);

        if (!isActive) {
            answer.style.maxHeight = answer.scrollHeight + 'px';
        } else {
            answer.style.maxHeight = '0';
        }
    });
})();
