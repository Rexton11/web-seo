<?php
/**
 * Built-in contact form — AJAX handler
 * No third-party plugins required.
 *
 * @package WebSEO
 */

defined('ABSPATH') || exit;

/* ── AJAX handler ───────────────────────────── */

add_action('wp_ajax_webseo_contact_submit', 'webseo_contact_submit');
add_action('wp_ajax_nopriv_webseo_contact_submit', 'webseo_contact_submit');

function webseo_contact_submit(): void {
    check_ajax_referer('webseo_contact_nonce', 'nonce');

    // Honeypot check
    if (!empty($_POST['website'])) {
        wp_send_json_error(['message' => 'Спам-запрос.']);
    }

    $name    = sanitize_text_field($_POST['name'] ?? '');
    $phone   = sanitize_text_field($_POST['phone'] ?? '');
    $email   = sanitize_email($_POST['email'] ?? '');
    $message = sanitize_textarea_field($_POST['message'] ?? '');
    $plan    = sanitize_text_field($_POST['plan'] ?? '');

    // Validation
    if (empty($name)) {
        wp_send_json_error(['message' => 'Укажите имя.', 'field' => 'name']);
    }
    if (empty($phone) && empty($email)) {
        wp_send_json_error(['message' => 'Укажите телефон или email.', 'field' => 'phone']);
    }

    // Build email
    $to = webseo_option('email') ?: get_option('admin_email');
    $subject = $plan
        ? "Заявка [{$plan}]: " . get_bloginfo('name')
        : 'Заявка с сайта: ' . get_bloginfo('name');

    $body  = "Новая заявка с сайта\n\n";
    if ($plan) $body .= "Тариф: {$plan}\n";
    $body .= "Имя: {$name}\n";
    if ($phone)   $body .= "Телефон: {$phone}\n";
    if ($email)   $body .= "Email: {$email}\n";
    if ($message) $body .= "\nСообщение:\n{$message}\n";
    $page_url = sanitize_url($_POST['page_url'] ?? '');
    $body .= "\n---\nОтправлено с " . ($page_url ?: home_url('/'));

    $headers = ['Content-Type: text/plain; charset=UTF-8'];
    if ($email) {
        $headers[] = "Reply-To: {$name} <{$email}>";
    }

    $sent = wp_mail($to, $subject, $body, $headers);

    $crm_data = ['name' => $name, 'phone' => $phone, 'email' => $email, 'message' => $message];
    if ($plan) $crm_data['plan'] = $plan;
    $crm_data['source'] = $page_url ?: home_url('/');
    webseo_send_to_crm($crm_data);

    if ($sent) {
        wp_send_json_success(['message' => 'Спасибо! Свяжусь с вами в ближайшее время.']);
    } else {
        wp_send_json_error(['message' => 'Ошибка отправки. Попробуйте позже.']);
    }
}

/* ── Enqueue form script (contacts page only) ── */

add_action('wp_enqueue_scripts', function () {
    if (is_page_template('page-contacts.php')) {
        wp_enqueue_script('webseo-contact-form', WEBSEO_URI . '/assets/js/contact-form.js', ['webseo-modal'], WEBSEO_VERSION, true);
    }
});
