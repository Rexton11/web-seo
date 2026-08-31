<?php
/**
 * ACF Options Pages
 *
 * @package WebSEO
 */

defined('ABSPATH') || exit;

add_action('acf/init', function () {
    if (!function_exists('acf_add_options_page')) {
        return;
    }

    acf_add_options_page([
        'page_title'  => 'Настройки темы',
        'menu_title'  => 'Настройки темы',
        'menu_slug'   => 'webseo-settings',
        'capability'  => 'manage_options',
        'icon_url'    => 'dashicons-admin-customizer',
        'position'    => 2,
        'redirect'    => true,
    ]);

    acf_add_options_sub_page([
        'page_title'  => 'Контакты и соцсети',
        'menu_title'  => 'Контакты',
        'parent_slug' => 'webseo-settings',
        'menu_slug'   => 'webseo-contacts',
    ]);

    acf_add_options_sub_page([
        'page_title'  => 'Шапка и подвал',
        'menu_title'  => 'Шапка и подвал',
        'parent_slug' => 'webseo-settings',
        'menu_slug'   => 'webseo-header-footer',
    ]);

    acf_add_options_sub_page([
        'page_title'  => 'Код аналитики',
        'menu_title'  => 'Аналитика',
        'parent_slug' => 'webseo-settings',
        'menu_slug'   => 'webseo-analytics',
    ]);

    acf_add_options_sub_page([
        'page_title'  => 'Мультирегиональность',
        'menu_title'  => 'Города',
        'parent_slug' => 'webseo-settings',
        'menu_slug'   => 'webseo-geo',
    ]);

    acf_add_options_sub_page([
        'page_title'  => 'Правовая информация (152-ФЗ)',
        'menu_title'  => 'Правовая информация',
        'parent_slug' => 'webseo-settings',
        'menu_slug'   => 'webseo-legal',
    ]);
});
