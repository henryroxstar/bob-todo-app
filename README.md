# Bob Todo App

A full-stack todo application built with **Python Flask** (backend) and **vanilla JavaScript** (frontend), created as part of the IBM Bob lab.

## Features

- Create, read, update, and delete todos
- Mark todos complete / incomplete with a single click
- Filter by All / Active / Completed
- Responsive design — works on mobile and desktop
- 99% backend test coverage

## Project Structure

```
todo-app/
├── backend/
│   ├── app.py            # Flask app + all REST routes
│   ├── models.py         # SQLAlchemy Todo model
│   ├── database.py       # DB initialisation helper
│   ├── requirements.txt  # Python dependencies
│   └── tests/
│       ├── conftest.py   # Pytest fixtures
│       └── test_todos.py # 26 endpoint tests
└── frontend/
    ├── index.html        # Single-page shell
    ├── css/
    │   └── styles.css    # Responsive stylesheet
    └── js/
        ├── api.js        # Fetch wrappers for every endpoint
        └── app.js        # DOM rendering + event handlers
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/todos` | List all todos |
| `POST` | `/api/todos` | Create a todo |
| `PUT` | `/api/todos/<id>` | Update a todo |
| `PATCH` | `/api/todos/<id>/toggle` | Toggle completed |
| `DELETE` | `/api/todos/<id>` | Delete a todo |

## Quick Start

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python3 app.py                 # runs on http://127.0.0.1:5000
```

### Frontend

Open `frontend/index.html` in your browser (backend must be running).

### Run Tests

```bash
cd backend
.venv/bin/pytest tests/ -v --cov=app --cov=models --cov=database
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3, Flask 3, Flask-CORS |
| ORM | Flask-SQLAlchemy |
| Database | SQLite (dev) |
| Frontend | Vanilla JS, Fetch API |
| Testing | pytest, pytest-flask, pytest-cov |
