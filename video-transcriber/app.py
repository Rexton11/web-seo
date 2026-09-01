import os
import uuid
import shutil
import subprocess
import threading
from pathlib import Path

from flask import Flask, render_template, request, jsonify

import whisper

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 500 * 1024 * 1024  # 500 MB

UPLOAD_DIR = Path(__file__).parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

model_lock = threading.Lock()
_model = None


def get_model():
    global _model
    if _model is None:
        with model_lock:
            if _model is None:
                _model = whisper.load_model("base")
    return _model


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/transcribe/upload", methods=["POST"])
def transcribe_upload():
    file = request.files.get("file")
    if not file or file.filename == "":
        return jsonify({"error": "Файл не выбран"}), 400

    job_id = uuid.uuid4().hex[:12]
    job_dir = UPLOAD_DIR / job_id
    job_dir.mkdir(parents=True, exist_ok=True)

    ext = Path(file.filename).suffix or ".mp4"
    src_path = job_dir / f"source{ext}"
    file.save(str(src_path))

    try:
        text = _transcribe_file(src_path)
        return jsonify({"text": text})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        shutil.rmtree(job_dir, ignore_errors=True)


@app.route("/transcribe/youtube", methods=["POST"])
def transcribe_youtube():
    data = request.get_json(silent=True) or {}
    url = data.get("url", "").strip()
    if not url:
        return jsonify({"error": "URL не указан"}), 400

    job_id = uuid.uuid4().hex[:12]
    job_dir = UPLOAD_DIR / job_id
    job_dir.mkdir(parents=True, exist_ok=True)
    audio_path = job_dir / "audio.mp3"

    try:
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
                audio_path = candidates[0]
            else:
                return jsonify({"error": "Не удалось скачать аудио"}), 500

        text = _transcribe_file(audio_path)
        return jsonify({"text": text})
    except subprocess.TimeoutExpired:
        return jsonify({"error": "Таймаут при скачивании видео"}), 500
    except subprocess.CalledProcessError as e:
        return jsonify({"error": f"Ошибка yt-dlp: {e.stderr[:500]}"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        shutil.rmtree(job_dir, ignore_errors=True)


def _transcribe_file(path: Path) -> str:
    model = get_model()
    result = model.transcribe(str(path), language=None)
    return result["text"]


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
