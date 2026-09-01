<?php
/**
 * Template: Blog posts page (is_home)
 *
 * @package WebSEO
 */

get_header();
webseo_breadcrumbs();
?>
<section class="section-padding">
    <div class="container">
        <div class="section-header">
            <h1>Блог</h1>
        </div>
        <?php if (have_posts()) : ?>
            <div class="blog-grid">
                <?php while (have_posts()) : the_post(); ?>
                    <article class="blog-card" data-reveal>
                        <?php if (has_post_thumbnail()) : ?>
                            <a href="<?php the_permalink(); ?>" class="blog-card__img">
                                <?php the_post_thumbnail('card-thumb', ['loading' => 'lazy']); ?>
                            </a>
                        <?php endif; ?>
                        <div class="blog-card__body">
                            <time class="blog-card__date" datetime="<?php echo get_the_date('c'); ?>"><?php echo get_the_date(); ?></time>
                            <h2 class="blog-card__title"><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h2>
                            <p><?php echo get_the_excerpt(); ?></p>
                            <a href="<?php the_permalink(); ?>" class="blog-card__link">Читать далее <i class="ph-bold ph-arrow-right"></i></a>
                        </div>
                    </article>
                <?php endwhile; ?>
            </div>
            <div class="pagination"><?php the_posts_pagination(['prev_text' => '←', 'next_text' => '→']); ?></div>
        <?php else : ?>
            <p>Записей пока нет.</p>
        <?php endif; ?>
    </div>
</section>
<?php get_footer(); ?>
