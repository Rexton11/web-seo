<?php
$p = get_query_var('card_post');
if (!$p) return;
$tags = wp_get_post_terms($p->ID, 'portfolio_tag');
?>
<div class="portfolio-card">
    <?php if (has_post_thumbnail($p)) : ?>
        <a href="<?php echo get_permalink($p); ?>" class="portfolio-img">
            <?php echo get_the_post_thumbnail($p, 'portfolio-thumb', ['loading' => 'lazy']); ?>
        </a>
    <?php else : ?>
        <a href="<?php echo get_permalink($p); ?>" class="portfolio-img portfolio-img--empty"></a>
    <?php endif; ?>
    <div class="portfolio-info">
        <?php if ($tags) : ?>
            <div class="portfolio-tags">
                <?php foreach ($tags as $tag) : ?>
                    <span class="tag"><?php echo esc_html($tag->name); ?></span>
                <?php endforeach; ?>
            </div>
        <?php endif; ?>
        <h3><a href="<?php echo get_permalink($p); ?>"><?php echo esc_html($p->post_title); ?></a></h3>
        <p><?php echo esc_html($p->post_excerpt ?: wp_trim_words($p->post_content, 20)); ?></p>
        <a href="<?php echo get_permalink($p); ?>" class="card-more">Смотреть кейс <i class="ph-bold ph-arrow-right"></i></a>
    </div>
</div>
