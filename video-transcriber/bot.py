import os
import re
import uuid
import shutil
import subprocess
import logging
from pathlib import Path

import whisper
from telegram import Update
from telegram.ext import (
    Application,
    CommandHandler,
    MessageHandler,
    filters,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "")
UPLOAD_DIR = Path(__file__).parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

YOUTUBE_RE = re.compile(
    r"(https?://)?(www\.)?(youtube\.com/watch\?v=|youtu\.be/|youtube\.com/shorts/)[\w\-]+"
)

_model = None


def get_model():
    global _model
    if _model is None:
        _model = whisper.load_model("base")
    return _model


def transcribe_file(path: Path) -> str:
    model = get_model()
    result = model.transcribe(str(path), language=None)
    return result["text"]


def download_youtube(url: str, job_dir: Path) -> Path:
    audio_path = job_dir / "audio.mp3"
    subprocess.run(
        [
            "yt-dlp",
            "--no-playlist",
            "-x",
            "--audio-format", "mp3",
            "--audio-quality", "5",
            "-o", str(audio_path),
            url,
        ],
        check=True,
        capture_output=True,
        text=True,
        timeout=300,
    )
    if not audio_path.exists():
        candidates = list(job_dir.glob("audio.*"))
        if candidates:
            return candidates[0]
    return audio_path


async def cmd_start(update: Update, context):
    await update.message.reply_text(
        "Привет! Я транскрибирую видео и аудио.\n\n"
        "Что умею:\n"
        "— Отправь мне видео или аудиофайл\n"
        "— Отправь ссылку на YouTube\n"
        "— Отправь голосовое сообщение\n\n"
        "Я верну текстовую расшифровку."
    )


async def handle_youtube(update: Update, context):
    url = update.message.text.strip()
    match = YOUTUBE_RE.search(url)
    if not match:
        await update.message.reply_text("Не похоже на ссылку YouTube. Отправь видео/аудио файл или ссылку.")
        return

    msg = await update.message.reply_text("⏳ Скачиваю видео с YouTube...")
    job_dir = UPLOAD_DIR / uuid.uuid4().hex[:12]
    job_dir.mkdir(parents=True, exist_ok=True)

    try:
        audio_path = download_youtube(match.group(0), job_dir)
        await msg.edit_text("🔄 Транскрибирую...")
        text = transcribe_file(audio_path)
        await send_result(update, text)
        await msg.delete()
    except subprocess.CalledProcessError as e:
        await msg.edit_text(f"Ошибка при скачивании: {e.stderr[:300]}")
    except Exception as e:
        await msg.edit_text(f"Ошибка: {e}")
    finally:
        shutil.rmtree(job_dir, ignore_errors=True)


async def handle_file(update: Update, context):
    message = update.message
    if message.video:
        file = message.video
        ext = ".mp4"
    elif message.audio:
        file = message.audio
        ext = Path(message.audio.file_name or "audio.mp3").suffix or ".mp3"
    elif message.voice:
        file = message.voice
        ext = ".ogg"
    elif message.video_note:
        file = message.video_note
        ext = ".mp4"
    elif message.document:
        file = message.document
        name = message.document.file_name or "file"
        ext = Path(name).suffix or ".mp4"
    else:
        return

    if file.file_size and file.file_size > 500 * 1024 * 1024:
        await message.reply_text("Файл слишком большой (максимум 500 МБ).")
        return

    msg = await message.reply_text("⏳ Загружаю файл...")
    job_dir = UPLOAD_DIR / uuid.uuid4().hex[:12]
    job_dir.mkdir(parents=True, exist_ok=True)
    src_path = job_dir / f"source{ext}"

    try:
        tg_file = await file.get_file()
        await tg_file.download_to_drive(str(src_path))
        await msg.edit_text("🔄 Транскрибирую...")
        text = transcribe_file(src_path)
        await send_result(update, text)
        await msg.delete()
    except Exception as e:
        await msg.edit_text(f"Ошибка: {e}")
    finally:
        shutil.rmtree(job_dir, ignore_errors=True)


async def send_result(update: Update, text: str):
    if len(text) <= 4000:
        await update.message.reply_text(text)
    else:
        # Telegram message limit ~4096 chars, send as file
        job_dir = UPLOAD_DIR / uuid.uuid4().hex[:8]
        job_dir.mkdir(parents=True, exist_ok=True)
        txt_path = job_dir / "transcript.txt"
        txt_path.write_text(text, encoding="utf-8")
        await update.message.reply_document(
            document=open(txt_path, "rb"),
            filename="transcript.txt",
            caption="Транскрипция готова (текст длинный, отправляю файлом)."
        )
        shutil.rmtree(job_dir, ignore_errors=True)


async def handle_text(update: Update, context):
    text = update.message.text or ""
    if YOUTUBE_RE.search(text):
        await handle_youtube(update, context)
    else:
        await update.message.reply_text(
            "Отправь мне:\n"
            "— Видео или аудиофайл\n"
            "— Ссылку на YouTube\n"
            "— Голосовое сообщение"
        )


def main():
    if not BOT_TOKEN:
        print("Установи переменную TELEGRAM_BOT_TOKEN")
        print("  export TELEGRAM_BOT_TOKEN='123456:ABC...'")
        return

    get_model()
    logger.info("Whisper model loaded")

    app = Application.builder().token(BOT_TOKEN).build()
    app.add_handler(CommandHandler("start", cmd_start))
    app.add_handler(MessageHandler(filters.VIDEO | filters.AUDIO | filters.VOICE | filters.VIDEO_NOTE | filters.Document.ALL, handle_file))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_text))

    logger.info("Bot started")
    app.run_polling()


if __name__ == "__main__":
    main()
