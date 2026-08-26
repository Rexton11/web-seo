<?php
/**
 * Fallback template — WordPress requires this file.
 * Actual routing: front-page.php, archive.php, single.php, etc.
 *
 * @package WebSEO
 */

get_header();
?>

<section class="section-padding">
    <div class="container">
        <?php if (have_posts()) : ?>
            <?php while (have_posts()) : the_post(); ?>
                <article>
                    <h2><a href="<?php the_permalink(); ?>"><?php the_title(); ?></a></h2>
                    <?php the_excerpt(); ?>
                </article>
            <?php endwhile; ?>
            <div class="pagination"><?php the_posts_pagination(); ?></div>
        <?php else : ?>
            <p>Ничего не найдено.</p>
        <?php endif; ?>
    </div>
</section>

<?php get_footer(); ?>
