# Helpers

from datetime import datetime, timezone
from bson import ObjectId
from fastapi import HTTPException

def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def to_object_id(value: str, field_name: str = "id") -> ObjectId:
    if not ObjectId.is_valid(value):
        raise HTTPException(status_code=400, detail=f"Invalid {field_name}")
    return ObjectId(value)


def get_finance_collections(db):
    return {
        "accounts": db["finance_accounts"],
        "categories": db["finance_categories"],
        "transactions": db["finance_transactions"],
        "budgets": db["finance_budgets"],
    }


async def ensure_owned_doc(collection, doc_id: str, user_id: str, label: str) -> dict:
    obj_id = to_object_id(doc_id, f"{label}Id")
    doc = await collection.find_one({"_id": obj_id, "userId": user_id})
    if not doc:
        raise HTTPException(status_code=404, detail=f"{label.capitalize()} not found")
    return doc