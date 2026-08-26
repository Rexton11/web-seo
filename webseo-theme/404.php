<?php get_header(); ?>
<section class="section-padding" style="text-align:center;min-height:60vh;display:flex;align-items:center;">
    <div class="container">
        <h1 style="font-size:6rem;line-height:1;">404</h1>
        <p style="font-size:1.25rem;color:var(--text-muted);margin-bottom:32px;">Страница не найдена</p>
        <a href="<?php echo esc_url(home_url('/')); ?>" class="btn btn-primary">На главную</a>
    </div>
</section>
<?php get_footer(); ?>
