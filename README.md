# Personal Finance Assistant

An AI-powered personal finance management application built with React, FastAPI, PostgreSQL, and Ollama (Llama 3.2).

## Features

* User authentication using JWT
* Expense tracking and categorization
* Personalized dashboards
* AI-powered financial insights
* Spending trend analysis
* Local LLM integration using Ollama

---

## Prerequisites

Install the following before running the project:

* Python 3.10+
* Node.js 18+
* PostgreSQL
* Ollama

---

## Database Setup

1. Install PostgreSQL.
2. Create a database:

```sql
CREATE DATABASE finance_assistant;
```

3. Update your database connection string in `.env`:

```env
DATABASE_URL=postgresql+asyncpg://postgres:your_password@localhost/finance_assistant
```

---

## Backend Setup

Navigate to the backend folder:

```bash
cd backend
```

Create and activate a virtual environment:

```bash
python -m venv venv
```

Windows:

```bash
venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create a `.env` file:

```env
DATABASE_URL=postgresql+asyncpg://postgres:your_password@localhost/finance_assistant
SECRET_KEY=your_secret_key
```

Run the backend:

```bash
uvicorn app.main:app --reload
```

Backend runs on:

```txt
http://localhost:8000
```

---

## Ollama Setup (AI Assistant)

Install Ollama from:

https://ollama.com

Download the model:

```bash
ollama pull llama3.2
```

Verify Ollama is running:

```bash
curl http://localhost:11434/api/generate -d "{\"model\":\"llama3.2\",\"prompt\":\"Hello\",\"stream\":false}"
```

The backend connects to:

```txt
http://localhost:11434
```

No OpenAI API key is required.

---

## Frontend Setup

Navigate to frontend:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Run:

```bash
npm start
```

Frontend runs on:

```txt
http://localhost:3000
```

---

## Architecture

React → FastAPI → PostgreSQL

React → FastAPI → Ollama (Llama 3.2)

The AI assistant receives summarized financial data from PostgreSQL and generates personalized insights locally using Llama 3.2.

---

## Future Improvements

* Expense forecasting
* Budget planning
* Data visualizations
* Cloud deployment
