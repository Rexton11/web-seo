<?php get_header(); webseo_breadcrumbs(); ?>
<section class="section-padding">
    <div class="container">
        <div class="section-header">
            <h1>Услуги</h1>
        </div>
        <?php
        $cats = get_terms(['taxonomy' => 'service_category', 'hide_empty' => true]);
        if ($cats && !is_wp_error($cats)) :
        ?>
            <div class="filter-tabs">
                <button class="filter-tab active" data-filter="all">Все</button>
                <?php foreach ($cats as $cat) : ?>
                    <button class="filter-tab" data-filter="<?php echo esc_attr($cat->slug); ?>"><?php echo esc_html($cat->name); ?></button>
                <?php endforeach; ?>
            </div>
        <?php endif; ?>
        <?php if (have_posts()) : ?>
            <div class="grid-3">
                <?php while (have_posts()) : the_post();
                    $terms = wp_get_post_terms(get_the_ID(), 'service_category', ['fields' => 'slugs']);
                    $classes = implode(' ', $terms);
                ?>
                    <div class="filterable" data-categories="<?php echo esc_attr($classes); ?>">
                        <?php set_query_var('card_post', $post); get_template_part('parts/card', 'service'); ?>
                    </div>
                <?php endwhile; ?>
            </div>
        <?php endif; ?>
    </div>
</section>
<?php get_footer(); ?>
