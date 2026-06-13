from fastapi import FastAPI, APIRouter, Depends, Header, HTTPException
from fastapi.security import HTTPBearer
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select, text
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from collections import defaultdict
from app.database import engine, SessionLocal, get_db
from app.models import User, Expense, Category
from app.schemas import (
    UserCreate,
    UserOut,
    UserLogin,
    ExpenseCreate,
    ExpenseOut,
    ExpenseUpdate,
    CategoryCreate,
    CategoryOut,
    CategoryUpdate,
    ChatRequest,
    ChatResponse,
)
from app.utils import verify_password, hash_password
from app.auth import create_access_token, get_current_user
from app.init_db import init_db



router = APIRouter()


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()

@app.on_event("startup")
async def startup_event():
    print("FastAPI started")


@app.get("/debug/db-users")
async def debug_users(db=Depends(get_db)):
    result = await db.execute(text("SELECT id, email FROM users"))
    users = result.mappings().all()
    return users


@app.get("/")
async def root():
    return {"message": "API is running 🚀"}


@app.get("/db-test")
async def db_test():
    try:
        async with engine.begin() as conn:
            return {"status": "DB connected successfully 🚀"}
    except Exception as e:
        return {"status": "DB connection failed ❌", "error": str(e)}
    

@app.on_event("startup")
async def startup():
    await init_db()


async def get_db():
    async with SessionLocal() as session:
        yield session


import httpx

@app.get("/test-ollama")
async def test_ollama():

    async with httpx.AsyncClient() as client:
        response = await client.post(
            "http://localhost:11434/api/generate",
            json={
                "model": "llama3.2",
                "prompt": "Say hello in one sentence.",
                "stream": False
            }
        )

    return response.json()


@app.post("/users", response_model=UserOut)
async def create_user(user: UserCreate, db: AsyncSession = Depends(get_db)):
    new_user = User(
        username=user.username,
        email=user.email,
        password=hash_password(user.password)
    )

    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    return new_user


@app.post("/chat", response_model = ChatResponse)
async def chat_with_finance_data(
    chat: ChatRequest,
    db: AsyncSession = Depends(get_db),
    user_id: int = Depends(get_current_user)
):
    result = await db.execute(
        select(Expense)
        .options(selectinload(Expense.category_rel))
        .where(Expense.user_id == int(user_id))
        .order_by(Expense.date.desc())
    )

    expenses = result.scalars().all()

    if not expenses:
        return {
            "answer": "I do not see any expenses yet. Add a few expenses first, then I can help you find patterns and suggestions.",
            "sources": []
        }

    total_spent = sum(float(e.amount or 0) for e in expenses)

    category_totals = defaultdict(float)
    category_counts = defaultdict(int)

    for e in expenses:
        category_name = e.category_rel.name if e.category_rel else "Uncategorized"
        category_totals[category_name] += float(e.amount or 0)
        category_counts[category_name] += 1

    top_category = max(category_totals.items(), key=lambda item: item[1])
    biggest_expense = max(expenses, key=lambda e: float(e.amount or 0))

    all_expenses_text = "\n".join(
    f"{e.date.strftime('%Y-%m-%d')} | "
    f"{e.title} | "
    f"Rs. {float(e.amount):,.2f} | "
    f"{e.category_rel.name if e.category_rel else 'Uncategorized'}"
    for e in expenses
)

    message = chat.message

    category_text = "\n".join(
        f"- {cat}: Rs. {amt:,.2f}"
        for cat, amt in sorted(
            category_totals.items(),
            key=lambda x: x[1],
            reverse=True
        )
    )
    
    recent_text = "\n".join(
    f"- {e.title}: Rs. {float(e.amount):,.2f} | Date: {e.date.strftime('%Y-%m-%d')}"
    for e in expenses[:5]
)

    top_name, top_amount = top_category

    prompt = f"""
    You are an intelligent personal finance assistant.

    Analyze the user's spending data and answer the user's question.

    SPENDING DATA

    Total Spending:
    Rs. {total_spent:,.2f}

    Number of Expenses:
    {len(expenses)}
    
    Expense Records:
    {all_expenses_text}

    Highest Spending Category:
    {top_name} (Rs. {top_amount:,.2f})

    Category Breakdown:
    {category_text}

    Recent Expenses:
    {recent_text}

    USER QUESTION:
    {message}

    Rules:
    1. Answer only using the spending data provided.
    2. Give practical financial insights when possible.
    3. Keep answers concise and useful.
    4. If the user asks for savings advice, suggest realistic actions.
    5. If the user asks about trends, infer them from the available data.
    6. Expense dates are provided. Use them when answering questions about time periods.
    7. Never say data is missing if dates are present in Expense Records.
    """

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                "http://localhost:11434/api/generate",
                json={
                    "model": "llama3.2",
                    "prompt": prompt,
                    "stream": False
                }
            )

        response.raise_for_status()

        ai_answer = response.json()["response"]

    except Exception as e:
        print("OLLAMA ERROR:", e)

        ai_answer = (
            "I couldn't analyze your spending data right now. "
            "Please try again in a moment."
        )

    sources = [
    f"{e.title} - Rs. {float(e.amount):,.2f}"
    for e in expenses[:5]
]

    return {
        "answer": ai_answer,
        "sources": sources
    }

@app.post("/register")
async def register(
    user: UserCreate,
    db: AsyncSession = Depends(get_db)
):
    existing_user = await db.execute(
        select(User).where(User.email == user.email)
    )
    existing_user = existing_user.scalar_one_or_none()

    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists")

    hashed_password = hash_password(user.password)

    new_user = User(
        email=user.email,
        username=user.username,
        password=hashed_password
    )

    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)


    if user.categories:
        for c in user.categories:
            db.add(Category(name=c, user_id=new_user.id))

        await db.commit()

    return {"message": "User created successfully"}




@app.post("/login")
async def login(user: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(User).where(User.email == user.email)
    )
    db_user = result.scalar_one_or_none()
    if not db_user:
        raise HTTPException(
            status_code=401,
            detail="User not found"
        )
    if not verify_password(user.password, db_user.password):
        raise HTTPException(
            status_code=401,
            detail="Incorrect password"
        )
    access_token = create_access_token(
        {"sub": str(db_user.id)}
    )
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }



@app.get("/protected")
async def protected_route(user_id: str = Depends(get_current_user)):
    return {
        "message": "You are logged in",
        "user_id": user_id
    }

@app.post("/categories", response_model=CategoryOut)
async def create_category(
    category: CategoryCreate,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    new_category = Category(
        name=category.name,
        user_id=int(user_id)
    )

    db.add(new_category)
    await db.commit()
    await db.refresh(new_category)

    return new_category


@app.get("/categories", response_model=list[CategoryOut])
async def get_categories(
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    result = await db.execute(
        select(Category).where(
            Category.user_id == int(user_id)
        ).order_by(Category.id)
    )

    categories = result.scalars().all()

    return categories



@app.patch("/categories/{id}", response_model=CategoryOut)
async def update_category(
    id: int,
    category: CategoryUpdate,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    result = await db.execute(
        select(Category).where(
            Category.id == id,
            Category.user_id == int(user_id)
        )
    )

    db_category = result.scalar_one_or_none()

    if not db_category:
        raise HTTPException(
            status_code=404,
            detail="Category not found"
        )

    db_category.name = category.name

    await db.commit()
    await db.refresh(db_category)

    return db_category


@app.delete("/categories/{id}")
async def delete_category(
    id: int,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    result = await db.execute(
        select(Category).where(
            Category.id == id,
            Category.user_id == int(user_id)
        )
    )

    category = result.scalar_one_or_none()

    if category is None:
        raise HTTPException(
            status_code=404,
            detail="Category not found"
        )

    await db.delete(category)
    await db.commit()

    return {
        "message": "Category deleted successfully"
    }



@app.post("/expenses", response_model=ExpenseOut)
async def create_expense(
    expense: ExpenseCreate,
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    new_expense = Expense(
        title=expense.title,
        amount=expense.amount,
        category=int(expense.category),
        user_id=int(user_id),
    )

    db.add(new_expense)
    await db.commit()
    await db.refresh(new_expense)

    return new_expense

from sqlalchemy.orm import selectinload

@app.get("/expenses")
async def get_expenses(
    db: AsyncSession = Depends(get_db),
    user_id: str = Depends(get_current_user)
):

    result = await db.execute(
        select(Expense)
        .options(selectinload(Expense.category_rel))
        .where(Expense.user_id == int(user_id))
    )
    expenses = result.scalars().all()
    
    return [
    {
        "id": e.id,
        "title": e.title,
        "amount": e.amount,
        "date": e.date,
        "user_id": e.user_id,
        "category": e.category,
        "category_name": e.category_rel.name if e.category_rel else None,
    }
    for e in expenses
]


@router.get("/categories")
async def get_categories(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Category))
    categories = result.scalars().all()
    
    return categories



@router.patch("/expenses/{expense_id}")
async def update_expense(
    expense_id: int,
    expense_update: ExpenseUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: int = Depends(get_current_user)
):
    result = await db.execute(
        select(Expense).where(Expense.id == expense_id)
    )
    expense = result.scalar_one_or_none()

    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")

    if expense.user_id != int(current_user):
        raise HTTPException(status_code=403, detail="Not allowed")

    if expense_update.amount is not None:
        expense.amount = expense_update.amount

    if expense_update.category is not None:
        expense.category = int(expense_update.category)

    if expense_update.title is not None:
        expense.title = expense_update.title

    if expense_update.date is not None:
        expense.date = expense_update.date

    await db.commit()
    await db.refresh(expense)

    return expense



@router.delete("/expenses/{expense_id}")
async def delete_expense(
    expense_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: int = Depends(get_current_user)
):
    result = await db.execute(
        select(Expense).where(Expense.id == expense_id)
    )
    expense = result.scalar_one_or_none()
    
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")

    if expense.user_id != current_user:
        raise HTTPException(status_code=403, detail="Not allowed")

    await db.delete(expense)
    await db.commit()

    return {"message": "Expense deleted"}



app.include_router(router)