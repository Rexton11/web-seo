<?php
/**
 * Template part: Modal contact form
 * Triggered by any link/button with data-modal="callback"
 *
 * @package WebSEO
 */

defined('ABSPATH') || exit;
?>
<div class="modal-overlay" id="callbackModal" hidden aria-hidden="true">
    <div class="modal" role="dialog" aria-labelledby="modalTitle">
        <button class="modal-close" id="modalClose" aria-label="Закрыть">
            <i class="ph-bold ph-x"></i>
        </button>
        <div class="modal-body">
            <h2 id="modalTitle">Обсудить проект</h2>
            <p class="modal-subtitle">Оставьте контакт — свяжусь в течение часа</p>

            <div class="modal-form" id="modalForm">
                <div class="form-group">
                    <input type="text" name="name" class="form-input" placeholder="Ваше имя" required>
                </div>
                <div class="form-group">
                    <input type="tel" name="phone" class="form-input" placeholder="Телефон" required>
                </div>
                <div class="form-group">
                    <textarea name="message" class="form-input" rows="3" placeholder="Коротко опишите задачу (необязательно)"></textarea>
                </div>
                <!-- Honeypot -->
                <div style="position:absolute;left:-9999px;" aria-hidden="true">
                    <input type="text" name="website" tabindex="-1" autocomplete="off">
                </div>
                <?php webseo_consent_checkbox('modal'); ?>
                <button type="button" class="btn btn-primary modal-submit" id="modalSubmit" style="width:100%;">
                    Отправить заявку <i class="ph-bold ph-arrow-right"></i>
                </button>
                <div class="form-message" id="modalMessage" hidden></div>
            </div>

            <?php $messengers = webseo_get_messengers(); if ($messengers) : ?>
                <div class="modal-or">
                    <span>или напишите напрямую</span>
                </div>
                <div class="modal-messengers">
                    <?php foreach ($messengers as $m) : ?>
                        <a href="<?php echo esc_url($m['url']); ?>" class="btn btn-secondary" target="_blank" rel="noopener">
                            <i class="<?php echo esc_attr($m['icon']); ?>"></i> <?php echo esc_html($m['label']); ?>
                        </a>
                    <?php endforeach; ?>
                </div>
            <?php endif; ?>
        </div>
    </div>
</div>
