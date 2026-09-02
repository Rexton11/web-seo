# Транскрибатор видео

Telegram-бот и веб-интерфейс для транскрипции видео с YouTube и загруженных файлов. Работает локально через OpenAI Whisper.

## Установка

```bash
cd video-transcriber
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Также нужен ffmpeg:
```bash
# Ubuntu/Debian
sudo apt install ffmpeg

# macOS
brew install ffmpeg
```

## Telegram-бот (основной способ)

### 1. Создай бота

Напиши [@BotFather](https://t.me/BotFather) в Telegram:
1. `/newbot`
2. Дай имя и username
3. Скопируй токен

### 2. Запусти

```bash
source .venv/bin/activate
export TELEGRAM_BOT_TOKEN='123456:ABC-DEF...'
python bot.py
```

### Что умеет бот

- Отправь **видео или аудиофайл** — получишь транскрипцию
- Отправь **ссылку на YouTube** — скачает и транскрибирует
- Отправь **голосовое сообщение** — тоже расшифрует
- Длинные тексты отправляет файлом `.txt`

### Ограничение Telegram

Telegram позволяет ботам скачивать файлы до **20 МБ**. Для файлов больше 20 МБ используй веб-интерфейс или запускай [Telegram Bot API сервер](https://github.com/tdlib/telegram-bot-api) локально (снимает лимит до 2 ГБ).

## Веб-интерфейс (альтернатива)

```bash
source .venv/bin/activate
python app.py
```

Открой http://localhost:5000 — drag-and-drop файлы до 500 МБ.

## Модели Whisper

По умолчанию — `base`. Для лучшего качества измени в `bot.py` / `app.py`:

| Модель | Размер | Качество |
|--------|--------|----------|
| `tiny` | 39 МБ | Быстро, низкое качество |
| `base` | 74 МБ | Баланс скорости и качества |
| `small` | 244 МБ | Хорошее качество |
| `medium` | 769 МБ | Высокое качество |
| `large` | 1.5 ГБ | Максимальное качество |
