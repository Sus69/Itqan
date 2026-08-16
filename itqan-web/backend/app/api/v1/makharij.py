from fastapi import APIRouter
from app.data.makharij_data import MAKHAARIJ_AREAS

router = APIRouter(prefix="/makharij", tags=["Makhaarij Explorer"])

@router.get("")
def get_makharij_explorer_data():
    """Returns the 5 primary vocal areas and all 17 specific articulation points."""
    return {
        "title": "Makhaarij al-Huroof (Points of Articulation)",
        "total_areas": len(MAKHAARIJ_AREAS),
        "areas": MAKHAARIJ_AREAS
    }
