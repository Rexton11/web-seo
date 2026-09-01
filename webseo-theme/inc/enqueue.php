<?php
/**
 * Enqueue styles & scripts
 *
 * @package WebSEO
 */

defined('ABSPATH') || exit;

add_action('wp_enqueue_scripts', function () {
    $v = WEBSEO_VERSION;
    $uri = WEBSEO_URI;

    /* ── CSS ──────────────────────────────────────────────── */

    // Google Fonts
    wp_enqueue_style(
        'webseo-fonts',
        'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Space+Grotesk:wght@600;700&display=swap',
        [],
        null
    );

    // Main stylesheet
    wp_enqueue_style('webseo-main', $uri . '/assets/css/main.css', ['webseo-fonts'], $v);

    // Component stylesheets
    $components = ['header', 'hero', 'cards', 'sections', 'buttons', 'faq', 'quiz', 'footer', 'portfolio', 'pricing', 'testimonials', 'blog', 'modal', 'mega-menu', 'animations', 'legal'];
    foreach ($components as $component) {
        $file = "/assets/css/components/{$component}.css";
        if (file_exists(WEBSEO_DIR . $file)) {
            wp_enqueue_style("webseo-{$component}", $uri . $file, ['webseo-main'], $v);
        }
    }

    /* ── JS ───────────────────────────────────────────────── */

    wp_enqueue_script('webseo-header', $uri . '/assets/js/header.js', [], $v, true);
    wp_enqueue_script('webseo-main', $uri . '/assets/js/main.js', [], $v, true);
    wp_enqueue_script('webseo-animations', $uri . '/assets/js/animations.js', [], $v, true);

    // Cookie consent — global
    wp_enqueue_script('webseo-cookie-consent', $uri . '/assets/js/cookie-consent.js', [], $v, true);

    // Modal form — global (any page can have CTA buttons)
    wp_enqueue_script('webseo-modal', $uri . '/assets/js/modal.js', [], $v, true);
    wp_localize_script('webseo-modal', 'webseoContact', [
        'ajaxUrl' => admin_url('admin-ajax.php'),
        'nonce'   => wp_create_nonce('webseo_contact_nonce'),
    ]);

    // Process bar (steps) — service pages
    if (is_singular('service')) {
        wp_enqueue_script('webseo-process-bar', $uri . '/assets/js/process-bar.js', [], $v, true);
    }

    // FAQ accordion — only where needed
    if (is_singular('service') || is_page() || is_front_page()) {
        wp_enqueue_script('webseo-faq', $uri . '/assets/js/faq.js', [], $v, true);
    }

    // Quiz — only where needed
    if (is_singular('service') || is_front_page()) {
        wp_enqueue_script('webseo-quiz', $uri . '/assets/js/quiz.js', [], $v, true);
        wp_localize_script('webseo-quiz', 'webseoQuiz', [
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce'   => wp_create_nonce('webseo_quiz_nonce'),
        ]);
    }
});

/* ── Preload fonts ─────────────────────────────────────────── */

add_action('wp_head', function () {
    echo '<link rel="preconnect" href="https://fonts.googleapis.com">' . "\n";
    echo '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' . "\n";
}, 1);

/* ── Defer non-critical JS ─────────────────────────────────── */

add_filter('script_loader_tag', function ($tag, $handle) {
    $defer_handles = ['webseo-main', 'webseo-faq', 'webseo-quiz', 'webseo-animations', 'webseo-process-bar'];
    if (in_array($handle, $defer_handles, true)) {
        return str_replace(' src', ' defer src', $tag);
    }
    return $tag;
}, 10, 2);
