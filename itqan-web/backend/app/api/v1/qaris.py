from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from app.data.qari_metadata import load_all_qaris_list

router = APIRouter(prefix="/qaris", tags=["Qari Directory & Profiles"])

@router.get("")
def list_qaris(
    query: Optional[str] = Query(None, description="Search by name, country, or style"),
    limit: int = Query(250, ge=1, le=300),
    offset: int = Query(0, ge=0)
):
    """Lists all 242 Qaris from the vector database with biographical profiles."""
    all_qaris = load_all_qaris_list()
    
    if query:
        q_lower = query.lower().strip()
        filtered = [
            q for q in all_qaris
            if q_lower in q["name"].lower() or q_lower in q.get("country", "").lower() or q_lower in q.get("style", "").lower() or q_lower in q.get("arabic_name", "").lower()
        ]
    else:
        filtered = all_qaris
        
    paged = filtered[offset : offset + limit]
    return {
        "total": len(filtered),
        "offset": offset,
        "limit": limit,
        "qaris": paged
    }

@router.get("/{qari_name}")
def get_qari_profile(qari_name: str):
    """Fetches details for a specific Qari."""
    all_qaris = load_all_qaris_list()
    q_norm = qari_name.lower().strip()
    for q in all_qaris:
        if q["name"].lower() == q_norm or q["id"].lower() == q_norm:
            return q
    raise HTTPException(status_code=404, detail=f"Qari '{qari_name}' not found.")
