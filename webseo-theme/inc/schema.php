<?php
/**
 * Schema JSON-LD
 *
 * @package WebSEO
 */

defined('ABSPATH') || exit;

add_action('wp_head', 'webseo_schema_output', 99);

function webseo_schema_output(): void {
    $schema = [];

    // Front page — ProfessionalService
    if (is_front_page()) {
        $schema = [
            '@context' => 'https://schema.org',
            '@type'    => 'ProfessionalService',
            'name'     => get_bloginfo('name'),
            'url'      => home_url('/'),
            'telephone'=> webseo_option('phone'),
            'email'    => webseo_option('email'),
        ];
    }

    // Single service — Service + FAQPage
    if (is_singular('service')) {
        $schema = [
            '@context' => 'https://schema.org',
            '@type'    => 'Service',
            'name'     => get_the_title(),
            'url'      => get_permalink(),
            'provider' => [
                '@type' => 'ProfessionalService',
                'name'  => get_bloginfo('name'),
            ],
        ];

        // FAQ Schema
        $faq_items = get_field('faq_items');
        if ($faq_items) {
            $faq_schema = [
                '@context'   => 'https://schema.org',
                '@type'      => 'FAQPage',
                'mainEntity' => [],
            ];
            foreach ($faq_items as $item) {
                $faq_schema['mainEntity'][] = [
                    '@type'          => 'Question',
                    'name'           => $item['question'],
                    'acceptedAnswer' => [
                        '@type' => 'Answer',
                        'text'  => wp_strip_all_tags($item['answer']),
                    ],
                ];
            }
            echo '<script type="application/ld+json">' . wp_json_encode($faq_schema, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . '</script>' . "\n";
        }
    }

    if (!empty($schema)) {
        echo '<script type="application/ld+json">' . wp_json_encode($schema, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . '</script>' . "\n";
    }
}
