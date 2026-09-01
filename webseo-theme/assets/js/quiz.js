/**
 * Quiz — single "next" button that becomes submit on last step
 */
(function () {
    'use strict';

    document.querySelectorAll('.quiz').forEach(function (quiz) {
        var quizId = quiz.getAttribute('data-quiz-id');
        var total = parseInt(quiz.getAttribute('data-total'), 10);
        var submitText = quiz.getAttribute('data-submit-text') || 'Отправить';
        var current = 0;
        var answers = [];

        var steps = quiz.querySelectorAll('.quiz-step');
        var prevBtn = quiz.querySelector('.quiz-prev');
        var nextBtn = quiz.querySelector('.quiz-next');
        var progressBar = quiz.querySelector('.quiz-progress__bar');
        var counter = quiz.querySelector('.quiz-current');
        var successDiv = quiz.querySelector('.quiz-success');
        var nextOriginal = nextBtn.innerHTML;

        function updateUI() {
            steps.forEach(function (s, i) { s.hidden = i !== current; });
            prevBtn.hidden = current === 0;
            progressBar.style.width = ((current + 1) / total * 100) + '%';
            counter.textContent = current + 1;

            if (current === total - 1) {
                nextBtn.innerHTML = submitText + ' <i class="ph-bold ph-arrow-right"></i>';
            } else {
                nextBtn.innerHTML = nextOriginal;
            }
        }

        function getAnswer(stepIndex) {
            var step = steps[stepIndex];
            if (!step) return null;
            var textarea = step.querySelector('textarea');
            if (textarea) return textarea.value;
            var checked = step.querySelectorAll('input:checked');
            if (checked.length === 0) return null;
            var vals = [];
            checked.forEach(function (c) { vals.push(c.value); });
            return vals.length === 1 ? vals[0] : vals;
        }

        function submitQuiz() {
            var contactStep = steps[total - 1];
            var nameInput = contactStep.querySelector('[name="contact_name"]');
            var phoneInput = contactStep.querySelector('[name="contact_phone"]');
            var emailInput = contactStep.querySelector('[name="contact_email"]');
            var consentWrap = contactStep.querySelector('.form-consent');
            var consentBox = contactStep.querySelector('[name="consent"]');

            if (consentWrap) consentWrap.classList.remove('form-consent--error');

            var contact = {};
            if (nameInput) contact.name = nameInput.value.trim();
            if (phoneInput) contact.phone = phoneInput.value.trim();
            if (emailInput) contact.email = emailInput.value.trim();

            if (!contact.name && !contact.phone && !contact.email) {
                var first = phoneInput || nameInput || emailInput;
                if (first) first.focus();
                return;
            }
            if (consentBox && !consentBox.checked) {
                consentWrap.classList.add('form-consent--error');
                consentBox.focus();
                return;
            }

            nextBtn.disabled = true;
            nextBtn.innerHTML = 'Отправка...';

            var formData = new FormData();
            formData.append('action', 'webseo_quiz_submit');
            formData.append('nonce', webseoQuiz.nonce);
            formData.append('quiz_id', quizId);

            answers.forEach(function (a, i) {
                if (Array.isArray(a)) {
                    a.forEach(function (v) { formData.append('answers[' + i + '][]', v); });
                } else if (a !== null && a !== undefined) {
                    formData.append('answers[' + i + ']', a);
                }
            });

            Object.keys(contact).forEach(function (k) {
                formData.append('contact[' + k + ']', contact[k]);
            });

            fetch(webseoQuiz.ajaxUrl, {
                method: 'POST',
                body: formData,
                credentials: 'same-origin',
            })
            .then(function (r) { return r.json(); })
            .then(function (data) {
                var msg = (data.data && data.data.message) || 'Спасибо!';
                quiz.querySelector('.quiz-header').hidden = true;
                steps.forEach(function (s) { s.hidden = true; });
                quiz.querySelector('.quiz-nav').hidden = true;
                successDiv.hidden = false;
                successDiv.innerHTML = '<h3>' + msg + '</h3>';
            })
            .catch(function () {
                nextBtn.disabled = false;
                nextBtn.innerHTML = submitText + ' <i class="ph-bold ph-arrow-right"></i>';
            });
        }

        nextBtn.addEventListener('click', function () {
            if (current === total - 1) {
                submitQuiz();
            } else {
                answers[current] = getAnswer(current);
                current++;
                updateUI();
            }
        });

        prevBtn.addEventListener('click', function () {
            if (current > 0) { current--; updateUI(); }
        });

        updateUI();
    });
})();
