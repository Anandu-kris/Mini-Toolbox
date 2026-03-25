from __future__ import annotations

from datetime import datetime, timezone
from typing import Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status

from app.deps.auth_deps import get_current_user
from app.schemas.finance_manager_schema import (
    FinanceAccountCreate,
    FinanceAccountOut,
    FinanceAccountUpdate,
    FinanceBudgetCreate,
    FinanceBudgetOut,
    FinanceBudgetStatusOut,
    FinanceBudgetUpdate,
    FinanceCategoryCreate,
    FinanceCategoryOut,
    FinanceCategoryUpdate,
    FinanceDashboardSummaryOut,
    FinanceTransactionCreate,
    FinanceTransactionOut,
    FinanceTransactionUpdate,
    MessageResponse,
)
from app.services.finance_manager_service import (
    create_finance_account,
    create_finance_budget,
    create_finance_category,
    create_finance_transaction,
    delete_finance_account,
    delete_finance_budget,
    delete_finance_category,
    delete_finance_transaction,
    get_finance_budget_status,
    get_finance_dashboard_summary,
    list_finance_accounts,
    list_finance_budgets,
    list_finance_categories,
    list_finance_transactions,
    update_finance_account,
    update_finance_budget,
    update_finance_category,
    update_finance_transaction,
)

router = APIRouter(prefix="/api/finance", tags=["Finance Manager"])


def get_db(request: Request):
    db = getattr(request.app.state, "db", None)
    if db is None:
        raise HTTPException(status_code=503, detail="DB not ready")
    return db


def get_start_of_month_utc(now: datetime) -> datetime:
    return datetime(now.year, now.month, 1, tzinfo=timezone.utc)


def get_user_id(current_user: dict = Depends(get_current_user)) -> str:
    return str(current_user["_id"])


# Accounts

@router.post(
    "/accounts",
    response_model=FinanceAccountOut,
    response_model_by_alias=False,
    status_code=status.HTTP_201_CREATED,
)
async def create_account_route(
    payload: FinanceAccountCreate,
    db=Depends(get_db),
    user_id: str = Depends(get_user_id),
):
    return await create_finance_account(db, user_id, payload)


@router.get("/accounts", response_model=list[FinanceAccountOut],
    response_model_by_alias=False,
)
async def list_accounts_route(
    db=Depends(get_db),
    user_id: str = Depends(get_user_id),
):
    return await list_finance_accounts(db, user_id)


@router.patch("/accounts/{account_id}", response_model=FinanceAccountOut,
    response_model_by_alias=False,
)
async def update_account_route(
    account_id: str,
    payload: FinanceAccountUpdate,
    db=Depends(get_db),
    user_id: str = Depends(get_user_id),
):
    return await update_finance_account(db, user_id, account_id, payload)


@router.delete("/accounts/{account_id}", response_model=MessageResponse,
    response_model_by_alias=False,
)
async def delete_account_route(
    account_id: str,
    db=Depends(get_db),
    user_id: str = Depends(get_user_id),
):
    await delete_finance_account(db, user_id, account_id)
    return MessageResponse(message="Account deleted successfully")


# Categories

@router.post(
    "/categories",
    response_model=FinanceCategoryOut,
    status_code=status.HTTP_201_CREATED,
)
async def create_category_route(
    payload: FinanceCategoryCreate,
    db=Depends(get_db),
    user_id: str = Depends(get_user_id),
):
    return await create_finance_category(db, user_id, payload)


@router.get("/categories", response_model=list[FinanceCategoryOut])
async def list_categories_route(
    type_filter: Optional[Literal["income", "expense"]] = Query(default=None, alias="type"),
    db=Depends(get_db),
    user_id: str = Depends(get_user_id),
):
    return await list_finance_categories(db, user_id, type_filter)


@router.patch("/categories/{category_id}", response_model=FinanceCategoryOut)
async def update_category_route(
    category_id: str,
    payload: FinanceCategoryUpdate,
    db=Depends(get_db),
    user_id: str = Depends(get_user_id),
):
    return await update_finance_category(db, user_id, category_id, payload)


@router.delete("/categories/{category_id}", response_model=MessageResponse)
async def delete_category_route(
    category_id: str,
    db=Depends(get_db),
    user_id: str = Depends(get_user_id),
):
    await delete_finance_category(db, user_id, category_id)
    return MessageResponse(message="Category deleted successfully")


# Transactions

@router.post(
    "/transactions",
    response_model=FinanceTransactionOut,
    status_code=status.HTTP_201_CREATED,
)
async def create_transaction_route(
    payload: FinanceTransactionCreate,
    db=Depends(get_db),
    user_id: str = Depends(get_user_id),
):
    return await create_finance_transaction(db, user_id, payload)


@router.get("/transactions", response_model=list[FinanceTransactionOut])
async def list_transactions_route(
    start_date: Optional[datetime] = Query(default=None, alias="startDate"),
    end_date: Optional[datetime] = Query(default=None, alias="endDate"),
    type_filter: Optional[Literal["income", "expense", "transfer"]] = Query(default=None, alias="type"),
    category_id: Optional[str] = Query(default=None, alias="categoryId"),
    account_id: Optional[str] = Query(default=None, alias="accountId"),
    db=Depends(get_db),
    user_id: str = Depends(get_user_id),
):
    return await list_finance_transactions(
        db=db,
        user_id=user_id,
        start_date=start_date,
        end_date=end_date,
        type_filter=type_filter,
        category_id=category_id,
        account_id=account_id,
    )


@router.patch("/transactions/{transaction_id}", response_model=FinanceTransactionOut)
async def update_transaction_route(
    transaction_id: str,
    payload: FinanceTransactionUpdate,
    db=Depends(get_db),
    user_id: str = Depends(get_user_id),
):
    return await update_finance_transaction(db, user_id, transaction_id, payload)


@router.delete("/transactions/{transaction_id}", response_model=MessageResponse)
async def delete_transaction_route(
    transaction_id: str,
    db=Depends(get_db),
    user_id: str = Depends(get_user_id),
):
    await delete_finance_transaction(db, user_id, transaction_id)
    return MessageResponse(message="Transaction deleted successfully")


# Budgets

@router.post(
    "/budgets",
    response_model=FinanceBudgetOut,
    status_code=status.HTTP_201_CREATED,
)
async def create_budget_route(
    payload: FinanceBudgetCreate,
    db=Depends(get_db),
    user_id: str = Depends(get_user_id),
):
    return await create_finance_budget(db, user_id, payload)


@router.get("/budgets", response_model=list[FinanceBudgetOut])
async def list_budgets_route(
    db=Depends(get_db),
    user_id: str = Depends(get_user_id),
):
    return await list_finance_budgets(db, user_id)


@router.patch("/budgets/{budget_id}", response_model=FinanceBudgetOut)
async def update_budget_route(
    budget_id: str,
    payload: FinanceBudgetUpdate,
    db=Depends(get_db),
    user_id: str = Depends(get_user_id),
):
    return await update_finance_budget(db, user_id, budget_id, payload)


@router.delete("/budgets/{budget_id}", response_model=MessageResponse)
async def delete_budget_route(
    budget_id: str,
    db=Depends(get_db),
    user_id: str = Depends(get_user_id),
):
    await delete_finance_budget(db, user_id, budget_id)
    return MessageResponse(message="Budget deleted successfully")


@router.get("/budgets/status", response_model=list[FinanceBudgetStatusOut])
async def budget_status_route(
    db=Depends(get_db),
    user_id: str = Depends(get_user_id),
):
    return await get_finance_budget_status(db, user_id)


# Dashboard

@router.get("/dashboard/summary", response_model=FinanceDashboardSummaryOut)
async def dashboard_summary_route(
    start_date: Optional[datetime] = Query(default=None, alias="startDate"),
    end_date: Optional[datetime] = Query(default=None, alias="endDate"),
    db=Depends(get_db),
    user_id: str = Depends(get_user_id),
):
    now = datetime.now(timezone.utc)
    start_date = start_date or get_start_of_month_utc(now)
    end_date = end_date or now

    return await get_finance_dashboard_summary(
        db=db,
        user_id=user_id,
        start_date=start_date,
        end_date=end_date,
    )