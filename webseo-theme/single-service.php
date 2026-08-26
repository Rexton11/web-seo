<?php
/**
 * Template: Single Service (selling structure)
 *
 * @package WebSEO
 */

get_header();
$post_id = get_the_ID();
?>

<!-- 1. HERO -->
<?php $hero_media = get_field('hero_media'); ?>
<?php webseo_breadcrumbs(); ?>
<section class="service-hero<?php echo $hero_media ? ' service-hero--with-media' : ''; ?>">
    <div class="hero-decor">
        <div class="hero-grid"></div>
        <div class="hero-blob hero-blob--1"></div>
        <div class="hero-glow"></div>
    </div>
    <div class="container" data-reveal="scale">
        <div class="service-hero__content">
            <?php if ($icon = get_field('service_icon')) : ?>
                <div class="service-hero__icon"><?php echo webseo_icon($icon); ?></div>
            <?php endif; ?>
            <h1 class="js-kinetic"><?php the_title(); ?></h1>

            <?php $chips = get_field('hero_chips'); if ($chips) : ?>
                <div class="hero-chips">
                    <?php foreach ($chips as $chip) : ?>
                        <span class="hero-chip"><i class="ph-bold ph-check"></i> <?php echo esc_html($chip['text']); ?></span>
                    <?php endforeach; ?>
                </div>
            <?php endif; ?>

            <?php if ($sub = get_field('service_subtitle')) : ?>
                <p class="service-hero__subtitle"><?php echo esc_html($sub); ?></p>
            <?php endif; ?>

            <div class="service-hero__actions">
                <?php if ($cta = get_field('service_cta_text')) : ?>
                    <a href="#callback" data-modal="callback" data-magnetic class="btn btn-primary">
                        <?php echo esc_html($cta); ?> <i class="ph-bold ph-arrow-right"></i>
                    </a>
                <?php endif; ?>
                <?php $tg = webseo_option('telegram'); if ($tg) : ?>
                    <a href="<?php echo esc_url($tg); ?>" class="btn btn-secondary" target="_blank" rel="noopener">
                        <i class="ph-fill ph-telegram-logo"></i> Написать в Telegram
                    </a>
                <?php endif; ?>
            </div>

            <?php $trust = get_field('hero_trust'); if ($trust) : ?>
                <div class="hero-trust">
                    <?php foreach ($trust as $item) : ?>
                        <div class="hero-trust__item">
                            <span class="hero-trust__dot"></span>
                            <span class="hero-trust__value"><?php echo esc_html($item['value']); ?></span>
                            <span class="hero-trust__label"><?php echo esc_html($item['label']); ?></span>
                        </div>
                    <?php endforeach; ?>
                </div>
            <?php endif; ?>
        </div>

    </div>
</section>

<!-- 2. PAINS -->
<?php if ($pains = get_field('pains')) : ?>
<section class="pains-section section-padding bg-gray" id="pains">
    <div class="container">
        <div class="section-header">
            <h2><?php echo esc_html(get_field('pains_title') ?: 'Знакомо?'); ?></h2>
        </div>
        <div class="pains-pills">
            <?php foreach ($pains as $pain) : ?>
                <span class="pain-pill" data-reveal="scale">
                    <i class="ph-bold ph-x"></i>
                    <?php echo esc_html($pain['title']); ?>
                </span>
            <?php endforeach; ?>
        </div>
    </div>
</section>
<?php endif; ?>

<!-- 3. SOLUTION -->
<?php if ($solution = get_field('solution_items')) : ?>
<section class="section-padding" id="solution">
    <div class="container">
        <?php webseo_section_header('', get_field('solution_title') ?: 'Что вы получите'); ?>
        <div class="solution-checklist">
            <?php foreach ($solution as $item) : ?>
                <div class="solution-check-item" data-reveal="left">
                    <div class="solution-check-icon"><i class="ph-bold ph-check"></i></div>
                    <div>
                        <h3><?php echo esc_html($item['title']); ?></h3>
                        <p><?php echo esc_html($item['text']); ?></p>
                    </div>
                </div>
            <?php endforeach; ?>
        </div>
    </div>
</section>
<?php endif; ?>

<!-- 4. BENEFITS -->
<?php if ($benefits = get_field('benefits')) : ?>
<section class="section-padding bg-gray" id="why-us">
    <div class="container">
        <?php webseo_section_header('', get_field('benefits_title') ?: 'Почему мы'); ?>
        <div class="bento-grid">
            <?php foreach ($benefits as $b) : ?>
                <div class="bento-tile" data-reveal>
                    <div class="card-icon"><?php echo webseo_icon($b['icon']); ?></div>
                    <h3><?php echo esc_html($b['title']); ?></h3>
                    <p><?php echo esc_html($b['text']); ?></p>
                </div>
            <?php endforeach; ?>
        </div>
    </div>
</section>
<?php endif; ?>

<!-- 5. STEPS -->
<?php if ($steps = get_field('steps')) : ?>
<section class="section-padding" id="steps">
    <div class="container">
        <?php webseo_section_header('', get_field('steps_title') ?: 'Как мы работаем'); ?>
    </div>
    <div class="container">
        <div class="steps-wrapper">
            <div class="steps-slider">
                <?php foreach ($steps as $i => $step) : ?>
                    <div class="step-item" data-reveal="scale">
                        <div class="step-number"><?php echo $i + 1; ?></div>
                        <h3><?php echo esc_html($step['title']); ?></h3>
                        <p><?php echo esc_html($step['text']); ?></p>
                    </div>
                <?php endforeach; ?>
            </div>
            <?php if (count($steps) > 4) : ?>
                <div class="slider-arrows">
                    <button class="slider-arrow" data-dir="-1" data-slider=".steps-slider"><i class="ph-bold ph-arrow-left"></i></button>
                    <button class="slider-arrow" data-dir="1" data-slider=".steps-slider"><i class="ph-bold ph-arrow-right"></i></button>
                </div>
            <?php endif; ?>
        </div>
    </div>
</section>
<?php endif; ?>

<!-- 6. CASES -->
<?php
$selected = get_field('selected_cases');
$cases = $selected
    ? get_posts(['post_type' => 'portfolio', 'post__in' => $selected, 'orderby' => 'post__in'])
    : webseo_get_related_cases($post_id);

if ($cases) :
?>
<section class="section-padding bg-gray" id="cases">
    <div class="container">
        <?php webseo_section_header('', get_field('cases_title') ?: 'Наши работы'); ?>
        <div class="grid-2">
            <?php foreach ($cases as $c) :
                set_query_var('card_post', $c);
                get_template_part('parts/card', 'portfolio');
            endforeach; ?>
        </div>
    </div>
</section>
<?php endif; ?>

<!-- 7. PRICING -->
<?php if ($pricing = get_field('pricing')) : ?>
<section class="section-padding" id="pricing">
    <div class="container">
        <?php webseo_section_header('', get_field('pricing_title') ?: 'Стоимость'); ?>
        <div class="pricing-grid">
            <?php foreach ($pricing as $plan) : ?>
                <div class="pricing-card<?php echo $plan['popular'] ? ' pricing-card--popular' : ''; ?>" data-reveal>
                    <?php if ($plan['popular']) : ?>
                        <span class="pricing-badge">Популярный</span>
                    <?php endif; ?>
                    <h3 class="pricing-name"><?php echo esc_html($plan['name']); ?></h3>
                    <div class="pricing-price"><?php echo esc_html($plan['price']); ?></div>
                    <ul class="pricing-features">
                        <?php foreach (explode("\n", $plan['features']) as $feature) :
                            $feature = trim($feature);
                            if ($feature) :
                        ?>
                            <li><i class="ph ph-check"></i> <?php echo esc_html($feature); ?></li>
                        <?php endif; endforeach; ?>
                    </ul>
                    <a href="#callback" data-modal="callback" data-plan="<?php echo esc_attr($plan['name']); ?>" data-magnetic class="btn btn-primary pricing-btn">
                        <?php echo esc_html($plan['btn_text'] ?: 'Заказать'); ?>
                    </a>
                </div>
            <?php endforeach; ?>
        </div>
    </div>
</section>
<?php endif; ?>

<!-- 8. TESTIMONIALS -->
<?php
$testimonials = webseo_get_testimonials($post_id);
if ($testimonials) :
?>
<section class="section-padding bg-gray" id="testimonials">
    <div class="container">
        <?php webseo_section_header('', 'Отзывы клиентов'); ?>
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

<!-- 9. FAQ -->
<?php if ($faq = get_field('faq_items')) : ?>
<section class="section-padding" id="faq">
    <div class="container">
        <?php webseo_section_header('', 'Частые вопросы'); ?>
        <?php
        set_query_var('faq_data', $faq);
        get_template_part('parts/section', 'faq');
        ?>
    </div>
</section>
<?php endif; ?>

<!-- 10. QUIZ -->
<?php
$quiz_id = get_field('quiz_id');
// Auto-find quiz by service_category if not manually set
if (!$quiz_id) {
    $srv_terms = wp_get_post_terms($post_id, 'service_category', ['fields' => 'ids']);
    if ($srv_terms && !is_wp_error($srv_terms)) {
        $auto_quiz = get_posts([
            'post_type'      => 'quiz',
            'posts_per_page' => 1,
            'tax_query'      => [[
                'taxonomy' => 'service_category',
                'terms'    => $srv_terms,
            ]],
        ]);
        if ($auto_quiz) {
            $quiz_id = $auto_quiz[0]->ID;
        }
    }
}
if ($quiz_id) :
?>
<section class="section-padding bg-gray" id="quiz">
    <div class="container">
        <?php
        set_query_var('quiz_post_id', $quiz_id);
        get_template_part('parts/quiz', 'render');
        ?>
    </div>
</section>
<?php endif; ?>

<!-- 11. CTA -->
<?php
set_query_var('cta_data', [
    'title'    => get_field('cta_title') ?: 'Готовы обсудить проект?',
    'text'     => get_field('cta_desc'),
    'btn_text' => get_field('cta_btn_text') ?: 'Оставить заявку',
]);
get_template_part('parts/section', 'cta');
?>

<?php get_footer(); ?>
