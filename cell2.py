# Cell 2: Persistent and volatile filesystem topology

import json
import os
import shutil
import sys
from pathlib import Path

from google.colab import drive

for _stream in (sys.stdout, sys.stderr):
    try:
        _stream.reconfigure(encoding="utf-8", errors="backslashreplace")
    except (AttributeError, OSError):
        pass

# Persistent storage: survives Colab runtime disconnects/restarts.
DRIVE_MOUNT = "/content/drive"
PERSISTENT_ROOT = Path("/content/drive/MyDrive/QariMatch_Outputs")
LEDGER_PATH = PERSISTENT_ROOT / "master_vector_matrix.json"

# Volatile storage: intentionally local to the Colab VM for fast processing.
SCRATCH_ROOT = Path("/content/scratch_space")

drive.mount(DRIVE_MOUNT, force_remount=False)

PERSISTENT_ROOT.mkdir(parents=True, exist_ok=True)
SCRATCH_ROOT.mkdir(parents=True, exist_ok=True)

EMPTY_LEDGER = {
    "schema_version": 1,
    "description": (
        "WavLM register-profile embeddings. Each completed Qari record is keyed "
        "by a stable hash of its source profile URL."
    ),
    "profiles": {},
}

if LEDGER_PATH.exists():
    try:
        with LEDGER_PATH.open("r", encoding="utf-8") as handle:
            LEDGER = json.load(handle)

        if not isinstance(LEDGER, dict):
            raise ValueError("Ledger root must be a JSON object.")

        # Normalize older-but-compatible structures.
        LEDGER.setdefault("schema_version", 1)
        LEDGER.setdefault("profiles", {})

        if not isinstance(LEDGER["profiles"], dict):
            raise ValueError("Ledger field 'profiles' must be a JSON object.")

        print(f"Loaded ledger with {len(LEDGER['profiles'])} existing Qari profiles.")
    except Exception as exc:
        raise RuntimeError(
            f"Ledger exists but cannot be safely read: {LEDGER_PATH}\n"
            f"Refusing to overwrite it. Repair or remove the file first.\n"
            f"Original error: {type(exc).__name__}: {exc}"
        ) from exc
else:
    LEDGER = EMPTY_LEDGER
    print("No existing ledger found. A new ledger will be created after the first successful Qari.")

def qari_is_complete(qari_id: str) -> bool:
    """Idempotent skip check used by Cell 3."""
    record = LEDGER.get("profiles", {}).get(qari_id, {})
    return bool(record.get("completed") is True)

print(f"Persistent root: {PERSISTENT_ROOT}")
print(f"Ledger path:     {LEDGER_PATH}")
print(f"Scratch root:    {SCRATCH_ROOT}")