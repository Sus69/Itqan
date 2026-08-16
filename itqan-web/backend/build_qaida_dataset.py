"""
Script to parse docs/qaida.md and build the complete 21-lesson Qaida dataset.
"""

import sys
import re
import json
from pathlib import Path

# Prevent UnicodeEncodeError on Windows terminals
for s in (sys.stdout, sys.stderr):
    try:
        s.reconfigure(encoding='utf-8', errors='backslashreplace')
    except (AttributeError, OSError):
        pass

qaida_path = Path(__file__).resolve().parent.parent.parent / "docs" / "qaida.md"
if not qaida_path.exists():
    # Try alternate relative location
    qaida_path = Path(__file__).resolve().parent / "docs" / "qaida.md"

with qaida_path.open('r', encoding='utf-8') as f:
    text = f.read()

titles_meta = {
    1: ('Huroof Mufridat (Individual Letters)', 'حروف الهجاء المفردة', 'Alphabets', 'Beginner'),
    2: ('Huroof Murakkabat (Compound Letters)', 'الحروف المركبة', 'Alphabets', 'Beginner'),
    3: ('Harakaat (Short Vowels: Fathah, Kasrah, Dammah)', 'الحركات', 'Vowels', 'Beginner'),
    4: ('Harakaat Exercises & Similar Sounding Letters', 'تدريبات الحركات والحروف المتقاربة', 'Vowels', 'Beginner'),
    5: ('Tanween (Double Vowels: Fathatayn, Kasratayn, Dammatayn)', 'التنوين', 'Tanween', 'Beginner'),
    6: ('Exercises on Harakaat & Tanween (Rawan & Hijjay)', 'تدريبات على الحركات والتنوين', 'Words', 'Beginner'),
    7: ('The Letters of Maddah (Alif, Waw, Yaa)', 'حروف المد', 'Madd', 'Intermediate'),
    8: ('Vertical (Khari) Harakaat', 'الحركات القائمة (العمودية)', 'Vowels', 'Intermediate'),
    9: ('The Letters of Leen (Waw Leen & Yaa Leen)', 'حروف اللين', 'Leen', 'Intermediate'),
    10: ('Comprehensive Practice on Harakaat, Tanween, Madd & Leen', 'تدريبات شاملة على المد واللين', 'Words', 'Intermediate'),
    11: ('Sukoon (Jazm) & Qalqalah (Echoing Stops)', 'السكون (الجزم) والقلقلة', 'Sukoon', 'Intermediate'),
    12: ('Noon Saakinah & Tanween: Izhar & Ikhfa', 'النون الساكنة والتنوين (الإظهار والإخفاء)', 'Noon Saakin', 'Intermediate'),
    13: ('Tashdeed (Shaddah) & Ghunnah', 'التشديد', 'Shaddah', 'Intermediate'),
    14: ('Noon Saakinah & Tanween: Idgham & Iqlaab', 'النون الساكنة والتنوين (الإدغام والإقلاب)', 'Noon Saakin', 'Advanced'),
    15: ('The Cases of Meem Saakinah (Idgham, Ikhfa, Izhar Shafawi)', 'أحكام الميم الساكنة', 'Meem Saakin', 'Advanced'),
    16: ('Tafkheem & Tarqeeq (Thick and Thin Letters: Laam & Raa)', 'التفخيم والترقيق', 'Sifaat', 'Advanced'),
    17: ('Maddaat (Connected, Separated, Compulsory 6-Count Madd)', 'أحكام المدود (المتصل، المنفصل، اللازم، العارض)', 'Madd', 'Advanced'),
    18: ('Muqatta\'at Letters (Opening Disjointed Quranic Letters)', 'الحروف المقطعة', 'Quranic', 'Advanced'),
    19: ('Za\'id (Additional) Alif Rules in Wasl & Waqf', 'الألف الزائدة', 'Special Rules', 'Advanced'),
    20: ('Miscellaneous Rules (Izhar Mutlaq, Saktah, Tasheel, Imalah)', 'أحكام متفرقة (الإظهار المطلق، السكتة، التسهيل، الإمالة)', 'Special Rules', 'Mastery'),
    21: ('Rules of Waqf (Stopping, Pausing Signs & Noon Qutni)', 'أحكام الوقف وعلاماته ونون الوقاية', 'Waqf', 'Mastery'),
    22: ('Salah (Recitation Practice for Daily Prayer)', 'الصلاة والأدعية المأثورة', 'Application', 'Mastery')
}

lessons_raw = re.findall(r'(## Lesson Number (\d+).*?)(?=(?:## Lesson Number \d+|\Z))', text, re.DOTALL)
all_lessons = []

for full_text, num_str in lessons_raw:
    num = int(num_str)
    meta = titles_meta.get(num, (f'Lesson {num}', f'الدرس {num}', 'General', 'Intermediate'))
    
    bullets = re.findall(r'✦\s*(.*?)(?=(?:✦|\n\n|\||\Z))', full_text, re.DOTALL)
    cleaned_bullets = [b.strip().replace('\n', ' ') for b in bullets if b.strip()]
    
    table_matches = re.findall(r'\|([^\n]+)\|', full_text)
    items = []
    for row in table_matches:
        if ':-' in row or row.startswith('-'):
            continue
        cells = [c.strip() for c in row.split('|') if c.strip()]
        for c in cells:
            c_clean = re.sub(r'<br>.*', '', c)
            c_clean = c_clean.replace('**', '').strip()
            if c_clean and not c_clean.isdigit() and c_clean not in items:
                items.append(c_clean)
                
    all_lessons.append({
        'lesson_id': f'lesson_{num:02d}',
        'lesson_number': num,
        'title': f'Lesson {num}: {meta[0]}',
        'arabic_title': f'الدرس {num}: {meta[1]}',
        'category': meta[2],
        'difficulty': meta[3],
        'description': cleaned_bullets[0] if cleaned_bullets else f'Lesson {num} of the authentic Madani Qaida.',
        'instructions': cleaned_bullets,
        'items': items,
        'item_count': len(items),
        'content_markdown': full_text.strip()
    })

out_file = Path(__file__).resolve().parent / "app" / "data" / "qaida_data.py"
with out_file.open('w', encoding='utf-8') as f:
    f.write('"""\nComplete 21 (+1 Application) Lessons of Madani Qa\'idah.\nExact 100% representation derived verbatim from docs/qaida.md as the source of truth.\n"""\n\n')
    f.write('from typing import List, Dict, Any\n\n')
    f.write('QAIDA_LESSONS: List[Dict[str, Any]] = ' + json.dumps(all_lessons, ensure_ascii=False, indent=2) + '\n\n')
    f.write('def get_all_qaida_lessons() -> List[Dict[str, Any]]:\n')
    f.write('    return QAIDA_LESSONS\n\n')
    f.write('def get_qaida_lesson_by_id(lesson_id: str) -> Dict[str, Any]:\n')
    f.write('    for l in QAIDA_LESSONS:\n')
    f.write('        if l["lesson_id"] == lesson_id or str(l["lesson_number"]) == str(lesson_id):\n')
    f.write('            return l\n')
    f.write('    return None\n')

print(f"Successfully generated {out_file} with {len(all_lessons)} lessons!")
