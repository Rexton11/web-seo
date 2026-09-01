<?php
$data = get_query_var('cta_data');
if (!$data || empty($data['title'])) return;
$tg = webseo_option('telegram');
?>
<section class="cta-section">
    <div class="container" data-reveal="scale">
        <div class="cta-icons">
            <div class="cta-icon"><i class="ph ph-rocket"></i></div>
            <div class="cta-icon"><i class="ph ph-chart-line-up"></i></div>
            <div class="cta-icon"><i class="ph ph-monitor"></i></div>
        </div>
        <h2><?php echo esc_html($data['title']); ?></h2>
        <?php if (!empty($data['text'])) : ?>
            <p><?php echo esc_html($data['text']); ?></p>
        <?php endif; ?>
        <div class="cta-buttons">
            <a href="#callback" data-modal="callback" data-magnetic class="btn btn-primary">
                <?php echo esc_html($data['btn_text'] ?? 'Оставить заявку'); ?> <i class="ph-bold ph-arrow-right"></i>
            </a>
            <?php if ($tg) : ?>
                <a href="<?php echo esc_url($tg); ?>" class="btn btn-secondary" target="_blank" rel="noopener">
                    <i class="ph-fill ph-telegram-logo"></i> Написать в Telegram
                </a>
            <?php endif; ?>
        </div>
    </div>
</section>
