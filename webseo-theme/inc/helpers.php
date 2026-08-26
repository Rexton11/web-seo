<?php
/**
 * Helper functions
 *
 * @package WebSEO
 */

defined('ABSPATH') || exit;

/**
 * Get ACF option field with fallback.
 */
function webseo_option(string $key, $default = '') {
    if (!function_exists('get_field')) return $default;
    $val = get_field($key, 'option');
    return $val ?: $default;
}

/**
 * Render Phosphor icon from CSS class string.
 */
function webseo_icon(string $class): string {
    if (empty($class)) return '';
    return '<i class="' . esc_attr($class) . '"></i>';
}

/**
 * Get messenger links array.
 */
function webseo_get_messengers(): array {
    $items = [];
    $tg  = webseo_option('telegram');
    $wa  = webseo_option('whatsapp');
    $vb  = webseo_option('viber');

    if ($tg) $items[] = ['url' => $tg, 'icon' => 'ph-fill ph-telegram-logo', 'label' => 'Telegram'];
    if ($wa) $items[] = ['url' => $wa, 'icon' => 'ph-fill ph-whatsapp-logo',  'label' => 'WhatsApp'];
    if ($vb) $items[] = ['url' => $vb, 'icon' => 'ph ph-phone',               'label' => 'Viber'];

    return $items;
}

/**
 * Render section badge.
 */
function webseo_badge(string $text): string {
    if (empty($text)) return '';
    return '<span class="section-badge">' . esc_html($text) . '</span>';
}

/**
 * Render section header.
 */
function webseo_section_header(string $badge, string $title, string $subtitle = ''): void {
    echo '<div class="section-header" data-reveal="scale">';
    echo webseo_badge($badge);
    echo '<h2>' . esc_html($title) . '</h2>';
    if ($subtitle) {
        echo '<p>' . esc_html($subtitle) . '</p>';
    }
    echo '</div>';
}

/**
 * Get related portfolio items by service category.
 */
function webseo_get_related_cases(int $post_id, int $limit = 4): array {
    $terms = wp_get_post_terms($post_id, 'service_category', ['fields' => 'ids']);
    if (empty($terms) || is_wp_error($terms)) return [];

    return get_posts([
        'post_type'      => 'portfolio',
        'posts_per_page' => $limit,
        'tax_query'      => [[
            'taxonomy' => 'service_category',
            'terms'    => $terms,
        ]],
    ]);
}

/**
 * Get testimonials filtered by service category.
 */
function webseo_get_testimonials(int $post_id = 0, int $limit = 10): array {
    $args = [
        'post_type'      => 'testimonial',
        'posts_per_page' => $limit,
    ];

    if ($post_id) {
        $terms = wp_get_post_terms($post_id, 'service_category', ['fields' => 'ids']);
        if (!empty($terms) && !is_wp_error($terms)) {
            $args['tax_query'] = [[
                'taxonomy' => 'service_category',
                'terms'    => $terms,
            ]];
        }
    }

    return get_posts($args);
}
