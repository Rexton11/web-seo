/**
 * Modal contact form — open/close + AJAX submit
 * Opens on click: data-modal="callback" or href="#callback"
 */
(function () {
    'use strict';

    var overlay = document.getElementById('callbackModal');
    var form    = document.getElementById('modalForm');
    var btn     = document.getElementById('modalSubmit');
    var msg     = document.getElementById('modalMessage');
    var close   = document.getElementById('modalClose');

    if (!overlay || !form) return;

    /* ── Open ────────────────────────────────── */

    var currentPlan = '';

    function openModal(plan) {
        currentPlan = plan || '';
        overlay.hidden = false;
        overlay.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        // Update title if plan specified
        var title = document.getElementById('modalTitle');
        if (title) {
            title.textContent = currentPlan ? 'Заявка: ' + currentPlan : 'Обсудить проект';
        }
        setTimeout(function () { overlay.classList.add('open'); }, 10);
        var firstInput = form.querySelector('input');
        if (firstInput) setTimeout(function () { firstInput.focus(); }, 300);
    }

    /* ── Close ───────────────────────────────── */

    function closeModal() {
        overlay.classList.remove('open');
        document.body.style.overflow = '';
        setTimeout(function () {
            overlay.hidden = true;
            overlay.setAttribute('aria-hidden', 'true');
        }, 300);
    }

    /* ── Triggers ────────────────────────────── */

    document.addEventListener('click', function (e) {
        var trigger = e.target.closest('[data-modal="callback"], [href="#callback"]');
        if (trigger) {
            e.preventDefault();
            openModal(trigger.getAttribute('data-plan') || '');
        }
    });

    close.addEventListener('click', closeModal);

    overlay.addEventListener('click', function (e) {
        if (e.target === overlay) closeModal();
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && !overlay.hidden) closeModal();
    });

    /* ── Submit ──────────────────────────────── */

    btn.addEventListener('click', function () {
        var name    = form.querySelector('[name="name"]');
        var phone   = form.querySelector('[name="phone"]');
        var message = form.querySelector('[name="message"]');
        var honey   = form.querySelector('[name="website"]');
        var consentWrap = document.getElementById('modalConsent');
        var consentBox  = document.getElementById('modalConsentCheck');

        msg.hidden = true;
        form.querySelectorAll('.form-input--error').forEach(function (el) {
            el.classList.remove('form-input--error');
        });
        if (consentWrap) consentWrap.classList.remove('form-consent--error');

        if (!name.value.trim()) {
            name.classList.add('form-input--error');
            name.focus();
            return;
        }
        if (!phone.value.trim()) {
            phone.classList.add('form-input--error');
            phone.focus();
            return;
        }
        if (consentBox && !consentBox.checked) {
            consentWrap.classList.add('form-consent--error');
            consentBox.focus();
            return;
        }

        btn.disabled = true;
        btn.innerHTML = 'Отправка...';

        var fd = new FormData();
        fd.append('action', 'webseo_contact_submit');
        fd.append('nonce', webseoContact.nonce);
        fd.append('name', name.value.trim());
        fd.append('phone', phone.value.trim());
        fd.append('email', '');
        fd.append('message', message.value.trim());
        fd.append('website', honey ? honey.value : '');
        if (currentPlan) fd.append('plan', currentPlan);
        fd.append('page_url', window.location.href);

        fetch(webseoContact.ajaxUrl, {
            method: 'POST',
            body: fd,
            credentials: 'same-origin',
        })
        .then(function (r) { return r.json(); })
        .then(function (data) {
            msg.hidden = false;
            if (data.success) {
                msg.className = 'form-message form-message--success';
                msg.textContent = data.data.message;
                name.value = '';
                phone.value = '';
                message.value = '';
                if (consentBox) consentBox.checked = false;
                setTimeout(closeModal, 2500);
            } else {
                msg.className = 'form-message form-message--error';
                msg.textContent = data.data.message || 'Ошибка отправки';
            }
            btn.disabled = false;
            btn.innerHTML = 'Отправить заявку <i class="ph-bold ph-arrow-right"></i>';
        })
        .catch(function () {
            msg.hidden = false;
            msg.className = 'form-message form-message--error';
            msg.textContent = 'Ошибка сети. Попробуйте позже.';
            btn.disabled = false;
            btn.innerHTML = 'Отправить заявку <i class="ph-bold ph-arrow-right"></i>';
        });
    });
})();
