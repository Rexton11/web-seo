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
        'cities'       => '🏙 Города',
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
    <p>Каждая услуга — CPT <code>service</code> с продающим шаблоном. Поддерживается мультирегиональность: привяжите города через <code>cities</code> — автоматически создадутся страницы <code>/uslugi/slug/city/</code>.</p>

    <div class="webseo-cols">
        <div>
            <h3>Структура JSON</h3>
            <table class="field-table">
                <tr><th colspan="3" style="background:#e8f5e9;">Основные поля</th></tr>
                <tr><th><code>title</code></th><td>string</td><td>Название услуги (H1). Продающий формат: «Разработка интернет-магазинов» (город добавится автоматически на городских страницах)</td></tr>
                <tr><th><code>excerpt</code></th><td>string</td><td>Для карточки на главной (1 предложение, макс. выгода)</td></tr>
                <tr><th><code>menu_order</code></th><td>number</td><td>Порядок сортировки</td></tr>
                <tr><th><code>taxonomies.service_category</code></th><td>array</td><td>Категории: <code>["Разработка сайтов"]</code></td></tr>

                <tr><th colspan="3" style="background:#fce4ec;">Мультирегиональность</th></tr>
                <tr><th><code>cities</code></th><td>array</td><td>Массив городов для создания региональных страниц. Каждый город:<br>
                    <code>name</code> — именительный (Москва)<br>
                    <code>slug</code> — slug для URL (moskva)<br>
                    <code>prepositional</code> — предложный (Москве)<br>
                    <code>genitive</code> — родительный (Москвы)<br>
                    <code>accusative</code> — винительный, если отличается (Москву). Необязательно
                </td></tr>

                <tr><th colspan="3" style="background:#e3f2fd;">fields → Hero (первый экран)</th></tr>
                <tr><th><code>service_icon</code></th><td>string</td><td>CSS-класс Phosphor: <code>ph ph-shopping-cart</code></td></tr>
                <tr><th><code>service_subtitle</code></th><td>string</td><td><strong>Продающий подзаголовок (1–2 предложения, максимум конкретики).</strong><br>Формула: выгода + цифра + срок.<br>Пример: «Создаём магазины на 1С-Битрикс и WooCommerce с конверсией от 3%. Средний рост продаж клиентов — ×2.4 за первый квартал.»</td></tr>
                <tr><th><code>service_cta_text</code></th><td>string</td><td>Текст CTA-кнопки. Формула: действие + результат.<br>Примеры: «Рассчитать стоимость», «Получить КП за 2 часа»</td></tr>

                <tr><th colspan="3" style="background:#e8f5e9;">fields → Hero чипсы и trust</th></tr>
                <tr><th><code>hero_chips</code></th><td>array</td><td><strong>3–4</strong> объекта: <code>{text}</code><br>Каждый чип = одна конкретная выгода с цифрой или фактом.<br>Плохо: «Качественно» / Хорошо: «Конверсия от 3%»<br>Плохо: «Быстро» / Хорошо: «Запуск от 2 недель»</td></tr>
                <tr><th><code>hero_trust</code></th><td>array</td><td><strong>3</strong> объекта: <code>{value, label}</code><br>Только проверяемые цифры. Пример: value=«147» label=«магазинов запущено»</td></tr>

                <tr><th colspan="3" style="background:#fff3e0;">fields → Боли клиента</th></tr>
                <tr><th><code>pains_title</code></th><td>string</td><td>Заголовок. Пример: «Знакомая ситуация?»</td></tr>
                <tr><th><code>pains</code></th><td>array</td><td><strong>4–6</strong> объектов: <code>{title}</code> (icon и text не отображаются).<br>Формулируйте как боль, не как проблему:<br>Плохо: «Нет SEO» / Хорошо: «Вложили 200к в рекламу — 3 заявки»</td></tr>

                <tr><th colspan="3" style="background:#e8f5e9;">fields → Решение</th></tr>
                <tr><th><code>solution_title</code></th><td>string</td><td>Заголовок. Пример: «Что вы получите»</td></tr>
                <tr><th><code>solution_items</code></th><td>array</td><td><strong>4–6</strong> штук: <code>{title, text}</code><br>Каждый пункт = результат + доказательство через цифру</td></tr>

                <tr><th colspan="3" style="background:#e3f2fd;">fields → Преимущества</th></tr>
                <tr><th><code>benefits_title</code></th><td>string</td><td>Заголовок. Пример: «Почему мы»</td></tr>
                <tr><th><code>benefits</code></th><td>array</td><td><strong>5–6</strong> объектов: <code>{icon, title, text}</code><br>Bento-сетка: 1-й элемент крупный, 6-й на всю ширину</td></tr>

                <tr><th colspan="3" style="background:#fff3e0;">fields → Этапы</th></tr>
                <tr><th><code>steps</code></th><td>array</td><td><strong>4–6</strong> шагов: <code>{title, text}</code>. Номера автоматически</td></tr>

                <tr><th colspan="3" style="background:#e8f5e9;">fields → Тарифы</th></tr>
                <tr><th><code>pricing</code></th><td>array</td><td>2–3 тарифа: <code>{name, price, features, popular, btn_text}</code><br><code>features</code> — каждый пункт с новой строки <code>\n</code><br>Один тариф с <code>popular: true</code></td></tr>

                <tr><th colspan="3" style="background:#e3f2fd;">fields → FAQ</th></tr>
                <tr><th><code>faq_items</code></th><td>array</td><td><strong>6–8</strong> вопросов: <code>{question, answer}</code>. Ответы 2–3 предложения, можно HTML</td></tr>

                <tr><th colspan="3" style="background:#fff3e0;">fields → CTA</th></tr>
                <tr><th><code>cta_title</code></th><td>string</td><td>Финальный призыв. Подстановка <code>{city}</code> работает</td></tr>
                <tr><th><code>cta_desc</code></th><td>string</td><td>1 предложение</td></tr>
                <tr><th><code>cta_btn_text</code></th><td>string</td><td>Текст кнопки</td></tr>

                <tr><th colspan="3" style="background:#fce4ec;">fields → Гео-контент (для городов)</th></tr>
                <tr><th><code>geo_subtitle</code></th><td>string</td><td>Переопределяет подзаголовок на городской странице.<br>Используйте <code>{city}</code> (предложный), <code>{city_nom}</code> (именительный), <code>{city_rod}</code> (родительный).<br>Пример: «Разрабатываем интернет-магазины в {city} от 40 000 ₽. Запуск от 2 недель.»</td></tr>
                <tr><th><code>geo_description</code></th><td>HTML</td><td>Уникальный текстовый блок для городской страницы. SEO-контент с подстановками <code>{city}</code>. 2–3 абзаца</td></tr>
            </table>
        </div>
        <div>
            <?php
            // Fetch existing cities
            $prompt_cities = get_terms(['taxonomy' => 'city', 'hide_empty' => false, 'orderby' => 'name']);
            $cities_names = [];
            $cities_json_arr = [];
            if ($prompt_cities && !is_wp_error($prompt_cities)) {
                foreach ($prompt_cities as $ct) {
                    $cities_names[] = $ct->name;
                    $cd = ['name' => $ct->name, 'slug' => $ct->slug];
                    if (function_exists('get_field')) {
                        $p = get_field('city_prepositional', "city_{$ct->term_id}");
                        $g = get_field('city_genitive', "city_{$ct->term_id}");
                        $a = get_field('city_accusative', "city_{$ct->term_id}");
                        if ($p) $cd['prepositional'] = $p;
                        if ($g) $cd['genitive'] = $g;
                        if ($a) $cd['accusative'] = $a;
                    }
                    $cities_json_arr[] = $cd;
                }
            }
            $cities_list_text = $cities_names ? implode(', ', $cities_names) : '[города не созданы]';
            $cities_json_block = $cities_json_arr
                ? json_encode($cities_json_arr, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)
                : "[\n        {\n          \"name\": \"Москва\",\n          \"slug\": \"moskva\",\n          \"prepositional\": \"Москве\",\n          \"genitive\": \"Москвы\",\n          \"accusative\": \"Москву\"\n        }\n      ]";
            $has_cities = !empty($cities_json_arr);

            // Fetch existing service categories
            $srv_cats = get_terms(['taxonomy' => 'service_category', 'hide_empty' => false, 'orderby' => 'name']);
            $cat_options = [];
            if ($srv_cats && !is_wp_error($srv_cats)) {
                foreach ($srv_cats as $sc) $cat_options[] = $sc->name;
            }
            $first_cat = $cat_options ? $cat_options[0] : 'Разработка сайтов';
            ?>

            <div style="margin-bottom:16px;padding:12px 16px;background:#f0f6ff;border:1px solid #c5d9f0;border-radius:6px;">
                <label style="font-weight:600;font-size:13px;display:block;margin-bottom:6px;">Категория услуги для промта:</label>
                <?php if ($cat_options) : ?>
                    <select id="ws-prompt-cat" style="width:100%;padding:6px 10px;font-size:14px;">
                        <?php foreach ($cat_options as $co) : ?>
                            <option value="<?php echo esc_attr($co); ?>"><?php echo esc_html($co); ?></option>
                        <?php endforeach; ?>
                    </select>
                <?php else : ?>
                    <input type="text" id="ws-prompt-cat" value="Разработка сайтов" style="width:100%;padding:6px 10px;font-size:14px;" placeholder="Название категории">
                <?php endif; ?>
            </div>

            <div class="prompt-box">
                <h4>📎 Промт для ИИ <button type="button" onclick="var t=document.getElementById('ws-prompt-text');navigator.clipboard.writeText(t.textContent);this.textContent='Скопировано!';setTimeout(()=>this.textContent='Копировать',1500);" style="float:right;font-size:12px;padding:4px 12px;cursor:pointer;border:1px solid #ccc;border-radius:4px;background:#fff;">Копировать</button></h4>
                <pre id="ws-prompt-text" style="max-height:500px;">Сгенерируй JSON для импорта продающей страницы услуги в WordPress.

Услуга: [НАЗВАНИЕ УСЛУГИ]
Компания: [НАЗВАНИЕ] — веб-студия / SEO-агентство
Категория услуги: <span id="ws-cat-in-prompt"><?php echo esc_html($first_cat); ?></span>
<?php if ($has_cities) : ?>Города для мультирегиональности: <?php echo esc_html($cities_list_text); ?>
<?php else : ?>Города для мультирегиональности: [города не созданы — удали блок cities и geo-поля из JSON]
<?php endif; ?>

ПРАВИЛА ДЛЯ ПЕРВОГО ЭКРАНА (это самое важное):
1. title — чистое название услуги БЕЗ города (город
   подставляется автоматически на гео-страницах).
   Примеры: «Разработка интернет-магазинов»,
   «SEO-продвижение сайтов»
2. service_subtitle — ПРОДАЮЩИЙ подзаголовок, 1–2
   предложения. Формула: [конкретная выгода] + [цифра/срок]
   + [доказательство].
   Пример: «Магазины на 1С-Битрикс и WooCommerce с
   конверсией от 3%. Средний чек клиентов растёт в 2.4 раза
   за первый квартал.»
   ПЛОХО: «Мы создаём качественные интернет-магазины
   с индивидуальным подходом к каждому клиенту и
   современными технологиями...» — ЭТО ВОДА.
3. hero_chips — 3–4 коротких факта с цифрами.
   Хорошо: «Запуск от 14 дней», «Конверсия от 3%»,
   «Гарантия 12 мес.»
   Плохо: «Качественно», «Профессионально», «Быстро»
4. hero_trust — 3 цифры доверия, реалистичные.
<?php if ($has_cities) : ?>5. geo_subtitle — подзаголовок для городских страниц.
   Формула: [что делаем] + в {city} + [цена/срок].
   Пример: «Создаём интернет-магазины в {city}
   от 40 000 ₽ и 2 недель. Интеграция с 1С, CRM, доставкой.»
<?php endif; ?>

ОБЩИЕ ПРАВИЛА:
- Тон: уверенный, экспертный, лаконичный. Ноль воды.
- Каждое предложение должно содержать факт, цифру
  или конкретную выгоду. Если убрать предложение и
  смысл не теряется — оно лишнее.
- Боли (pains): 4–6 штук. Отображаются как теги-пилюли,
  видно только title. Пиши как боль клиента, коротко:
  «Вложили 200к в рекламу — 3 заявки»,
  «Сайт на 6-м месяце — до сих пор не готов»
- Решение (solution_items): 4–6 штук. Каждый = результат
  + цифра. «Рост трафика ×3 за 6 месяцев»
- Преимущества (benefits): 5–6 штук. Факты, не слоганы.
- Тарифы (pricing): 2–3 штуки. Один с popular: true.
  Цены реалистичные для РФ/СНГ.
- FAQ: 6–8 вопросов, которые реально задают. Ответы —
  2–3 предложения с конкретикой.

JSON-формат (СТРОГО соблюдай структуру):

{
  "services": [
    {
      "title": "Название услуги",
      "excerpt": "Краткое описание для карточки",
      "menu_order": 1,
      "taxonomies": {
        "service_category": ["<span id="ws-cat-in-json"><?php echo esc_html($first_cat); ?></span>"]
      },
<?php if ($has_cities) : ?>      "cities": <?php echo esc_html($cities_json_block); ?>,
<?php endif; ?>      "fields": {
        "service_icon": "ph ph-...",
        "service_subtitle": "...",
        "service_cta_text": "...",
        "hero_chips": [{"text": "..."}, ...],
        "hero_trust": [{"value": "...", "label": "..."}, ...],
<?php if ($has_cities) : ?>        "geo_subtitle": "... в {city} ...",
        "geo_description": "<p>... {city} ...</p>",
<?php endif; ?>        "pains_title": "...",
        "pains": [{"icon": "", "title": "...", "text": ""}, ...],
        "solution_title": "...",
        "solution_items": [{"icon": "", "title": "...", "text": "..."}, ...],
        "benefits_title": "...",
        "benefits": [{"icon": "ph ph-...", "title": "...", "text": "..."}, ...],
        "steps_title": "...",
        "steps": [{"title": "...", "text": "..."}, ...],
        "pricing_title": "...",
        "pricing": [{"name": "...", "price": "...", "features": "...\n...", "popular": false, "btn_text": "..."}, ...],
        "faq_items": [{"question": "...", "answer": "..."}, ...],
        "cta_title": "...",
        "cta_desc": "...",
        "cta_btn_text": "..."
      }
    }
  ]
}

Иконки Phosphor: https://phosphoricons.com
Используй: ph ph-shopping-cart, ph ph-magnifying-glass,
ph ph-code, ph ph-chart-line-up, ph ph-clock, ph ph-rocket,
ph ph-shield-check, ph ph-handshake, ph ph-user-focus,
ph ph-target, ph ph-trophy, ph ph-gear, ph ph-database,
ph ph-chat-text, ph ph-currency-dollar, ph ph-lightning,
ph ph-headset, ph ph-browser, ph ph-globe, ph ph-paint-brush</pre>
            </div>

            <script>
            (function(){
                var sel = document.getElementById('ws-prompt-cat');
                if (!sel) return;
                sel.addEventListener('change', function(){
                    var v = this.value || this.textContent;
                    document.getElementById('ws-cat-in-prompt').textContent = v;
                    document.getElementById('ws-cat-in-json').textContent = v;
                });
                sel.addEventListener('input', function(){
                    var v = this.value;
                    document.getElementById('ws-cat-in-prompt').textContent = v;
                    document.getElementById('ws-cat-in-json').textContent = v;
                });
            })();
            </script>

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
   TAB: CITIES
   ════════════════════════════════════════════════ */

function webseo_tab_cities(): void {
    ?>
    <h2>Импорт городов</h2>
    <p>Города — таксономия <code>city</code>, привязывается к услугам для мультирегиональных страниц (<code>/uslugi/slug/city-slug/</code>). Каждый город хранит склонения для корректной подстановки в тексты.</p>

    <div class="webseo-cols">
        <div>
            <h3>Структура JSON</h3>
            <table class="field-table">
                <tr><th colspan="3" style="background:#e8f5e9;">Поля города</th></tr>
                <tr><th><code>name</code></th><td>string</td><td><strong>Обязательно.</strong> Название в именительном падеже: «Москва», «Санкт-Петербург»</td></tr>
                <tr><th><code>slug</code></th><td>string</td><td>Slug для URL. Если не указан — генерируется из name. Примеры: <code>moskva</code>, <code>spb</code>, <code>novosibirsk</code></td></tr>
                <tr><th><code>prepositional</code></th><td>string</td><td><strong>Обязательно.</strong> Предложный падеж (в ком? в чём?): «Москве», «Санкт-Петербурге», «Новосибирске».<br>Используется в <code>{city}</code> — «SEO-продвижение в <u>Москве</u>»</td></tr>
                <tr><th><code>genitive</code></th><td>string</td><td><strong>Обязательно.</strong> Родительный падеж (кого? чего?): «Москвы», «Санкт-Петербурга», «Новосибирска».<br>Используется в <code>{city_rod}</code> — «Клиенты из <u>Москвы</u>»</td></tr>
                <tr><th><code>accusative</code></th><td>string</td><td>Винительный падеж (кого? что?): «Москву», «Санкт-Петербург», «Новосибирск».<br>Используется в <code>{city_vin}</code>. Необязательно — если совпадает с именительным</td></tr>
            </table>

            <div style="margin-top:16px;padding:12px 16px;background:#fff3e0;border-radius:6px;font-size:13px;">
                <strong>Важно:</strong> После импорта городов привяжите их к услугам — либо через импорт услуг (поле <code>cities</code>), либо вручную в редакторе услуги (таксономия «Город» в сайдбаре).
            </div>

            <h4 style="margin-top:16px;">Переменные подстановки</h4>
            <table class="field-table">
                <tr><th><code>{city}</code></th><td>Предложный — «в {city}» → «в Москве»</td></tr>
                <tr><th><code>{city_nom}</code></th><td>Именительный — «{city_nom} — мой город» → «Москва — мой город»</td></tr>
                <tr><th><code>{city_rod}</code></th><td>Родительный — «жители {city_rod}» → «жители Москвы»</td></tr>
                <tr><th><code>{city_vin}</code></th><td>Винительный — «выбирайте {city_vin}» → «выбирайте Москву»</td></tr>
            </table>
        </div>
        <div>
            <?php
            $existing_cities = get_terms(['taxonomy' => 'city', 'hide_empty' => false, 'orderby' => 'name']);
            if ($existing_cities && !is_wp_error($existing_cities) && count($existing_cities) > 0) :
                $cities_json = [];
                foreach ($existing_cities as $ct) {
                    $city_data = ['name' => $ct->name, 'slug' => $ct->slug];
                    if (function_exists('get_field')) {
                        $prep = get_field('city_prepositional', "city_{$ct->term_id}");
                        $gen  = get_field('city_genitive', "city_{$ct->term_id}");
                        $acc  = get_field('city_accusative', "city_{$ct->term_id}");
                        if ($prep) $city_data['prepositional'] = $prep;
                        if ($gen)  $city_data['genitive'] = $gen;
                        if ($acc)  $city_data['accusative'] = $acc;
                    }
                    $cities_json[] = $city_data;
                }
            ?>
            <div class="prompt-box">
                <h4>🏙 Существующие города (<?php echo count($existing_cities); ?>)</h4>
                <p style="font-size:13px;color:#666;margin:0 0 8px;">Готовый JSON всех городов. Скопируйте, отредактируйте и импортируйте повторно для обновления склонений.</p>
                <pre style="max-height:400px;"><?php echo esc_html(json_encode(['cities' => $cities_json], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)); ?></pre>
            </div>
            <?php else : ?>
            <div class="prompt-box">
                <h4>🏙 Городов пока нет</h4>
                <p style="font-size:13px;color:#666;">Импортируйте первую партию через форму ниже.</p>
            </div>
            <?php endif; ?>

            <div class="prompt-box">
                <h4>📎 Промт для ИИ</h4>
                <pre>Сгенерируй JSON-массив городов для импорта
в WordPress-тему. Нужны города: [ПЕРЕЧИСЛИ ГОРОДА]

Для каждого города укажи:
- name — именительный падеж (Москва)
- slug — транслит для URL (moskva, spb,
  nizhniy-novgorod)
- prepositional — предложный (Москве)
- genitive — родительный (Москвы)
- accusative — винительный, ТОЛЬКО если
  отличается от именительного (Москву)

Формат: {"cities": [...]}</pre>
            </div>

            <h3>Вставьте JSON и импортируйте</h3>
            <?php webseo_import_form('cities', '{"cities": [...]}'); ?>
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
    if (!empty($data['cities']))       $log = array_merge($log, webseo_import_cities($data['cities']));
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

    // Cities (multi-regional)
    if (!empty($item['cities']) && $post_type === 'service' && function_exists('update_field')) {
        $city_ids = [];
        foreach ($item['cities'] as $city) {
            $slug = sanitize_title($city['slug'] ?? $city['name']);
            $t = term_exists($slug, 'city');
            if (!$t) {
                $t = wp_insert_term($city['name'], 'city', ['slug' => $slug]);
            }
            if (!is_wp_error($t)) {
                $term_id = (int)($t['term_id'] ?? $t);
                $city_ids[] = $term_id;

                if (!empty($city['prepositional'])) update_field('city_prepositional', $city['prepositional'], "city_{$term_id}");
                if (!empty($city['genitive']))      update_field('city_genitive', $city['genitive'], "city_{$term_id}");
                if (!empty($city['accusative']))     update_field('city_accusative', $city['accusative'], "city_{$term_id}");

                $log[] = "  → Город: {$city['name']} ({$slug})";
            }
        }
        if ($city_ids) {
            wp_set_post_terms($post_id, $city_ids, 'city');
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

/* ── Import cities ─────────────────────────── */

function webseo_import_cities(array $cities): array {
    $log = [];
    if (!function_exists('update_field')) {
        $log[] = '✗ ACF Pro не активен — склонения не будут сохранены';
    }

    foreach ($cities as $city) {
        if (empty($city['name'])) continue;

        $slug = sanitize_title($city['slug'] ?? $city['name']);
        $t = term_exists($slug, 'city');

        if ($t) {
            $term_id = (int)($t['term_id'] ?? $t);
            wp_update_term($term_id, 'city', ['name' => $city['name']]);
            $log[] = "↻ Обновлён город: {$city['name']} ({$slug})";
        } else {
            $t = wp_insert_term($city['name'], 'city', ['slug' => $slug]);
            if (is_wp_error($t)) {
                $log[] = "✗ Ошибка: {$city['name']} — " . $t->get_error_message();
                continue;
            }
            $term_id = (int)$t['term_id'];
            $log[] = "✓ Создан город: {$city['name']} ({$slug})";
        }

        if (function_exists('update_field')) {
            if (!empty($city['prepositional'])) update_field('city_prepositional', $city['prepositional'], "city_{$term_id}");
            if (!empty($city['genitive']))      update_field('city_genitive', $city['genitive'], "city_{$term_id}");
            if (!empty($city['accusative']))     update_field('city_accusative', $city['accusative'], "city_{$term_id}");
        }
    }

    $log[] = "— Итого: " . count($cities) . " городов обработано";
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
