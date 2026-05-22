# PeerLift Backend

Flask REST API powering the PeerLift student skill-exchange platform.

## Tech Stack

- **Python 3.11+** / **Flask**
- **PostgreSQL** / **SQLAlchemy 2.0**
- **JWT** authentication (Flask-JWT-Extended)
- **Flask-Migrate** (Alembic) for schema migrations

## Quick Start

```bash
# 1. Create & activate virtual environment
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Mac/Linux

# 2. Install dependencies
pip install -r requirements.txt

# 3. Create .env from template (then update DATABASE_URL with your password)
copy .env.example .env

# 4. Create the PostgreSQL database
createdb peerlift

# 5. Run database migrations
flask db upgrade

# 6. Seed sample data
python seed.py

# 7. Start the dev server
python run.py
```

Server runs on **http://localhost:5000**

## Seed Credentials

| Role    | Email              | Password      |
|---------|--------------------|---------------|
| Admin   | rudra@pit.edu      | password123   |
| Student | karan@piet.edu     | password123   |

All seeded users share the password `password123`.

## API Base URL

All endpoints live under `/api/v1`. Protected routes require:

```
Authorization: Bearer <jwt_token>
```

## Endpoints Overview

| Group           | Prefix                     |
|-----------------|----------------------------|
| Auth            | `/api/v1/auth`             |
| Users           | `/api/v1/users`            |
| Skills          | `/api/v1/skills`           |
| Matches         | `/api/v1/matches`          |
| Posts           | `/api/v1/posts`            |
| Notifications   | `/api/v1/notifications`    |
| Messages        | `/api/v1/messages`         |
| Admin           | `/api/v1/admin`            |
