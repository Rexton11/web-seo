<?php
$quiz_id = get_query_var('quiz_post_id');
if (!$quiz_id) return;
$steps      = get_field('quiz_steps', $quiz_id);
$show_name  = get_field('show_name', $quiz_id);
$show_phone = get_field('show_phone', $quiz_id);
$show_email = get_field('show_email', $quiz_id);
$btn_text   = get_field('submit_text', $quiz_id) ?: 'Получить консультацию';
$title      = get_the_title($quiz_id);
$subtitle   = get_field('quiz_subtitle', $quiz_id);
$side_image = get_field('quiz_side_image', $quiz_id);
if (!$steps) return;
$total = count($steps) + 1;
?>
<div class="quiz" data-quiz-id="<?php echo esc_attr($quiz_id); ?>" data-total="<?php echo esc_attr($total); ?>" data-submit-text="<?php echo esc_attr($btn_text); ?>">
    <div class="quiz-body">
        <div class="quiz-header">
            <h2><?php echo esc_html($title); ?></h2>
            <?php if ($subtitle) : ?><p><?php echo esc_html($subtitle); ?></p><?php endif; ?>
            <div class="quiz-progress"><div class="quiz-progress__bar" style="width:<?php echo round(1/$total*100); ?>%"></div></div>
            <div class="quiz-counter">Шаг <span class="quiz-current">1</span> из <?php echo $total; ?></div>
        </div>
        <?php foreach ($steps as $i => $step) : ?>
            <div class="quiz-step" data-step="<?php echo $i; ?>" <?php echo $i > 0 ? 'hidden' : ''; ?>>
                <h3><?php echo esc_html($step['question']); ?></h3>
                <?php if ($step['type'] === 'text') : ?>
                    <textarea class="quiz-input" name="answer_<?php echo $i; ?>" rows="3" placeholder="Ваш ответ..."></textarea>
                <?php else :
                    foreach (($step['options'] ?? []) as $opt) :
                        $type = $step['type'] === 'radio' ? 'radio' : 'checkbox';
                        $name = $step['type'] === 'radio' ? "answer_{$i}" : "answer_{$i}[]";
                ?>
                    <label class="quiz-option">
                        <input type="<?php echo $type; ?>" name="<?php echo $name; ?>" value="<?php echo esc_attr($opt['text']); ?>">
                        <span><?php echo esc_html($opt['text']); ?></span>
                    </label>
                <?php endforeach; endif; ?>
            </div>
        <?php endforeach; ?>
        <div class="quiz-step quiz-step--contact" data-step="<?php echo count($steps); ?>" hidden>
            <h3>Куда отправить результат?</h3>
            <?php if ($show_name) : ?><input type="text" name="contact_name" class="quiz-input" placeholder="Ваше имя" required><?php endif; ?>
            <?php if ($show_phone) : ?><input type="tel" name="contact_phone" class="quiz-input" placeholder="Телефон" required><?php endif; ?>
            <?php if ($show_email) : ?><input type="email" name="contact_email" class="quiz-input" placeholder="Email"><?php endif; ?>
        </div>
        <div class="quiz-nav">
            <button class="btn btn-secondary quiz-prev" hidden>← Назад</button>
            <button class="btn btn-primary quiz-next">Далее <i class="ph-bold ph-arrow-right"></i></button>
            </div>
        <div class="quiz-success" hidden></div>
    </div>
    <div class="quiz-side<?php echo $side_image ? ' quiz-side--image' : ''; ?>">
        <?php if ($side_image) : ?>
            <img src="<?php echo esc_url($side_image['sizes']['medium_large'] ?? $side_image['url']); ?>" alt="" class="quiz-side__img">
            <div class="quiz-side__overlay">
                <div class="quiz-side__badges">
                    <span class="quiz-side__badge"><i class="ph ph-clock"></i> Ответ за час</span>
                    <span class="quiz-side__badge"><i class="ph ph-shield-check"></i> Бесплатно</span>
                </div>
            </div>
        <?php else : ?>
            <div class="quiz-side__icon"><i class="ph ph-chat-circle-dots"></i></div>
            <div class="quiz-side__title">Бесплатная<br>консультация</div>
            <div class="quiz-side__text">Ответьте на несколько вопросов — подготовим персональное предложение</div>
            <div class="quiz-side__badges">
                <span class="quiz-side__badge"><i class="ph ph-clock"></i> Ответ за час</span>
                <span class="quiz-side__badge"><i class="ph ph-shield-check"></i> Бесплатно</span>
            </div>
        <?php endif; ?>
    </div>
</div>
<div style="text-align:center;margin-top:20px;">
    <a href="#callback" data-modal="callback" class="btn btn-secondary">
        Обсудить проект напрямую <i class="ph-bold ph-arrow-right"></i>
    </a>
</div>