<?php
/**
 * Template Name: Контакты
 */
get_header(); webseo_breadcrumbs();
$messengers = webseo_get_messengers();
$phone = webseo_option('phone');
$email = webseo_option('email');
?>
<section class="section-padding">
    <div class="container">
        <div class="section-header">
            <h1><?php echo esc_html(get_field('contacts_title') ?: get_the_title()); ?></h1>
            <?php if ($sub = get_field('contacts_subtitle')) : ?>
                <p><?php echo esc_html($sub); ?></p>
            <?php endif; ?>
        </div>
        <div class="contacts-grid">
            <div class="contacts-form">
                <?php get_template_part('parts/contact', 'form'); ?>
            </div>
            <div class="contacts-info">
                <?php if ($phone) : ?>
                    <div class="contacts-item">
                        <i class="ph ph-phone"></i>
                        <a href="tel:<?php echo esc_attr(preg_replace('/[^\d+]/', '', $phone)); ?>"><?php echo esc_html($phone); ?></a>
                    </div>
                <?php endif; ?>
                <?php if ($email) : ?>
                    <div class="contacts-item">
                        <i class="ph ph-envelope"></i>
                        <a href="mailto:<?php echo esc_attr($email); ?>"><?php echo esc_html($email); ?></a>
                    </div>
                <?php endif; ?>
                <?php if ($hours = get_field('work_hours')) : ?>
                    <div class="contacts-item">
                        <i class="ph ph-clock"></i>
                        <span><?php echo esc_html($hours); ?></span>
                    </div>
                <?php endif; ?>
                <?php if ($messengers) : ?>
                    <div class="contacts-messengers">
                        <?php foreach ($messengers as $m) : ?>
                            <a href="<?php echo esc_url($m['url']); ?>" class="btn btn-secondary" target="_blank" rel="noopener">
                                <i class="<?php echo esc_attr($m['icon']); ?>"></i> <?php echo esc_html($m['label']); ?>
                            </a>
                        <?php endforeach; ?>
                    </div>
                <?php endif; ?>
            </div>
        </div>
    </div>
</section>
<?php get_footer(); ?>
