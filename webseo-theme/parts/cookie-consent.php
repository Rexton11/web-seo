<?php
/**
 * Template part: Cookie consent banner (152-FZ)
 *
 * @package WebSEO
 */

defined('ABSPATH') || exit;

$cookie_text = webseo_option('cookie_text', 'Мы используем файлы cookie для улучшения работы сайта. Продолжая использовать сайт, вы соглашаетесь с использованием cookie и обработкой данных в соответствии с');
$privacy_url = webseo_option('privacy_policy_url');
if (!$privacy_url) {
    $privacy_page = get_option('wp_page_for_privacy_policy');
    if ($privacy_page) {
        $privacy_url = get_permalink($privacy_page);
    }
}
?>
<div class="cookie-consent" id="cookieConsent" hidden>
    <div class="cookie-consent__inner">
        <p class="cookie-consent__text">
            <?php echo esc_html($cookie_text); ?>
            <?php if ($privacy_url) : ?>
                <a href="<?php echo esc_url($privacy_url); ?>" target="_blank" rel="noopener">Политикой конфиденциальности</a>.
            <?php else : ?>
                Политикой конфиденциальности.
            <?php endif; ?>
        </p>
        <button class="btn btn-primary cookie-consent__accept" id="cookieAccept">Принимаю</button>
    </div>
</div>
