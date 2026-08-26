<?php
/**
 * Theme JSON Importer — per-entity tabs with field docs & AI prompts
 *
 * @package WebSEO
 */

defined('ABSPATH') || exit;

/* ── Admin menu ─────────────────────────────── */

add_action('admin_menu', function () {
    add_menu_page('Импорт контента', 'Импорт JSON', 'manage_options', 'webseo-import', 'webseo_import_page', 'dashicons-database-import', 100);
    if (function_exists('acf_add_options_page')) {
        add_submenu_page('webseo-settings', 'Импорт контента', 'Импорт JSON', 'manage_options', 'webseo-import', 'webseo_import_page');
    }
});

/* ── Admin page ─────────────────────────────── */

function webseo_import_page(): void {
    $result = '';
    $active_tab = $_GET['tab'] ?? 'services';

    // Handle import
    if (isset($_POST['webseo_import_json']) && check_admin_referer('webseo_import')) {
        $json_raw = wp_unslash($_POST['webseo_import_json']);
        $type = sanitize_text_field($_POST['webseo_import_type'] ?? '');
        $data = json_decode($json_raw, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            $result = '<div class="notice notice-error"><p>❌ Ошибка JSON: ' . json_last_error_msg() . '</p></div>';
        } else {
            $log = webseo_run_import($data, $type);
            $result = '<div class="notice notice-success"><p>✅ Импорт завершён</p><pre style="max-height:300px;overflow:auto;">' . esc_html(implode("\n", $log)) . '</pre></div>';
        }
        $active_tab = $type ?: $active_tab;
    }

    $tabs = [
        'services'     => '🔧 Услуги',
        'portfolio'    => '📁 Портфолио',
        'quizzes'      => '📋 Квизы',
        'testimonials' => '💬 Отзывы',
        'pages'        => '📄 Страницы',
        'settings'     => '⚙️ Настройки',
    ];

    ?>
    <div class="wrap">
        <h1>Импорт контента</h1>
        <?php echo $result; ?>

        <style>
            .webseo-tabs { display:flex; gap:0; border-bottom:2px solid #c3c4c7; margin:16px 0 0; }
            .webseo-tab { padding:10px 20px; cursor:pointer; border:1px solid transparent; border-bottom:none; border-radius:4px 4px 0 0; font-weight:500; background:transparent; font-size:14px; }
            .webseo-tab:hover { background:#f0f0f1; }
            .webseo-tab.active { background:#fff; border-color:#c3c4c7; margin-bottom:-2px; border-bottom:2px solid #fff; font-weight:600; }
            .webseo-panel { display:none; background:#fff; border:1px solid #c3c4c7; border-top:none; padding:24px; }
            .webseo-panel.active { display:block; }
            .webseo-cols { display:grid; grid-template-columns:1fr 1fr; gap:24px; }
            @media(max-width:1200px) { .webseo-cols { grid-template-columns:1fr; } }
            .field-table { width:100%; border-collapse:collapse; font-size:13px; }
            .field-table th, .field-table td { padding:8px 12px; border:1px solid #ddd; text-align:left; vertical-align:top; }
            .field-table th { background:#f9f9f9; font-weight:600; white-space:nowrap; }
            .field-table code { background:#f0f0f1; padding:2px 6px; border-radius:3px; font-size:12px; }
            .prompt-box { background:#f9f9f9; border:1px solid #ddd; border-radius:6px; padding:16px; margin:16px 0; }
            .prompt-box h4 { margin:0 0 8px; }
            .prompt-box pre { white-space:pre-wrap; font-size:12px; background:#fff; padding:12px; border:1px solid #e5e5e5; border-radius:4px; max-height:200px; overflow:auto; }
            .json-area { width:100%; min-height:300px; font-family:monospace; font-size:13px; }
        </style>

        <div class="webseo-tabs">
            <?php foreach ($tabs as $key => $label) : ?>
                <a href="?page=webseo-import&tab=<?php echo $key; ?>" class="webseo-tab <?php echo $active_tab === $key ? 'active' : ''; ?>"><?php echo $label; ?></a>
            <?php endforeach; ?>
        </div>

        <?php
        foreach ($tabs as $key => $label) {
            $fn = "webseo_tab_{$key}";
            echo '<div class="webseo-panel ' . ($active_tab === $key ? 'active' : '') . '">';
            if (function_exists($fn)) $fn();
            echo '</div>';
        }
        ?>
    </div>
    <?php
}

/* ── Import form helper ─────────────────────── */

function webseo_import_form(string $type, string $placeholder = ''): void {
    ?>
    <form method="post">
        <?php wp_nonce_field('webseo_import'); ?>
        <input type="hidden" name="webseo_import_type" value="<?php echo esc_attr($type); ?>">
        <textarea name="webseo_import_json" class="json-area" placeholder="<?php echo esc_attr($placeholder); ?>"></textarea>
        <p><button type="submit" class="button button-primary button-hero">Импортировать</button></p>
    </form>
    <?php
}

/* ════════════════════════════════════════════════
   TAB: SERVICES
   ════════════════════════════════════════════════ */

function webseo_tab_services(): void {
    ?>
    <h2>Импорт услуг</h2>
    <p>Каждая услуга — это CPT <code>service</code> с 11-секционным продающим шаблоном. Все секции опциональны — пустые не отображаются.</p>

    <div class="webseo-cols">
        <div>
            <h3>Структура JSON</h3>
            <table class="field-table">
                <tr><th colspan="3" style="background:#e8f5e9;">Основные поля</th></tr>
                <tr><th><code>title</code></th><td>string</td><td>Название услуги (H1 на странице). Пример: «Разработка интернет-магазинов»</td></tr>
                <tr><th><code>excerpt</code></th><td>string</td><td>Краткое описание для карточки на главной (1–2 предложения)</td></tr>
                <tr><th><code>menu_order</code></th><td>number</td><td>Порядок сортировки (1, 2, 3...)</td></tr>
                <tr><th><code>taxonomies.service_category</code></th><td>array</td><td>Категории: <code>["Разработка сайтов"]</code> или <code>["SEO-продвижение"]</code></td></tr>

                <tr><th colspan="3" style="background:#e3f2fd;">fields → Hero</th></tr>
                <tr><th><code>service_icon</code></th><td>string</td><td>CSS-класс иконки Phosphor. Пример: <code>ph ph-shopping-cart</code></td></tr>
                <tr><th><code>service_subtitle</code></th><td>string</td><td>Лид-абзац под H1 (2–3 предложения, суть услуги)</td></tr>
                <tr><th><code>service_cta_text</code></th><td>string</td><td>Текст кнопки. Пример: «Рассчитать стоимость»</td></tr>
                <tr><th><code>service_cta_anchor</code></th><td>string</td><td>Якорь кнопки. Обычно: <code>#quiz</code></td></tr>

                <tr><th colspan="3" style="background:#e8f5e9;">fields → Hero чипсы и trust</th></tr>
                <tr><th><code>hero_chips</code></th><td>array</td><td><strong>3–4</strong> объекта с полем <code>text</code><br>Короткие обещания-выгоды: «Рост трафика ×3», «Без долгих контрактов»</td></tr>
                <tr><th><code>hero_trust</code></th><td>array</td><td><strong>2–4</strong> объекта: <code>value</code> + <code>label</code><br>Цифры доверия: value=«10+» label=«лет опыта»</td></tr>

                <tr><th colspan="3" style="background:#fff3e0;">fields → Боли клиента</th></tr>
                <tr><th><code>pains_title</code></th><td>string</td><td>Заголовок секции. Пример: «Знакомые проблемы?»</td></tr>
                <tr><th><code>pains</code></th><td>array</td><td><strong>4–6</strong> объектов: <code>icon</code>, <code>title</code>, <code>text</code><br>Отображаются как пилюли-теги (только title видно). Формулируйте коротко: «Сайт есть, а заявок нет»</td></tr>

                <tr><th colspan="3" style="background:#e8f5e9;">fields → Решение</th></tr>
                <tr><th><code>solution_title</code></th><td>string</td><td>Заголовок. Пример: «Что вы получите»</td></tr>
                <tr><th><code>solution_items</code></th><td>array</td><td><strong>6</strong> объектов (сетка 3 колонки × 2 ряда): <code>icon</code>, <code>title</code>, <code>text</code><br>Конкретные результаты: «Рост трафика в 3 раза за 6 месяцев»</td></tr>

                <tr><th colspan="3" style="background:#e3f2fd;">fields → Преимущества</th></tr>
                <tr><th><code>benefits_title</code></th><td>string</td><td>Заголовок. Пример: «Почему выбирают нас»</td></tr>
                <tr><th><code>benefits</code></th><td>array</td><td><strong>6</strong> объектов (сетка 3 колонки × 2 ряда): <code>icon</code>, <code>title</code>, <code>text</code></td></tr>

                <tr><th colspan="3" style="background:#fff3e0;">fields → Этапы работы</th></tr>
                <tr><th><code>steps_title</code></th><td>string</td><td>Заголовок. Пример: «Как мы работаем»</td></tr>
                <tr><th><code>steps</code></th><td>array</td><td><strong>4–7</strong> объектов: <code>title</code>, <code>text</code><br>4 в ряд, остальные в слайдере. Номера автоматически</td></tr>

                <tr><th colspan="3" style="background:#e8f5e9;">fields → Тарифы</th></tr>
                <tr><th><code>pricing_title</code></th><td>string</td><td>Заголовок. Пример: «Стоимость»</td></tr>
                <tr><th><code>pricing</code></th><td>array</td><td>1–3 объекта:<br><code>name</code> — название тарифа<br><code>price</code> — цена текстом («от 30 000 ₽»)<br><code>features</code> — что входит (каждый пункт с новой строки \n)<br><code>popular</code> — true/false<br><code>btn_text</code> — текст кнопки<br></td></tr>

                <tr><th colspan="3" style="background:#e3f2fd;">fields → FAQ</th></tr>
                <tr><th><code>faq_items</code></th><td>array</td><td><strong>6–10</strong> объектов: <code>question</code>, <code>answer</code><br>Ответы можно с HTML (<code>&lt;p&gt;</code>, <code>&lt;ul&gt;</code>). Schema FAQPage генерируется автоматически</td></tr>

                <tr><th colspan="3" style="background:#fff3e0;">fields → CTA</th></tr>
                <tr><th><code>cta_title</code></th><td>string</td><td>Заголовок финального блока</td></tr>
                <tr><th><code>cta_desc</code></th><td>string</td><td>Описание (1 предложение)</td></tr>
                <tr><th><code>cta_btn_text</code></th><td>string</td><td>Текст кнопки</td></tr>

            </table>
        </div>
        <div>
            <div class="prompt-box">
                <h4>📎 Промт для ИИ</h4>
                <pre>Сгенерируй JSON для импорта продающей страницы услуги.

Услуга: [НАЗВАНИЕ УСЛУГИ]
Целевая аудитория: владельцы бизнеса в Москве
Тон: уверенный, экспертный, без воды и канцелярита.
Каждый блок должен продавать: боли бьют в реальные проблемы,
решение показывает конкретный результат, преимущества —
почему выбрать именно нас.

СТРОГИЕ ТРЕБОВАНИЯ ПО КОЛИЧЕСТВУ И ФОРМАТУ:
- Боли клиента (pains): 4–6 штук, отображаются как ПИЛЮЛИ-ТЕГИ
  (видно только title, пиши коротко: «Сайт есть, а заявок нет»)
- Что вы получите (solution_items): 6 штук (чеклист 2 колонки,
  заголовок + краткое описание 5–8 слов)
- Преимущества (benefits): 6 штук (карточки с иконками, 3×2 сетка)
- Этапы работы (steps): от 4 до 7 (4 в ряд, далее слайдер)
- Тарифы (pricing): 2 или 3
- FAQ (faq_items): от 6 до 10 вопросов

Текст болей: формулируй от лица клиента, «У вас...», «Вы сталкиваетесь...».
Текст решений: конкретные результаты с цифрами где возможно.
Текст преимуществ: факты, не общие слова.
FAQ: реальные вопросы которые задают клиенты, ответы 2-3 предложения.

JSON-формат (вставь контент в эту структуру):

{
  "services": [
    {
      "title": "Название услуги (H1)",
      "excerpt": "Краткое описание для карточки (1–2 предложения)",
      "menu_order": 1,
      "taxonomies": {
        "service_category": ["Категория"]
      },
      "fields": {
        "service_icon": "ph ph-icon-name",
        "service_subtitle": "Лид-абзац 2–3 предложения",
        "service_cta_text": "Получить бесплатный аудит",
        "hero_chips": [
          {"text": "Рост трафика ×3"},
          {"text": "Прозрачная отчётность"},
          {"text": "Без долгих контрактов"}
        ],
        "hero_trust": [
          {"value": "10+", "label": "лет опыта"},
          {"value": "200+", "label": "проектов"},
          {"value": "50+", "label": "в ТОП-10"}
        ],
        "pains_title": "Знакомые проблемы?",
        "pains": [
          {"icon": "", "title": "Сайт есть, а заявок нет", "text": ""},
          {"icon": "", "title": "Срыв сроков разработки", "text": ""},
          {"icon": "", "title": "Сложно управлять контентом", "text": ""},
          {"icon": "", "title": "Непонятно за что платите", "text": ""},
          {"icon": "", "title": "Нет позиций в поиске", "text": ""},
          {"icon": "", "title": "Сайт не адаптирован под мобильные", "text": ""}
        ],
        "solution_title": "Что вы получите",
        "solution_items": [
          {"icon": "", "title": "Рост видимости в поиске", "text": "Продвигаем по коммерческим запросам"},
          {"icon": "", "title": "Больше целевого трафика", "text": "Посетители готовые покупать"},
          {"icon": "", "title": "Исправленный сайт", "text": "Устраняем технические проблемы"},
          {"icon": "", "title": "Продуманная структура", "text": "SEO-логика в каждой странице"},
          {"icon": "", "title": "Контент под запросы", "text": "Тексты помогающие ранжироваться"},
          {"icon": "", "title": "Система для роста", "text": "План работ каждый месяц"}
        ],
        "benefits_title": "Почему доверяют нам",
        "benefits": [
          {"icon": "ph ph-star", "title": "Преимущество 1", "text": "Описание"},
          {"icon": "ph ph-handshake", "title": "Преимущество 2", "text": "Описание"},
          {"icon": "ph ph-user-focus", "title": "Преимущество 3", "text": "Описание"},
          {"icon": "ph ph-target", "title": "Преимущество 4", "text": "Описание"},
          {"icon": "ph ph-trophy", "title": "Преимущество 5", "text": "Описание"},
          {"icon": "ph ph-graph", "title": "Преимущество 6", "text": "Описание"}
        ],
        "steps_title": "Как мы работаем",
        "steps": [
          {"title": "Шаг 1", "text": "Описание шага"},
          {"title": "Шаг 2", "text": "Описание шага"},
          {"title": "Шаг 3", "text": "Описание шага"},
          {"title": "Шаг 4", "text": "Описание шага"}
        ],
        "pricing_title": "Стоимость",
        "pricing": [
          {
            "name": "Базовый",
            "price": "от 30 000 ₽",
            "features": "Пункт 1\nПункт 2\nПункт 3",
            "popular": false,
            "btn_text": "Заказать",
          }
        ],
        "faq_items": [
          {"question": "Вопрос 1?", "answer": "Ответ на 2-3 предложения."},
          {"question": "Вопрос 2?", "answer": "Ответ на 2-3 предложения."},
          {"question": "Вопрос 3?", "answer": "Ответ."},
          {"question": "Вопрос 4?", "answer": "Ответ."},
          {"question": "Вопрос 5?", "answer": "Ответ."},
          {"question": "Вопрос 6?", "answer": "Ответ."}
        ],
        "cta_title": "Готовы обсудить проект?",
        "cta_desc": "Напишите — отвечу в течение часа",
        "cta_btn_text": "Написать в Telegram",

      }
    }
  ]
}

Иконки Phosphor: https://phosphoricons.com
Используй: ph ph-shopping-cart, ph ph-magnifying-glass,
ph ph-code, ph ph-chart-line-up, ph ph-clock, ph ph-x-circle,
ph ph-check-circle, ph ph-shield-check, ph ph-rocket,
ph ph-handshake, ph ph-user-focus, ph ph-gear, ph ph-database,
ph ph-chat-text, ph ph-currency-dollar, ph ph-lightning</pre>
            </div>

            <h3>Вставьте JSON и импортируйте</h3>
            <?php webseo_import_form('services', '{"services": [...]}'); ?>
        </div>
    </div>
    <?php
}

/* ════════════════════════════════════════════════
   TAB: PORTFOLIO
   ════════════════════════════════════════════════ */

function webseo_tab_portfolio(): void {
    ?>
    <h2>Импорт портфолио</h2>
    <p>Каждый кейс — это CPT <code>portfolio</code> со страницей проекта: задача, решение, результаты, технологии.</p>

    <div class="webseo-cols">
        <div>
            <h3>Структура JSON</h3>
            <table class="field-table">
                <tr><th colspan="3" style="background:#e8f5e9;">Основные поля</th></tr>
                <tr><th><code>title</code></th><td>string</td><td>Название проекта. Пример: «Интернет-магазин автозапчастей»</td></tr>
                <tr><th><code>excerpt</code></th><td>string</td><td>Краткое описание для карточки (1–2 предложения)</td></tr>
                <tr><th><code>taxonomies.portfolio_tag</code></th><td>array</td><td>Теги: <code>["WordPress", "SEO"]</code> или <code>["OpenCart", "Интеграция"]</code></td></tr>
                <tr><th><code>thumbnail_url</code></th><td>string</td><td>URL скриншота (загрузится автоматически). Опционально</td></tr>

                <tr><th colspan="3" style="background:#e3f2fd;">fields → Данные кейса</th></tr>
                <tr><th><code>client</code></th><td>string</td><td>Клиент / отрасль. Пример: «Магазин автозапчастей, Москва»</td></tr>
                <tr><th><code>task</code></th><td>HTML</td><td>Описание задачи. Можно с <code>&lt;p&gt;</code>, <code>&lt;ul&gt;</code></td></tr>
                <tr><th><code>solution</code></th><td>HTML</td><td>Описание решения. Что сделали, какой подход выбрали</td></tr>
                <tr><th><code>results</code></th><td>array</td><td>Измеримые результаты. Объекты:<br><code>metric</code> — что измеряли («Трафик», «Конверсия»)<br><code>before</code> — было<br><code>after</code> — стало</td></tr>
                <tr><th><code>technologies</code></th><td>array</td><td>Стек. Объекты: <code>name</code>, <code>icon</code> (CSS-класс Phosphor)</td></tr>
                <tr><th><code>project_url</code></th><td>string</td><td>Ссылка на живой сайт (опционально)</td></tr>
            </table>
        </div>
        <div>
            <div class="prompt-box">
                <h4>📎 Промт для ИИ</h4>
                <pre>Сгенерируй JSON для импорта кейса портфолио в WordPress-тему.
Проект: [ОПИСАНИЕ ПРОЕКТА]
Формат:

{
  "portfolio": [
    {
      "title": "Название проекта",
      "excerpt": "Краткое описание для карточки",
      "taxonomies": {
        "portfolio_tag": ["WordPress", "SEO"]
      },
      "fields": {
        "client": "Клиент / отрасль, город",
        "task": "<p>Описание задачи клиента</p>",
        "solution": "<p>Что сделали и как решили задачу</p>",
        "results": [
          {"metric": "Трафик", "before": "500 визитов/мес", "after": "3 200 визитов/мес"},
          {"metric": "Позиции в ТОП-10", "before": "3 запроса", "after": "45 запросов"}
        ],
        "technologies": [
          {"name": "WordPress", "icon": "ph ph-globe"},
          {"name": "PHP", "icon": "ph ph-code"}
        ],
        "project_url": "https://example.com"
      }
    }
  ]
}

Результаты должны быть реалистичными и измеримыми.
Задачу и решение пиши в HTML (теги p, ul, li).</pre>
            </div>

            <h3>Вставьте JSON и импортируйте</h3>
            <?php webseo_import_form('portfolio', '{"portfolio": [...]}'); ?>
        </div>
    </div>
    <?php
}

/* ════════════════════════════════════════════════
   TAB: QUIZZES
   ════════════════════════════════════════════════ */

function webseo_tab_quizzes(): void {
    ?>
    <h2>Импорт квизов</h2>
    <p>Квиз — это мультишаговая форма для сбора заявок. Встраивается на страницу услуги. CPT <code>quiz</code>.</p>

    <div class="webseo-cols">
        <div>
            <h3>Структура JSON</h3>
            <table class="field-table">
                <tr><th colspan="3" style="background:#e8f5e9;">Основные поля</th></tr>
                <tr><th><code>title</code></th><td>string</td><td>Название квиза (H2 в блоке). Пример: «Рассчитать стоимость сайта»</td></tr>
                <tr><th><code>taxonomies.service_category</code></th><td>array</td><td>Привязка к категории услуг: <code>["Разработка сайтов"]</code></td></tr>

                <tr><th colspan="3" style="background:#e3f2fd;">fields → Настройки квиза</th></tr>
                <tr><th><code>quiz_subtitle</code></th><td>string</td><td>Мотивирующий текст. Пример: «Ответьте на 3 вопроса — получите расчёт за 30 минут»</td></tr>
                <tr><th><code>quiz_steps</code></th><td>array</td><td>Массив шагов. Каждый шаг:<br><code>question</code> — текст вопроса<br><code>type</code> — <strong>radio</strong> (один вариант), <strong>checkbox</strong> (несколько), <strong>text</strong> (свободный ввод)<br><code>options</code> — варианты ответов, массив <code>[{"text": "Вариант"}]</code> (не нужен для type=text)</td></tr>

                <tr><th colspan="3" style="background:#fff3e0;">fields → Финальный шаг (контакты)</th></tr>
                <tr><th><code>show_name</code></th><td>bool</td><td>Показывать поле «Имя»</td></tr>
                <tr><th><code>show_phone</code></th><td>bool</td><td>Показывать поле «Телефон»</td></tr>
                <tr><th><code>show_email</code></th><td>bool</td><td>Показывать поле «Email»</td></tr>
                <tr><th><code>submit_text</code></th><td>string</td><td>Текст кнопки отправки</td></tr>
                <tr><th><code>success_message</code></th><td>string</td><td>Сообщение после отправки</td></tr>
                <tr><th><code>email_to</code></th><td>string</td><td>Email получателя заявок (если пусто — берётся из настроек WP)</td></tr>
            </table>

            <h4 style="margin-top:16px;">Типы вопросов</h4>
            <table class="field-table">
                <tr><th><code>radio</code></th><td>Один вариант из списка. Лучше для простых вопросов: «Какой сайт нужен?»</td></tr>
                <tr><th><code>checkbox</code></th><td>Несколько вариантов. Для: «Какие интеграции нужны?»</td></tr>
                <tr><th><code>text</code></th><td>Свободный ввод. Для: «Опишите вашу задачу» (поле options не нужно)</td></tr>
            </table>
        </div>
        <div>
            <div class="prompt-box">
                <h4>📎 Промт для ИИ</h4>
                <pre>Сгенерируй JSON для импорта квиза (мультишаговой формы заявки) в WordPress-тему.
Квиз для услуги: [НАЗВАНИЕ УСЛУГИ]
Цель: собрать контакты потенциального клиента, квалифицировать запрос.
3–5 шагов, вопросы простые и конкретные.

{
  "quizzes": [
    {
      "title": "Заголовок квиза",
      "taxonomies": {
        "service_category": ["Категория услуги"]
      },
      "fields": {
        "quiz_subtitle": "Мотивирующий текст (зачем проходить)",
        "quiz_steps": [
          {
            "question": "Вопрос 1?",
            "type": "radio",
            "options": [
              {"text": "Вариант A"},
              {"text": "Вариант B"},
              {"text": "Вариант C"}
            ]
          },
          {
            "question": "Вопрос 2?",
            "type": "checkbox",
            "options": [
              {"text": "Опция 1"},
              {"text": "Опция 2"}
            ]
          },
          {
            "question": "Опишите задачу",
            "type": "text",
            "options": []
          }
        ],
        "show_name": true,
        "show_phone": true,
        "show_email": false,
        "submit_text": "Получить расчёт",
        "success_message": "Спасибо! Расчёт будет готов в течение часа.",
        "email_to": ""
      }
    }
  ]
}

Типы вопросов: radio (один вариант), checkbox (несколько), text (свободный ввод).
Для type=text — options оставь пустым массивом [].</pre>
            </div>

            <h3>Вставьте JSON и импортируйте</h3>
            <?php webseo_import_form('quizzes', '{"quizzes": [...]}'); ?>
        </div>
    </div>
    <?php
}

/* ════════════════════════════════════════════════
   TAB: TESTIMONIALS
   ════════════════════════════════════════════════ */

function webseo_tab_testimonials(): void {
    ?>
    <h2>Импорт отзывов</h2>
    <p>Отзывы выводятся на главной и на страницах услуг (по привязке к категории). CPT <code>testimonial</code>.</p>

    <div class="webseo-cols">
        <div>
            <h3>Структура JSON</h3>
            <table class="field-table">
                <tr><th><code>title</code></th><td>string</td><td>Заголовок записи (для админки). Обычно = имя клиента</td></tr>
                <tr><th><code>taxonomies.service_category</code></th><td>array</td><td>Привязка к категориям: <code>["SEO-продвижение"]</code></td></tr>
                <tr><th><code>fields.client_name</code></th><td>string</td><td>Имя клиента</td></tr>
                <tr><th><code>fields.client_position</code></th><td>string</td><td>Должность / компания</td></tr>
                <tr><th><code>fields.review_text</code></th><td>string</td><td>Текст отзыва (2–4 предложения)</td></tr>
            </table>
        </div>
        <div>
            <div class="prompt-box">
                <h4>📎 Промт для ИИ</h4>
                <pre>Сгенерируй JSON для импорта отзывов клиентов.
Категория услуг: [КАТЕГОРИЯ]
Нужно: [КОЛИЧЕСТВО] отзывов. Реалистичные, без восторженности.

{
  "testimonials": [
    {
      "title": "Имя Фамилия",
      "taxonomies": {"service_category": ["Категория"]},
      "fields": {
        "client_name": "Имя Фамилия",
        "client_position": "Должность, Компания",
        "review_text": "Текст отзыва 2–4 предложения."
      }
    }
  ]
}</pre>
            </div>

            <h3>Вставьте JSON и импортируйте</h3>
            <?php webseo_import_form('testimonials', '{"testimonials": [...]}'); ?>
        </div>
    </div>
    <?php
}

/* ════════════════════════════════════════════════
   TAB: PAGES
   ════════════════════════════════════════════════ */

function webseo_tab_pages(): void {
    ?>
    <h2>Импорт страниц</h2>
    <p>Создаёт страницы, назначает шаблоны и заполняет ACF-поля. Также может назначить главную страницу и страницу записей.</p>

    <div class="webseo-cols">
        <div>
            <h3>Структура JSON</h3>
            <table class="field-table">
                <tr><th><code>title</code></th><td>string</td><td>Название страницы</td></tr>
                <tr><th><code>template</code></th><td>string</td><td>Шаблон: <code>page-contacts.php</code>, <code>page-about.php</code>, <code>page-thanks.php</code></td></tr>
                <tr><th><code>content</code></th><td>HTML</td><td>Контент (для шорткодов CF7, текста «Спасибо» и т.д.)</td></tr>
                <tr><th><code>is_front_page</code></th><td>bool</td><td>Назначить главной страницей</td></tr>
                <tr><th><code>is_posts_page</code></th><td>bool</td><td>Назначить страницей блога</td></tr>
                <tr><th><code>fields</code></th><td>object</td><td>ACF-поля (зависят от шаблона)</td></tr>
            </table>

            <h4 style="margin-top:16px;">Доступные шаблоны и их ACF-поля</h4>
            <table class="field-table">
                <tr><th>page-contacts.php</th><td><code>contacts_title</code>, <code>contacts_subtitle</code>, <code>work_hours</code></td></tr>
                <tr><th>page-about.php</th><td><code>about_name</code>, <code>about_role</code>, <code>about_bio</code> (HTML), <code>tech_stack</code> (массив {name, icon})</td></tr>
                <tr><th>page-thanks.php</th><td>Контент в поле <code>content</code></td></tr>
                <tr><th>Главная (без шаблона)</th><td><code>hero_*</code>, <code>services_*</code>, <code>benefits</code>, <code>portfolio_*</code>, <code>faq_items</code>, <code>cta_*</code> — см. вкладку «Настройки»</td></tr>
            </table>
        </div>
        <div>
            <div class="prompt-box">
                <h4>📎 Пример JSON</h4>
                <pre>{
  "pages": [
    {
      "title": "Главная",
      "is_front_page": true,
      "fields": {
        "hero_title": "Заголовок H1",
        "hero_subtitle": "Подзаголовок"
      }
    },
    {
      "title": "Контакты",
      "template": "page-contacts.php",
      "fields": {
        "contacts_title": "Контакты",
        "contacts_subtitle": "Описание",
        "work_hours": "Пн–Пт: 10:00–19:00"
      }
    },
    {
      "title": "Обо мне",
      "template": "page-about.php",
      "fields": {
        "about_name": "Имя",
        "about_role": "Должность",
        "about_bio": "<p>Текст о себе</p>"
      }
    },
    {
      "title": "Спасибо",
      "template": "page-thanks.php",
      "content": "Заявка принята. Свяжусь в течение часа."
    },
    {
      "title": "Блог",
      "is_posts_page": true
    }
  ]
}</pre>
            </div>

            <h3>Вставьте JSON и импортируйте</h3>
            <?php webseo_import_form('pages', '{"pages": [...]}'); ?>
        </div>
    </div>
    <?php
}

/* ════════════════════════════════════════════════
   TAB: SETTINGS
   ════════════════════════════════════════════════ */

function webseo_tab_settings(): void {
    ?>
    <h2>Импорт настроек</h2>
    <p>Настройки WordPress, ACF Options (контакты, шапка, подвал, аналитика) и меню.</p>

    <div class="webseo-cols">
        <div>
            <h3>Доступные блоки</h3>

            <h4>settings — Настройки WP</h4>
            <table class="field-table">
                <tr><th><code>blogname</code></th><td>Название сайта</td></tr>
                <tr><th><code>blogdescription</code></th><td>Описание сайта</td></tr>
                <tr><th><code>permalink_structure</code></th><td>Формат ссылок. Ставь: <code>/%postname%/</code></td></tr>
            </table>

            <h4 style="margin-top:16px;">options — ACF Options</h4>
            <table class="field-table">
                <tr><th><code>phone</code></th><td>Телефон</td></tr>
                <tr><th><code>email</code></th><td>Email</td></tr>
                <tr><th><code>telegram</code></th><td>URL Telegram</td></tr>
                <tr><th><code>whatsapp</code></th><td>URL WhatsApp</td></tr>
                <tr><th><code>viber</code></th><td>URL Viber</td></tr>
                <tr><th><code>logo_text</code></th><td>Текст логотипа</td></tr>
                <tr><th><code>header_cta_text</code></th><td>Кнопка в шапке — текст</td></tr>
                <tr><th><code>header_cta_url</code></th><td>Кнопка в шапке — URL</td></tr>
                <tr><th><code>copyright</code></th><td>Копирайт в подвале</td></tr>
                <tr><th><code>blog_cta_title</code></th><td>CTA после статей — заголовок</td></tr>
                <tr><th><code>blog_cta_text</code></th><td>CTA после статей — текст</td></tr>
                <tr><th><code>blog_cta_btn_text</code></th><td>CTA после статей — кнопка</td></tr>
                <tr><th><code>blog_cta_btn_url</code></th><td>CTA после статей — URL</td></tr>
            </table>

            <h4 style="margin-top:16px;">menus — Навигация</h4>
            <table class="field-table">
                <tr><th><code>name</code></th><td>Название меню</td></tr>
                <tr><th><code>location</code></th><td><code>primary</code> или <code>footer</code></td></tr>
                <tr><th><code>items</code></th><td>Массив пунктов:<br><code>title</code> + <code>url</code> — произвольная ссылка<br><code>title</code> + <code>page_title</code> — ссылка на страницу по заголовку</td></tr>
            </table>
        </div>
        <div>
            <div class="prompt-box">
                <h4>📎 Пример полного импорта</h4>
                <pre>{
  "settings": {
    "blogname": "WebDev & SEO",
    "blogdescription": "Разработка сайтов и SEO-продвижение в Москве",
    "permalink_structure": "/%postname%/"
  },
  "options": {
    "phone": "+7 (999) 123-45-67",
    "email": "info@example.com",
    "telegram": "https://t.me/example",
    "whatsapp": "https://wa.me/79991234567",
    "logo_text": "DEV&SEO",
    "header_cta_text": "Обсудить проект",
    "header_cta_url": "https://t.me/example",
    "copyright": "© 2026 Все права защищены."
  },
  "menus": [
    {
      "name": "Основное меню",
      "location": "primary",
      "items": [
        {"title": "Услуги", "url": "/uslugi/"},
        {"title": "Портфолио", "url": "/portfolio/"},
        {"title": "Блог", "page_title": "Блог"},
        {"title": "Обо мне", "page_title": "Обо мне"},
        {"title": "Контакты", "page_title": "Контакты"}
      ]
    },
    {
      "name": "Меню подвала",
      "location": "footer",
      "items": [
        {"title": "Услуги", "url": "/uslugi/"},
        {"title": "Портфолио", "url": "/portfolio/"},
        {"title": "Контакты", "page_title": "Контакты"}
      ]
    }
  ]
}</pre>
            </div>

            <h3>Вставьте JSON и импортируйте</h3>
            <?php webseo_import_form('settings', '{"settings": {...}, "options": {...}, "menus": [...]}'); ?>
        </div>
    </div>
    <?php
}

/* ════════════════════════════════════════════════
   IMPORT ENGINE
   ════════════════════════════════════════════════ */

function webseo_run_import(array $data, string $type = ''): array {
    $log = [];

    if (!empty($data['settings']))     $log = array_merge($log, webseo_import_settings($data['settings']));
    if (!empty($data['options']))      { foreach ($data['options'] as $k => $v) { update_field($k, $v, 'option'); $log[] = "✓ Опция: {$k}"; } }
    if (!empty($data['pages']))        { foreach ($data['pages'] as $p)        $log = array_merge($log, webseo_import_post($p, 'page')); }
    if (!empty($data['services']))     { foreach ($data['services'] as $p)     $log = array_merge($log, webseo_import_post($p, 'service')); }
    if (!empty($data['portfolio']))    { foreach ($data['portfolio'] as $p)    $log = array_merge($log, webseo_import_post($p, 'portfolio')); }
    if (!empty($data['testimonials'])) { foreach ($data['testimonials'] as $p) $log = array_merge($log, webseo_import_post($p, 'testimonial')); }
    if (!empty($data['quizzes']))      { foreach ($data['quizzes'] as $p)      $log = array_merge($log, webseo_import_post($p, 'quiz')); }
    if (!empty($data['menus']))        { foreach ($data['menus'] as $m)        $log = array_merge($log, webseo_import_menu($m)); }

    if (empty($log)) $log[] = '⚠ JSON не содержит данных для импорта';
    return $log;
}

/* ── Import post/page ───────────────────────── */

function webseo_import_post(array $item, string $post_type): array {
    $log = [];

    $existing = get_page_by_title($item['title'], OBJECT, $post_type);
    if ($existing) {
        $post_id = $existing->ID;
        $update = ['ID' => $post_id];
        if (isset($item['content']))    $update['post_content'] = $item['content'];
        if (isset($item['excerpt']))    $update['post_excerpt']  = $item['excerpt'];
        if (isset($item['menu_order'])) $update['menu_order']    = $item['menu_order'];
        wp_update_post($update);
        $log[] = "↻ Обновлён {$post_type}: {$item['title']}";
    } else {
        $post_id = wp_insert_post([
            'post_title'   => $item['title'],
            'post_content' => $item['content'] ?? '',
            'post_excerpt'  => $item['excerpt'] ?? '',
            'post_status'  => 'publish',
            'post_type'    => $post_type,
            'menu_order'   => $item['menu_order'] ?? 0,
        ]);
        $log[] = "✓ Создан {$post_type}: {$item['title']}";
    }

    if (is_wp_error($post_id)) {
        $log[] = "✗ Ошибка: " . $post_id->get_error_message();
        return $log;
    }

    if (!empty($item['template']))      update_post_meta($post_id, '_wp_page_template', $item['template']);
    if (!empty($item['is_front_page'])) { update_option('show_on_front', 'page'); update_option('page_on_front', $post_id); $log[] = "  → Главная страница"; }
    if (!empty($item['is_posts_page'])) { update_option('show_on_front', 'page'); update_option('page_for_posts', $post_id); $log[] = "  → Страница записей"; }

    if (!empty($item['taxonomies'])) {
        foreach ($item['taxonomies'] as $tax => $terms) {
            $ids = [];
            foreach ((array)$terms as $name) {
                $t = term_exists($name, $tax);
                if (!$t) $t = wp_insert_term($name, $tax);
                if (!is_wp_error($t)) $ids[] = (int)($t['term_id'] ?? $t);
            }
            wp_set_post_terms($post_id, $ids, $tax);
        }
    }

    if (!empty($item['fields']) && function_exists('update_field')) {
        foreach ($item['fields'] as $k => $v) update_field($k, $v, $post_id);
        $log[] = "  → ACF: " . count($item['fields']) . " полей";
    }

    if (!empty($item['thumbnail_url'])) {
        $tid = webseo_sideload_image($item['thumbnail_url'], $post_id);
        if ($tid) { set_post_thumbnail($post_id, $tid); $log[] = "  → Миниатюра"; }
    }

    return $log;
}

/* ── Import menu ────────────────────────────── */

function webseo_import_menu(array $d): array {
    $log = [];
    $existing = wp_get_nav_menu_object($d['name']);
    if ($existing) wp_delete_nav_menu($existing->term_id);

    $menu_id = wp_create_nav_menu($d['name']);
    if (is_wp_error($menu_id)) return ["✗ Меню: " . $menu_id->get_error_message()];
    $log[] = "✓ Меню: {$d['name']}";

    foreach (($d['items'] ?? []) as $i => $item) {
        $args = ['menu-item-title' => $item['title'], 'menu-item-position' => $i + 1, 'menu-item-status' => 'publish'];
        if (!empty($item['url'])) {
            $args['menu-item-type'] = 'custom';
            $args['menu-item-url']  = $item['url'];
        } elseif (!empty($item['page_title'])) {
            $page = get_page_by_title($item['page_title'], OBJECT, $item['post_type'] ?? 'page');
            if ($page) { $args['menu-item-type'] = 'post_type'; $args['menu-item-object'] = $page->post_type; $args['menu-item-object-id'] = $page->ID; }
            else { $args['menu-item-type'] = 'custom'; $args['menu-item-url'] = '#'; }
        }
        wp_update_nav_menu_item($menu_id, 0, $args);
    }

    if (!empty($d['location'])) {
        $locs = get_theme_mod('nav_menu_locations', []);
        $locs[$d['location']] = $menu_id;
        set_theme_mod('nav_menu_locations', $locs);
    }

    return $log;
}

/* ── Import settings ────────────────────────── */

function webseo_import_settings(array $s): array {
    $log = [];
    if (isset($s['permalink_structure'])) { global $wp_rewrite; $wp_rewrite->set_permalink_structure($s['permalink_structure']); $wp_rewrite->flush_rules(); $log[] = "✓ Ссылки: {$s['permalink_structure']}"; }
    if (isset($s['blogname']))        { update_option('blogname', $s['blogname']); $log[] = "✓ Название: {$s['blogname']}"; }
    if (isset($s['blogdescription'])) { update_option('blogdescription', $s['blogdescription']); $log[] = "✓ Описание: {$s['blogdescription']}"; }
    return $log;
}

/* ── Sideload image ─────────────────────────── */

function webseo_sideload_image(string $url, int $parent = 0): int {
    require_once ABSPATH . 'wp-admin/includes/media.php';
    require_once ABSPATH . 'wp-admin/includes/file.php';
    require_once ABSPATH . 'wp-admin/includes/image.php';
    $tmp = download_url($url);
    if (is_wp_error($tmp)) return 0;
    $id = media_handle_sideload(['name' => basename(parse_url($url, PHP_URL_PATH)), 'tmp_name' => $tmp], $parent);
    if (is_wp_error($id)) { @unlink($tmp); return 0; }
    return $id;
}
