from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException
from app.data.syllabus_data import TAJWEED_MODULES, get_all_rules_flat, get_rule_by_id

router = APIRouter(prefix="/courses", tags=["Courses & Modules"])

@router.get("")
def list_available_courses():
    """Lists available courses on Itqān."""
    return {
        "courses": [
            {
                "course_id": "tajweed",
                "title": "Mastering Tajweed Rules",
                "arabic_title": "أحكام التجويد وإتقان التلاوة",
                "description": "Comprehensive 6-module, 24-rule curriculum covering Makharij, Sifaat, Noon/Meem Sakinah, and Madd.",
                "total_modules": len(TAJWEED_MODULES),
                "total_rules": len(get_all_rules_flat()),
                "level": "All Levels"
            },
            {
                "course_id": "qaida",
                "title": "Madani / Noorani Qaida",
                "arabic_title": "القاعدة المدنية والنورانية",
                "description": "Authentic 21-lesson progressive curriculum covering Arabic alphabets, compound letters, vowels, Tanween, Sukoon, Qalqalah, Tashdeed, and Waqf.",
                "total_lessons": 21,
                "level": "Beginner to Intermediate"
            },
            {
                "course_id": "makharij",
                "title": "Makhaarij al-Huroof Explorer",
                "arabic_title": "مخارج وصفات الحروف",
                "description": "Interactive anatomical guide to the 5 primary vocal areas and 17 articulation points.",
                "total_areas": 5,
                "total_points": 17,
                "level": "Foundational"
            }
        ]
    }

@router.get("/tajweed/modules")
def get_tajweed_modules():
    """Returns the full modular breakdown of the 24 Tajweed rules."""
    return {
        "course_id": "tajweed",
        "title": "Mastering Tajweed Rules",
        "modules": TAJWEED_MODULES
    }

@router.get("/tajweed/rules")
def get_all_tajweed_rules():
    """Returns all 24 Tajweed rules as a flat list."""
    return {
        "total": len(get_all_rules_flat()),
        "rules": get_all_rules_flat()
    }

@router.get("/tajweed/rules/{rule_id}")
def get_single_tajweed_rule(rule_id: str):
    """Fetches details, explanations, and benchmark ayah for a specific Tajweed rule."""
    rule = get_rule_by_id(rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail=f"Tajweed rule '{rule_id}' not found.")
    return rule
