from fastapi import FastAPI, APIRouter, HTTPException, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Admin key for protected routes
ADMIN_KEY = os.environ.get('ADMIN_KEY', '')

app = FastAPI(title="yayhop API")
api_router = APIRouter(prefix="/api")


# ---------- Models ----------
class WaitlistCreate(BaseModel):
    email: EmailStr
    name: Optional[str] = None


class WaitlistEntry(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    name: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class WaitlistResponse(BaseModel):
    success: bool
    message: str
    already_joined: bool = False
    position: Optional[int] = None


class CountResponse(BaseModel):
    count: int


# ---------- Routes ----------
@api_router.get("/")
async def root():
    return {"message": "yayhop api is hopping", "status": "ok"}


@api_router.post("/waitlist", response_model=WaitlistResponse)
async def join_waitlist(payload: WaitlistCreate):
    email_lower = payload.email.lower().strip()

    # Check existing
    existing = await db.waitlist.find_one({"email": email_lower}, {"_id": 0})
    if existing:
        return WaitlistResponse(
            success=True,
            message="You're already on the list — hop tight!",
            already_joined=True,
        )

    entry = WaitlistEntry(email=email_lower, name=payload.name)
    doc = entry.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()

    await db.waitlist.insert_one(doc)
    count = await db.waitlist.count_documents({})

    return WaitlistResponse(
        success=True,
        message="You're in! We'll hop into your inbox soon.",
        already_joined=False,
        position=count,
    )


@api_router.get("/waitlist/count", response_model=CountResponse)
async def waitlist_count():
    count = await db.waitlist.count_documents({})
    return CountResponse(count=count)


@api_router.get("/waitlist/admin", response_model=List[WaitlistEntry])
async def waitlist_admin(key: str = Query(..., description="Admin access key")):
    if not ADMIN_KEY or key != ADMIN_KEY:
        raise HTTPException(status_code=403, detail="Invalid admin key")

    entries = await db.waitlist.find({}, {"_id": 0}).sort("created_at", -1).to_list(10000)
    for e in entries:
        if isinstance(e.get('created_at'), str):
            try:
                e['created_at'] = datetime.fromisoformat(e['created_at'])
            except ValueError:
                pass
    return entries


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
