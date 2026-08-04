import subprocess
import sys

# Make notebook logs robust to Arabic names and other Unicode text.
for _stream in (sys.stdout, sys.stderr):
    try:
        _stream.reconfigure(encoding="utf-8", errors="backslashreplace")
    except (AttributeError, OSError):
        pass

def run(command):
    print("▶", " ".join(command))
    subprocess.check_call(command)

# Audio decoding support for MP3 plus libsndfile support for soundfile/librosa.
run(["apt-get", "update", "-qq"])
run(
    [
        "apt-get",
        "install",
        "-y",
        "-qq",
        "ffmpeg",
        "libsndfile1",
        "build-essential",
    ]
)

# Install torch and torchaudio with explicit CUDA 12.1 compatibility.
# The `--index-url` ensures matching CUDA versions.
# This assumes the Colab T4 GPU runtime has CUDA 12.1.
run(
    [
        sys.executable,
        "-m",
        "pip",
        "install",
        "--upgrade",
        "--no-cache-dir",
        "torch",
        "torchaudio",
        "--index-url",
        "https://download.pytorch.org/whl/cu121",
    ]
)

# Install other requested Python packages.
run(
    [
        sys.executable,
        "-m",
        "pip",
        "install",
        "--upgrade",
        "--no-cache-dir",
        "transformers",
        "librosa",
        "soundfile",
        "beautifulsoup4",
        "requests",
    ]
)

# Verify the runtime after installation.
import torch
import torchaudio
import transformers
import librosa
import soundfile
import bs4
import requests

print(f"Python:       {sys.version.split()[0]}")
print(f"PyTorch:      {torch.__version__}")
print(f"Transformers: {transformers.__version__}")
print(f"CUDA ready:   {torch.cuda.is_available()}")

if not torch.cuda.is_available():
    raise RuntimeError(
        "CUDA is unavailable. In Colab, select Runtime → Change runtime type → T4 GPU, "
        "then rerun this notebook from Cell 1."
    )

print(f"GPU:          {torch.cuda.get_device_name(0)}")