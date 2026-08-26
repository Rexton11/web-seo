<?php
defined('ABSPATH') || exit;

$categories = get_terms([
    'taxonomy'   => 'service_category',
    'hide_empty' => true,
    'orderby'    => 'menu_order',
    'order'      => 'ASC',
]);

if (empty($categories) || is_wp_error($categories)) return;
?>
<div class="mega-menu" id="megaMenu">
    <div class="mega-menu__inner">
        <div class="mega-menu__layout">
            <div class="mega-menu__cats">
                <?php foreach ($categories as $i => $cat) : ?>
                    <a href="<?php echo esc_url(get_term_link($cat)); ?>"
                       class="mega-menu__cat<?php echo $i === 0 ? ' active' : ''; ?>"
                       data-cat="<?php echo esc_attr($cat->slug); ?>">
                        <?php echo esc_html($cat->name); ?>
                        <i class="ph ph-caret-right"></i>
                    </a>
                <?php endforeach; ?>
                <a href="<?php echo esc_url(get_post_type_archive_link('service')); ?>" class="mega-menu__all">
                    Все услуги <i class="ph-bold ph-arrow-right"></i>
                </a>
            </div>
            <div class="mega-menu__services">
                <?php foreach ($categories as $i => $cat) :
                    $services = get_posts([
                        'post_type'      => 'service',
                        'posts_per_page' => 12,
                        'orderby'        => 'menu_order',
                        'order'          => 'ASC',
                        'tax_query'      => [[
                            'taxonomy' => 'service_category',
                            'terms'    => $cat->term_id,
                        ]],
                    ]);
                ?>
                    <div class="mega-menu__panel<?php echo $i === 0 ? ' active' : ''; ?>"
                         data-cat="<?php echo esc_attr($cat->slug); ?>">
                        <?php if ($services) : ?>
                            <?php foreach ($services as $s) :
                                $icon = get_field('service_icon', $s->ID);
                            ?>
                                <a href="<?php echo get_permalink($s); ?>" class="mega-menu__link">
                                    <?php if ($icon) : ?>
                                        <span class="mega-menu__icon"><?php echo webseo_icon($icon); ?></span>
                                    <?php endif; ?>
                                    <span>
                                        <strong><?php echo esc_html($s->post_title); ?></strong>
                                        <?php if ($s->post_excerpt) : ?>
                                            <small><?php echo esc_html(wp_trim_words($s->post_excerpt, 8)); ?></small>
                                        <?php endif; ?>
                                    </span>
                                </a>
                            <?php endforeach; ?>
                        <?php else : ?>
                            <p class="mega-menu__empty">Услуги скоро появятся</p>
                        <?php endif; ?>
                    </div>
                <?php endforeach; ?>
            </div>
        </div>
    </div>
</div>
