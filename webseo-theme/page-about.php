<?php
/**
 * Template Name: Обо мне
 */
get_header(); webseo_breadcrumbs();
?>
<section class="section-padding">
    <div class="container">
        <div class="about-hero">
            <?php if ($photo = get_field('about_photo')) : ?>
                <div class="about-photo">
                    <img src="<?php echo esc_url($photo['sizes']['medium_large']); ?>" alt="<?php echo esc_attr(get_field('about_name')); ?>" loading="eager">
                </div>
            <?php endif; ?>
            <div class="about-intro">
                <h1><?php echo esc_html(get_field('about_name') ?: get_the_title()); ?></h1>
                <?php if ($role = get_field('about_role')) : ?>
                    <p class="about-role"><?php echo esc_html($role); ?></p>
                <?php endif; ?>
            </div>
        </div>
        <?php if ($bio = get_field('about_bio')) : ?>
            <div class="prose about-bio"><?php echo $bio; ?></div>
        <?php endif; ?>
        <?php if ($tech = get_field('tech_stack')) : ?>
            <div class="about-tech">
                <h2>Стек технологий</h2>
                <div class="tech-stack">
                    <?php foreach ($tech as $t) : ?>
                        <span class="tech-item"><?php echo webseo_icon($t['icon']); ?> <?php echo esc_html($t['name']); ?></span>
                    <?php endforeach; ?>
                </div>
            </div>
        <?php endif; ?>
    </div>
</section>
<?php
set_query_var('cta_data', [
    'title' => 'Готовы обсудить проект?',
    'text' => '',
    'btn_text' => 'Связаться',
]);
get_template_part('parts/section', 'cta');
get_footer(); ?>
