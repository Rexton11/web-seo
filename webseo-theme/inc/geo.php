<?php
/**
 * Multi-regional SEO — city-specific service pages
 *
 * URL: /uslugi/{service-slug}/{city-slug}/
 * Template variable {city} in ACF fields gets replaced with the localized city name.
 *
 * @package WebSEO
 */

defined('ABSPATH') || exit;

/* ── Register taxonomy ──────────────────────────────────────── */

add_action('init', function () {
    register_taxonomy('city', ['service'], [
        'labels' => [
            'name'              => 'Города',
            'singular_name'     => 'Город',
            'add_new_item'      => 'Добавить город',
            'edit_item'         => 'Редактировать город',
            'all_items'         => 'Все города',
            'search_items'      => 'Поиск городов',
        ],
        'public'            => false,
        'show_ui'           => true,
        'hierarchical'      => false,
        'rewrite'           => false,
        'show_in_rest'      => true,
        'show_admin_column' => true,
    ]);
}, 5);

/* ── Rewrite rules ──────────────────────────────────────────── */

add_action('init', function () {
    add_rewrite_tag('%city%', '([^/]+)');

    add_rewrite_rule(
        '^uslugi/([^/]+)/([^/]+)/?$',
        'index.php?service=$matches[1]&city=$matches[2]',
        'top'
    );
}, 20);

add_filter('query_vars', function ($vars) {
    $vars[] = 'city';
    return $vars;
});

/* ── Resolve city term from query var ───────────────────────── */

function webseo_get_current_city(): ?WP_Term {
    static $cache = null;
    if ($cache !== null) return $cache ?: null;

    $city_slug = get_query_var('city');
    if (!$city_slug) {
        $cache = false;
        return null;
    }

    $term = get_term_by('slug', $city_slug, 'city');
    if (!$term || is_wp_error($term)) {
        $cache = false;
        return null;
    }

    // Verify service has this city assigned
    global $post;
    if ($post && !has_term($term->term_id, 'city', $post)) {
        $cache = false;
        return null;
    }

    $cache = $term;
    return $term;
}

/**
 * Get city name in a specific grammatical case.
 *
 * Cases stored as ACF term meta:
 *   city_prepositional — предложный (в Москве)
 *   city_genitive      — родительный (Москвы)
 *   city_accusative    — винительный (Москву) — optional, falls back to nominative
 */
function webseo_city_name(string $case = 'prepositional'): string {
    $city = webseo_get_current_city();
    if (!$city) return '';

    if ($case === 'nominative') return $city->name;

    $val = get_field("city_{$case}", "city_{$city->term_id}");
    return $val ?: $city->name;
}

/**
 * Replace {city} and {city_rod} placeholders in text.
 */
function webseo_city_replace(string $text): string {
    $city = webseo_get_current_city();
    if (!$city) return $text;

    $replacements = [
        '{city}'     => webseo_city_name('prepositional'),
        '{city_nom}' => webseo_city_name('nominative'),
        '{city_rod}' => webseo_city_name('genitive'),
        '{city_vin}' => webseo_city_name('accusative'),
    ];

    return str_replace(array_keys($replacements), array_values($replacements), $text);
}

/* ── 404 for invalid city ───────────────────────────────────── */

add_action('template_redirect', function () {
    $city_slug = get_query_var('city');
    if (!$city_slug || !is_singular('service')) return;

    $city = webseo_get_current_city();
    if (!$city) {
        global $wp_query;
        $wp_query->set_404();
        status_header(404);
        nocache_headers();
    }
});

/* ── Document title (works with Yoast and wp_title) ─────────── */

add_filter('pre_get_document_title', function ($title) {
    if (!is_singular('service')) return $title;
    $city = webseo_get_current_city();
    if (!$city) return $title;

    $city_prep = webseo_city_name('prepositional');
    return get_the_title() . ' в ' . $city_prep . ' — ' . get_bloginfo('name');
}, 20);

add_filter('wpseo_title', function ($title) {
    if (!is_singular('service')) return $title;
    $city = webseo_get_current_city();
    if (!$city) return $title;

    $city_prep = webseo_city_name('prepositional');
    return get_the_title() . ' в ' . $city_prep . ' — ' . get_bloginfo('name');
}, 20);

add_filter('wpseo_metadesc', function ($desc) {
    if (!is_singular('service')) return $desc;
    $city = webseo_get_current_city();
    if (!$city) return $desc;

    $city_prep = webseo_city_name('prepositional');
    if ($desc) {
        return webseo_city_replace($desc) . ' в ' . $city_prep . '.';
    }
    return get_the_title() . ' в ' . $city_prep . '. ' . get_bloginfo('description');
}, 20);

/* ── Canonical URL ──────────────────────────────────────────── */

add_filter('wpseo_canonical', function ($canonical) {
    if (!is_singular('service')) return $canonical;
    $city = webseo_get_current_city();
    if (!$city) return $canonical;

    return home_url('/uslugi/' . get_post_field('post_name') . '/' . $city->slug . '/');
});

add_action('wp_head', function () {
    if (!is_singular('service')) return;
    $city = webseo_get_current_city();
    if (!$city) return;

    if (!function_exists('wpseo_head')) {
        $canonical = home_url('/uslugi/' . get_post_field('post_name') . '/' . $city->slug . '/');
        echo '<link rel="canonical" href="' . esc_url($canonical) . '">' . "\n";
    }
}, 5);

/* ── Permalink helper for city service pages ────────────────── */

function webseo_city_service_url(int $post_id, WP_Term $city): string {
    $slug = get_post_field('post_name', $post_id);
    return home_url("/uslugi/{$slug}/{$city->slug}/");
}

/* ── Hreflang tags for regional pages ───────────────────────── */

add_action('wp_head', function () {
    if (!is_singular('service')) return;

    $post_id = get_the_ID();
    $cities  = wp_get_post_terms($post_id, 'city');
    if (empty($cities) || is_wp_error($cities)) return;

    $base_url = get_permalink($post_id);
    echo '<link rel="alternate" hreflang="x-default" href="' . esc_url($base_url) . '">' . "\n";

    foreach ($cities as $city_term) {
        $city_url = webseo_city_service_url($post_id, $city_term);
        echo '<link rel="alternate" hreflang="ru-' . esc_attr(strtoupper($city_term->slug)) . '" href="' . esc_url($city_url) . '">' . "\n";
    }
}, 3);

/* ── XML Sitemap — add city pages (Yoast) ───────────────────── */

add_filter('wpseo_sitemap_index', function ($index) {
    $cities = get_terms(['taxonomy' => 'city', 'hide_empty' => true]);
    if (empty($cities) || is_wp_error($cities)) return $index;

    $index .= '<sitemap><loc>' . home_url('/geo-sitemap.xml') . '</loc></sitemap>' . "\n";
    return $index;
});

add_action('init', function () {
    if (!class_exists('WPSEO_Sitemaps')) return;

    global $wpseo_sitemaps;
    if ($wpseo_sitemaps) {
        $wpseo_sitemaps->register_sitemap('geo', function () {
            global $wpseo_sitemaps;
            $output = '';

            $services = get_posts([
                'post_type'      => 'service',
                'posts_per_page' => -1,
                'post_status'    => 'publish',
            ]);

            foreach ($services as $service) {
                $cities = wp_get_post_terms($service->ID, 'city');
                if (empty($cities) || is_wp_error($cities)) continue;

                foreach ($cities as $city) {
                    $url = webseo_city_service_url($service->ID, $city);
                    $mod = get_the_modified_date('c', $service);
                    $output .= '<url><loc>' . esc_url($url) . '</loc>';
                    $output .= '<lastmod>' . esc_html($mod) . '</lastmod>';
                    $output .= '<changefreq>monthly</changefreq>';
                    $output .= '<priority>0.6</priority></url>' . "\n";
                }
            }

            if ($output) {
                $wpseo_sitemaps->set_sitemap($output);
            }
        });
    }
}, 999);

/* ── Flush rewrite rules on theme activation ────────────────── */

add_action('after_switch_theme', 'flush_rewrite_rules');
