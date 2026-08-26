<?php
/**
 * Template Name: Спасибо
 */
get_header(); ?>
<section class="section-padding thanks-page">
    <div class="container" style="text-align:center;">
        <div class="thanks-icon"><i class="ph ph-check-circle" style="font-size:4rem;color:var(--acid-green);"></i></div>
        <h1><?php the_title(); ?></h1>
        <div class="prose"><?php the_content(); ?></div>
        <a href="<?php echo esc_url(home_url('/')); ?>" class="btn btn-primary">На главную</a>
    </div>
</section>
<?php get_footer(); ?>
