from __future__ import annotations

from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


CurrencyType = Literal["INR", "USD", "EUR"]
AccountType = Literal["bank", "cash", "wallet", "credit_card", "investment"]
CategoryType = Literal["income", "expense"]
TransactionType = Literal["income", "expense", "transfer"]
PaymentMethodType = Literal["cash", "upi", "card", "bank_transfer", "wallet", "other"]
BudgetPeriodType = Literal["monthly", "weekly", "custom"]


class FinanceBaseSchema(BaseModel):
    model_config = ConfigDict(
        populate_by_name=True,
        from_attributes=True,
        extra="forbid",
    )


class MessageResponse(FinanceBaseSchema):
    message: str


# Accounts

class FinanceAccountCreate(FinanceBaseSchema):
    name: str = Field(..., min_length=1, max_length=100)
    type: AccountType
    currency: CurrencyType = "INR"
    openingBalance: float = 0
    institution: Optional[str] = Field(default=None, max_length=120)
    notes: Optional[str] = Field(default=None, max_length=500)

    @field_validator("openingBalance")
    @classmethod
    def validate_opening_balance(cls, v: float) -> float:
        return round(float(v), 2)


class FinanceAccountUpdate(FinanceBaseSchema):
    name: Optional[str] = Field(default=None, min_length=1, max_length=100)
    type: Optional[AccountType] = None
    currency: Optional[CurrencyType] = None
    openingBalance: Optional[float] = None
    institution: Optional[str] = Field(default=None, max_length=120)
    notes: Optional[str] = Field(default=None, max_length=500)
    isActive: Optional[bool] = None

    @field_validator("openingBalance")
    @classmethod
    def validate_opening_balance(cls, v: Optional[float]) -> Optional[float]:
        if v is None:
            return None
        return round(float(v), 2)


class FinanceAccountOut(FinanceBaseSchema):
    id: str 
    userId: str
    name: str
    type: AccountType
    currency: CurrencyType
    openingBalance: float
    currentBalance: float
    institution: Optional[str] = None
    notes: Optional[str] = None
    isActive: bool = True
    createdAt: datetime
    updatedAt: datetime


# Categories

class FinanceCategoryCreate(FinanceBaseSchema):
    name: str = Field(..., min_length=1, max_length=80)
    type: CategoryType
    icon: Optional[str] = Field(default=None, max_length=50)
    color: Optional[str] = Field(default="#6366F1", max_length=20)


class FinanceCategoryUpdate(FinanceBaseSchema):
    name: Optional[str] = Field(default=None, min_length=1, max_length=80)
    type: Optional[CategoryType] = None
    icon: Optional[str] = Field(default=None, max_length=50)
    color: Optional[str] = Field(default=None, max_length=20)
    isActive: Optional[bool] = None


class FinanceCategoryOut(FinanceBaseSchema):
    id: str
    userId: str
    name: str
    type: CategoryType
    icon: Optional[str] = None
    color: Optional[str] = None
    isSystem: bool = False
    isActive: bool = True
    createdAt: datetime
    updatedAt: datetime


# Transactions

class FinanceTransactionCreate(FinanceBaseSchema):
    type: TransactionType
    amount: float = Field(..., gt=0)
    currency: CurrencyType = "INR"
    categoryId: Optional[str] = None
    accountId: str
    toAccountId: Optional[str] = None
    title: str = Field(..., min_length=1, max_length=120)
    description: Optional[str] = Field(default=None, max_length=500)
    merchant: Optional[str] = Field(default=None, max_length=120)
    transactionDate: datetime
    paymentMethod: PaymentMethodType = "other"
    tags: List[str] = Field(default_factory=list)

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, v: float) -> float:
        return round(float(v), 2)


class FinanceTransactionUpdate(FinanceBaseSchema):
    type: Optional[TransactionType] = None
    amount: Optional[float] = Field(default=None, gt=0)
    currency: Optional[CurrencyType] = None
    categoryId: Optional[str] = None
    accountId: Optional[str] = None
    toAccountId: Optional[str] = None
    title: Optional[str] = Field(default=None, min_length=1, max_length=120)
    description: Optional[str] = Field(default=None, max_length=500)
    merchant: Optional[str] = Field(default=None, max_length=120)
    transactionDate: Optional[datetime] = None
    paymentMethod: Optional[PaymentMethodType] = None
    tags: Optional[List[str]] = None

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, v: Optional[float]) -> Optional[float]:
        if v is None:
            return None
        return round(float(v), 2)


class FinanceTransactionOut(FinanceBaseSchema):
    id: str
    userId: str
    type: TransactionType
    amount: float
    currency: CurrencyType
    categoryId: Optional[str] = None
    accountId: str
    toAccountId: Optional[str] = None
    title: str
    description: Optional[str] = None
    merchant: Optional[str] = None
    transactionDate: datetime
    paymentMethod: PaymentMethodType
    tags: List[str] = Field(default_factory=list)
    createdAt: datetime
    updatedAt: datetime


# Budgets

class FinanceBudgetCreate(FinanceBaseSchema):
    name: str = Field(..., min_length=1, max_length=120)
    categoryId: str
    amount: float = Field(..., gt=0)
    period: BudgetPeriodType = "monthly"
    startDate: datetime
    endDate: Optional[datetime] = None
    alertThresholds: List[int] = Field(default_factory=lambda: [50, 80, 100])

    @field_validator("amount")
    @classmethod
    def validate_budget_amount(cls, v: float) -> float:
        return round(float(v), 2)


class FinanceBudgetUpdate(FinanceBaseSchema):
    name: Optional[str] = Field(default=None, min_length=1, max_length=120)
    categoryId: Optional[str] = None
    amount: Optional[float] = Field(default=None, gt=0)
    period: Optional[BudgetPeriodType] = None
    startDate: Optional[datetime] = None
    endDate: Optional[datetime] = None
    alertThresholds: Optional[List[int]] = None
    isActive: Optional[bool] = None

    @field_validator("amount")
    @classmethod
    def validate_budget_amount(cls, v: Optional[float]) -> Optional[float]:
        if v is None:
            return None
        return round(float(v), 2)


class FinanceBudgetOut(FinanceBaseSchema):
    id: str
    userId: str
    name: str
    categoryId: str
    amount: float
    period: BudgetPeriodType
    startDate: datetime
    endDate: Optional[datetime] = None
    alertThresholds: List[int]
    isActive: bool = True
    createdAt: datetime
    updatedAt: datetime


class FinanceBudgetStatusOut(FinanceBaseSchema):
    budgetId: str
    budgetName: str
    categoryId: str
    budgetAmount: float
    spentAmount: float
    remainingAmount: float
    usedPercentage: float
    isOverBudget: bool


# Dashboard

class CategorySpendItem(FinanceBaseSchema):
    categoryId: Optional[str] = None
    categoryName: str
    amount: float


class MonthlyTrendItem(FinanceBaseSchema):
    month: str
    income: float
    expense: float
    net: float


class FinanceDashboardSummaryOut(FinanceBaseSchema):
    totalBalance: float
    totalIncome: float
    totalExpense: float
    netSavings: float
    topExpenseCategories: List[CategorySpendItem]
    monthlyTrend: List[MonthlyTrendItem]