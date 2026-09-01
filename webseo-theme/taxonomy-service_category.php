<?php
/**
 * Template: Service Category Archive
 *
 * @package WebSEO
 */

get_header();
webseo_breadcrumbs();
$term = get_queried_object();
?>
<section class="section-padding">
    <div class="container">
        <div class="section-header">
            <h1><?php single_term_title(); ?></h1>
            <?php if ($term->description) : ?>
                <p><?php echo esc_html($term->description); ?></p>
            <?php endif; ?>
        </div>
        <?php if (have_posts()) : ?>
            <div class="grid-3">
                <?php while (have_posts()) : the_post(); ?>
                    <?php set_query_var('card_post', $post); get_template_part('parts/card', 'service'); ?>
                <?php endwhile; ?>
            </div>
            <div class="pagination"><?php the_posts_pagination(['prev_text' => '←', 'next_text' => '→']); ?></div>
        <?php else : ?>
            <p>Услуги скоро появятся.</p>
        <?php endif; ?>
    </div>
</section>
<?php get_footer(); ?>
