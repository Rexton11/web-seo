<?php
/**
 * ACF Field Groups — registered via PHP.
 * After first save in admin, fields sync to /acf-json/.
 *
 * @package WebSEO
 */

defined('ABSPATH') || exit;

add_action('acf/init', 'webseo_register_acf_fields');

function webseo_register_acf_fields(): void {
    if (!function_exists('acf_add_local_field_group')) {
        return;
    }

    /* ================================================================
     * 1. OPTIONS — Контакты
     * ================================================================ */
    acf_add_local_field_group([
        'key'      => 'group_contacts',
        'title'    => 'Контакты и мессенджеры',
        'location' => [[[
            'param' => 'options_page', 'operator' => '==', 'value' => 'webseo-contacts',
        ]]],
        'fields'   => [
            ['key' => 'f_phone',     'name' => 'phone',     'label' => 'Телефон',    'type' => 'text'],
            ['key' => 'f_email',     'name' => 'email',     'label' => 'Email',      'type' => 'email'],
            ['key' => 'f_telegram',  'name' => 'telegram',  'label' => 'Telegram URL',  'type' => 'url'],
            ['key' => 'f_whatsapp',  'name' => 'whatsapp',  'label' => 'WhatsApp URL',  'type' => 'url'],
            ['key' => 'f_viber',     'name' => 'viber',     'label' => 'Viber URL',     'type' => 'url'],
            [
                'key'        => 'f_socials',
                'name'       => 'socials',
                'label'      => 'Соцсети',
                'type'       => 'repeater',
                'layout'     => 'table',
                'sub_fields' => [
                    ['key' => 'f_social_name', 'name' => 'name', 'label' => 'Название', 'type' => 'text'],
                    ['key' => 'f_social_url',  'name' => 'url',  'label' => 'URL',      'type' => 'url'],
                    ['key' => 'f_social_icon', 'name' => 'icon', 'label' => 'CSS-класс иконки', 'type' => 'text', 'instructions' => 'Например: ph-instagram-logo'],
                ],
            ],
        ],
    ]);

    /* ================================================================
     * 2. OPTIONS — Шапка и подвал
     * ================================================================ */
    acf_add_local_field_group([
        'key'      => 'group_header_footer',
        'title'    => 'Шапка и подвал',
        'location' => [[[
            'param' => 'options_page', 'operator' => '==', 'value' => 'webseo-header-footer',
        ]]],
        'fields'   => [
            ['key' => 'f_logo_image',    'name' => 'logo_image',    'label' => 'Логотип (изображение)', 'type' => 'image', 'return_format' => 'array', 'preview_size' => 'thumbnail'],
            ['key' => 'f_logo_text',     'name' => 'logo_text',     'label' => 'Логотип (текст)',       'type' => 'text', 'default_value' => 'DEV&SEO'],
            ['key' => 'f_header_cta_text','name' => 'header_cta_text','label' => 'CTA кнопка — текст', 'type' => 'text'],
            ['key' => 'f_header_cta_url', 'name' => 'header_cta_url', 'label' => 'CTA кнопка — URL',  'type' => 'url'],
            ['key' => 'f_copyright',     'name' => 'copyright',     'label' => 'Копирайт',             'type' => 'text', 'default_value' => '© 2026 Все права защищены.'],
        ],
    ]);

    /* ================================================================
     * 3. OPTIONS — Аналитика
     * ================================================================ */
    acf_add_local_field_group([
        'key'      => 'group_analytics',
        'title'    => 'Код аналитики',
        'location' => [[[
            'param' => 'options_page', 'operator' => '==', 'value' => 'webseo-analytics',
        ]]],
        'fields'   => [
            ['key' => 'f_head_code', 'name' => 'head_code', 'label' => 'Код в &lt;head&gt;', 'type' => 'textarea', 'rows' => 6],
            ['key' => 'f_body_code', 'name' => 'body_code', 'label' => 'Код после &lt;body&gt;', 'type' => 'textarea', 'rows' => 6],
        ],
    ]);

    /* ================================================================
     * 3b. OPTIONS — Мультирегиональность
     * ================================================================ */
    acf_add_local_field_group([
        'key'      => 'group_geo_settings',
        'title'    => 'Мультирегиональность',
        'location' => [[[
            'param' => 'options_page', 'operator' => '==', 'value' => 'webseo-geo',
        ]]],
        'fields'   => [
            [
                'key'           => 'f_primary_city',
                'name'          => 'primary_city',
                'label'         => 'Основной город',
                'type'          => 'taxonomy',
                'taxonomy'      => 'city',
                'field_type'    => 'select',
                'allow_null'    => 1,
                'return_format' => 'id',
                'instructions'  => 'Город по умолчанию для основных страниц услуг (без /city/ в URL). Обычно — Москва.',
            ],
        ],
    ]);

    /* ================================================================
     * 4. FRONT PAGE — Главная
     * ================================================================ */
    acf_add_local_field_group([
        'key'      => 'group_front_page',
        'title'    => 'Главная страница',
        'location' => [[[
            'param' => 'page_type', 'operator' => '==', 'value' => 'front_page',
        ]]],
        'fields' => [
            // Hero
            ['key' => 'f_fp_tab_hero', 'label' => 'Hero', 'type' => 'tab'],
            ['key' => 'f_fp_hero_title',    'name' => 'hero_title',    'label' => 'Заголовок (H1)',  'type' => 'text'],
            ['key' => 'f_fp_hero_subtitle', 'name' => 'hero_subtitle', 'label' => 'Подзаголовок',    'type' => 'textarea', 'rows' => 3],
            ['key' => 'f_fp_hero_btn1_text','name' => 'hero_btn1_text','label' => 'Кнопка 1 — текст','type' => 'text'],
            ['key' => 'f_fp_hero_btn1_url', 'name' => 'hero_btn1_url', 'label' => 'Кнопка 1 — URL', 'type' => 'url'],
            ['key' => 'f_fp_hero_btn2_text','name' => 'hero_btn2_text','label' => 'Кнопка 2 — текст','type' => 'text'],
            ['key' => 'f_fp_hero_btn2_url', 'name' => 'hero_btn2_url', 'label' => 'Кнопка 2 — URL', 'type' => 'url'],

            // Services section
            ['key' => 'f_fp_tab_services', 'label' => 'Услуги', 'type' => 'tab'],
            ['key' => 'f_fp_services_badge',    'name' => 'services_badge',    'label' => 'Badge',       'type' => 'text', 'default_value' => 'Экспертиза'],
            ['key' => 'f_fp_services_title',    'name' => 'services_title',    'label' => 'Заголовок',   'type' => 'text'],
            ['key' => 'f_fp_services_subtitle', 'name' => 'services_subtitle', 'label' => 'Подзаголовок','type' => 'textarea', 'rows' => 2],

            // Benefits section
            ['key' => 'f_fp_tab_benefits', 'label' => 'Преимущества', 'type' => 'tab'],
            ['key' => 'f_fp_benefits_badge',    'name' => 'benefits_badge',    'label' => 'Badge',       'type' => 'text', 'default_value' => 'Подход'],
            ['key' => 'f_fp_benefits_title',    'name' => 'benefits_title',    'label' => 'Заголовок',   'type' => 'text'],
            ['key' => 'f_fp_benefits_subtitle', 'name' => 'benefits_subtitle', 'label' => 'Подзаголовок','type' => 'textarea', 'rows' => 2],
            [
                'key'        => 'f_fp_benefits',
                'name'       => 'benefits',
                'label'      => 'Преимущества',
                'type'       => 'repeater',
                'layout'     => 'block',
                'sub_fields' => [
                    ['key' => 'f_fp_b_icon',  'name' => 'icon',  'label' => 'Иконка (CSS-класс)', 'type' => 'text', 'instructions' => 'Phosphor: ph ph-handshake'],
                    ['key' => 'f_fp_b_title', 'name' => 'title', 'label' => 'Заголовок',           'type' => 'text'],
                    ['key' => 'f_fp_b_text',  'name' => 'text',  'label' => 'Описание',            'type' => 'textarea', 'rows' => 3],
                ],
            ],

            // Portfolio section
            ['key' => 'f_fp_tab_portfolio', 'label' => 'Портфолио', 'type' => 'tab'],
            ['key' => 'f_fp_portfolio_badge',   'name' => 'portfolio_badge',   'label' => 'Badge',       'type' => 'text', 'default_value' => 'Кейсы'],
            ['key' => 'f_fp_portfolio_title',   'name' => 'portfolio_title',   'label' => 'Заголовок',   'type' => 'text'],
            ['key' => 'f_fp_portfolio_subtitle','name' => 'portfolio_subtitle','label' => 'Подзаголовок','type' => 'textarea', 'rows' => 2],
            ['key' => 'f_fp_portfolio_count',   'name' => 'portfolio_count',   'label' => 'Кол-во кейсов','type' => 'number', 'default_value' => 4],

            // Testimonials
            ['key' => 'f_fp_tab_testimonials', 'label' => 'Отзывы', 'type' => 'tab'],
            ['key' => 'f_fp_testimonials_badge','name' => 'testimonials_badge','label' => 'Badge',     'type' => 'text', 'default_value' => 'Отзывы'],
            ['key' => 'f_fp_testimonials_title','name' => 'testimonials_title','label' => 'Заголовок', 'type' => 'text'],

            // FAQ
            ['key' => 'f_fp_tab_faq', 'label' => 'FAQ', 'type' => 'tab'],
            ['key' => 'f_fp_faq_badge', 'name' => 'faq_badge', 'label' => 'Badge', 'type' => 'text', 'default_value' => 'Вопросы'],
            ['key' => 'f_fp_faq_title', 'name' => 'faq_title', 'label' => 'Заголовок', 'type' => 'text'],
            [
                'key'        => 'f_fp_faq',
                'name'       => 'faq_items',
                'label'      => 'Вопросы и ответы',
                'type'       => 'repeater',
                'layout'     => 'block',
                'sub_fields' => [
                    ['key' => 'f_fp_faq_q', 'name' => 'question', 'label' => 'Вопрос', 'type' => 'text'],
                    ['key' => 'f_fp_faq_a', 'name' => 'answer',   'label' => 'Ответ',  'type' => 'wysiwyg', 'media_upload' => 0, 'toolbar' => 'basic'],
                ],
            ],

            // CTA
            ['key' => 'f_fp_tab_cta', 'label' => 'CTA', 'type' => 'tab'],
            ['key' => 'f_fp_cta_title', 'name' => 'cta_title', 'label' => 'Заголовок', 'type' => 'text'],
            ['key' => 'f_fp_cta_text',  'name' => 'cta_text',  'label' => 'Описание',  'type' => 'textarea', 'rows' => 2],
            ['key' => 'f_fp_cta_btn_text','name'=> 'cta_btn_text','label'=> 'Кнопка — текст','type' => 'text'],
        ],
    ]);

    /* ================================================================
     * 5. SINGLE SERVICE — Страница услуги
     * ================================================================ */
    acf_add_local_field_group([
        'key'      => 'group_service',
        'title'    => 'Настройки услуги',
        'location' => [[[
            'param' => 'post_type', 'operator' => '==', 'value' => 'service',
        ]]],
        'fields' => [
            // Hero
            ['key' => 'f_srv_tab_hero', 'label' => 'Hero', 'type' => 'tab'],
            ['key' => 'f_srv_subtitle',  'name' => 'service_subtitle',  'label' => 'Подзаголовок',    'type' => 'textarea', 'rows' => 3],
            ['key' => 'f_srv_hero_icon', 'name' => 'service_icon',      'label' => 'Иконка (CSS-класс)','type' => 'text', 'instructions' => 'Phosphor: ph ph-code'],
            ['key' => 'f_srv_cta_text',  'name' => 'service_cta_text',  'label' => 'CTA кнопка текст','type' => 'text', 'default_value' => 'Оставить заявку'],
            ['key' => 'f_srv_hero_media','name' => 'hero_media',        'label' => 'Медиа справа (изображение / GIF / видео)', 'type' => 'file', 'return_format' => 'array', 'mime_types' => 'jpg,jpeg,png,gif,webp,svg,mp4,webm', 'instructions' => 'Анимация, GIF, иллюстрация или видео для правой части hero-блока'],

            // Hero chips
            [
                'key' => 'f_srv_hero_chips', 'name' => 'hero_chips', 'label' => 'Выгоды-чипсы (3–4 шт)', 'type' => 'repeater', 'layout' => 'table',
                'instructions' => 'Короткие обещания с галочкой: «Рост трафика ×3», «Без долгих контрактов»',
                'sub_fields' => [
                    ['key' => 'f_srv_hc_text', 'name' => 'text', 'label' => 'Текст', 'type' => 'text'],
                ],
            ],
            // Hero trust metrics
            [
                'key' => 'f_srv_hero_trust', 'name' => 'hero_trust', 'label' => 'Trust-метрики (2–4 шт)', 'type' => 'repeater', 'layout' => 'table',
                'instructions' => 'Цифры доверия: «10+» — «лет опыта», «200+» — «проектов»',
                'sub_fields' => [
                    ['key' => 'f_srv_ht_value', 'name' => 'value', 'label' => 'Цифра', 'type' => 'text'],
                    ['key' => 'f_srv_ht_label', 'name' => 'label', 'label' => 'Подпись', 'type' => 'text'],
                ],
            ],

            // Pains
            ['key' => 'f_srv_tab_pains', 'label' => 'Боли клиента', 'type' => 'tab'],
            ['key' => 'f_srv_pains_title', 'name' => 'pains_title', 'label' => 'Заголовок секции', 'type' => 'text', 'default_value' => 'Знакомо?'],
            [
                'key' => 'f_srv_pains', 'name' => 'pains', 'label' => 'Боли', 'type' => 'repeater', 'layout' => 'block',
                'sub_fields' => [
                    ['key' => 'f_srv_p_icon',  'name' => 'icon',  'label' => 'Иконка', 'type' => 'text'],
                    ['key' => 'f_srv_p_title', 'name' => 'title', 'label' => 'Заголовок', 'type' => 'text'],
                    ['key' => 'f_srv_p_text',  'name' => 'text',  'label' => 'Описание',  'type' => 'textarea', 'rows' => 2],
                ],
            ],

            // Solution
            ['key' => 'f_srv_tab_solution', 'label' => 'Решение', 'type' => 'tab'],
            ['key' => 'f_srv_solution_title', 'name' => 'solution_title', 'label' => 'Заголовок секции', 'type' => 'text', 'default_value' => 'Что вы получите'],
            [
                'key' => 'f_srv_solution', 'name' => 'solution_items', 'label' => 'Результаты', 'type' => 'repeater', 'layout' => 'block',
                'sub_fields' => [
                    ['key' => 'f_srv_sol_icon',  'name' => 'icon',  'label' => 'Иконка', 'type' => 'text'],
                    ['key' => 'f_srv_sol_title', 'name' => 'title', 'label' => 'Заголовок', 'type' => 'text'],
                    ['key' => 'f_srv_sol_text',  'name' => 'text',  'label' => 'Описание',  'type' => 'textarea', 'rows' => 2],
                ],
            ],

            // Benefits
            ['key' => 'f_srv_tab_benefits', 'label' => 'Преимущества', 'type' => 'tab'],
            ['key' => 'f_srv_benefits_title', 'name' => 'benefits_title', 'label' => 'Заголовок секции', 'type' => 'text'],
            [
                'key' => 'f_srv_benefits', 'name' => 'benefits', 'label' => 'Преимущества', 'type' => 'repeater', 'layout' => 'block',
                'sub_fields' => [
                    ['key' => 'f_srv_ben_icon',  'name' => 'icon',  'label' => 'Иконка', 'type' => 'text'],
                    ['key' => 'f_srv_ben_title', 'name' => 'title', 'label' => 'Заголовок', 'type' => 'text'],
                    ['key' => 'f_srv_ben_text',  'name' => 'text',  'label' => 'Описание',  'type' => 'textarea', 'rows' => 2],
                ],
            ],

            // Steps
            ['key' => 'f_srv_tab_steps', 'label' => 'Этапы', 'type' => 'tab'],
            ['key' => 'f_srv_steps_title', 'name' => 'steps_title', 'label' => 'Заголовок секции', 'type' => 'text', 'default_value' => 'Как мы работаем'],
            [
                'key' => 'f_srv_steps', 'name' => 'steps', 'label' => 'Этапы', 'type' => 'repeater', 'layout' => 'block',
                'sub_fields' => [
                    ['key' => 'f_srv_step_title', 'name' => 'title', 'label' => 'Заголовок', 'type' => 'text'],
                    ['key' => 'f_srv_step_text',  'name' => 'text',  'label' => 'Описание',  'type' => 'textarea', 'rows' => 3],
                ],
            ],

            // Cases
            ['key' => 'f_srv_tab_cases', 'label' => 'Кейсы', 'type' => 'tab'],
            ['key' => 'f_srv_cases_title', 'name' => 'cases_title', 'label' => 'Заголовок секции', 'type' => 'text', 'default_value' => 'Наши работы'],
            [
                'key' => 'f_srv_cases', 'name' => 'selected_cases', 'label' => 'Выбрать кейсы (или авто по категории)',
                'type' => 'relationship', 'post_type' => ['portfolio'], 'filters' => ['search'], 'return_format' => 'id',
            ],

            // Pricing
            ['key' => 'f_srv_tab_pricing', 'label' => 'Тарифы', 'type' => 'tab'],
            ['key' => 'f_srv_pricing_title', 'name' => 'pricing_title', 'label' => 'Заголовок секции', 'type' => 'text', 'default_value' => 'Стоимость'],
            [
                'key' => 'f_srv_pricing', 'name' => 'pricing', 'label' => 'Тарифы', 'type' => 'repeater', 'layout' => 'block',
                'sub_fields' => [
                    ['key' => 'f_srv_pr_name',    'name' => 'name',    'label' => 'Название тарифа', 'type' => 'text'],
                    ['key' => 'f_srv_pr_price',   'name' => 'price',   'label' => 'Цена',            'type' => 'text', 'instructions' => 'Например: от 500 BYN'],
                    ['key' => 'f_srv_pr_features','name' => 'features','label' => 'Что входит',      'type' => 'textarea', 'rows' => 5, 'instructions' => 'Каждый пункт с новой строки'],
                    ['key' => 'f_srv_pr_popular', 'name' => 'popular', 'label' => 'Популярный?',     'type' => 'true_false', 'default_value' => 0],
                    ['key' => 'f_srv_pr_btn_text','name' => 'btn_text','label' => 'Текст кнопки',    'type' => 'text', 'default_value' => 'Заказать'],
                ],
            ],

            // FAQ
            ['key' => 'f_srv_tab_faq', 'label' => 'FAQ', 'type' => 'tab'],
            [
                'key' => 'f_srv_faq', 'name' => 'faq_items', 'label' => 'Вопросы и ответы', 'type' => 'repeater', 'layout' => 'block',
                'sub_fields' => [
                    ['key' => 'f_srv_faq_q', 'name' => 'question', 'label' => 'Вопрос', 'type' => 'text'],
                    ['key' => 'f_srv_faq_a', 'name' => 'answer',   'label' => 'Ответ',  'type' => 'wysiwyg', 'media_upload' => 0, 'toolbar' => 'basic'],
                ],
            ],

            // Quiz
            ['key' => 'f_srv_tab_quiz', 'label' => 'Квиз', 'type' => 'tab'],
            ['key' => 'f_srv_quiz', 'name' => 'quiz_id', 'label' => 'Выбрать квиз', 'type' => 'post_object', 'post_type' => ['quiz'], 'return_format' => 'id', 'allow_null' => 1],

            // CTA
            ['key' => 'f_srv_tab_cta', 'label' => 'CTA', 'type' => 'tab'],
            ['key' => 'f_srv_cta_title',    'name' => 'cta_title',    'label' => 'Заголовок', 'type' => 'text', 'default_value' => 'Готовы обсудить проект?'],
            ['key' => 'f_srv_cta_desc',     'name' => 'cta_desc',     'label' => 'Описание',  'type' => 'textarea', 'rows' => 2],
            ['key' => 'f_srv_cta_btn_text', 'name' => 'cta_btn_text', 'label' => 'Кнопка',    'type' => 'text', 'default_value' => 'Оставить заявку'],
        ],
    ]);

    /* ================================================================
     * 6. SINGLE PORTFOLIO — Кейс (продающая структура)
     * ================================================================ */
    acf_add_local_field_group([
        'key'      => 'group_portfolio',
        'title'    => 'Данные кейса',
        'location' => [[[
            'param' => 'post_type', 'operator' => '==', 'value' => 'portfolio',
        ]]],
        'fields' => [
            // Hero
            ['key' => 'f_pf_tab_hero', 'label' => 'Hero', 'type' => 'tab'],
            ['key' => 'f_pf_client',  'name' => 'client',  'label' => 'Клиент / компания', 'type' => 'text', 'instructions' => 'Название компании или имя клиента'],
            ['key' => 'f_pf_niche',   'name' => 'niche',   'label' => 'Ниша / отрасль',    'type' => 'text', 'instructions' => 'Например: «E-commerce», «Медицина», «B2B SaaS»'],

            // Task & Challenge
            ['key' => 'f_pf_tab_task', 'label' => 'Задача', 'type' => 'tab'],
            ['key' => 'f_pf_task',      'name' => 'task',      'label' => 'Задача проекта',  'type' => 'wysiwyg', 'media_upload' => 0, 'toolbar' => 'basic',
             'instructions' => 'Что нужно было сделать. HTML: p, ul, li'],
            ['key' => 'f_pf_challenge', 'name' => 'challenge', 'label' => 'Сложности',       'type' => 'wysiwyg', 'media_upload' => 0, 'toolbar' => 'basic',
             'instructions' => 'С какими трудностями столкнулись. Опционально'],

            // Approach
            ['key' => 'f_pf_tab_approach', 'label' => 'Подход', 'type' => 'tab'],
            [
                'key' => 'f_pf_approach', 'name' => 'approach', 'label' => 'Этапы решения', 'type' => 'repeater', 'layout' => 'block',
                'instructions' => 'Пошаговый подход: анализ → проектирование → разработка → тестирование. 4–6 этапов',
                'sub_fields' => [
                    ['key' => 'f_pf_app_title', 'name' => 'title', 'label' => 'Этап',     'type' => 'text'],
                    ['key' => 'f_pf_app_text',  'name' => 'text',  'label' => 'Описание', 'type' => 'textarea', 'rows' => 3],
                ],
            ],

            // Solution
            ['key' => 'f_pf_tab_solution', 'label' => 'Решение', 'type' => 'tab'],
            ['key' => 'f_pf_solution','name' => 'solution', 'label' => 'Решение', 'type' => 'wysiwyg',
             'instructions' => 'Подробное описание что сделали, какой подход выбрали'],

            // Results
            ['key' => 'f_pf_tab_results', 'label' => 'Результаты', 'type' => 'tab'],
            [
                'key' => 'f_pf_results', 'name' => 'results', 'label' => 'Измеримые результаты', 'type' => 'repeater', 'layout' => 'table',
                'instructions' => '3–6 метрик: трафик, конверсия, позиции, скорость и т.д.',
                'sub_fields' => [
                    ['key' => 'f_pf_res_metric', 'name' => 'metric', 'label' => 'Метрика',        'type' => 'text'],
                    ['key' => 'f_pf_res_before', 'name' => 'before', 'label' => 'Было',           'type' => 'text'],
                    ['key' => 'f_pf_res_after',  'name' => 'after',  'label' => 'Стало',          'type' => 'text'],
                ],
            ],

            // Gallery
            ['key' => 'f_pf_tab_gallery', 'label' => 'Визуал', 'type' => 'tab'],
            ['key' => 'f_pf_gallery',  'name' => 'gallery',     'label' => 'Скриншоты',    'type' => 'gallery', 'return_format' => 'array', 'preview_size' => 'medium'],

            // Technologies
            ['key' => 'f_pf_tab_tech', 'label' => 'Технологии', 'type' => 'tab'],
            [
                'key' => 'f_pf_tech', 'name' => 'technologies', 'label' => 'Стек технологий', 'type' => 'repeater', 'layout' => 'table',
                'sub_fields' => [
                    ['key' => 'f_pf_tech_name', 'name' => 'name', 'label' => 'Название', 'type' => 'text'],
                    ['key' => 'f_pf_tech_icon', 'name' => 'icon', 'label' => 'Иконка',   'type' => 'text'],
                ],
            ],

            // Timeline
            ['key' => 'f_pf_tab_timeline', 'label' => 'Хронология', 'type' => 'tab'],
            [
                'key' => 'f_pf_timeline', 'name' => 'timeline', 'label' => 'Хронология проекта', 'type' => 'repeater', 'layout' => 'block',
                'instructions' => 'Ключевые вехи проекта: «Неделя 1–2» — «Аудит и анализ». Опционально, 3–6 пунктов',
                'sub_fields' => [
                    ['key' => 'f_pf_tl_period', 'name' => 'period', 'label' => 'Период',   'type' => 'text', 'instructions' => 'Неделя 1–2, Месяц 1, и т.д.'],
                    ['key' => 'f_pf_tl_title',  'name' => 'title',  'label' => 'Заголовок','type' => 'text'],
                    ['key' => 'f_pf_tl_text',   'name' => 'text',   'label' => 'Описание', 'type' => 'textarea', 'rows' => 2],
                ],
            ],

            // Meta
            ['key' => 'f_pf_tab_meta', 'label' => 'Доп. данные', 'type' => 'tab'],
            ['key' => 'f_pf_url',         'name' => 'project_url',   'label' => 'Ссылка на сайт', 'type' => 'url'],
            ['key' => 'f_pf_testimonial', 'name' => 'testimonial_id','label' => 'Отзыв клиента',  'type' => 'post_object', 'post_type' => ['testimonial'], 'return_format' => 'id', 'allow_null' => 1],
        ],
    ]);

    /* ================================================================
     * 7. TESTIMONIAL
     * ================================================================ */
    acf_add_local_field_group([
        'key'      => 'group_testimonial',
        'title'    => 'Данные отзыва',
        'location' => [[[
            'param' => 'post_type', 'operator' => '==', 'value' => 'testimonial',
        ]]],
        'fields' => [
            ['key' => 'f_tm_name',     'name' => 'client_name',    'label' => 'Имя клиента',         'type' => 'text'],
            ['key' => 'f_tm_position', 'name' => 'client_position','label' => 'Должность / компания','type' => 'text'],
            ['key' => 'f_tm_text',     'name' => 'review_text',    'label' => 'Текст отзыва',        'type' => 'textarea', 'rows' => 5],
            ['key' => 'f_tm_avatar',   'name' => 'client_avatar',  'label' => 'Аватар',              'type' => 'image', 'return_format' => 'array', 'preview_size' => 'thumbnail'],
        ],
    ]);

    /* ================================================================
     * 8. QUIZ
     * ================================================================ */
    acf_add_local_field_group([
        'key'      => 'group_quiz',
        'title'    => 'Настройка квиза',
        'location' => [[[
            'param' => 'post_type', 'operator' => '==', 'value' => 'quiz',
        ]]],
        'fields' => [
            ['key' => 'f_qz_subtitle',  'name' => 'quiz_subtitle',  'label' => 'Подзаголовок',      'type' => 'textarea', 'rows' => 2],
            [
                'key' => 'f_qz_steps', 'name' => 'quiz_steps', 'label' => 'Шаги квиза', 'type' => 'repeater', 'layout' => 'block',
                'sub_fields' => [
                    ['key' => 'f_qz_s_question', 'name' => 'question', 'label' => 'Вопрос', 'type' => 'text'],
                    ['key' => 'f_qz_s_type',     'name' => 'type',     'label' => 'Тип ответа', 'type' => 'select', 'choices' => ['radio' => 'Один вариант', 'checkbox' => 'Несколько вариантов', 'text' => 'Свободный ввод']],
                    [
                        'key' => 'f_qz_s_options', 'name' => 'options', 'label' => 'Варианты ответов', 'type' => 'repeater', 'layout' => 'table',
                        'conditional_logic' => [[['field' => 'f_qz_s_type', 'operator' => '!=', 'value' => 'text']]],
                        'sub_fields' => [
                            ['key' => 'f_qz_s_opt_text', 'name' => 'text', 'label' => 'Вариант', 'type' => 'text'],
                        ],
                    ],
                ],
            ],
            // Contact fields config
            ['key' => 'f_qz_tab_contact', 'label' => 'Финальный шаг', 'type' => 'tab'],
            ['key' => 'f_qz_show_name',  'name' => 'show_name',  'label' => 'Поле «Имя»',    'type' => 'true_false', 'default_value' => 1],
            ['key' => 'f_qz_show_phone', 'name' => 'show_phone', 'label' => 'Поле «Телефон»', 'type' => 'true_false', 'default_value' => 1],
            ['key' => 'f_qz_show_email', 'name' => 'show_email', 'label' => 'Поле «Email»',   'type' => 'true_false', 'default_value' => 0],
            ['key' => 'f_qz_btn_text',   'name' => 'submit_text', 'label' => 'Текст кнопки отправки', 'type' => 'text', 'default_value' => 'Получить консультацию'],
            ['key' => 'f_qz_success',    'name' => 'success_message','label' => 'Сообщение после отправки', 'type' => 'text', 'default_value' => 'Спасибо! Мы свяжемся с вами в ближайшее время.'],
            ['key' => 'f_qz_email_to',   'name' => 'email_to',  'label' => 'Email получателя', 'type' => 'email', 'instructions' => 'Если пусто — используется email из настроек WP'],
            ['key' => 'f_qz_side_image', 'name' => 'quiz_side_image', 'label' => 'Изображение (боковая панель)', 'type' => 'image', 'return_format' => 'array', 'preview_size' => 'medium', 'instructions' => 'Фото менеджера или иллюстрация. Если загружено — заменяет текст.'],
        ],
    ]);

    /* ================================================================
     * 9. PAGE — About (Обо мне)
     * ================================================================ */
    acf_add_local_field_group([
        'key'      => 'group_about',
        'title'    => 'Страница «Обо мне»',
        'location' => [[[
            'param' => 'page_template', 'operator' => '==', 'value' => 'page-about.php',
        ]]],
        'fields' => [
            ['key' => 'f_about_photo',    'name' => 'about_photo',    'label' => 'Фото',           'type' => 'image', 'return_format' => 'array'],
            ['key' => 'f_about_name',     'name' => 'about_name',     'label' => 'Имя',            'type' => 'text'],
            ['key' => 'f_about_role',     'name' => 'about_role',     'label' => 'Должность',      'type' => 'text'],
            ['key' => 'f_about_bio',      'name' => 'about_bio',      'label' => 'О себе',         'type' => 'wysiwyg'],
            [
                'key' => 'f_about_tech', 'name' => 'tech_stack', 'label' => 'Стек технологий', 'type' => 'repeater', 'layout' => 'table',
                'sub_fields' => [
                    ['key' => 'f_about_t_name', 'name' => 'name', 'label' => 'Название', 'type' => 'text'],
                    ['key' => 'f_about_t_icon', 'name' => 'icon', 'label' => 'Иконка',   'type' => 'text'],
                ],
            ],
        ],
    ]);

    /* ================================================================
     * 10. PAGE — Contacts
     * ================================================================ */
    acf_add_local_field_group([
        'key'      => 'group_contacts_page',
        'title'    => 'Страница контактов',
        'location' => [[[
            'param' => 'page_template', 'operator' => '==', 'value' => 'page-contacts.php',
        ]]],
        'fields' => [
            ['key' => 'f_ct_title',     'name' => 'contacts_title',    'label' => 'Заголовок',   'type' => 'text'],
            ['key' => 'f_ct_subtitle',  'name' => 'contacts_subtitle', 'label' => 'Подзаголовок','type' => 'textarea', 'rows' => 2],
            ['key' => 'f_ct_work_hours','name' => 'work_hours',        'label' => 'Время работы','type' => 'text'],
        ],
    ]);

    /* ================================================================
     * 11. BLOG — CTA after post (Options)
     * ================================================================ */
    acf_add_local_field_group([
        'key'      => 'group_blog_cta',
        'title'    => 'CTA после статьи',
        'location' => [[[
            'param' => 'options_page', 'operator' => '==', 'value' => 'webseo-settings',
        ]]],
        'fields' => [
            ['key' => 'f_blog_cta_title',    'name' => 'blog_cta_title',    'label' => 'Заголовок CTA', 'type' => 'text'],
            ['key' => 'f_blog_cta_text',     'name' => 'blog_cta_text',     'label' => 'Текст CTA',     'type' => 'textarea', 'rows' => 2],
            ['key' => 'f_blog_cta_btn_text', 'name' => 'blog_cta_btn_text', 'label' => 'Кнопка — текст','type' => 'text'],
        ],
    ]);

    /* ================================================================
     * 12. CITY TAXONOMY — Склонения города
     * ================================================================ */
    acf_add_local_field_group([
        'key'      => 'group_city',
        'title'    => 'Настройки города',
        'location' => [[[
            'param' => 'taxonomy', 'operator' => '==', 'value' => 'city',
        ]]],
        'fields' => [
            ['key' => 'f_city_prep', 'name' => 'city_prepositional', 'label' => 'Предложный (в …)', 'type' => 'text',
             'instructions' => 'Москве, Санкт-Петербурге, Минске', 'required' => 1],
            ['key' => 'f_city_gen',  'name' => 'city_genitive',      'label' => 'Родительный (… ого)', 'type' => 'text',
             'instructions' => 'Москвы, Санкт-Петербурга, Минска', 'required' => 1],
            ['key' => 'f_city_acc',  'name' => 'city_accusative',    'label' => 'Винительный (в …)', 'type' => 'text',
             'instructions' => 'Москву, Санкт-Петербург, Минск. Если совпадает с именительным — оставьте пустым'],
        ],
    ]);

    /* ================================================================
     * 13. SERVICE — Региональный контент (geo)
     * ================================================================ */
    acf_add_local_field_group([
        'key'      => 'group_service_geo',
        'title'    => 'Мультирегиональность',
        'location' => [[[
            'param' => 'post_type', 'operator' => '==', 'value' => 'service',
        ]]],
        'position' => 'normal',
        'menu_order' => 20,
        'fields' => [
            [
                'key' => 'f_srv_geo_msg', 'type' => 'message', 'label' => '',
                'message' => 'Назначьте города через таксономию «Города» справа.<br>'
                    . 'В текстовых полях услуги используйте подстановки:<br>'
                    . '<code>{city}</code> — предложный падеж (в <em>Москве</em>)<br>'
                    . '<code>{city_nom}</code> — именительный (Москва)<br>'
                    . '<code>{city_rod}</code> — родительный (Москвы)<br>'
                    . '<code>{city_vin}</code> — винительный (Москву)',
            ],
            ['key' => 'f_srv_geo_subtitle', 'name' => 'geo_subtitle', 'label' => 'Подзаголовок для города', 'type' => 'textarea', 'rows' => 3,
             'instructions' => 'Переопределяет основной подзаголовок на городской странице. Используйте {city}.', 'placeholder' => 'Профессиональная разработка интернет-магазинов в {city}'],
            ['key' => 'f_srv_geo_desc',     'name' => 'geo_description', 'label' => 'Дополнительный текст для города', 'type' => 'wysiwyg', 'media_upload' => 0, 'toolbar' => 'basic',
             'instructions' => 'Выводится дополнительным блоком на городской странице. Уникальный контент для SEO.'],
        ],
    ]);
}
