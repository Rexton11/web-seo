</main><!-- #main -->

<?php
$logo_img   = webseo_option('logo_image');
$logo_text  = webseo_option('logo_text', 'DEV&SEO');
$phone      = webseo_option('phone');
$email      = webseo_option('email');
$copyright  = webseo_option('copyright', '© ' . date('Y') . ' Все права защищены.');
$socials    = webseo_option('socials');
$messengers = webseo_get_messengers();
?>

<footer class="footer" role="contentinfo">
    <div class="container">
        <div class="footer-content">
            <div class="footer-col">
                <a href="<?php echo esc_url(home_url('/')); ?>" class="logo">
                    <?php if ($logo_img) : ?>
                        <img src="<?php echo esc_url($logo_img['url']); ?>" alt="<?php echo esc_attr($logo_text); ?>" width="100" height="28" loading="lazy">
                    <?php else : ?>
                        <div class="logo-icon" style="width:24px;height:24px;font-size:0.9rem;"><i class="ph-bold ph-code"></i></div>
                        <?php echo esc_html($logo_text); ?>
                    <?php endif; ?>
                </a>
                <p class="footer-copy"><?php echo esc_html($copyright); ?></p>
            </div>

            <div class="footer-col">
                <nav class="footer-nav" aria-label="Меню подвала">
                    <?php
                    wp_nav_menu([
                        'theme_location' => 'footer',
                        'container'      => false,
                        'menu_class'     => 'footer-menu',
                        'fallback_cb'    => false,
                        'depth'          => 1,
                    ]);
                    ?>
                </nav>
            </div>

            <div class="footer-col">
                <?php if ($phone) : ?>
                    <a href="tel:<?php echo esc_attr(preg_replace('/[^\d+]/', '', $phone)); ?>" class="footer-phone"><?php echo esc_html($phone); ?></a>
                <?php endif; ?>
                <?php if ($email) : ?>
                    <a href="mailto:<?php echo esc_attr($email); ?>" class="footer-email"><?php echo esc_html($email); ?></a>
                <?php endif; ?>
                <?php if ($messengers) : ?>
                    <div class="footer-messengers">
                        <?php foreach ($messengers as $m) : ?>
                            <a href="<?php echo esc_url($m['url']); ?>" class="messenger-btn" target="_blank" rel="noopener" aria-label="<?php echo esc_attr($m['label']); ?>">
                                <i class="<?php echo esc_attr($m['icon']); ?>"></i>
                            </a>
                        <?php endforeach; ?>
                    </div>
                <?php endif; ?>
                <?php if ($socials) : ?>
                    <div class="footer-socials">
                        <?php foreach ($socials as $s) : ?>
                            <a href="<?php echo esc_url($s['url']); ?>" class="messenger-btn" target="_blank" rel="noopener" aria-label="<?php echo esc_attr($s['name']); ?>">
                                <i class="<?php echo esc_attr($s['icon']); ?>"></i>
                            </a>
                        <?php endforeach; ?>
                    </div>
                <?php endif; ?>
            </div>
        </div>
    </div>
</footer>

<?php get_template_part('parts/modal', 'form'); ?>

<?php wp_footer(); ?>
</body>
</html>
