from pydantic import BaseModel
from typing import Optional
from datetime import date as Date
from datetime import datetime


class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    answer: str
    sources: list[str] = []

class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    categories: list[str] = []

class UserLogin(BaseModel):
    email: str
    password: str

class UserOut(BaseModel):
    id: int
    username: str
    email: str

    class Config:
        from_attributes = True

class ExpenseCreate(BaseModel):
    title: str
    amount: float
    category: int


class ExpenseOut(BaseModel):
    id: int
    title: str
    amount: float
    category: int
    category_name: Optional[str] = None
    user_id: int
    date: datetime

    class Config:   
        from_attributes = True


class ExpenseUpdate(BaseModel):
    amount: Optional[float] = None
    category: Optional[int] = None
    title: Optional[str] = None
    date: Optional[Date] = None


class CategoryCreate(BaseModel):
    name: str


class CategoryOut(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True


class CategoryUpdate(BaseModel):
    name: str