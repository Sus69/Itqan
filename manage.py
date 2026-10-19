#!/usr/bin/env python3
"""
Itqān (إتقان) — Single Full-Stack Runner
Usage:
    python manage.py          # Starts backend and frontend together with synchronization
    python manage.py backend  # Starts FastAPI backend only (:8000)
    python manage.py frontend # Starts Vite frontend only (:5173)
    python manage.py test     # Runs full backend automated test suite
    python manage.py clean    # Kills any lingering processes on ports 8000 & 5173
"""

import os
import sys
import time
import socket
import subprocess
import urllib.request
from pathlib import Path

# Configure UTF-8 output and line buffering on Windows
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
    """Checks if a TCP port is currently accepting connections."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.3)
        return s.connect_ex((host, port)) == 0


def check_backend_healthy(host: str = "127.0.0.1", port: int = 8000) -> bool:
    """Queries /health to check if FastAPI and AI models are fully initialized."""
    try:
        url = f"http://{host}:{port}/health"
        req = urllib.request.Request(url, headers={"User-Agent": "Itqan-Manage/1.0"})
        with urllib.request.urlopen(req, timeout=1.0) as resp:
            return resp.status == 200
    except Exception:
        return False


def kill_processes_on_port(port: int):
    """Finds and terminates any process currently listening on the specified port."""
    if sys.platform != "win32":
        try:
            out = subprocess.check_output(["lsof", "-t", f"-i:{port}"], stderr=subprocess.DEVNULL).decode().strip()
            for pid in out.split():
                subprocess.run(["kill", "-9", pid], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        except Exception:
            pass
        return

    try:
        # Use netstat on Windows to find listening PID
        out = subprocess.check_output(f"netstat -ano | findstr :{port}", shell=True, stderr=subprocess.DEVNULL).decode()
        for line in out.strip().splitlines():
            parts = line.split()
            if len(parts) >= 5 and "LISTENING" in parts:
                pid = parts[-1]
                if pid.isdigit() and int(pid) != os.getpid():
                    subprocess.run(["taskkill", "/F", "/T", "/PID", pid], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    except Exception:
        pass


def kill_proc(proc):
    """Cleanly terminates a subprocess and its child tree."""
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
    """Ensure database schema and vector DB are initialized if missing."""
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
        print(f"  [Notice] Database setup: {e}")

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
            print(f"  [Notice] Vector DB sync: {e}")


def wait_for_backend_ready(backend_proc, host: str = "127.0.0.1", port: int = 8000, max_wait_sec: int = 60) -> bool:
    """
    Actively waits until FastAPI has finished loading AI models (WavLM, Whisper, XLS-R)
    and responds with HTTP 200 on /health before launching the frontend.
    Prevents ECONNREFUSED proxy errors in Vite.
    """
    print(f"  [*] Initializing backend & loading AI models on http://{host}:{port}...", flush=True)
    start_time = time.time()
    spinner = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"]
    idx = 0

    while time.time() - start_time < max_wait_sec:
        # Check if backend process crashed during startup
        if backend_proc.poll() is not None:
            print(f"\n  [!] Backend failed to start (exit code {backend_proc.returncode}).")
            return False

        if check_backend_healthy(host, port):
            elapsed = round(time.time() - start_time, 1)
            print(f"\r  [✓] Backend is ONLINE & healthy! (Ready in {elapsed}s)                              \n", flush=True)
            return True

        elapsed = int(time.time() - start_time)
        spin_char = spinner[idx % len(spinner)]
        idx += 1
        print(f"\r  {spin_char} Warming up AI engines (WavLM SV, Whisper ASR, XLS-R) ... ({elapsed}s)", end="", flush=True)
        time.sleep(0.6)

    print(f"\n  [!] Backend warm-up timed out after {max_wait_sec}s. Starting frontend anyway...\n", flush=True)
    return False


def run_fullstack():
    ensure_data()

    print("\n" + "=" * 66)
    print("  ITQĀN (إتقان) — Starting Full-Stack Environment")
    print("=" * 66)

    # Clean up any stale/orphaned processes on ports 8000 or 5173
    if is_port_in_use(8000):
        if check_backend_healthy("127.0.0.1", 8000):
            print("  [Notice] Backend is already running and healthy on port 8000.")
        else:
            print("  [Notice] Port 8000 occupied by stale process. Releasing port...")
            kill_processes_on_port(8000)
            time.sleep(0.5)

    if is_port_in_use(5173):
        print("  [Notice] Port 5173 occupied by previous frontend. Releasing port...")
        kill_processes_on_port(5173)
        time.sleep(0.5)

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

    frontend_cmd = "npm run dev:frontend"

    # 1. Start Backend First
    p_backend = subprocess.Popen(backend_cmd, cwd=WEB_DIR)

    # 2. Synchronize: Wait until Backend /health is confirmed 200 OK
    backend_ok = wait_for_backend_ready(p_backend, "127.0.0.1", 8000)

    if not backend_ok and p_backend.poll() is not None:
        kill_proc(p_backend)
        print("  [Error] Could not start backend. Aborting.")
        return

    # 3. Start Frontend after backend is guaranteed ready
    p_frontend = subprocess.Popen(frontend_cmd, cwd=WEB_DIR, shell=True)

    print("  " + "-" * 62)
    print("  [✓] ITQĀN IS READY AND RUNNING:")
    print("      -> Frontend: http://localhost:5173  (Tajweed Web App)")
    print("      -> Backend:  http://127.0.0.1:8000  (FastAPI)")
    print("      -> Swagger:  http://127.0.0.1:8000/docs")
    print("      -> Press Ctrl+C at any time to cleanly stop both services.")
    print("  " + "-" * 62 + "\n")

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
        print("\n\nStopping Itqān services...")
    finally:
        kill_proc(p_frontend)
        kill_proc(p_backend)
        kill_processes_on_port(8000)
        kill_processes_on_port(5173)
        print("Done. Both services stopped cleanly.\n")


def run_backend_only():
    ensure_data()
    if is_port_in_use(8000):
        if not check_backend_healthy("127.0.0.1", 8000):
            kill_processes_on_port(8000)
            time.sleep(0.4)
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
    try:
        subprocess.run(cmd, cwd=WEB_DIR)
    except KeyboardInterrupt:
        print("\nBackend stopped cleanly.")


def run_frontend_only():
    if is_port_in_use(5173):
        kill_processes_on_port(5173)
        time.sleep(0.4)
    print("Starting Vite frontend on http://127.0.0.1:5173...")
    try:
        subprocess.run("npm run dev:frontend", cwd=WEB_DIR, shell=True)
    except KeyboardInterrupt:
        print("\nFrontend stopped cleanly.")


def run_tests():
    ensure_data()
    print("Running backend automated test suite...")
    cmd = [sys.executable, "backend/test_backend.py"]
    subprocess.run(cmd, cwd=WEB_DIR)


def run_clean():
    print("Cleaning lingering processes on ports 8000 and 5173...")
    kill_processes_on_port(8000)
    kill_processes_on_port(5173)
    print("Done. Ports 8000 and 5173 are free.")


def run_build():
    print("Building frontend production bundle...")
    subprocess.run("npm run build", cwd=WEB_DIR, shell=True)


def main():
    arg = sys.argv[1].lower().strip("-") if len(sys.argv) > 1 else ""

    if arg in ("backend", "server", "api"):
        run_backend_only()
    elif arg in ("frontend", "ui", "client"):
        run_frontend_only()
    elif arg in ("test", "tests"):
        run_tests()
    elif arg in ("clean", "kill", "stop"):
        run_clean()
    elif arg == "build":
        run_build()
    else:
        # Default behavior: run synchronized full-stack!
        run_fullstack()


if __name__ == "__main__":
    main()
