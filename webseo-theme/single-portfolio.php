<?php get_header(); webseo_breadcrumbs(); $id = get_the_ID(); ?>

<article class="portfolio-single section-padding">
    <div class="container container--narrow">
        <header class="portfolio-single__header">
            <?php if (has_post_thumbnail()) : ?>
                <div class="portfolio-single__hero">
                    <?php the_post_thumbnail('hero-bg', ['loading' => 'eager']); ?>
                </div>
            <?php endif; ?>
            <h1><?php the_title(); ?></h1>
            <?php if ($client = get_field('client')) : ?>
                <p class="portfolio-single__client"><strong>Клиент:</strong> <?php echo esc_html($client); ?></p>
            <?php endif; ?>
            <?php $tags = get_the_terms($id, 'portfolio_tag'); if ($tags) : ?>
                <div class="portfolio-tags">
                    <?php foreach ($tags as $tag) : ?>
                        <span class="tag"><?php echo esc_html($tag->name); ?></span>
                    <?php endforeach; ?>
                </div>
            <?php endif; ?>
        </header>

        <?php if ($task = get_field('task')) : ?>
            <section class="portfolio-block">
                <h2>Задача</h2>
                <div class="prose"><?php echo $task; ?></div>
            </section>
        <?php endif; ?>

        <?php if ($solution = get_field('solution')) : ?>
            <section class="portfolio-block">
                <h2>Решение</h2>
                <div class="prose"><?php echo $solution; ?></div>
            </section>
        <?php endif; ?>

        <?php if ($gallery = get_field('gallery')) : ?>
            <section class="portfolio-block">
                <div class="portfolio-gallery">
                    <?php foreach ($gallery as $img) : ?>
                        <img src="<?php echo esc_url($img['sizes']['large']); ?>" alt="<?php echo esc_attr($img['alt']); ?>" loading="lazy" width="<?php echo $img['sizes']['large-width']; ?>" height="<?php echo $img['sizes']['large-height']; ?>">
                    <?php endforeach; ?>
                </div>
            </section>
        <?php endif; ?>

        <?php if ($results = get_field('results')) : ?>
            <section class="portfolio-block">
                <h2>Результаты</h2>
                <div class="results-grid">
                    <?php foreach ($results as $r) : ?>
                        <div class="result-card" data-reveal>
                            <div class="result-metric"><?php echo esc_html($r['metric']); ?></div>
                            <div class="result-values">
                                <span class="result-before"><?php echo esc_html($r['before']); ?></span>
                                <i class="ph-bold ph-arrow-right"></i>
                                <span class="result-after"><?php echo esc_html($r['after']); ?></span>
                            </div>
                        </div>
                    <?php endforeach; ?>
                </div>
            </section>
        <?php endif; ?>

        <?php if ($tech = get_field('technologies')) : ?>
            <section class="portfolio-block">
                <h2>Технологии</h2>
                <div class="tech-stack">
                    <?php foreach ($tech as $t) : ?>
                        <span class="tech-item"><?php echo webseo_icon($t['icon']); ?> <?php echo esc_html($t['name']); ?></span>
                    <?php endforeach; ?>
                </div>
            </section>
        <?php endif; ?>

        <?php if ($url = get_field('project_url')) : ?>
            <a href="<?php echo esc_url($url); ?>" class="btn btn-secondary" target="_blank" rel="noopener">
                Перейти на сайт <i class="ph ph-arrow-square-out"></i>
            </a>
        <?php endif; ?>

        <?php
        $tm_id = get_field('testimonial_id');
        if ($tm_id) :
            set_query_var('card_post', get_post($tm_id));
            get_template_part('parts/card', 'testimonial');
        endif;
        ?>
    </div>
</article>

<?php
set_query_var('cta_data', [
    'title' => 'Хотите такой же результат?',
    'text' => 'Обсудим ваш проект и предложим решение.',
    'btn_text' => 'Обсудить проект',
]);
get_template_part('parts/section', 'cta');
get_footer();
