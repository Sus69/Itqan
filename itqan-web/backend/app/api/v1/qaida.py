from typing import List
from fastapi import APIRouter, HTTPException
from app.data.qaida_data import QAIDA_LESSONS, get_all_qaida_lessons, get_qaida_lesson_by_id

router = APIRouter(prefix="/qaida", tags=["Madani & Noorani Qaida"])

@router.get("/lessons")
def list_qaida_lessons():
    """Lists all authentic Qaida lessons."""
    return {
        "course_id": "qaida",
        "total_lessons": len(QAIDA_LESSONS),
        "lessons": [
            {
                "lesson_id": l["lesson_id"],
                "lesson_number": l["lesson_number"],
                "title": l["title"],
                "arabic_title": l["arabic_title"],
                "category": l["category"],
                "difficulty": l["difficulty"],
                "description": l["description"],
                "item_count": l.get("item_count", len(l.get("items", [])))
            }
            for l in QAIDA_LESSONS
        ]
    }

@router.get("/lessons/{lesson_id}")
def get_single_qaida_lesson(lesson_id: str):
    """Retrieves full lesson content, letters grid, and pronunciation guidelines."""
    lesson = get_qaida_lesson_by_id(lesson_id)
    if not lesson:
        raise HTTPException(status_code=404, detail=f"Qaida lesson '{lesson_id}' not found.")
    return lesson
