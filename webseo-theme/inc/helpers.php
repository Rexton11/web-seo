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

/**
 * Send lead data to CRM webhook.
 */
function webseo_send_to_crm(array $data): void {
    $url = webseo_option('crm_webhook_url');
    if (empty($url)) return;

    wp_remote_post($url, [
        'body'      => wp_json_encode($data),
        'headers'   => ['Content-Type' => 'application/json'],
        'timeout'   => 5,
        'blocking'  => false,
    ]);
}

/**
 * Render privacy consent checkbox for forms.
 */
function webseo_consent_checkbox(string $id_prefix = 'form'): void {
    $privacy_url = webseo_option('privacy_policy_url');
    if (!$privacy_url) {
        $privacy_page = get_option('wp_page_for_privacy_policy');
        if ($privacy_page) {
            $privacy_url = get_permalink($privacy_page);
        }
    }
    $consent_text = webseo_option('consent_text', 'Нажимая кнопку, вы даёте согласие на обработку персональных данных и соглашаетесь с');
    ?>
    <div class="form-consent" id="<?php echo esc_attr($id_prefix); ?>Consent">
        <input type="checkbox" id="<?php echo esc_attr($id_prefix); ?>ConsentCheck" name="consent" value="1">
        <label class="form-consent__label" for="<?php echo esc_attr($id_prefix); ?>ConsentCheck">
            <?php echo esc_html($consent_text); ?>
            <?php if ($privacy_url) : ?>
                <a href="<?php echo esc_url($privacy_url); ?>" target="_blank" rel="noopener">Политикой конфиденциальности</a>
            <?php else : ?>
                Политикой конфиденциальности
            <?php endif; ?>
        </label>
    </div>
    <?php
}

/**
 * Get parsed reviews from Yandex/Kwork parser plugin.
 * Returns arrays (not WP_Post objects) with source_url added.
 */
function webseo_get_parsed_reviews(int $limit = 20): array {
    $saved = get_option('yrp_saved_reviews', []);
    if (empty($saved)) return [];

    $yandex_url = get_option('yrp_yandex_url', '');
    $reviews = [];

    foreach ($saved as $rev) {
        if (!empty($rev['hidden'])) continue;
        if (empty($rev['text'])) continue;

        $rev['source_url'] = '';
        if (($rev['source'] ?? '') === 'yandex' && $yandex_url) {
            $rev['source_url'] = rtrim($yandex_url, '/') . '/reviews/';
        }

        $reviews[] = $rev;
    }

    if ((int)get_option('yrp_shuffle_sources', 0)) {
        shuffle($reviews);
    }

    return array_slice($reviews, 0, $limit);
}
