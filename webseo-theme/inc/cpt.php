<?php
/**
 * Custom Post Types & Taxonomies
 *
 * @package WebSEO
 */

defined('ABSPATH') || exit;

add_action('init', 'webseo_register_cpt');
add_action('init', 'webseo_register_taxonomies');

/* ── CPT: Услуги ─────────────────────────────────────────── */

function webseo_register_cpt(): void {

    // Services
    register_post_type('service', [
        'labels' => [
            'name'               => 'Услуги',
            'singular_name'      => 'Услуга',
            'add_new'            => 'Добавить услугу',
            'add_new_item'       => 'Новая услуга',
            'edit_item'          => 'Редактировать услугу',
            'view_item'          => 'Просмотр услуги',
            'all_items'          => 'Все услуги',
            'search_items'       => 'Поиск услуг',
            'not_found'          => 'Услуги не найдены',
        ],
        'public'             => true,
        'has_archive'        => true,
        'rewrite'            => ['slug' => 'uslugi', 'with_front' => false],
        'menu_icon'          => 'dashicons-hammer',
        'menu_position'      => 5,
        'supports'           => ['title', 'editor', 'thumbnail', 'excerpt'],
        'show_in_rest'       => true,
    ]);

    // Portfolio
    register_post_type('portfolio', [
        'labels' => [
            'name'               => 'Портфолио',
            'singular_name'      => 'Кейс',
            'add_new'            => 'Добавить кейс',
            'add_new_item'       => 'Новый кейс',
            'edit_item'          => 'Редактировать кейс',
            'view_item'          => 'Просмотр кейса',
            'all_items'          => 'Все кейсы',
            'search_items'       => 'Поиск кейсов',
            'not_found'          => 'Кейсы не найдены',
        ],
        'public'             => true,
        'has_archive'        => true,
        'rewrite'            => ['slug' => 'portfolio', 'with_front' => false],
        'menu_icon'          => 'dashicons-portfolio',
        'menu_position'      => 6,
        'supports'           => ['title', 'thumbnail', 'excerpt'],
        'show_in_rest'       => true,
    ]);

    // Testimonials
    register_post_type('testimonial', [
        'labels' => [
            'name'               => 'Отзывы',
            'singular_name'      => 'Отзыв',
            'add_new'            => 'Добавить отзыв',
            'add_new_item'       => 'Новый отзыв',
            'edit_item'          => 'Редактировать отзыв',
            'all_items'          => 'Все отзывы',
            'not_found'          => 'Отзывы не найдены',
        ],
        'public'             => false,
        'show_ui'            => true,
        'has_archive'        => false,
        'rewrite'            => false,
        'menu_icon'          => 'dashicons-format-quote',
        'menu_position'      => 7,
        'supports'           => ['title'],
        'show_in_rest'       => true,
    ]);

    // Quiz
    register_post_type('quiz', [
        'labels' => [
            'name'               => 'Квизы',
            'singular_name'      => 'Квиз',
            'add_new'            => 'Добавить квиз',
            'add_new_item'       => 'Новый квиз',
            'edit_item'          => 'Редактировать квиз',
            'all_items'          => 'Все квизы',
            'not_found'          => 'Квизы не найдены',
        ],
        'public'             => false,
        'show_ui'            => true,
        'has_archive'        => false,
        'rewrite'            => false,
        'menu_icon'          => 'dashicons-forms',
        'menu_position'      => 8,
        'supports'           => ['title'],
        'show_in_rest'       => true,
    ]);
}

/* ── Taxonomies ───────────────────────────────────────────── */

function webseo_register_taxonomies(): void {

    // Service Category — shared across services, testimonials, quizzes
    register_taxonomy('service_category', ['service', 'testimonial', 'quiz'], [
        'labels' => [
            'name'              => 'Категории услуг',
            'singular_name'     => 'Категория услуг',
            'add_new_item'      => 'Добавить категорию',
            'edit_item'         => 'Редактировать категорию',
            'all_items'         => 'Все категории',
            'search_items'      => 'Поиск категорий',
        ],
        'public'            => true,
        'hierarchical'      => true,
        'rewrite'           => ['slug' => 'uslugi-cat', 'with_front' => false],
        'show_in_rest'      => true,
        'show_admin_column'  => true,
    ]);

    // Portfolio Tag
    register_taxonomy('portfolio_tag', ['portfolio'], [
        'labels' => [
            'name'              => 'Теги портфолио',
            'singular_name'     => 'Тег портфолио',
            'add_new_item'      => 'Добавить тег',
            'edit_item'         => 'Редактировать тег',
            'all_items'         => 'Все теги',
        ],
        'public'            => true,
        'hierarchical'      => false,
        'rewrite'           => ['slug' => 'portfolio-tag', 'with_front' => false],
        'show_in_rest'      => true,
        'show_admin_column'  => true,
    ]);
}
