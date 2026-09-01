<?php
$faq = get_query_var('faq_data');
if (!$faq) return;
?>
<div class="faq-list">
    <?php foreach ($faq as $item) : ?>
        <div class="faq-item" data-reveal>
            <button class="faq-question" aria-expanded="false">
                <?php echo esc_html($item['question']); ?>
                <i class="ph-bold ph-plus faq-icon"></i>
            </button>
            <div class="faq-answer" role="region">
                <div class="faq-answer__inner"><?php echo wp_kses_post($item['answer']); ?></div>
            </div>
        </div>
    <?php endforeach; ?>
</div>
