from __future__ import annotations

from collections import defaultdict
from datetime import datetime
from typing import Any, Optional

from bson import ObjectId
from fastapi import HTTPException

from app.schemas.finance_manager_schema import (
    CategorySpendItem,
    FinanceAccountCreate,
    FinanceAccountUpdate,
    FinanceBudgetCreate,
    FinanceBudgetStatusOut,
    FinanceBudgetUpdate,
    FinanceCategoryCreate,
    FinanceCategoryUpdate,
    FinanceDashboardSummaryOut,
    FinanceTransactionCreate,
    FinanceTransactionUpdate,
    MonthlyTrendItem,
)
from app.util.mongo_serializer import serialize_finance_doc
from app.helper.finance_manager_helper import (
    utc_now,
    get_finance_collections,
    to_object_id,
    ensure_owned_doc,
)


# Account balance

async def compute_account_balance(db, user_id: str, account_id: ObjectId) -> float:
    cols = get_finance_collections(db)
    accounts = cols["accounts"]
    transactions = cols["transactions"]

    account = await accounts.find_one({"_id": account_id, "userId": user_id})
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    opening_balance = float(account.get("openingBalance", 0))

    income_pipeline = [
        {
            "$match": {
                "userId": user_id,
                "type": "income",
                "accountId": account_id,
            }
        },
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}},
    ]

    expense_pipeline = [
        {
            "$match": {
                "userId": user_id,
                "type": "expense",
                "accountId": account_id,
            }
        },
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}},
    ]

    transfer_out_pipeline = [
        {
            "$match": {
                "userId": user_id,
                "type": "transfer",
                "accountId": account_id,
            }
        },
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}},
    ]

    transfer_in_pipeline = [
        {
            "$match": {
                "userId": user_id,
                "type": "transfer",
                "toAccountId": account_id,
            }
        },
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}},
    ]

    income_res = await transactions.aggregate(income_pipeline).to_list(length=1)
    expense_res = await transactions.aggregate(expense_pipeline).to_list(length=1)
    transfer_out_res = await transactions.aggregate(transfer_out_pipeline).to_list(length=1)
    transfer_in_res = await transactions.aggregate(transfer_in_pipeline).to_list(length=1)

    total_income = float(income_res[0]["total"]) if income_res else 0.0
    total_expense = float(expense_res[0]["total"]) if expense_res else 0.0
    total_transfer_out = float(transfer_out_res[0]["total"]) if transfer_out_res else 0.0
    total_transfer_in = float(transfer_in_res[0]["total"]) if transfer_in_res else 0.0

    current_balance = (
        opening_balance
        + total_income
        - total_expense
        - total_transfer_out
        + total_transfer_in
    )
    return round(current_balance, 2)


async def build_account_out(db, user_id: str, doc: dict) -> dict:
    account_obj_id = doc["_id"] 

    current_balance = await compute_account_balance(
        db,
        user_id,
        account_obj_id,
    )

    out = {
        **doc,
        "currentBalance": current_balance,
    }

    return serialize_finance_doc(out)


# Accounts

async def create_finance_account(db, user_id: str, payload: FinanceAccountCreate) -> dict:
    cols = get_finance_collections(db)
    accounts = cols["accounts"]

    now = utc_now()
    doc = {
        "userId": user_id,
        "name": payload.name.strip(),
        "type": payload.type,
        "currency": payload.currency,
        "openingBalance": round(float(payload.openingBalance), 2),
        "institution": payload.institution.strip() if payload.institution else None,
        "notes": payload.notes.strip() if payload.notes else None,
        "isActive": True,
        "createdAt": now,
        "updatedAt": now,
    }

    result = await accounts.insert_one(doc)
    created = await accounts.find_one({"_id": result.inserted_id})
    return await build_account_out(db, user_id, created)


async def list_finance_accounts(db, user_id: str) -> list[dict]:
    cols = get_finance_collections(db)
    accounts = cols["accounts"]

    docs = await accounts.find({"userId": user_id}).sort("createdAt", -1).to_list(length=500)

    result: list[dict] = []
    for doc in docs:
        result.append(await build_account_out(db, user_id, doc))
    return result


async def update_finance_account(db, user_id: str, account_id: str, payload: FinanceAccountUpdate) -> dict:
    cols = get_finance_collections(db)
    accounts = cols["accounts"]

    await ensure_owned_doc(accounts, account_id, user_id, "account")

    update_data = {k: v for k, v in payload.model_dump(exclude_none=True).items()}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields provided for update")

    if "name" in update_data and isinstance(update_data["name"], str):
        update_data["name"] = update_data["name"].strip()
    if "institution" in update_data and isinstance(update_data["institution"], str):
        update_data["institution"] = update_data["institution"].strip()
    if "notes" in update_data and isinstance(update_data["notes"], str):
        update_data["notes"] = update_data["notes"].strip()

    update_data["updatedAt"] = utc_now()

    await accounts.update_one(
        {"_id": to_object_id(account_id, "accountId"), "userId": user_id},
        {"$set": update_data},
    )

    updated = await accounts.find_one(
        {"_id": to_object_id(account_id, "accountId"), "userId": user_id}
    )
    return await build_account_out(db, user_id, updated)


async def delete_finance_account(db, user_id: str, account_id: str) -> None:
    cols = get_finance_collections(db)
    accounts = cols["accounts"]
    transactions = cols["transactions"]

    await ensure_owned_doc(accounts, account_id, user_id, "account")

    obj_account_id = to_object_id(account_id, "accountId")
    linked_count = await transactions.count_documents(
        {
            "userId": user_id,
            "$or": [
                {"accountId": obj_account_id},
                {"toAccountId": obj_account_id},
            ],
        }
    )

    if linked_count > 0:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete account with existing transactions",
        )

    await accounts.delete_one({"_id": obj_account_id, "userId": user_id})


# Categories

async def create_finance_category(db, user_id: str, payload: FinanceCategoryCreate) -> dict:
    cols = get_finance_collections(db)
    categories = cols["categories"]

    existing = await categories.find_one(
        {
            "userId": user_id,
            "name": payload.name.strip(),
            "type": payload.type,
        }
    )
    if existing:
        raise HTTPException(status_code=400, detail="Category already exists")

    now = utc_now()
    doc = {
        "userId": user_id,
        "name": payload.name.strip(),
        "type": payload.type,
        "icon": payload.icon,
        "color": payload.color,
        "isSystem": False,
        "isActive": True,
        "createdAt": now,
        "updatedAt": now,
    }

    result = await categories.insert_one(doc)
    created = await categories.find_one({"_id": result.inserted_id})
    return serialize_finance_doc(created)


async def list_finance_categories(
    db,
    user_id: str,
    type_filter: Optional[str] = None,
) -> list[dict]:
    cols = get_finance_collections(db)
    categories = cols["categories"]

    query: dict[str, Any] = {"userId": user_id}
    if type_filter:
        query["type"] = type_filter

    docs = await categories.find(query).sort("name", 1).to_list(length=500)
    return [serialize_finance_doc(doc) for doc in docs]


async def update_finance_category(db, user_id: str, category_id: str, payload: FinanceCategoryUpdate) -> dict:
    cols = get_finance_collections(db)
    categories = cols["categories"]

    await ensure_owned_doc(categories, category_id, user_id, "category")

    update_data = {k: v for k, v in payload.model_dump(exclude_none=True).items()}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields provided for update")

    if "name" in update_data and isinstance(update_data["name"], str):
        update_data["name"] = update_data["name"].strip()

    update_data["updatedAt"] = utc_now()

    await categories.update_one(
        {"_id": to_object_id(category_id, "categoryId"), "userId": user_id},
        {"$set": update_data},
    )

    updated = await categories.find_one(
        {"_id": to_object_id(category_id, "categoryId"), "userId": user_id}
    )
    return serialize_finance_doc(updated)


async def delete_finance_category(db, user_id: str, category_id: str) -> None:
    cols = get_finance_collections(db)
    categories = cols["categories"]
    transactions = cols["transactions"]
    budgets = cols["budgets"]

    await ensure_owned_doc(categories, category_id, user_id, "category")

    obj_category_id = to_object_id(category_id, "categoryId")

    tx_count = await transactions.count_documents(
        {"userId": user_id, "categoryId": obj_category_id}
    )
    budget_count = await budgets.count_documents(
        {"userId": user_id, "categoryId": obj_category_id}
    )

    if tx_count > 0 or budget_count > 0:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete category linked to transactions or budgets",
        )

    await categories.delete_one({"_id": obj_category_id, "userId": user_id})


# Transactions

async def validate_transaction_relations(db, user_id: str, payload: FinanceTransactionCreate) -> None:
    cols = get_finance_collections(db)
    accounts = cols["accounts"]
    categories = cols["categories"]

    from_account = await accounts.find_one(
        {"_id": to_object_id(payload.accountId, "accountId"), "userId": user_id}
    )
    if not from_account:
        raise HTTPException(status_code=404, detail="Source account not found")

    if payload.type == "transfer":
        if not payload.toAccountId:
            raise HTTPException(status_code=400, detail="toAccountId is required for transfer")
        if payload.toAccountId == payload.accountId:
            raise HTTPException(status_code=400, detail="Cannot transfer to same account")

        to_account = await accounts.find_one(
            {"_id": to_object_id(payload.toAccountId, "toAccountId"), "userId": user_id}
        )
        if not to_account:
            raise HTTPException(status_code=404, detail="Destination account not found")

    else:
        if not payload.categoryId:
            raise HTTPException(status_code=400, detail="categoryId is required for income/expense")

        category = await categories.find_one(
            {"_id": to_object_id(payload.categoryId, "categoryId"), "userId": user_id}
        )
        if not category:
            raise HTTPException(status_code=404, detail="Category not found")

        if category["type"] != payload.type:
            raise HTTPException(
                status_code=400,
                detail=f"Category type '{category['type']}' does not match transaction type '{payload.type}'",
            )


async def create_finance_transaction(db, user_id: str, payload: FinanceTransactionCreate) -> dict:
    cols = get_finance_collections(db)
    transactions = cols["transactions"]

    await validate_transaction_relations(db, user_id, payload)

    now = utc_now()
    doc = {
        "userId": user_id,
        "type": payload.type,
        "amount": round(float(payload.amount), 2),
        "currency": payload.currency,
        "categoryId": to_object_id(payload.categoryId, "categoryId") if payload.categoryId else None,
        "accountId": to_object_id(payload.accountId, "accountId"),
        "toAccountId": to_object_id(payload.toAccountId, "toAccountId") if payload.toAccountId else None,
        "title": payload.title.strip(),
        "description": payload.description.strip() if payload.description else None,
        "merchant": payload.merchant.strip() if payload.merchant else None,
        "transactionDate": payload.transactionDate,
        "paymentMethod": payload.paymentMethod,
        "tags": [tag.strip() for tag in payload.tags if tag.strip()],
        "createdAt": now,
        "updatedAt": now,
    }

    result = await transactions.insert_one(doc)
    created = await transactions.find_one({"_id": result.inserted_id})
    return serialize_finance_doc(created)


async def list_finance_transactions(
    db,
    user_id: str,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    type_filter: Optional[str] = None,
    category_id: Optional[str] = None,
    account_id: Optional[str] = None,
) -> list[dict]:
    cols = get_finance_collections(db)
    transactions = cols["transactions"]

    query: dict[str, Any] = {"userId": user_id}

    if type_filter:
        query["type"] = type_filter

    if category_id:
        query["categoryId"] = to_object_id(category_id, "categoryId")

    if account_id:
        query["accountId"] = to_object_id(account_id, "accountId")

    if start_date or end_date:
        query["transactionDate"] = {}
        if start_date:
            query["transactionDate"]["$gte"] = start_date
        if end_date:
            query["transactionDate"]["$lte"] = end_date

    docs = await transactions.find(query).sort("transactionDate", -1).to_list(length=1000)
    return [serialize_finance_doc(doc) for doc in docs]


async def update_finance_transaction(
    db,
    user_id: str,
    transaction_id: str,
    payload: FinanceTransactionUpdate,
) -> dict:
    cols = get_finance_collections(db)
    transactions = cols["transactions"]
    categories = cols["categories"]
    accounts = cols["accounts"]

    existing = await ensure_owned_doc(transactions, transaction_id, user_id, "transaction")

    update_data = {k: v for k, v in payload.model_dump(exclude_none=True).items()}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields provided for update")

    next_type = update_data.get("type", existing["type"])

    if "accountId" in update_data and update_data["accountId"]:
        account = await accounts.find_one(
            {"_id": to_object_id(update_data["accountId"], "accountId"), "userId": user_id}
        )
        if not account:
            raise HTTPException(status_code=404, detail="Source account not found")
        update_data["accountId"] = to_object_id(update_data["accountId"], "accountId")

    if "toAccountId" in update_data:
        if update_data["toAccountId"]:
            to_account_obj_id = to_object_id(update_data["toAccountId"], "toAccountId")
            to_account = await accounts.find_one(
                {"_id": to_account_obj_id, "userId": user_id}
            )
            if not to_account:
                raise HTTPException(status_code=404, detail="Destination account not found")
            update_data["toAccountId"] = to_account_obj_id
        else:
            update_data["toAccountId"] = None
    
    if "amount" in update_data:
        update_data["amount"] = round(float(update_data["amount"]), 2)

    if "categoryId" in update_data:
        if update_data["categoryId"]:
            category = await categories.find_one(
                {"_id": to_object_id(update_data["categoryId"], "categoryId"), "userId": user_id}
            )
            if not category:
                raise HTTPException(status_code=404, detail="Category not found")

            if next_type != "transfer" and category["type"] != next_type:
                raise HTTPException(status_code=400, detail="Category type mismatch")

            update_data["categoryId"] = to_object_id(update_data["categoryId"], "categoryId")
        else:
            update_data["categoryId"] = None

    if "type" in update_data:
        if update_data["type"] == "transfer":
            effective_account_id = update_data.get("accountId", existing.get("accountId"))
            effective_to_account_id = update_data.get("toAccountId", existing.get("toAccountId"))

            if not effective_to_account_id:
                raise HTTPException(status_code=400, detail="toAccountId is required for transfer")

            if str(effective_account_id) == str(effective_to_account_id):
                raise HTTPException(status_code=400, detail="Cannot transfer to same account")

            update_data["categoryId"] = None
        else:
            effective_category_id = update_data.get("categoryId", existing.get("categoryId"))
            if not effective_category_id:
                raise HTTPException(
                    status_code=400,
                    detail="categoryId is required for income/expense",
                )
            update_data["toAccountId"] = None

    if "amount" in update_data:
        update_data["amount"] = round(float(update_data["amount"]), 2)

    if "title" in update_data and isinstance(update_data["title"], str):
        update_data["title"] = update_data["title"].strip()
    if "description" in update_data and isinstance(update_data["description"], str):
        update_data["description"] = update_data["description"].strip()
    if "merchant" in update_data and isinstance(update_data["merchant"], str):
        update_data["merchant"] = update_data["merchant"].strip()
    if "tags" in update_data and isinstance(update_data["tags"], list):
        update_data["tags"] = [
            tag.strip() for tag in update_data["tags"]
            if isinstance(tag, str) and tag.strip()
        ]

    update_data["updatedAt"] = utc_now()

    await transactions.update_one(
        {"_id": to_object_id(transaction_id, "transactionId"), "userId": user_id},
        {"$set": update_data},
    )

    updated = await transactions.find_one(
        {"_id": to_object_id(transaction_id, "transactionId"), "userId": user_id}
    )
    return serialize_finance_doc(updated)


async def delete_finance_transaction(db, user_id: str, transaction_id: str) -> None:
    cols = get_finance_collections(db)
    transactions = cols["transactions"]

    await ensure_owned_doc(transactions, transaction_id, user_id, "transaction")
    await transactions.delete_one(
        {"_id": to_object_id(transaction_id, "transactionId"), "userId": user_id}
    )


# Budgets

async def create_finance_budget(db, user_id: str, payload: FinanceBudgetCreate) -> dict:
    cols = get_finance_collections(db)
    budgets = cols["budgets"]
    categories = cols["categories"]

    category = await categories.find_one(
        {"_id": to_object_id(payload.categoryId, "categoryId"), "userId": user_id}
    )
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    if category["type"] != "expense":
        raise HTTPException(status_code=400, detail="Budget can only be created for expense category")

    now = utc_now()
    doc = {
        "userId": user_id,
        "name": payload.name.strip(),
        "categoryId": to_object_id(payload.categoryId, "categoryId"),
        "amount": round(float(payload.amount), 2),
        "period": payload.period,
        "startDate": payload.startDate,
        "endDate": payload.endDate,
        "alertThresholds": payload.alertThresholds,
        "isActive": True,
        "createdAt": now,
        "updatedAt": now,
    }

    result = await budgets.insert_one(doc)
    created = await budgets.find_one({"_id": result.inserted_id})
    return serialize_finance_doc(created)


async def list_finance_budgets(db, user_id: str) -> list[dict]:
    cols = get_finance_collections(db)
    budgets = cols["budgets"]

    docs = await budgets.find({"userId": user_id}).sort("createdAt", -1).to_list(length=500)
    return [serialize_finance_doc(doc) for doc in docs]


async def update_finance_budget(db, user_id: str, budget_id: str, payload: FinanceBudgetUpdate) -> dict:
    cols = get_finance_collections(db)
    budgets = cols["budgets"]
    categories = cols["categories"]

    await ensure_owned_doc(budgets, budget_id, user_id, "budget")

    update_data = {k: v for k, v in payload.model_dump(exclude_none=True).items()}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields provided for update")

    if "categoryId" in update_data and update_data["categoryId"]:
        category = await categories.find_one(
            {"_id": to_object_id(update_data["categoryId"], "categoryId"), "userId": user_id}
        )
        if not category:
            raise HTTPException(status_code=404, detail="Category not found")

        if category["type"] != "expense":
            raise HTTPException(status_code=400, detail="Budget category must be expense type")

        update_data["categoryId"] = to_object_id(update_data["categoryId"], "categoryId")

    if "amount" in update_data:
        update_data["amount"] = round(float(update_data["amount"]), 2)

    if "name" in update_data and isinstance(update_data["name"], str):
        update_data["name"] = update_data["name"].strip()

    update_data["updatedAt"] = utc_now()

    await budgets.update_one(
        {"_id": to_object_id(budget_id, "budgetId"), "userId": user_id},
        {"$set": update_data},
    )

    updated = await budgets.find_one(
        {"_id": to_object_id(budget_id, "budgetId"), "userId": user_id}
    )
    return serialize_finance_doc(updated)


async def delete_finance_budget(db, user_id: str, budget_id: str) -> None:
    cols = get_finance_collections(db)
    budgets = cols["budgets"]

    await ensure_owned_doc(budgets, budget_id, user_id, "budget")
    await budgets.delete_one(
        {"_id": to_object_id(budget_id, "budgetId"), "userId": user_id}
    )


async def get_finance_budget_status(db, user_id: str) -> list[FinanceBudgetStatusOut]:
    cols = get_finance_collections(db)
    budgets = cols["budgets"]
    transactions = cols["transactions"]

    active_budgets = await budgets.find(
        {"userId": user_id, "isActive": True}
    ).to_list(length=500)

    result: list[FinanceBudgetStatusOut] = []

    for budget in active_budgets:
        query: dict[str, Any] = {
            "userId": user_id,
            "type": "expense",
            "categoryId": budget["categoryId"],
            "transactionDate": {"$gte": budget["startDate"]},
        }

        if budget.get("endDate"):
            query["transactionDate"]["$lte"] = budget["endDate"]

        pipeline = [
            {"$match": query},
            {"$group": {"_id": None, "total": {"$sum": "$amount"}}},
        ]

        agg = await transactions.aggregate(pipeline).to_list(length=1)
        spent_amount = float(agg[0]["total"]) if agg else 0.0
        budget_amount = float(budget["amount"])
        remaining_amount = round(budget_amount - spent_amount, 2)
        used_percentage = round((spent_amount / budget_amount) * 100, 2) if budget_amount > 0 else 0.0

        result.append(
            FinanceBudgetStatusOut(
                budgetId=str(budget["_id"]),
                budgetName=budget["name"],
                categoryId=str(budget["categoryId"]),
                budgetAmount=budget_amount,
                spentAmount=round(spent_amount, 2),
                remainingAmount=remaining_amount,
                usedPercentage=used_percentage,
                isOverBudget=spent_amount > budget_amount,
            )
        )

    return result


# Dashboard

async def get_finance_dashboard_summary(
    db,
    user_id: str,
    start_date: datetime,
    end_date: datetime,
) -> FinanceDashboardSummaryOut:
    cols = get_finance_collections(db)
    accounts = cols["accounts"]
    categories = cols["categories"]
    transactions = cols["transactions"]

    account_docs = await accounts.find(
        {"userId": user_id, "isActive": True}
    ).to_list(length=500)

    total_balance = 0.0
    for acc in account_docs:
        total_balance += await compute_account_balance(db, user_id, acc["_id"])

    income_pipeline = [
        {
            "$match": {
                "userId": user_id,
                "type": "income",
                "transactionDate": {"$gte": start_date, "$lte": end_date},
            }
        },
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}},
    ]

    expense_pipeline = [
        {
            "$match": {
                "userId": user_id,
                "type": "expense",
                "transactionDate": {"$gte": start_date, "$lte": end_date},
            }
        },
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}},
    ]

    income_res = await transactions.aggregate(income_pipeline).to_list(length=1)
    expense_res = await transactions.aggregate(expense_pipeline).to_list(length=1)

    total_income = float(income_res[0]["total"]) if income_res else 0.0
    total_expense = float(expense_res[0]["total"]) if expense_res else 0.0
    net_savings = round(total_income - total_expense, 2)

    expense_by_category_pipeline = [
        {
            "$match": {
                "userId": user_id,
                "type": "expense",
                "transactionDate": {"$gte": start_date, "$lte": end_date},
                "categoryId": {"$ne": None},
            }
        },
        {"$group": {"_id": "$categoryId", "amount": {"$sum": "$amount"}}},
        {"$sort": {"amount": -1}},
        {"$limit": 5},
    ]

    expense_by_category = await transactions.aggregate(expense_by_category_pipeline).to_list(length=5)

    category_name_map: dict[str, str] = {}
    if expense_by_category:
        category_ids = [item["_id"] for item in expense_by_category]
        category_docs = await categories.find(
            {"_id": {"$in": category_ids}, "userId": user_id}
        ).to_list(length=50)
        category_name_map = {str(cat["_id"]): cat["name"] for cat in category_docs}

    top_expense_categories = [
        CategorySpendItem(
            categoryId=str(item["_id"]),
            categoryName=category_name_map.get(str(item["_id"]), "Unknown"),
            amount=round(float(item["amount"]), 2),
        )
        for item in expense_by_category
    ]

    tx_docs = await transactions.find(
        {
            "userId": user_id,
            "transactionDate": {"$gte": start_date, "$lte": end_date},
            "type": {"$in": ["income", "expense"]},
        }
    ).sort("transactionDate", 1).to_list(length=5000)

    month_map = defaultdict(lambda: {"income": 0.0, "expense": 0.0})

    for tx in tx_docs:
        month_key = tx["transactionDate"].strftime("%Y-%m")
        month_map[month_key][tx["type"]] += float(tx["amount"])

    monthly_trend: list[MonthlyTrendItem] = []
    for month, vals in sorted(month_map.items()):
        income_val = round(vals["income"], 2)
        expense_val = round(vals["expense"], 2)
        monthly_trend.append(
            MonthlyTrendItem(
                month=month,
                income=income_val,
                expense=expense_val,
                net=round(income_val - expense_val, 2),
            )
        )

    return FinanceDashboardSummaryOut(
        totalBalance=round(total_balance, 2),
        totalIncome=round(total_income, 2),
        totalExpense=round(total_expense, 2),
        netSavings=net_savings,
        topExpenseCategories=top_expense_categories,
        monthlyTrend=monthly_trend,
    )