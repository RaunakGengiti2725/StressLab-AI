from fastapi import APIRouter, UploadFile, File

router = APIRouter(prefix="/cad", tags=["cad"])


@router.post("/upload")
async def upload_model(file: UploadFile = File(...)):
    """Accept an STL file upload. Phase 1 stub: returns metadata without processing."""
    return {
        "filename": file.filename,
        "content_type": file.content_type,
        "status": "received",
        "message": "File upload accepted. Processing not implemented until Phase 3.",
        "mesh_summary": {
            "vertex_count": 0,
            "face_count": 0,
            "bounding_box_mm": [0, 0, 0],
            "volume_mm3": 0,
            "surface_area_mm2": 0,
            "is_watertight": False,
        },
    }


@router.get("/models")
async def list_models():
    """List available models. Phase 1 stub: returns sample entries."""
    return {
        "models": [
            {
                "id": "sample-bracket",
                "name": "Sample Bracket",
                "filename": "bracket.stl",
                "vertex_count": 2844,
                "face_count": 948,
            }
        ]
    }
