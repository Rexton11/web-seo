/**
 * Contact form — AJAX submit
 */
(function () {
    'use strict';

    var form = document.getElementById('contactForm');
    var btn = document.getElementById('contactSubmit');
    var msg = document.getElementById('formMessage');

    if (!form || !btn) return;

    btn.addEventListener('click', function () {
        var name    = form.querySelector('[name="name"]');
        var phone   = form.querySelector('[name="phone"]');
        var email   = form.querySelector('[name="email"]');
        var message = form.querySelector('[name="message"]');
        var honey   = form.querySelector('[name="website"]');

        // Reset
        msg.hidden = true;
        form.querySelectorAll('.form-input--error').forEach(function (el) {
            el.classList.remove('form-input--error');
        });

        // Validate
        if (!name.value.trim()) {
            name.classList.add('form-input--error');
            name.focus();
            return;
        }
        if (!phone.value.trim() && !email.value.trim()) {
            phone.classList.add('form-input--error');
            phone.focus();
            return;
        }

        btn.disabled = true;
        btn.innerHTML = 'Отправка...';

        var fd = new FormData();
        fd.append('action', 'webseo_contact_submit');
        fd.append('nonce', webseoContact.nonce);
        fd.append('name', name.value.trim());
        fd.append('phone', phone.value.trim());
        fd.append('email', email.value.trim());
        fd.append('message', message.value.trim());
        fd.append('website', honey ? honey.value : '');

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
                email.value = '';
                message.value = '';
            } else {
                msg.className = 'form-message form-message--error';
                msg.textContent = data.data.message || 'Ошибка отправки';
                if (data.data.field) {
                    var errField = form.querySelector('[name="' + data.data.field + '"]');
                    if (errField) errField.classList.add('form-input--error');
                }
            }
            btn.disabled = false;
            btn.innerHTML = 'Отправить <i class="ph-bold ph-arrow-right"></i>';
        })
        .catch(function () {
            msg.hidden = false;
            msg.className = 'form-message form-message--error';
            msg.textContent = 'Ошибка сети. Попробуйте позже.';
            btn.disabled = false;
            btn.innerHTML = 'Отправить <i class="ph-bold ph-arrow-right"></i>';
        });
    });
})();
