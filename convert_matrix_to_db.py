import json
from pathlib import Path

source_path = Path("master_vector_matrix.json")
target_dir = Path("itqan-web/backend/data")
target_dir.mkdir(parents=True, exist_ok=True)
target_path = target_dir / "vector_db.json"

with source_path.open("r", encoding="utf-8") as f:
    data = json.load(f)

profiles = data.get("profiles", {})
vector_db = {}

for qari_id, profile in profiles.items():
    name = profile.get("qari_name")
    native_embs = profile.get("native_speaker_embeddings", {})
    vector = native_embs.get("baseline_anchor")
    if not vector:
        # Fallback to 768 dim if native not found
        vector = profile.get("register_embeddings_768", {}).get("baseline_anchor")
    
    if name and vector:
        vector_db[name] = vector

print(f"Loaded {len(vector_db)} Qaris into vector_db.")
sample_name = list(vector_db.keys())[0]
print(f"Sample Qari: {sample_name}, Vector Dimension: {len(vector_db[sample_name])}")

with target_path.open("w", encoding="utf-8") as f:
    json.dump(vector_db, f, ensure_ascii=False, indent=2)

print(f"Successfully saved vector_db.json to {target_path}")
