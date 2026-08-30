<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <?php
    // Analytics head code
    $head_code = webseo_option('head_code');
    if ($head_code) echo $head_code;
    ?>
    <?php wp_head(); ?>
    <!-- Phosphor Icons -->
    <link rel="stylesheet" href="https://unpkg.com/@phosphor-icons/web@2.1.1/src/regular/style.css">
    <link rel="stylesheet" href="https://unpkg.com/@phosphor-icons/web@2.1.1/src/fill/style.css">
    <link rel="stylesheet" href="https://unpkg.com/@phosphor-icons/web@2.1.1/src/bold/style.css">
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>

<?php
$body_code = webseo_option('body_code');
if ($body_code) echo $body_code;
?>

<?php
$logo_img  = webseo_option('logo_image');
$logo_text = webseo_option('logo_text', 'DEV&SEO');
$phone     = webseo_option('phone');
$messengers = webseo_get_messengers();
$cta_text  = webseo_option('header_cta_text');
$cta_url   = webseo_option('header_cta_url');
?>

<div class="header-wrapper">
    <header class="header" id="header" role="banner">
        <!-- Logo -->
        <a href="<?php echo esc_url(home_url('/')); ?>" class="logo" aria-label="На главную">
            <?php if ($logo_img) : ?>
                <img src="<?php echo esc_url($logo_img['url']); ?>" alt="<?php echo esc_attr($logo_text); ?>" width="120" height="32" loading="eager">
            <?php else : ?>
                <div class="logo-icon"><i class="ph-bold ph-code"></i></div>
                <?php echo esc_html($logo_text); ?>
            <?php endif; ?>
        </a>

        <!-- Nav -->
        <nav class="nav-menu" role="navigation" aria-label="Основная навигация">
            <?php
            wp_nav_menu([
                'theme_location' => 'primary',
                'container'      => false,
                'items_wrap'     => '%3$s',
                'fallback_cb'    => false,
                'depth'          => 1,
                'walker'         => new Webseo_Mega_Menu_Walker(),
            ]);
            ?>
        </nav>

        <!-- Contacts -->
        <div class="header-contacts">
            <?php if ($phone) : ?>
                <a href="tel:<?php echo esc_attr(preg_replace('/[^\d+]/', '', $phone)); ?>" class="phone-number">
                    <?php echo esc_html($phone); ?>
                </a>
            <?php endif; ?>

            <?php if ($messengers) : ?>
                <div class="messengers">
                    <?php foreach ($messengers as $m) : ?>
                        <a href="<?php echo esc_url($m['url']); ?>" class="messenger-btn" target="_blank" rel="noopener" aria-label="<?php echo esc_attr($m['label']); ?>">
                            <i class="<?php echo esc_attr($m['icon']); ?>"></i>
                        </a>
                    <?php endforeach; ?>
                </div>
            <?php endif; ?>
        </div>

        <?php if ($cta_text) : ?>
            <a href="<?php echo esc_url($cta_url ?: '#callback'); ?>"
               <?php echo (!$cta_url || $cta_url === '#callback') ? 'data-modal="callback"' : ''; ?>
               class="header-cta btn btn-primary" style="padding:10px 24px;font-size:.9rem;">
                <?php echo esc_html($cta_text); ?>
            </a>
        <?php endif; ?>

        <!-- Mobile burger -->
        <button class="burger" id="burger" aria-label="Открыть меню" aria-expanded="false">
            <span></span><span></span><span></span>
        </button>
    </header>
</div>

<!-- Mobile menu -->
<div class="mobile-menu" id="mobileMenu" aria-hidden="true">
    <nav class="mobile-nav">
        <!-- Level 0: Main menu -->
        <div class="mob-level mob-level--main active" data-level="0">
            <?php
            $menu_items = wp_get_nav_menu_items(get_nav_menu_locations()['primary'] ?? 0);
            if ($menu_items) :
                foreach ($menu_items as $mi) :
                    $is_services = (mb_stripos($mi->title, 'Услуги') !== false);
            ?>
                <?php if ($is_services) : ?>
                    <button class="mob-link mob-link--arrow" data-goto="1">
                        <?php echo esc_html($mi->title); ?>
                        <i class="ph-bold ph-caret-right"></i>
                    </button>
                <?php else : ?>
                    <a href="<?php echo esc_url($mi->url); ?>" class="mob-link"><?php echo esc_html($mi->title); ?></a>
                <?php endif; ?>
            <?php endforeach; endif; ?>
        </div>

        <!-- Level 1: All services mega menu -->
        <div class="mob-level mob-level--mega" data-level="1">
            <button class="mob-back" data-goto="0"><i class="ph-bold ph-arrow-left"></i> Меню</button>
            <div class="mob-level__title">Услуги</div>
            <div class="mob-mega-scroll">
                <?php
                $mob_cats = get_terms(['taxonomy' => 'service_category', 'hide_empty' => true, 'orderby' => 'menu_order']);
                if ($mob_cats && !is_wp_error($mob_cats)) :
                    foreach ($mob_cats as $mcat) :
                        $mob_services = get_posts(['post_type' => 'service', 'posts_per_page' => 30, 'orderby' => 'menu_order', 'order' => 'ASC', 'tax_query' => [['taxonomy' => 'service_category', 'terms' => $mcat->term_id]]]);
                ?>
                    <div class="mob-mega-group">
                        <div class="mob-mega-group__title">
                            <a href="<?php echo esc_url(get_term_link($mcat)); ?>"><?php echo esc_html($mcat->name); ?></a>
                        </div>
                        <?php foreach ($mob_services as $ms) : ?>
                            <a href="<?php echo get_permalink($ms); ?>" class="mob-mega-link"><?php echo esc_html($ms->post_title); ?></a>
                        <?php endforeach; ?>
                    </div>
                <?php endforeach; endif; ?>
                <a href="<?php echo esc_url(get_post_type_archive_link('service')); ?>" class="mob-link mob-link--muted" style="margin-top:8px;">
                    Все услуги <i class="ph-bold ph-arrow-right" style="font-size:.75rem;"></i>
                </a>
            </div>
        </div>
    </nav>
    <?php if ($phone) : ?>
        <a href="tel:<?php echo esc_attr(preg_replace('/[^\d+]/', '', $phone)); ?>" class="mobile-phone"><?php echo esc_html($phone); ?></a>
    <?php endif; ?>
    <?php if ($messengers) : ?>
        <div class="mobile-messengers">
            <?php foreach ($messengers as $m) : ?>
                <a href="<?php echo esc_url($m['url']); ?>" class="messenger-btn" target="_blank" rel="noopener" aria-label="<?php echo esc_attr($m['label']); ?>">
                    <i class="<?php echo esc_attr($m['icon']); ?>"></i>
                </a>
            <?php endforeach; ?>
        </div>
    <?php endif; ?>
</div>

<main id="main" role="main">
