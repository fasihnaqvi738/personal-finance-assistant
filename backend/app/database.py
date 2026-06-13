import os
from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base


BASE_DIR = Path(__file__).resolve().parent.parent
env_path = BASE_DIR / ".env"

print("Loading .env from:", env_path)

load_dotenv(env_path)

DATABASE_URL = os.getenv("DATABASE_URL")

print("DATABASE URL LOADED:", DATABASE_URL)

if not DATABASE_URL:
    raise Exception(
        "DATABASE_URL not found. Check .env file location and format."
    )


engine = create_async_engine(
    DATABASE_URL,
    echo=True,  
    future=True
)

SessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False
)

Base = declarative_base()

async def get_db():
    async with SessionLocal() as session:
        yield session

