<?php
/**
 * Template: Single Portfolio / Case (selling structure)
 *
 * @package WebSEO
 */

get_header();
webseo_breadcrumbs();
$id = get_the_ID();

$client      = get_field('client');
$niche       = get_field('niche');
$task        = get_field('task');
$challenge   = get_field('challenge');
$solution    = get_field('solution');
$approach    = get_field('approach');
$results     = get_field('results');
$gallery     = get_field('gallery');
$tech        = get_field('technologies');
$timeline    = get_field('timeline');
$project_url = get_field('project_url');
$tm_id       = get_field('testimonial_id');
$tags        = get_the_terms($id, 'portfolio_tag');
?>

<!-- 1. HERO -->
<section class="case-hero">
    <div class="hero-decor">
        <div class="hero-grid"></div>
        <div class="hero-blob hero-blob--1"></div>
        <div class="hero-glow"></div>
    </div>
    <div class="container" data-reveal="scale">
        <div class="case-hero__content">
            <?php if ($tags) : ?>
                <div class="portfolio-tags">
                    <?php foreach ($tags as $tag) : ?>
                        <span class="tag"><?php echo esc_html($tag->name); ?></span>
                    <?php endforeach; ?>
                </div>
            <?php endif; ?>
            <h1 class="js-kinetic"><?php the_title(); ?></h1>
            <?php if ($client || $niche) : ?>
                <p class="case-hero__meta">
                    <?php if ($client) : ?><span><i class="ph ph-buildings"></i> <?php echo esc_html($client); ?></span><?php endif; ?>
                    <?php if ($niche) : ?><span><i class="ph ph-tag"></i> <?php echo esc_html($niche); ?></span><?php endif; ?>
                </p>
            <?php endif; ?>
            <?php if (has_excerpt()) : ?>
                <p class="case-hero__desc"><?php echo get_the_excerpt(); ?></p>
            <?php endif; ?>
            <div class="case-hero__actions">
                <a href="#case-results" class="btn btn-primary" data-magnetic>
                    Смотреть результаты <i class="ph-bold ph-arrow-down"></i>
                </a>
                <?php if ($project_url) : ?>
                    <a href="<?php echo esc_url($project_url); ?>" class="btn btn-secondary" target="_blank" rel="noopener">
                        Открыть сайт <i class="ph ph-arrow-square-out"></i>
                    </a>
                <?php endif; ?>
            </div>
        </div>
        <?php if (has_post_thumbnail()) : ?>
            <div class="case-hero__media">
                <?php the_post_thumbnail('hero-bg', ['loading' => 'eager']); ?>
            </div>
        <?php endif; ?>
    </div>
</section>

<!-- 2. TASK / CHALLENGE -->
<?php if ($task || $challenge) : ?>
<section class="section-padding case-task">
    <div class="container">
        <div class="section-header" data-reveal>
            <span class="section-badge">Задача</span>
            <h2>С чем обратился клиент</h2>
        </div>
        <div class="case-task__grid<?php echo ($task && $challenge) ? '' : ' case-task__grid--single'; ?>">
            <?php if ($task) : ?>
                <div class="case-task__block" data-reveal>
                    <div class="case-task__icon"><i class="ph-bold ph-target"></i></div>
                    <h3>Задача проекта</h3>
                    <div class="prose"><?php echo $task; ?></div>
                </div>
            <?php endif; ?>
            <?php if ($challenge) : ?>
                <div class="case-task__block case-task__block--dark" data-reveal>
                    <div class="case-task__icon"><i class="ph-bold ph-warning-circle"></i></div>
                    <h3>Сложности</h3>
                    <div class="prose"><?php echo $challenge; ?></div>
                </div>
            <?php endif; ?>
        </div>
    </div>
</section>
<?php endif; ?>

<!-- 3. APPROACH / STAGES -->
<?php if ($approach) : ?>
<section class="section-padding bg-gray case-approach">
    <div class="container">
        <div class="section-header" data-reveal>
            <span class="section-badge">Подход</span>
            <h2>Как мы решали задачу</h2>
        </div>
        <div class="case-steps">
            <?php foreach ($approach as $i => $step) : ?>
                <div class="case-step" data-reveal>
                    <div class="case-step__num"><?php echo str_pad($i + 1, 2, '0', STR_PAD_LEFT); ?></div>
                    <div class="case-step__body">
                        <h3><?php echo esc_html($step['title']); ?></h3>
                        <p><?php echo esc_html($step['text']); ?></p>
                    </div>
                </div>
            <?php endforeach; ?>
        </div>
    </div>
</section>
<?php endif; ?>

<!-- 4. SOLUTION -->
<?php if ($solution) : ?>
<section class="section-padding case-solution">
    <div class="container">
        <div class="section-header" data-reveal>
            <span class="section-badge">Решение</span>
            <h2>Что мы сделали</h2>
        </div>
        <div class="container--narrow" style="margin:0 auto;" data-reveal>
            <div class="prose"><?php echo $solution; ?></div>
        </div>
    </div>
</section>
<?php endif; ?>

<!-- 5. GALLERY -->
<?php if ($gallery) : ?>
<section class="section-padding bg-gray case-gallery-section">
    <div class="container">
        <div class="section-header" data-reveal>
            <span class="section-badge">Визуал</span>
            <h2>Скриншоты проекта</h2>
        </div>
        <div class="case-gallery" data-reveal>
            <?php foreach ($gallery as $img) : ?>
                <div class="case-gallery__item">
                    <img src="<?php echo esc_url($img['sizes']['large']); ?>" alt="<?php echo esc_attr($img['alt']); ?>" loading="lazy" width="<?php echo $img['sizes']['large-width']; ?>" height="<?php echo $img['sizes']['large-height']; ?>">
                </div>
            <?php endforeach; ?>
        </div>
    </div>
</section>
<?php endif; ?>

<!-- 6. RESULTS -->
<?php if ($results) : ?>
<section class="section-padding case-results" id="case-results">
    <div class="container">
        <div class="section-header" data-reveal>
            <span class="section-badge">Результаты</span>
            <h2>Что получил клиент</h2>
        </div>
        <div class="case-results__grid">
            <?php foreach ($results as $r) : ?>
                <div class="case-result-card" data-reveal>
                    <div class="case-result-card__metric"><?php echo esc_html($r['metric']); ?></div>
                    <div class="case-result-card__before">
                        <span class="case-result-card__label">Было</span>
                        <span class="case-result-card__value"><?php echo esc_html($r['before']); ?></span>
                    </div>
                    <div class="case-result-card__after">
                        <span class="case-result-card__label">Стало</span>
                        <span class="case-result-card__value"><?php echo esc_html($r['after']); ?></span>
                    </div>
                </div>
            <?php endforeach; ?>
        </div>
    </div>
</section>
<?php endif; ?>

<!-- 7. TECHNOLOGIES -->
<?php if ($tech) : ?>
<section class="section-padding bg-gray case-tech">
    <div class="container">
        <div class="section-header" data-reveal>
            <span class="section-badge">Стек</span>
            <h2>Технологии проекта</h2>
        </div>
        <div class="case-tech__grid" data-reveal>
            <?php foreach ($tech as $t) : ?>
                <div class="case-tech__item">
                    <?php if ($t['icon']) : ?>
                        <span class="case-tech__icon"><?php echo webseo_icon($t['icon']); ?></span>
                    <?php endif; ?>
                    <span><?php echo esc_html($t['name']); ?></span>
                </div>
            <?php endforeach; ?>
        </div>
    </div>
</section>
<?php endif; ?>

<!-- 8. TIMELINE -->
<?php if ($timeline) : ?>
<section class="section-padding case-timeline">
    <div class="container container--narrow">
        <div class="section-header" data-reveal>
            <span class="section-badge">Хронология</span>
            <h2>Ход проекта</h2>
        </div>
        <div class="case-timeline__list">
            <?php foreach ($timeline as $event) : ?>
                <div class="case-timeline__item" data-reveal>
                    <div class="case-timeline__dot"></div>
                    <div class="case-timeline__body">
                        <div class="case-timeline__period"><?php echo esc_html($event['period']); ?></div>
                        <h3><?php echo esc_html($event['title']); ?></h3>
                        <p><?php echo esc_html($event['text']); ?></p>
                    </div>
                </div>
            <?php endforeach; ?>
        </div>
    </div>
</section>
<?php endif; ?>

<!-- 9. TESTIMONIAL -->
<?php if ($tm_id) : ?>
<section class="section-padding bg-gray">
    <div class="container container--narrow">
        <div class="section-header" data-reveal>
            <span class="section-badge">Отзыв</span>
            <h2>Что говорит клиент</h2>
        </div>
        <?php
        set_query_var('card_post', get_post($tm_id));
        get_template_part('parts/card', 'testimonial');
        ?>
    </div>
</section>
<?php endif; ?>

<!-- 10. SIMILAR CASES -->
<?php
$similar_args = [
    'post_type'      => 'portfolio',
    'posts_per_page' => 3,
    'post__not_in'   => [$id],
    'orderby'        => 'rand',
];
if ($tags) {
    $similar_args['tax_query'] = [[
        'taxonomy' => 'portfolio_tag',
        'terms'    => wp_list_pluck($tags, 'term_id'),
    ]];
}
$similar = get_posts($similar_args);
if ($similar) :
?>
<section class="section-padding case-similar">
    <div class="container">
        <div class="section-header" data-reveal>
            <span class="section-badge">Ещё кейсы</span>
            <h2>Похожие проекты</h2>
        </div>
        <div class="grid-3" data-reveal>
            <?php foreach ($similar as $sp) :
                set_query_var('card_post', $sp);
                get_template_part('parts/card', 'portfolio');
            endforeach; ?>
        </div>
        <div class="section-footer" data-reveal>
            <a href="<?php echo esc_url(get_post_type_archive_link('portfolio')); ?>" class="btn btn-secondary">
                Все кейсы <i class="ph-bold ph-arrow-right"></i>
            </a>
        </div>
    </div>
</section>
<?php endif; ?>

<!-- 11. CTA -->
<?php
set_query_var('cta_data', [
    'title' => 'Хотите такой же результат?',
    'text'  => 'Обсудим ваш проект и предложим решение.',
    'btn_text' => 'Обсудить проект',
]);
get_template_part('parts/section', 'cta');
get_footer();
