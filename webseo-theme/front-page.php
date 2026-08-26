<?php
/**
 * Template: Front Page
 *
 * @package WebSEO
 */

get_header();
?>

<!-- Hero -->
<section class="hero section-padding">
    <div class="hero-decor">
        <div class="hero-grid"></div>
        <div class="hero-blob hero-blob--1"></div>
        <div class="hero-blob hero-blob--2"></div>
        <div class="hero-glow"></div>
    </div>
    <div class="container" data-reveal="scale">
        <h1 class="js-kinetic"><?php the_field('hero_title'); ?></h1>
        <p><?php the_field('hero_subtitle'); ?></p>

        <div class="hero-actions">
            <?php if ($btn1 = get_field('hero_btn1_text')) : ?>
                <a href="<?php the_field('hero_btn1_url'); ?>" data-magnetic class="btn btn-primary">
                    <?php echo esc_html($btn1); ?> <i class="ph-bold ph-arrow-right"></i>
                </a>
            <?php endif; ?>
            <?php if ($btn2 = get_field('hero_btn2_text')) : ?>
                <a href="<?php the_field('hero_btn2_url'); ?>" class="btn btn-secondary">
                    <?php echo esc_html($btn2); ?> <i class="ph ph-folder"></i>
                </a>
            <?php endif; ?>
        </div>
    </div>
</section>

<!-- Services -->
<?php
$srv_cats = get_terms(['taxonomy' => 'service_category', 'hide_empty' => true, 'orderby' => 'menu_order', 'order' => 'ASC']);
if ($srv_cats && !is_wp_error($srv_cats)) :
?>
<section class="section-padding bg-gray" id="services">
    <div class="container">
        <?php webseo_section_header(
            get_field('services_badge'),
            get_field('services_title'),
            get_field('services_subtitle')
        ); ?>

        <div class="services-home-wrapper">
            <div class="services-home-slider">
                <?php foreach ($srv_cats as $cat) :
                    $cat_services = get_posts([
                        'post_type' => 'service',
                        'posts_per_page' => 8,
                        'orderby' => 'menu_order',
                        'order' => 'ASC',
                        'tax_query' => [['taxonomy' => 'service_category', 'terms' => $cat->term_id]],
                    ]);
                ?>
                    <div class="service-cat-card" data-reveal>
                        <h3 class="service-cat-card__title">
                            <a href="<?php echo esc_url(get_term_link($cat)); ?>"><?php echo esc_html($cat->name); ?></a>
                        </h3>
                        <?php if ($cat_services) : ?>
                            <ul class="service-cat-card__list">
                                <?php foreach ($cat_services as $s) :
                                    $icon = get_field('service_icon', $s->ID);
                                ?>
                                    <li>
                                        <a href="<?php echo get_permalink($s); ?>">
                                            <?php if ($icon) : ?><span class="service-cat-card__icon"><?php echo webseo_icon($icon); ?></span><?php endif; ?>
                                            <?php echo esc_html($s->post_title); ?>
                                        </a>
                                    </li>
                                <?php endforeach; ?>
                            </ul>
                        <?php endif; ?>
                        <a href="<?php echo esc_url(get_term_link($cat)); ?>" class="service-cat-card__more">
                            Подробнее <i class="ph-bold ph-arrow-right"></i>
                        </a>
                    </div>
                <?php endforeach; ?>
            </div>
            <?php if (count($srv_cats) > 3) : ?>
                <div class="slider-arrows">
                    <button class="slider-arrow" data-dir="-1" data-slider=".services-home-slider"><i class="ph-bold ph-arrow-left"></i></button>
                    <button class="slider-arrow" data-dir="1" data-slider=".services-home-slider"><i class="ph-bold ph-arrow-right"></i></button>
                </div>
            <?php endif; ?>
        </div>
    </div>
</section>
<?php endif; ?>

<!-- Benefits -->
<?php if ($benefits = get_field('benefits')) : ?>
<section class="section-padding" id="benefits">
    <div class="container">
        <?php webseo_section_header(
            get_field('benefits_badge'),
            get_field('benefits_title'),
            get_field('benefits_subtitle')
        ); ?>

        <div class="grid-3">
            <?php foreach ($benefits as $item) : ?>
                <div class="card" data-reveal>
                    <div class="card-icon"><?php echo webseo_icon($item['icon']); ?></div>
                    <h3><?php echo esc_html($item['title']); ?></h3>
                    <p><?php echo esc_html($item['text']); ?></p>
                </div>
            <?php endforeach; ?>
        </div>
    </div>
</section>
<?php endif; ?>

<!-- Portfolio -->
<?php
$count = get_field('portfolio_count') ?: 4;
$cases = get_posts(['post_type' => 'portfolio', 'posts_per_page' => $count]);
if ($cases) :
?>
<section class="section-padding bg-gray" id="portfolio">
    <div class="container">
        <?php webseo_section_header(
            get_field('portfolio_badge'),
            get_field('portfolio_title'),
            get_field('portfolio_subtitle')
        ); ?>

        <div class="grid-2">
            <?php foreach ($cases as $c) : setup_postdata($c); ?>
                <?php
                set_query_var('card_post', $c);
                get_template_part('parts/card', 'portfolio');
                ?>
            <?php endforeach; wp_reset_postdata(); ?>
        </div>

        <div class="section-footer">
            <a href="<?php echo esc_url(get_post_type_archive_link('portfolio')); ?>" class="btn btn-secondary">
                Все кейсы <i class="ph-bold ph-arrow-right"></i>
            </a>
        </div>
    </div>
</section>
<?php endif; ?>

<!-- Testimonials -->
<?php
$testimonials = webseo_get_testimonials();
if ($testimonials) :
?>
<section class="section-padding" id="testimonials">
    <div class="container">
        <?php webseo_section_header(
            get_field('testimonials_badge'),
            get_field('testimonials_title')
        ); ?>

        <div class="testimonials-wrapper">
        <div class="testimonials-slider">
            <?php foreach ($testimonials as $t) :
                set_query_var('card_post', $t);
                get_template_part('parts/card', 'testimonial');
            endforeach; ?>
        </div>
        <div class="slider-arrows"><button class="slider-arrow" data-dir="-1"><i class="ph-bold ph-arrow-left"></i></button><button class="slider-arrow" data-dir="1"><i class="ph-bold ph-arrow-right"></i></button></div>
        </div>
    </div>
</section>
<?php endif; ?>

<!-- FAQ -->
<?php if ($faq = get_field('faq_items')) : ?>
<section class="section-padding bg-gray" id="faq">
    <div class="container">
        <?php webseo_section_header(
            get_field('faq_badge'),
            get_field('faq_title')
        ); ?>

        <?php
        set_query_var('faq_data', $faq);
        get_template_part('parts/section', 'faq');
        ?>
    </div>
</section>
<?php endif; ?>

<!-- CTA -->
<?php if ($cta_title = get_field('cta_title')) : ?>
    <?php
    set_query_var('cta_data', [
        'title'    => $cta_title,
        'text'     => get_field('cta_text'),
        'btn_text' => get_field('cta_btn_text'),
    ]);
    get_template_part('parts/section', 'cta');
    ?>
<?php endif; ?>

<?php get_footer(); ?>
