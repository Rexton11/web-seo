<?php
/**
 * Breadcrumbs — uses Yoast if available, fallback custom
 *
 * @package WebSEO
 */

defined('ABSPATH') || exit;

function webseo_breadcrumbs(): void {
    if (is_front_page()) return;

    $home_icon = '<i class="ph-bold ph-house-simple"></i>';

    echo '<nav class="breadcrumbs" aria-label="Хлебные крошки">';
    echo '<div class="container">';

    if (function_exists('yoast_breadcrumb')) {
        ob_start();
        yoast_breadcrumb('', '');
        $yoast_html = ob_get_clean();
        $yoast_html = preg_replace(
            '/>Главная<\/a>/',
            ' aria-label="Главная">' . $home_icon . '</a>',
            $yoast_html,
            1
        );
        $yoast_html = str_replace(
            ['<span class="breadcrumb_last"', '» ', ' »'],
            ['<span class="breadcrumb_last"', '', ''],
            $yoast_html
        );
        $sep_icon = '<span class="sep">/</span>';
        $yoast_html = preg_replace('/\s*(?:»|&raquo;|›)\s*/', $sep_icon, $yoast_html);
        echo $yoast_html;
    } else {
        echo '<a href="' . esc_url(home_url('/')) . '" aria-label="Главная">' . $home_icon . '</a>';
        echo '<span class="sep">/</span>';

        if (is_singular('service')) {
            echo '<a href="' . esc_url(get_post_type_archive_link('service')) . '">Услуги</a>';
            echo '<span class="sep">/</span>';
            $city = webseo_get_current_city();
            if ($city) {
                echo '<a href="' . esc_url(get_permalink()) . '">' . get_the_title() . '</a>';
                echo '<span class="sep">/</span>';
                echo '<span>' . esc_html($city->name) . '</span>';
            } else {
                echo '<span>' . get_the_title() . '</span>';
            }
        } elseif (is_singular('portfolio')) {
            echo '<a href="' . esc_url(get_post_type_archive_link('portfolio')) . '">Портфолио</a>';
            echo '<span class="sep">/</span>';
            echo '<span>' . get_the_title() . '</span>';
        } elseif (is_singular()) {
            echo '<a href="' . esc_url(get_permalink(get_option('page_for_posts'))) . '">Блог</a>';
            echo '<span class="sep">/</span>';
            echo '<span>' . get_the_title() . '</span>';
        } elseif (is_post_type_archive('service')) {
            echo '<span>Услуги</span>';
        } elseif (is_post_type_archive('portfolio')) {
            echo '<span>Портфолио</span>';
        } elseif (is_page()) {
            echo '<span>' . get_the_title() . '</span>';
        }

    }

    echo '</div>';
    echo '</nav>';
}
