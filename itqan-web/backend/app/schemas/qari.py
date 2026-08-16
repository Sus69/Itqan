from typing import List, Optional
from pydantic import BaseModel

class QariDetail(BaseModel):
    id: str
    name: str
    arabic_name: Optional[str] = ""
    country: Optional[str] = "Unknown"
    style: Optional[str] = "Murattal"
    riwayah: Optional[str] = "Hafs 'an 'Asim"
    biography: Optional[str] = ""
    sample_url: Optional[str] = None
    has_embedding: bool = True

class QariListResponse(BaseModel):
    total: int
    qaris: List[QariDetail]
