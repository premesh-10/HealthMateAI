import datetime
import os
from time import timezone
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Query, Path
from pydantic import BaseModel
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId

# ⬇️ Import your triage function here
# If your file is named triage_infer.py, change to:
# from triage_infer import infer_conditions_from_symptoms
from .triage_infer import infer_conditions_from_symptoms
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")
DB_NAME = os.getenv("DB_NAME", "myapp")

if not MONGODB_URI:
    raise RuntimeError("Missing MONGODB_URI in .env")

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "http://192.168.0.100:8080",
        "http://127.0.0.1:5173",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client: Optional[AsyncIOMotorClient] = None

@app.on_event("startup")
async def startup():
    global client
    client = AsyncIOMotorClient(MONGODB_URI, uuidRepresentation="standard")
    db = client[DB_NAME]
    # Connectivity check
    await db.command({"ping": 1})
    print("✅ Successfully connected to MongoDB Atlas!")

@app.on_event("shutdown")
async def shutdown():
    if client:
        client.close()
        print("🛑 MongoDB connection closed.")

# ---------- Request model ----------
class SymptomsIn(BaseModel):
    symptoms: str

# ---------- POST /symptom-check ----------
@app.post("/symptom-check")
async def triage(payload: SymptomsIn):
    """
    Accepts: { "symptoms": "headache, sore throat, mild fever, fatigue for 2 days" }
    Returns: structured triage JSON from the Gemini-based inference.
    """
    try:
        result = infer_conditions_from_symptoms(payload.symptoms)
        return result
    except Exception as e:
        # Surface a clean error for the client
        raise HTTPException(status_code=500, detail=f"Triage inference failed: {e}")

from pydantic import BaseModel, Field
from typing import Any, Dict, Optional
from datetime import datetime

# --- Existing ---
class SaveResultIn(BaseModel):
    symptoms: str
    result: Dict[str, Any]
    metadata: Optional[Dict[str, Any]] = None

# --- New: ResultOut ---
class ResultOut(BaseModel):
    id: str = Field(..., description="MongoDB document ID")
    symptoms: str
    result: Dict[str, Any]
    metadata: Optional[Dict[str, Any]] = None
    createdAt: datetime

    class Config:
        orm_mode = True

def to_result_out(doc: Dict[str, Any]) -> ResultOut:
    """Converts Mongo document to Pydantic ResultOut."""
    return ResultOut(
        id=str(doc["_id"]),
        symptoms=doc.get("symptoms", ""),
        result=doc.get("result", {}),
        metadata=doc.get("metadata"),
        createdAt=doc.get("createdAt"),
    )

@app.post("/results", response_model=ResultOut)
async def save_result(payload: SaveResultIn):
    """
    Body:
    {
      "symptoms": "headache, sore throat, mild fever, fatigue for 2 days",
      "result": { "conditions": [...], "disclaimer": "..." },
      "metadata": { "userId": "...", "ua": "...", ... } // optional
    }
    """
    if client is None:
        raise HTTPException(status_code=503, detail="Database not initialized")

    doc = {
        "symptoms": payload.symptoms.strip(),
        "result": payload.result,
        "metadata": payload.metadata,
        "createdAt": datetime.now(),
    }
    try:
        db = client[DB_NAME]
        res = await db.results.insert_one(doc)
        doc["_id"] = res.inserted_id
        return to_result_out(doc)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save result: {e}")

# ---------- GET /history (list saved results) ----------
@app.get("/history", response_model=List[ResultOut])
async def list_results(
    limit: int = Query(50, ge=1, le=200),
    skip: int = Query(0, ge=0),
):
    """
    Query params: ?limit=50&skip=0
    Returns most-recent-first.
    """
    if client is None:
        raise HTTPException(status_code=503, detail="Database not initialized")

    try:
        db = client[DB_NAME]
        cursor = db.results.find({}, sort=[("createdAt", -1)]).skip(skip).limit(limit)
        docs = await cursor.to_list(length=limit)
        return [to_result_out(d) for d in docs]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch results: {e}")

# ---------- DELETE /results/{id} ----------
@app.delete("/results/{id}", response_model=dict)
async def delete_result(id: str = Path(..., description="The ID of the result to delete")):
    if client is None:
        raise HTTPException(status_code=503, detail="Database not initialized")
    try:
        db = client[DB_NAME]
        res = await db.results.delete_one({"_id": ObjectId(id)})
        if res.deleted_count == 1:
            return {"message": f"Result {id} deleted successfully"}
        else:
            raise HTTPException(status_code=404, detail="Result not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete result: {e}")
