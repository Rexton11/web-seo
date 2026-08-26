<?php
/**
 * Template part: Contact form (built-in, no plugins)
 *
 * @package WebSEO
 */

defined('ABSPATH') || exit;
?>
<div class="contact-form" id="contactForm">
    <div class="form-group">
        <label for="cf-name">Имя <span class="required">*</span></label>
        <input type="text" id="cf-name" name="name" class="form-input" placeholder="Ваше имя" required>
    </div>
    <div class="form-group">
        <label for="cf-phone">Телефон <span class="required">*</span></label>
        <input type="tel" id="cf-phone" name="phone" class="form-input" placeholder="+7 (___) ___-__-__" required>
    </div>
    <div class="form-group">
        <label for="cf-email">Email</label>
        <input type="email" id="cf-email" name="email" class="form-input" placeholder="email@example.com">
    </div>
    <div class="form-group">
        <label for="cf-message">Сообщение</label>
        <textarea id="cf-message" name="message" class="form-input" rows="4" placeholder="Опишите задачу или задайте вопрос"></textarea>
    </div>
    <!-- Honeypot -->
    <div style="position:absolute;left:-9999px;" aria-hidden="true">
        <input type="text" name="website" tabindex="-1" autocomplete="off">
    </div>
    <button type="button" class="btn btn-primary contact-submit" id="contactSubmit">
        Отправить <i class="ph-bold ph-arrow-right"></i>
    </button>
    <div class="form-message" id="formMessage" hidden></div>
</div>
