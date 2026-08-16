from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class ProgressUpdateRequest(BaseModel):
    course_id: str = Field(..., description="'tajweed', 'qaida', or 'makharij'")
    lesson_id: str = Field(..., description="Unique rule/lesson identifier e.g. '1.1', 'madd_asli'")
    status: str = Field(..., description="'completed' or 'in_progress'")
    score: int = Field(..., ge=0, le=100)
    minutes_spent: Optional[int] = 5
    ayahs_recited: Optional[int] = 1

class LessonProgressResponse(BaseModel):
    id: str
    course_id: str
    lesson_id: str
    status: str
    score: int
    attempts: int
    mastery_level: str
    last_practiced_at: str

class DailyActivityItem(BaseModel):
    activity_date: str
    minutes_practiced: int
    ayahs_recited: int
    xp_earned: int

class UserStatsResponse(BaseModel):
    streak_days: int
    total_xp: int
    total_recitations: int
    total_minutes_practiced: int
    tajweed_mastery_percentage: int
    qaida_mastery_percentage: int
    recent_activity: List[DailyActivityItem]
    progress_items: List[LessonProgressResponse]
