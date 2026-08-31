<?php
$p = get_query_var('card_post');
if (!$p) return;

if (is_array($p)) {
    $name       = $p['author'] ?? '';
    $position   = '';
    $text       = $p['text'] ?? '';
    $avatar_url = $p['avatar'] ?? '';
    $rating     = (int)($p['rating'] ?? 0);
    $source     = $p['source'] ?? '';
    $source_url = $p['source_url'] ?? '';
} else {
    $name       = get_field('client_name', $p->ID) ?: $p->post_title;
    $position   = get_field('client_position', $p->ID);
    $text       = get_field('review_text', $p->ID);
    $avatar     = get_field('client_avatar', $p->ID);
    $avatar_url = $avatar ? ($avatar['sizes']['thumbnail'] ?? '') : '';
    $rating     = 0;
    $source     = '';
    $source_url = '';
}
?>
<div class="testimonial-card" data-reveal>
    <div class="testimonial-header">
        <?php if ($avatar_url) : ?>
            <img src="<?php echo esc_url($avatar_url); ?>" alt="<?php echo esc_attr($name); ?>" class="testimonial-avatar" width="48" height="48" loading="lazy">
        <?php else : ?>
            <div class="testimonial-avatar testimonial-avatar--placeholder"><i class="ph ph-user"></i></div>
        <?php endif; ?>
        <div>
            <strong class="testimonial-name"><?php echo esc_html($name); ?></strong>
            <?php if ($position) : ?>
                <span class="testimonial-position"><?php echo esc_html($position); ?></span>
            <?php endif; ?>
            <?php if ($rating > 0) : ?>
                <span class="testimonial-rating"><?php echo str_repeat('★', $rating) . str_repeat('☆', 5 - $rating); ?></span>
            <?php endif; ?>
        </div>
    </div>
    <blockquote class="testimonial-text"><?php echo esc_html($text); ?></blockquote>
    <?php if ($source) : ?>
        <div class="testimonial-source">
            <?php
            $source_labels = ['yandex' => 'Яндекс Карты', 'kwork' => 'Kwork'];
            $label = $source_labels[$source] ?? $source;
            ?>
            <?php if ($source_url) : ?>
                <a href="<?php echo esc_url($source_url); ?>" class="testimonial-source__link testimonial-source--<?php echo esc_attr($source); ?>" target="_blank" rel="noopener nofollow">
                    <?php echo esc_html($label); ?> <i class="ph ph-arrow-square-out"></i>
                </a>
            <?php else : ?>
                <span class="testimonial-source__link testimonial-source--<?php echo esc_attr($source); ?>"><?php echo esc_html($label); ?></span>
            <?php endif; ?>
        </div>
    <?php endif; ?>
</div>
