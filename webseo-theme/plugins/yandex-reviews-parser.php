<?php
/**
 * Plugin Name: Yandex & Kwork Reviews Parser
 * Description: Парсер отзывов Яндекс Карты и Kwork (через вставку HTML). Локальное хранение аватарок, поиск, bulk-действия, настройки.
 * Version: 3.0
 */

if (!defined('ABSPATH')) exit;

/* =========================================================
 *  КОНСТАНТЫ И УТИЛИТЫ
 * ========================================================= */

define('YRP_AVATAR_DIR', 'yrp-avatars'); // имя поддиректории внутри uploads
define('YRP_DEFAULT_TEXT_LIMIT', 200);   // лимит символов перед "Читать полностью"
define('YRP_DEFAULT_MAX_LENGTH', 1500);  // обрезка слишком длинных отзывов при сохранении
define('YRP_SHORT_REVIEW_LEN', 30);      // что считать "коротким" для bulk-скрытия

/**
 * Скачивает аватарку и сохраняет локально в uploads/yrp-avatars/.
 * Возвращает URL локальной копии или пустую строку.
 */
function yrp_save_avatar_locally($remote_url) {
    if (empty($remote_url)) return '';

    // Если URL уже локальный — возвращаем как есть
    $upload = wp_upload_dir();
    if (strpos($remote_url, $upload['baseurl']) === 0) {
        return $remote_url;
    }

    $target_dir = trailingslashit($upload['basedir']) . YRP_AVATAR_DIR;
    if (!file_exists($target_dir)) {
        wp_mkdir_p($target_dir);
    }

    // Генерируем имя файла: md5 от URL + расширение
    $ext = 'jpg';
    $path = parse_url($remote_url, PHP_URL_PATH);
    if ($path && preg_match('/\.(jpg|jpeg|png|gif|webp)$/i', $path, $m)) {
        $ext = strtolower($m[1]);
    }
    $filename  = md5($remote_url) . '.' . $ext;
    $filepath  = trailingslashit($target_dir) . $filename;
    $local_url = trailingslashit($upload['baseurl']) . YRP_AVATAR_DIR . '/' . $filename;

    // Если уже скачано — отдаём существующее
    if (file_exists($filepath)) {
        return $local_url;
    }

    // Скачиваем через WP
    $response = wp_remote_get($remote_url, [
        'timeout'   => 10,
        'sslverify' => false,
        'headers'   => ['User-Agent' => 'Mozilla/5.0'],
    ]);

    if (is_wp_error($response)) return '';
    if (wp_remote_retrieve_response_code($response) !== 200) return '';

    $body = wp_remote_retrieve_body($response);
    if (empty($body) || strlen($body) < 100) return '';

    file_put_contents($filepath, $body);
    return file_exists($filepath) ? $local_url : '';
}

/**
 * Перекачивает аватарки для всех уже сохранённых отзывов.
 */
function yrp_redownload_all_avatars() {
    $reviews = get_option('yrp_saved_reviews', []);
    if (empty($reviews)) return 0;

    $upload     = wp_upload_dir();
    $local_base = trailingslashit($upload['baseurl']) . YRP_AVATAR_DIR;
    $count      = 0;

    foreach ($reviews as $id => $rev) {
        if (empty($rev['avatar'])) continue;
        // Пропускаем уже локальные
        if (strpos($rev['avatar'], $upload['baseurl']) === 0) continue;

        $new_url = yrp_save_avatar_locally($rev['avatar']);
        if (!empty($new_url)) {
            $reviews[$id]['avatar'] = $new_url;
            $count++;
        }
    }

    update_option('yrp_saved_reviews', $reviews);
    return $count;
}

/* =========================================================
 *  АДМИНКА
 * ========================================================= */

add_action('admin_menu', 'yrp_add_admin_page');
function yrp_add_admin_page() {
    add_submenu_page(
        'tools.php',
        'Парсер Отзывов (Яндекс & Kwork)',
        'Парсер Отзывов',
        'manage_options',
        'yandex-kwork-reviews-parser',
        'yrp_admin_page_html'
    );
}

function yrp_admin_page_html() {
    if (!current_user_can('manage_options')) return;

    $message = '';

    /* ---- Сохранение настроек ---- */
    if (isset($_POST['yrp_save_settings'])) {
        check_admin_referer('yrp_action_nonce');
        $text_limit = (int)($_POST['text_limit'] ?? YRP_DEFAULT_TEXT_LIMIT);
        $max_length = (int)($_POST['max_length'] ?? YRP_DEFAULT_MAX_LENGTH);
        $shuffle    = isset($_POST['shuffle_sources']) ? 1 : 0;

        if ($text_limit < 50)  $text_limit = 50;
        if ($max_length < 100) $max_length = 100;

        update_option('yrp_text_limit', $text_limit);
        update_option('yrp_max_length', $max_length);
        update_option('yrp_shuffle_sources', $shuffle);
        $message = '<div class="notice notice-success is-dismissible"><p>Настройки сохранены.</p></div>';
    }

    /* ---- Скрытие/показ одного отзыва ---- */
    if (isset($_POST['yrp_toggle_visibility']) && isset($_POST['review_id'])) {
        check_admin_referer('yrp_action_nonce');
        $review_id = sanitize_text_field($_POST['review_id']);
        $saved = get_option('yrp_saved_reviews', []);
        if (isset($saved[$review_id])) {
            $saved[$review_id]['hidden'] = !$saved[$review_id]['hidden'];
            update_option('yrp_saved_reviews', $saved);
            $status = $saved[$review_id]['hidden'] ? 'скрыт' : 'показан';
            $message = "<div class='notice notice-success is-dismissible'><p>Статус отзыва изменен ($status).</p></div>";
        }
    }

    /* ---- Bulk-действия ---- */
    if (isset($_POST['yrp_bulk_action'])) {
        check_admin_referer('yrp_action_nonce');
        $action = sanitize_text_field($_POST['yrp_bulk_action']);
        $saved = get_option('yrp_saved_reviews', []);
        $changed = 0;

        switch ($action) {
            case 'show_all':
                foreach ($saved as &$r) { if (!empty($r['hidden'])) { $r['hidden'] = false; $changed++; } }
                unset($r);
                $message = "<div class='notice notice-success is-dismissible'><p>Показано отзывов: $changed</p></div>";
                break;

            case 'hide_all':
                foreach ($saved as &$r) { if (empty($r['hidden'])) { $r['hidden'] = true; $changed++; } }
                unset($r);
                $message = "<div class='notice notice-success is-dismissible'><p>Скрыто отзывов: $changed</p></div>";
                break;

            case 'hide_short':
                foreach ($saved as &$r) {
                    if (empty($r['hidden']) && mb_strlen($r['text'], 'UTF-8') < YRP_SHORT_REVIEW_LEN) {
                        $r['hidden'] = true;
                        $changed++;
                    }
                }
                unset($r);
                $message = "<div class='notice notice-success is-dismissible'><p>Скрыто коротких отзывов (&lt; ".YRP_SHORT_REVIEW_LEN." симв.): $changed</p></div>";
                break;

            case 'redownload_avatars':
                $count = yrp_redownload_all_avatars();
                $message = "<div class='notice notice-success is-dismissible'><p>Перекачано аватарок: $count</p></div>";
                $saved = get_option('yrp_saved_reviews', []); // перечитываем
                break;
        }

        if (in_array($action, ['show_all','hide_all','hide_short'])) {
            update_option('yrp_saved_reviews', $saved);
        }
    }

    /* ---- Парсинг ---- */
    if (isset($_POST['yrp_parse_action'])) {
        check_admin_referer('yrp_action_nonce');
        $source     = sanitize_text_field($_POST['yrp_source']);
        $url        = isset($_POST['profile_url']) ? sanitize_url($_POST['profile_url']) : '';
        $kwork_html = isset($_POST['kwork_html']) ? wp_unslash($_POST['kwork_html']) : '';
        
        if (!empty($url) || !empty($kwork_html)) {
            if (!empty($url)) update_option('yrp_' . $source . '_url', $url);
            
            $result = ($source === 'yandex') ? yrp_do_parse_yandex($url) : yrp_do_parse_kwork($kwork_html);
            
            if (is_array($result) && count($result) > 0) {
                $saved = get_option('yrp_saved_reviews', []);

                // Удаляем старые отзывы этого источника, которых больше нет в новой выборке
                foreach ($saved as $id => $rev) {
                    $rev_source = isset($rev['source']) ? $rev['source'] : 'yandex';
                    if ($rev_source === $source && !isset($result[$id])) {
                        unset($saved[$id]); 
                    }
                }

                // Добавляем/обновляем отзывы (сохраняя флаг hidden)
                foreach ($result as $id => $new_rev) {
                    if (isset($saved[$id])) {
                        $new_rev['hidden'] = $saved[$id]['hidden'];
                        // Не перекачиваем аватарку, если уже была сохранена локально
                        if (!empty($saved[$id]['avatar']) && empty($new_rev['avatar'])) {
                            $new_rev['avatar'] = $saved[$id]['avatar'];
                        }
                    }
                    $saved[$id] = $new_rev;
                }

                update_option('yrp_saved_reviews', $saved);
                update_option('yrp_last_parse_time', current_time('mysql'));
                $message = '<div class="notice notice-success is-dismissible"><p>Успешно обновлено ' . count($result) . ' отзывов из ' . ucfirst($source) . '!</p></div>';
            } else {
                $error_msg = is_string($result) ? $result : 'Отзывы не найдены.';
                $message = '<div class="notice notice-error is-dismissible"><p>Ошибка: ' . esc_html($error_msg) . '</p></div>';
            }
        }
    }

    /* ---- Получение данных для отрисовки ---- */
    $yandex_url      = get_option('yrp_yandex_url', '');
    $saved_reviews   = get_option('yrp_saved_reviews', []);
    $last_parse_time = get_option('yrp_last_parse_time', 'Никогда');
    $text_limit      = (int)get_option('yrp_text_limit', YRP_DEFAULT_TEXT_LIMIT);
    $max_length      = (int)get_option('yrp_max_length', YRP_DEFAULT_MAX_LENGTH);
    $shuffle_sources = (int)get_option('yrp_shuffle_sources', 0);

    // Поиск
    $search = isset($_GET['yrp_search']) ? sanitize_text_field($_GET['yrp_search']) : '';
    if ($search !== '') {
        $needle = mb_strtolower($search, 'UTF-8');
        $saved_reviews = array_filter($saved_reviews, function($r) use ($needle){
            $hay = mb_strtolower(($r['author'] ?? '') . ' ' . ($r['text'] ?? ''), 'UTF-8');
            return mb_strpos($hay, $needle) !== false;
        });
    }

    // Сортировка по дате (свежие сверху), отзывы без даты — в конец
    uasort($saved_reviews, function($a, $b){
        return strcmp(($b['date'] ?? ''), ($a['date'] ?? ''));
    });

    // Разделение по источникам
    $yandex_reviews = [];
    $kwork_reviews  = [];
    foreach ($saved_reviews as $id => $rev) {
        if (isset($rev['source']) && $rev['source'] === 'kwork') $kwork_reviews[$id] = $rev;
        else $yandex_reviews[$id] = $rev;
    }

    echo $message;
    ?>
    <div class="wrap">
        <h1>Парсер отзывов (Яндекс & Kwork)</h1>

        <!-- НАСТРОЙКИ -->
        <div style="background:#fff; padding:20px; border:1px solid #ccd0d4; margin-top: 20px; border-radius: 4px;">
            <h3 style="margin-top:0;">⚙️ Настройки вывода</h3>
            <form method="POST" action="" style="display:flex; flex-wrap:wrap; gap:25px; align-items:flex-end;">
                <?php wp_nonce_field('yrp_action_nonce'); ?>
                <input type="hidden" name="yrp_save_settings" value="1">
                <div>
                    <label style="display:block; font-weight:600; margin-bottom:5px;">Лимит символов перед "Читать полностью":</label>
                    <input type="number" name="text_limit" value="<?php echo esc_attr($text_limit); ?>" min="50" max="2000" class="small-text">
                </div>
                <div>
                    <label style="display:block; font-weight:600; margin-bottom:5px;">Макс. длина отзыва (обрезка при сохранении):</label>
                    <input type="number" name="max_length" value="<?php echo esc_attr($max_length); ?>" min="100" max="5000" class="small-text">
                </div>
                <div>
                    <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
                        <input type="checkbox" name="shuffle_sources" value="1" <?php checked($shuffle_sources, 1); ?>>
                        <span>Перемешивать Яндекс и Kwork в слайдере</span>
                    </label>
                </div>
                <div>
                    <?php submit_button('Сохранить настройки', 'secondary', 'submit', false); ?>
                </div>
            </form>
        </div>
        
        <!-- ФОРМЫ ПАРСИНГА -->
        <div style="display: flex; gap: 20px; margin-top: 20px; flex-wrap: wrap;">
            <div style="background:#fff; padding:20px; border:1px solid #ccd0d4; box-shadow:0 1px 1px rgba(0,0,0,.04); flex:1; min-width: 400px;">
                <h3>🔴 Парсинг Яндекс Карты</h3>
                <form method="POST" action="">
                    <?php wp_nonce_field('yrp_action_nonce'); ?>
                    <input type="hidden" name="yrp_parse_action" value="1">
                    <input type="hidden" name="yrp_source" value="yandex">
                    <p>
                        <label>Ссылка на профиль организации:</label>
                        <input type="url" name="profile_url" class="regular-text" style="width:100%; margin-top:5px;" placeholder="https://yandex.ru/maps/org/..." value="<?php echo esc_attr($yandex_url); ?>" required>
                    </p>
                    <?php submit_button('Спарсить Яндекс', 'primary', 'submit', false); ?>
                </form>
            </div>

            <div style="background:#fff; padding:20px; border:1px solid #ccd0d4; box-shadow:0 1px 1px rgba(0,0,0,.04); flex:1; min-width: 400px;">
                <h3>🟢 Парсинг Kwork (через HTML код)</h3>
                <form method="POST" action="">
                    <?php wp_nonce_field('yrp_action_nonce'); ?>
                    <input type="hidden" name="yrp_parse_action" value="1">
                    <input type="hidden" name="yrp_source" value="kwork">
                    <p>
                        <label><strong>Вставьте исходный код страницы:</strong><br>
                        <span style="color:#666; font-size:12px; font-weight: normal;">Нажмите <b>Ctrl+U</b> на вашей странице Kwork, скопируйте всё и вставьте сюда. Лимита по количеству нет.</span></label>
                        <textarea name="kwork_html" style="width:100%; height:200px; margin-top:5px; font-family: monospace; font-size: 11px;" placeholder="Вставьте скопированный HTML код сюда..." required></textarea>
                    </p>
                    <?php submit_button('Спарсить Kwork', 'primary', 'submit', false); ?>
                </form>
            </div>
        </div>

        <!-- BULK ACTIONS -->
        <div style="background:#fff; padding:15px 20px; border:1px solid #ccd0d4; margin-top:20px; border-radius:4px; display:flex; flex-wrap:wrap; gap:10px; align-items:center;">
            <strong>Массовые действия:</strong>
            <form method="POST" action="" style="display:inline;">
                <?php wp_nonce_field('yrp_action_nonce'); ?>
                <input type="hidden" name="yrp_bulk_action" value="show_all">
                <button type="submit" class="button">👁 Показать все</button>
            </form>
            <form method="POST" action="" style="display:inline;">
                <?php wp_nonce_field('yrp_action_nonce'); ?>
                <input type="hidden" name="yrp_bulk_action" value="hide_all">
                <button type="submit" class="button" onclick="return confirm('Скрыть ВСЕ отзывы?');">🚫 Скрыть все</button>
            </form>
            <form method="POST" action="" style="display:inline;">
                <?php wp_nonce_field('yrp_action_nonce'); ?>
                <input type="hidden" name="yrp_bulk_action" value="hide_short">
                <button type="submit" class="button" title="Скрыть односложные отзывы вроде &laquo;+&raquo;, &laquo;супер&raquo;">✂️ Скрыть короткие (&lt; <?php echo YRP_SHORT_REVIEW_LEN; ?> симв.)</button>
            </form>
            <form method="POST" action="" style="display:inline;">
                <?php wp_nonce_field('yrp_action_nonce'); ?>
                <input type="hidden" name="yrp_bulk_action" value="redownload_avatars">
                <button type="submit" class="button" onclick="return confirm('Перекачать все аватарки заново? Это может занять время.');">🖼 Перекачать аватарки</button>
            </form>
        </div>

        <hr style="margin: 30px 0;">

        <!-- СПИСОК ОТЗЫВОВ -->
        <h2>Сохраненные отзывы</h2>
        <p>
            Последнее обновление: <strong><?php echo esc_html($last_parse_time); ?></strong>
            &nbsp;|&nbsp; Всего: <strong><?php echo count(get_option('yrp_saved_reviews', [])); ?></strong>
            <?php if ($search): ?>&nbsp;|&nbsp; найдено по запросу "<em><?php echo esc_html($search); ?></em>": <strong><?php echo count($saved_reviews); ?></strong><?php endif; ?>
        </p>

        <!-- ПОИСК -->
        <form method="GET" action="" style="margin-bottom: 20px;">
            <input type="hidden" name="page" value="yandex-kwork-reviews-parser">
            <input type="search" name="yrp_search" value="<?php echo esc_attr($search); ?>" placeholder="Поиск по автору или тексту..." class="regular-text" style="width: 300px;">
            <button type="submit" class="button">🔍 Найти</button>
            <?php if ($search): ?><a href="?page=yandex-kwork-reviews-parser" class="button">Сбросить</a><?php endif; ?>
        </form>

        <div style="display: flex; gap: 40px; margin-top: 20px;">
            <div style="flex: 1;">
                <h3 style="border-bottom: 2px solid #f00; padding-bottom: 10px;">🔴 Яндекс (<?php echo count($yandex_reviews); ?> шт.)</h3>
                <div style="display:flex; flex-direction: column; gap: 15px;">
                    <?php yrp_render_admin_reviews($yandex_reviews, '#fff9e6'); ?>
                </div>
            </div>
            <div style="flex: 1;">
                <h3 style="border-bottom: 2px solid #1f912e; padding-bottom: 10px;">🟢 Kwork (<?php echo count($kwork_reviews); ?> шт.)</h3>
                <div style="display:flex; flex-direction: column; gap: 15px;">
                    <?php yrp_render_admin_reviews($kwork_reviews, '#f0f9f0'); ?>
                </div>
            </div>
        </div>
    </div>
    <?php
}

function yrp_render_admin_reviews($reviews, $bg_color) {
    if (empty($reviews)) {
        echo '<p style="color:#777;">Нет отзывов.</p>';
        return;
    }
    foreach ($reviews as $id => $rev) {
        $is_hidden = !empty($rev['hidden']);
        $opacity   = $is_hidden ? '0.5' : '1';
        $date_str  = !empty($rev['date']) ? esc_html($rev['date']) : '—';
        $text_len  = mb_strlen($rev['text'], 'UTF-8');
        ?>
        <div style="background:<?php echo $bg_color; ?>; padding:15px; border:1px solid #ccc; box-sizing: border-box; border-radius: 8px; opacity: <?php echo $opacity; ?>;">
            <div style="display:flex; align-items:center; margin-bottom:10px; gap: 10px;">
                <?php if(!empty($rev['avatar'])): ?>
                    <img src="<?php echo esc_url($rev['avatar']); ?>" style="width:40px; height:40px; border-radius:50%; object-fit: cover; flex-shrink:0;" loading="lazy">
                <?php else: ?>
                    <div style="width:40px; height:40px; border-radius:50%; background:#ddd; display:flex; align-items:center; justify-content:center; flex-shrink:0;">👤</div>
                <?php endif; ?>
                <div style="flex:1; min-width:0;">
                    <strong><?php echo esc_html($rev['author']); ?></strong>
                    <div style="font-size: 11px; color: #888;">
                        <?php echo $date_str; ?> · <?php echo $text_len; ?> симв.
                        <?php if ($is_hidden): ?> · <span style="color:#c00;">скрыт</span><?php endif; ?>
                    </div>
                </div>
                <div style="color:#ffb800; font-weight: bold; white-space: nowrap;">★ <?php echo esc_html($rev['rating']); ?>/5</div>
            </div>
            <p style="font-size:13px; color:#555; margin: 0 0 12px 0; line-height:1.4;"><?php echo esc_html(mb_strimwidth($rev['text'], 0, 200, '...')); ?></p>
            <form method="POST" action="" style="display:inline-block;">
                <?php wp_nonce_field('yrp_action_nonce'); ?>
                <input type="hidden" name="yrp_toggle_visibility" value="1">
                <input type="hidden" name="review_id" value="<?php echo esc_attr($id); ?>">
                <?php if ($is_hidden): ?>
                    <button type="submit" class="button">Показать</button>
                <?php else: ?>
                    <button type="submit" class="button button-primary">Скрыть</button>
                <?php endif; ?>
            </form>
        </div>
        <?php
    }
}

/* =========================================================
 *  ПАРСЕРЫ
 * ========================================================= */

function yrp_fetch_html($url) {
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_TIMEOUT, 15);
    curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0');
    $html = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return ['html' => $html, 'code' => $http_code];
}

function yrp_truncate_text($text) {
    $max = (int)get_option('yrp_max_length', YRP_DEFAULT_MAX_LENGTH);
    if (mb_strlen($text, 'UTF-8') > $max) {
        return rtrim(mb_substr($text, 0, $max, 'UTF-8')) . '…';
    }
    return $text;
}

function yrp_do_parse_yandex($url) {
    $url = rtrim($url, '/');
    if (strpos($url, '/reviews') === false) { $url .= '/reviews/'; } else { $url .= '/'; }

    $response = yrp_fetch_html($url);
    if ($response['code'] != 200 || empty($response['html']) || strpos($response['html'], 'SmartCaptcha') !== false) {
        return 'Яндекс заблокировал запрос (выдал капчу или ошибку HTTP ' . $response['code'] . ').';
    }

    $parsed = [];
    libxml_use_internal_errors(true);
    $dom = new DOMDocument();
    @$dom->loadHTML('<?xml encoding="UTF-8">' . $response['html']);
    $xpath = new DOMXPath($dom);
    $reviewNodes = $xpath->query('//*[@itemtype="http://schema.org/Review"]');

    if ($reviewNodes->length > 0) {
        foreach ($reviewNodes as $node) {
            $authorNode = $xpath->query('.//*[@itemprop="name"]', $node);
            $author = $authorNode->length > 0 ? trim($authorNode->item(0)->textContent) : 'Клиент';
            
            $textNode = $xpath->query('.//*[@itemprop="reviewBody"]', $node);
            $text = $textNode->length > 0 ? trim($textNode->item(0)->textContent) : '';
            
            $rating = 5;
            $ratingNode = $xpath->query('.//*[@itemprop="ratingValue"]', $node);
            if ($ratingNode->length > 0) {
                $val = $ratingNode->item(0)->getAttribute('content');
                if (empty($val)) $val = $ratingNode->item(0)->textContent;
                $rating = (int)$val;
            }

            $date = '';
            $dateNode = $xpath->query('.//*[@itemprop="datePublished"]', $node);
            if ($dateNode->length > 0) {
                $date = $dateNode->item(0)->getAttribute('content');
                if (empty($date)) $date = trim($dateNode->item(0)->textContent);
            }

            $avatar = '';
            $avatarNode = $xpath->query('.//img[contains(@class, "user-avatar__image") or contains(@class, "user-pic__image")]', $node);
            if ($avatarNode->length > 0) {
                $avatar = yrp_save_avatar_locally($avatarNode->item(0)->getAttribute('src'));
            }

            if (!empty($text)) {
                $id = md5('yandex' . $author . mb_substr($text, 0, 50));
                $parsed[$id] = [
                    'id'     => $id,
                    'source' => 'yandex',
                    'author' => sanitize_text_field($author),
                    'text'   => yrp_truncate_text(sanitize_textarea_field($text)),
                    'rating' => ($rating > 0 && $rating <= 5) ? $rating : 5,
                    'avatar' => sanitize_url($avatar),
                    'date'   => sanitize_text_field($date),
                    'hidden' => false
                ];
            }
            if (count($parsed) >= 30) break; // мягкий лимит для Яндекса
        }
    }
    return $parsed;
}

function yrp_do_parse_kwork($kwork_html) {
    if (empty($kwork_html)) return 'HTML код пуст.';

    $parsed = [];
    libxml_use_internal_errors(true);
    $dom = new DOMDocument();
    @$dom->loadHTML('<?xml encoding="UTF-8">' . $kwork_html);
    $xpath = new DOMXPath($dom);
    $reviewNodes = $xpath->query('//li[contains(@class, "clearfix") and contains(@class, "mb25")]');

    if ($reviewNodes->length > 0) {
        foreach ($reviewNodes as $node) {
            $authorNode = $xpath->query('.//a[contains(@class, "review-author-name")]', $node);
            $author = $authorNode->length > 0 ? trim($authorNode->item(0)->textContent) : 'Покупатель Kwork';
            
            $textNode = $xpath->query('.//div[contains(@class, "reviews_order__text") and contains(@class, "comment-comment")]', $node);
            $text = $textNode->length > 0 ? trim($textNode->item(0)->textContent) : '';
            
            if (empty($text) || $text === 'Нет отзыва') continue;

            $rating = 5;
            $ratingNode = $xpath->query('.//meta[@itemprop="ratingValue"]', $node);
            if ($ratingNode->length > 0) {
                $rating = (int)$ratingNode->item(0)->getAttribute('content');
            }

            $date = '';
            $dateNode = $xpath->query('.//meta[@itemprop="datePublished"]', $node);
            if ($dateNode->length > 0) $date = $dateNode->item(0)->getAttribute('content');

            $avatar = '';
            $avatarNode = $xpath->query('.//span[contains(@class, "user-avatar")]//img', $node);
            if ($avatarNode->length > 0) {
                $src = $avatarNode->item(0)->getAttribute('src');
                if (strpos($src, 'noprofilepicture') === false) {
                    $avatar = yrp_save_avatar_locally($src);
                }
            }

            // ID из data-id комментария Kwork — стабилен между парсингами
            $kworkIdNode = $xpath->query('.//span[@data-id]', $node);
            $kwork_id = $kworkIdNode->length > 0 ? $kworkIdNode->item(0)->getAttribute('data-id') : '';
            $id = !empty($kwork_id) ? 'kwork_' . $kwork_id : md5('kwork' . $author . mb_substr($text, 0, 50));

            $parsed[$id] = [
                'id'     => $id,
                'source' => 'kwork',
                'author' => sanitize_text_field($author),
                'text'   => yrp_truncate_text(sanitize_textarea_field($text)),
                'rating' => ($rating > 0 && $rating <= 5) ? $rating : 5,
                'avatar' => sanitize_url($avatar),
                'date'   => sanitize_text_field($date),
                'hidden' => false
            ];
            // ЛИМИТА НЕТ — пользователь сам контролирует объём
        }
    }
    
    if (empty($parsed)) {
        return 'Отзывы в HTML коде не найдены. Проверьте, правильный ли код вы скопировали.';
    }
    return $parsed;
}