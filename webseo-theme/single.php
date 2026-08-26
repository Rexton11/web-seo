<?php get_header(); webseo_breadcrumbs(); ?>
<?php while (have_posts()) : the_post(); ?>
<article class="section-padding">
    <div class="container container--narrow">
        <header class="post-header">
            <time class="post-date" datetime="<?php echo get_the_date('c'); ?>"><?php echo get_the_date(); ?></time>
            <h1><?php the_title(); ?></h1>
        </header>
        <?php if (has_post_thumbnail()) : ?>
            <div class="post-thumbnail"><?php the_post_thumbnail('large', ['loading' => 'eager']); ?></div>
        <?php endif; ?>
        <div class="prose"><?php the_content(); ?></div>
        <nav class="post-nav">
            <?php
            $prev = get_previous_post();
            $next = get_next_post();
            if ($prev) : ?>
                <a href="<?php echo get_permalink($prev); ?>" class="post-nav__link post-nav__prev">
                    <span>← Предыдущая</span>
                    <strong><?php echo esc_html($prev->post_title); ?></strong>
                </a>
            <?php endif;
            if ($next) : ?>
                <a href="<?php echo get_permalink($next); ?>" class="post-nav__link post-nav__next">
                    <span>Следующая →</span>
                    <strong><?php echo esc_html($next->post_title); ?></strong>
                </a>
            <?php endif; ?>
        </nav>
    </div>
</article>
<?php endwhile;

// Blog CTA
$cta_title = webseo_option('blog_cta_title');
if ($cta_title) :
    set_query_var('cta_data', [
        'title'    => $cta_title,
        'text'     => webseo_option('blog_cta_text'),
        'btn_text' => webseo_option('blog_cta_btn_text'),
    ]);
    get_template_part('parts/section', 'cta');
endif;

get_footer(); ?>
