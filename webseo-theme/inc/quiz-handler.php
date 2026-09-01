<?php
/**
 * Quiz AJAX handler
 *
 * @package WebSEO
 */

defined('ABSPATH') || exit;

add_action('wp_ajax_webseo_quiz_submit', 'webseo_quiz_submit');
add_action('wp_ajax_nopriv_webseo_quiz_submit', 'webseo_quiz_submit');

function webseo_quiz_submit(): void {
    check_ajax_referer('webseo_quiz_nonce', 'nonce');

    $quiz_id = intval($_POST['quiz_id'] ?? 0);
    $answers = $_POST['answers'] ?? [];
    $contact = $_POST['contact'] ?? [];

    if (!$quiz_id || empty($contact)) {
        wp_send_json_error(['message' => 'Данные не заполнены.']);
    }

    // Sanitize contact
    $name  = sanitize_text_field($contact['name'] ?? '');
    $phone = sanitize_text_field($contact['phone'] ?? '');
    $email = sanitize_email($contact['email'] ?? '');

    // Build email body
    $quiz_title = get_the_title($quiz_id);
    $to = get_field('email_to', $quiz_id) ?: get_option('admin_email');

    $body  = "Новая заявка с квиза: {$quiz_title}\n\n";

    if ($name)  $body .= "Имя: {$name}\n";
    if ($phone) $body .= "Телефон: {$phone}\n";
    if ($email) $body .= "Email: {$email}\n";

    $body .= "\n--- Ответы ---\n\n";

    // Get quiz steps for question labels
    $steps = get_field('quiz_steps', $quiz_id);
    if ($steps && is_array($answers)) {
        foreach ($answers as $i => $answer) {
            $question = $steps[$i]['question'] ?? "Вопрос " . ($i + 1);
            if (is_array($answer)) {
                $answer = implode(', ', array_map('sanitize_text_field', $answer));
            } else {
                $answer = sanitize_text_field($answer);
            }
            $body .= "{$question}: {$answer}\n";
        }
    }

    $body .= "\n--- Отправлено с " . home_url('/') . " ---";

    $subject = "Заявка с квиза: {$quiz_title}";
    $headers = ['Content-Type: text/plain; charset=UTF-8'];

    if ($email) {
        $headers[] = "Reply-To: {$name} <{$email}>";
    }

    $sent = wp_mail($to, $subject, $body, $headers);

    $crm_message = "Квиз: {$quiz_title}\n";
    if ($steps && is_array($answers)) {
        foreach ($answers as $i => $answer) {
            $question = $steps[$i]['question'] ?? "Вопрос " . ($i + 1);
            $val = is_array($answer) ? implode(', ', array_map('sanitize_text_field', $answer)) : sanitize_text_field($answer);
            $crm_message .= "{$question}: {$val}\n";
        }
    }
    webseo_send_to_crm([
        'name'    => $name,
        'phone'   => $phone,
        'email'   => $email,
        'message' => trim($crm_message),
        'source'  => home_url('/'),
    ]);

    if ($sent) {
        $success_msg = get_field('success_message', $quiz_id) ?: 'Спасибо! Мы свяжемся с вами в ближайшее время.';
        wp_send_json_success(['message' => $success_msg]);
    } else {
        wp_send_json_error(['message' => 'Ошибка отправки. Попробуйте позже.']);
    }
}
