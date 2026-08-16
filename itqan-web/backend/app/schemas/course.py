from typing import List, Optional, Dict, Any
from pydantic import BaseModel

class TargetAyah(BaseModel):
    surah_number: int
    surah_name: str
    ayah_number: int
    text_uthmani: str
    translation_en: str

class TajweedRuleDetail(BaseModel):
    rule_id: str
    name: str
    arabic_name: str
    tier: int
    description: str
    target_ayah: Optional[TargetAyah] = None

class TajweedModule(BaseModel):
    module_id: str
    title: str
    arabic_title: str
    description: str
    rules: List[TajweedRuleDetail]

class QaidaLessonSummary(BaseModel):
    lesson_id: str
    title: str
    arabic_title: str
    description: str
    category: str
    difficulty: str
    item_count: int

class MakhaarijPoint(BaseModel):
    id: str
    primary_area: str
    arabic_area: str
    name: str
    arabic_name: str
    description: str
    letters: List[str]
    acoustic_clue: str
