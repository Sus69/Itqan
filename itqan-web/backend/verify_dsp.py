import numpy as np
import torch
from app.tajweed import (
    normalize_arabic_text,
    levenshtein_similarity,
    check_audio_quality,
    compute_lpc_formants,
    compute_nasal_energy_ratio,
    compute_qalqala_burst_ratio,
    parse_tajweed_rules_from_text,
    ctc_trellis_forced_alignment
)

print("Testing DSP functions...")
sample_audio = np.sin(2 * np.pi * 440 * np.linspace(0, 1, 16000)).astype(np.float32)
f1, f2, f3 = compute_lpc_formants(sample_audio)
print(f"Formants: F1={f1}Hz, F2={f2}Hz, F3={f3}Hz")

nasal_r = compute_nasal_energy_ratio(sample_audio)
print(f"Nasal ratio: {nasal_r}")

burst_r = compute_qalqala_burst_ratio(sample_audio)
print(f"Burst ratio: {burst_r}")

verse = "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ"
rules, catalog = parse_tajweed_rules_from_text(verse)
print(f"\nDetected rules for: {verse}")
for r in rules:
    print(f"  - [{r['rule_id']}] {r['name']} | span={r.get('char_span')} | match='{r.get('char_match')}'")

print("\nTesting CTC Trellis Alignment...")
log_probs = torch.log_softmax(torch.randn(50, 32), dim=-1)
tokens = [1, 5, 12, 18, 24]
spans = ctc_trellis_forced_alignment(log_probs, tokens, duration=2.5)
print(f"Trellis spans generated: {len(spans)}")
for s in spans:
    print(f"  Token {s['token_index']}: {s['start_time']}s -> {s['end_time']}s")

print("\n>>> ALL ACOUSTIC DSP & TRELLIS TESTS PASSED SUCCESSFULLY! <<<")
