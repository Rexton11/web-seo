<?php
$p = get_query_var('card_post');
if (!$p) return;
$name     = get_field('client_name', $p->ID) ?: $p->post_title;
$position = get_field('client_position', $p->ID);
$text     = get_field('review_text', $p->ID);
$avatar   = get_field('client_avatar', $p->ID);
?>
<div class="testimonial-card" data-reveal>
    <div class="testimonial-header">
        <?php if ($avatar) : ?>
            <img src="<?php echo esc_url($avatar['sizes']['thumbnail']); ?>" alt="<?php echo esc_attr($name); ?>" class="testimonial-avatar" width="48" height="48" loading="lazy">
        <?php else : ?>
            <div class="testimonial-avatar testimonial-avatar--placeholder"><i class="ph ph-user"></i></div>
        <?php endif; ?>
        <div>
            <strong class="testimonial-name"><?php echo esc_html($name); ?></strong>
            <?php if ($position) : ?>
                <span class="testimonial-position"><?php echo esc_html($position); ?></span>
            <?php endif; ?>
        </div>
    </div>
    <blockquote class="testimonial-text"><?php echo esc_html($text); ?></blockquote>
</div>
