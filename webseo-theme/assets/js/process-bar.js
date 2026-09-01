(function () {
    var bar = document.getElementById('processBar');
    if (!bar) return;

    var steps = bar.querySelectorAll('.process-bar__step');
    var panels = bar.querySelectorAll('.process-bar__panel');
    var lineFill = bar.querySelector('.process-bar__line-fill');
    var timerFill = bar.querySelector('.process-bar__timer-fill');
    var counterEl = bar.querySelector('.process-bar__counter strong');
    var prevBtn = bar.querySelector('[data-pb-dir="-1"]');
    var nextBtn = bar.querySelector('[data-pb-dir="1"]');
    var total = steps.length;
    var current = 0;
    var timer = null;
    var INTERVAL = 4000;

    function goTo(index) {
        current = index;

        steps.forEach(function (s, i) {
            s.classList.remove('active', 'visited');
            if (i < current) s.classList.add('visited');
            if (i === current) s.classList.add('active');
        });

        panels.forEach(function (p) { p.classList.remove('active'); });
        panels[current].classList.add('active');

        var pct = total > 1 ? (current / (total - 1)) * 100 : 0;
        lineFill.style.width = pct + '%';

        if (counterEl) counterEl.textContent = current + 1;
        if (prevBtn) prevBtn.disabled = current === 0;
        if (nextBtn) nextBtn.disabled = current === total - 1;

        resetTimer();
    }

    function resetTimer() {
        timerFill.classList.remove('running');
        void timerFill.offsetWidth;
        timerFill.classList.add('running');

        clearTimeout(timer);
        timer = setTimeout(function () {
            goTo((current + 1) % total);
        }, INTERVAL);
    }

    steps.forEach(function (s) {
        s.addEventListener('click', function () {
            goTo(parseInt(s.getAttribute('data-index'), 10));
        });
    });

    if (prevBtn) {
        prevBtn.addEventListener('click', function () {
            if (current > 0) goTo(current - 1);
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', function () {
            if (current < total - 1) goTo(current + 1);
        });
    }

    goTo(0);
})();
