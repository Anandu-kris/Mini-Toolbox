# Mongo serializer

from typing import Any

def serialize_finance_doc(doc: dict[str, Any]) -> dict[str, Any]:
    if not doc:
        return doc

    if "_id" in doc:
        doc["id"] = str(doc.pop("_id"))

    object_id_keys = ["categoryId", "accountId", "toAccountId"]
    for key in object_id_keys:
        if key in doc and doc[key] is not None:
            doc[key] = str(doc[key])
    
    return doc