#!/usr/bin/env python3
"""
Itqān (إتقان) — Single Full-Stack Runner
Usage:
    python manage.py
Runs both FastAPI backend (:8000) and Vite frontend (:5173) together.
"""

import os
import sys
import time
import socket
import subprocess
from pathlib import Path

# Configure UTF-8 output
for _stream in (sys.stdout, sys.stderr):
    try:
        _stream.reconfigure(encoding="utf-8", errors="backslashreplace", line_buffering=True)
    except (AttributeError, OSError):
        pass

ROOT_DIR = Path(__file__).resolve().parent
WEB_DIR = ROOT_DIR / "itqan-web"
BACKEND_DIR = WEB_DIR / "backend"
DATA_DIR = BACKEND_DIR / "data"
DB_PATH = DATA_DIR / "itqan.db"
VECTOR_DB_PATH = DATA_DIR / "vector_db.json"
MASTER_MATRIX_PATH = ROOT_DIR / "master_vector_matrix.json"


def is_port_in_use(port: int, host: str = "127.0.0.1") -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.4)
        return s.connect_ex((host, port)) == 0


def kill_proc(proc):
    if proc is None or proc.poll() is not None:
        return
    try:
        if sys.platform == "win32":
            subprocess.run(
                ["taskkill", "/F", "/T", "/PID", str(proc.pid)],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
        else:
            proc.terminate()
            proc.wait(timeout=2)
    except Exception:
        try:
            proc.kill()
        except Exception:
            pass


def ensure_data():
    """Ensure database and vector DB are initialized if missing."""
    if DB_PATH.exists() and VECTOR_DB_PATH.exists():
        return

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    sys.path.insert(0, str(BACKEND_DIR))
    try:
        from app.core.database import init_db
        from app.core.seed import seed_dummy_users
        init_db()
        seed_dummy_users()
    except Exception as e:
        print(f"[Notice] Database setup: {e}")

    if not VECTOR_DB_PATH.exists() and MASTER_MATRIX_PATH.exists():
        try:
            import json
            with MASTER_MATRIX_PATH.open("r", encoding="utf-8") as f:
                data = json.load(f)
            profiles = data.get("profiles", {})
            vector_db = {}
            for _, profile in profiles.items():
                name = profile.get("qari_name")
                embs = profile.get("native_speaker_embeddings", {}) or profile.get("register_embeddings_768", {})
                vec = embs.get("baseline_anchor")
                if name and vec:
                    vector_db[name] = vec
            with VECTOR_DB_PATH.open("w", encoding="utf-8") as f:
                json.dump(vector_db, f, ensure_ascii=False)
        except Exception as e:
            print(f"[Notice] Vector DB sync: {e}")


def run_fullstack():
    ensure_data()

    print("\n" + "=" * 64)
    print("  ITQĀN (إتقان) — Starting Full-Stack Environment")
    print("=" * 64)

    if is_port_in_use(8000):
        print("  [Notice] Port 8000 is currently occupied (FastAPI may be running)")
    if is_port_in_use(5173):
        print("  [Notice] Port 5173 is currently occupied (Vite may be running)")

    backend_cmd = [
        sys.executable,
        "-m",
        "uvicorn",
        "app.main:app",
        "--app-dir",
        "backend",
        "--host",
        "127.0.0.1",
        "--port",
        "8000",
        "--reload",
        "--reload-dir",
        "backend/app",
    ]

    # Use npm run dev:frontend or npx vite
    frontend_cmd = "npm run dev:frontend"

    print("  -> Backend:  http://127.0.0.1:8000  (API & Swagger at /docs)")
    print("  -> Frontend: http://127.0.0.1:5173  (Tajweed Web Application)")
    print("  -> Press Ctrl+C at any time to stop both servers.")
    print("=" * 64 + "\n")

    p_backend = subprocess.Popen(backend_cmd, cwd=WEB_DIR)
    time.sleep(1.0)
    p_frontend = subprocess.Popen(frontend_cmd, cwd=WEB_DIR, shell=True)

    try:
        while True:
            time.sleep(0.5)
            if p_backend.poll() is not None:
                print(f"\n[Backend stopped with code {p_backend.returncode}]")
                break
            if p_frontend.poll() is not None:
                print(f"\n[Frontend stopped with code {p_frontend.returncode}]")
                break
    except KeyboardInterrupt:
        print("\nStopping Itqān services...")
    finally:
        kill_proc(p_frontend)
        kill_proc(p_backend)
        print("Done. Both services stopped cleanly.\n")


def run_backend_only():
    ensure_data()
    print("Starting FastAPI backend on http://127.0.0.1:8000...")
    cmd = [
        sys.executable,
        "-m",
        "uvicorn",
        "app.main:app",
        "--app-dir",
        "backend",
        "--host",
        "127.0.0.1",
        "--port",
        "8000",
        "--reload",
        "--reload-dir",
        "backend/app",
    ]
    subprocess.run(cmd, cwd=WEB_DIR)


def run_frontend_only():
    print("Starting Vite frontend on http://127.0.0.1:5173...")
    subprocess.run("npm run dev:frontend", cwd=WEB_DIR, shell=True)


def run_build():
    print("Building frontend production bundle...")
    subprocess.run("npm run build", cwd=WEB_DIR, shell=True)


def main():
    arg = sys.argv[1].lower().strip("-") if len(sys.argv) > 1 else ""

    if arg in ("backend", "server", "api"):
        run_backend_only()
    elif arg in ("frontend", "ui", "client"):
        run_frontend_only()
    elif arg == "build":
        run_build()
    else:
        # Default behavior with NO arguments (or 'dev', 'start', 'run'):
        # Directly run both frontend and backend!
        run_fullstack()


if __name__ == "__main__":
    main()
