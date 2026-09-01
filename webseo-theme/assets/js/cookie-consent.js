/**
 * Cookie consent banner — show/hide + remember choice
 */
(function () {
    'use strict';

    var banner = document.getElementById('cookieConsent');
    var acceptBtn = document.getElementById('cookieAccept');
    if (!banner || !acceptBtn) return;

    var COOKIE_NAME = 'webseo_cookie_consent';

    function getCookie(name) {
        var match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
        return match ? match[2] : null;
    }

    function setCookie(name, value, days) {
        var d = new Date();
        d.setTime(d.getTime() + days * 86400000);
        document.cookie = name + '=' + value + ';expires=' + d.toUTCString() + ';path=/;SameSite=Lax';
    }

    if (getCookie(COOKIE_NAME) === '1') return;

    banner.hidden = false;
    setTimeout(function () { banner.classList.add('visible'); }, 50);

    acceptBtn.addEventListener('click', function () {
        setCookie(COOKIE_NAME, '1', 365);
        banner.classList.remove('visible');
        setTimeout(function () { banner.hidden = true; }, 400);
    });
})();
