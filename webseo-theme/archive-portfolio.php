<?php get_header(); webseo_breadcrumbs(); ?>
<section class="section-padding">
    <div class="container">
        <div class="section-header">
            <h1>Портфолио</h1>
        </div>
        <?php
        $tags = get_terms(['taxonomy' => 'portfolio_tag', 'hide_empty' => true]);
        if ($tags && !is_wp_error($tags)) :
        ?>
            <div class="filter-tabs">
                <button class="filter-tab active" data-filter="all">Все</button>
                <?php foreach ($tags as $tag) : ?>
                    <button class="filter-tab" data-filter="<?php echo esc_attr($tag->slug); ?>"><?php echo esc_html($tag->name); ?></button>
                <?php endforeach; ?>
            </div>
        <?php endif; ?>
        <?php if (have_posts()) : ?>
            <div class="grid-2">
                <?php while (have_posts()) : the_post();
                    $terms = wp_get_post_terms(get_the_ID(), 'portfolio_tag', ['fields' => 'slugs']);
                    $classes = implode(' ', $terms);
                ?>
                    <div class="filterable" data-categories="<?php echo esc_attr($classes); ?>">
                        <?php set_query_var('card_post', $post); get_template_part('parts/card', 'portfolio'); ?>
                    </div>
                <?php endwhile; ?>
            </div>
            <div class="pagination"><?php the_posts_pagination(['prev_text' => '←', 'next_text' => '→']); ?></div>
        <?php endif; ?>
    </div>
</section>
<?php get_footer(); ?>
