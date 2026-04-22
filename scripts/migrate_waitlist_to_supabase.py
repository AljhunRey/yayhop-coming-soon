"""
One-time migration: export current Mongo preview waitlist → Supabase.
Run AFTER the user has executed supabase/waitlist_setup.sql in Supabase.

Usage:
    python /app/scripts/migrate_waitlist_to_supabase.py
"""
import os
import sys
import json
import urllib.request
import urllib.error
from pathlib import Path
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv(Path('/app/backend/.env'))

SUPABASE_URL = "https://cbbtggffrnvbvrijdcdv.supabase.co"
SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")
if not SERVICE_KEY:
    print("ERROR: export SUPABASE_SERVICE_KEY=... first", file=sys.stderr)
    sys.exit(1)

mongo = MongoClient(os.environ["MONGO_URL"])
db = mongo[os.environ["DB_NAME"]]
entries = list(db.waitlist.find({}, {"_id": 0}))
print(f"Found {len(entries)} entries in Mongo")

if not entries:
    print("Nothing to migrate.")
    sys.exit(0)

# Minimal payload — let Supabase generate its own UUIDs & timestamps
# to avoid type collisions. We keep the original created_at when present.
payload = []
for e in entries:
    row = {"email": e["email"]}
    if e.get("name"):
        row["name"] = e["name"]
    if e.get("created_at"):
        row["created_at"] = e["created_at"]
    payload.append(row)

req = urllib.request.Request(
    f"{SUPABASE_URL}/rest/v1/waitlist",
    data=json.dumps(payload).encode("utf-8"),
    method="POST",
    headers={
        "apikey": SERVICE_KEY,
        "Authorization": f"Bearer {SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation,resolution=ignore-duplicates",
    },
)
try:
    with urllib.request.urlopen(req, timeout=15) as resp:
        body = resp.read().decode("utf-8")
        print(f"Supabase status: {resp.status}")
        print(f"Inserted: {json.loads(body) if body else []}")
except urllib.error.HTTPError as e:
    print(f"HTTP {e.code}: {e.read().decode('utf-8')}", file=sys.stderr)
    sys.exit(1)
