<?php
/**
 * WebSEO Theme functions
 *
 * @package WebSEO
 */

defined('ABSPATH') || exit;

define('WEBSEO_VERSION', '3.4.0');
define('WEBSEO_DIR', get_template_directory());
define('WEBSEO_URI', get_template_directory_uri());

/* ── Theme setup ─────────────────────────────────────────── */

add_action('after_setup_theme', function () {
    add_theme_support('title-tag');
    add_theme_support('post-thumbnails');
    add_theme_support('html5', ['search-form', 'comment-form', 'comment-list', 'gallery', 'caption', 'style', 'script']);
    add_theme_support('custom-logo');
    add_theme_support('editor-styles');

    set_post_thumbnail_size(1200, 630, true);
    add_image_size('card-thumb', 600, 400, true);
    add_image_size('portfolio-thumb', 800, 500, true);
    add_image_size('hero-bg', 1920, 800, true);

    register_nav_menus([
        'primary'  => 'Основное меню',
        'footer'   => 'Меню подвала',
    ]);
});

/* ── Includes ────────────────────────────────────────────── */

$includes = [
    'inc/enqueue.php',
    'inc/cpt.php',
    'inc/acf-options.php',
    'inc/acf-fields.php',
    'inc/schema.php',
    'inc/breadcrumbs.php',
    'inc/quiz-handler.php',
    'inc/contact-handler.php',
    'inc/helpers.php',
    'inc/geo.php',
    'inc/mega-menu.php',
    'inc/importer.php',
];

foreach ($includes as $file) {
    $path = WEBSEO_DIR . '/' . $file;
    if (file_exists($path)) {
        require_once $path;
    }
}

/* ── ACF JSON save/load ──────────────────────────────────── */

add_filter('acf/settings/save_json', function () {
    return WEBSEO_DIR . '/acf-json';
});

add_filter('acf/settings/load_json', function ($paths) {
    $paths[] = WEBSEO_DIR . '/acf-json';
    return $paths;
});

/* ── Excerpt length ──────────────────────────────────────── */

add_filter('excerpt_length', fn () => 20);
add_filter('excerpt_more', fn () => '&hellip;');

/* ── Disable emoji & jQuery migrate ──────────────────────── */

add_action('init', function () {
    remove_action('wp_head', 'print_emoji_detection_script', 7);
    remove_action('wp_print_styles', 'print_emoji_styles');
});

add_action('wp_default_scripts', function ($scripts) {
    if (!is_admin() && isset($scripts->registered['jquery'])) {
        $scripts->registered['jquery']->deps = array_diff(
            $scripts->registered['jquery']->deps,
            ['jquery-migrate']
        );
    }
});

/* ── Yoast breadcrumbs support ───────────────────────────── */

add_theme_support('yoast-seo-breadcrumbs');

/* ── WebP upload support ─────────────────────────────────── */

add_filter('mime_types', function ($mimes) {
    $mimes['webp'] = 'image/webp';
    $mimes['svg']  = 'image/svg+xml';
    return $mimes;
});

/* ── Yoast breadcrumb: rename home ───────────── */

add_filter('wpseo_breadcrumb_links', function ($links) {
    if (isset($links[0]['text'])) {
        $links[0]['text'] = 'Главная';
    }

    if (is_singular('service') && function_exists('webseo_get_current_city')) {
        $city = webseo_get_current_city();
        if ($city) {
            $links[] = ['text' => $city->name];
        }
    }

    return $links;
});
