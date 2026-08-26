<?php
$p = get_query_var('card_post');
if (!$p) return;
$icon = get_field('service_icon', $p->ID);
?>
<div class="card card--service" data-reveal>
    <a href="<?php echo get_permalink($p); ?>" class="card-link">
        <?php if ($icon) : ?>
            <div class="card-icon"><?php echo webseo_icon($icon); ?></div>
        <?php endif; ?>
        <h3><?php echo esc_html($p->post_title); ?></h3>
        <p><?php echo esc_html($p->post_excerpt ?: wp_trim_words($p->post_content, 15)); ?></p>
        <span class="card-arrow"><i class="ph-bold ph-arrow-right"></i></span>
    </a>
</div>
