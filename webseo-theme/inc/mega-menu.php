<?php
/**
 * Mega Menu Walker — adds mega dropdown to menu items
 * linked to service archive or with CSS class 'mega-menu'
 *
 * @package WebSEO
 */

defined('ABSPATH') || exit;

class Webseo_Mega_Menu_Walker extends Walker_Nav_Menu {

    public function start_el(&$output, $item, $depth = 0, $args = null, $id = 0) {
        $is_mega = $this->is_mega_item($item);

        $classes = ['menu-item'];
        if ($is_mega) {
            $classes[] = 'nav-item--mega';
        }
        if ($item->current) {
            $classes[] = 'current-menu-item';
        }

        $output .= '<li class="' . implode(' ', $classes) . '">';
        $output .= '<a href="' . esc_url($item->url) . '">';
        $output .= esc_html($item->title);
        if ($is_mega) {
            $output .= ' <i class="ph ph-caret-down" style="font-size:.75rem;opacity:.5;"></i>';
        }
        $output .= '</a>';

        // Inject mega menu after the link
        if ($is_mega) {
            ob_start();
            get_template_part('parts/mega', 'menu');
            $output .= ob_get_clean();
        }
    }

    public function end_el(&$output, $item, $depth = 0, $args = null) {
        $output .= '</li>';
    }

    /**
     * Check if menu item should trigger mega menu.
     * Matches: URL = service archive, or CSS class contains 'mega-menu'
     */
    private function is_mega_item($item): bool {
        $archive_url = get_post_type_archive_link('service');

        // Match by URL
        if ($archive_url && trailingslashit($item->url) === trailingslashit($archive_url)) {
            return true;
        }

        // Match by custom CSS class
        if (in_array('mega-menu', $item->classes ?? [], true)) {
            return true;
        }

        // Match by title containing "Услуги"
        if (mb_stripos($item->title, 'Услуги') !== false) {
            return true;
        }

        return false;
    }
}
