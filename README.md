# Razorpay Pre-Assignment – Backend API

A production-grade REST API built with **Node.js**, **Express.js**, **PostgreSQL**, **Sequelize ORM**, and **cookie-based JWT authentication**.

---

## Tech Stack

| Layer         | Technology                     |
|---------------|--------------------------------|
| Runtime       | Node.js ≥ 18                   |
| Framework     | Express.js 4                   |
| Database      | PostgreSQL (local)             |
| ORM           | Sequelize 6 + sequelize-cli    |
| Auth          | JWT in HttpOnly cookies        |
| Validation    | express-validator              |
| Logging       | Winston                        |
| Security      | Helmet, CORS, cookie-parser    |

---

## Project Structure

```
src/
├── config/           # DB, CORS, JWT configuration
├── controllers/      # Thin HTTP handlers (req/res only)
├── services/         # Business logic layer
├── repositories/     # Data-access layer (Sequelize queries)
├── middleware/        # Auth, error handling, validation gate
├── routes/           # Express routers
├── models/           # Sequelize model definitions
├── migrations/       # Sequelize CLI migrations
├── seeders/          # Sequelize CLI seeders
├── utils/            # Logger, errors, asyncHandler, helpers
└── validations/      # express-validator schema chains
```

---

## Getting Started

### 1. Prerequisites

- Node.js ≥ 18
- PostgreSQL running locally on port 5432

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

```bash
cp .env.example .env
# Edit .env and fill in your DB credentials and JWT secrets
```

### 4. Create the Database

```sql
-- In psql or pgAdmin:
CREATE DATABASE razorpay_db;
```

### 5. Run Migrations

```bash
npm run db:migrate
```

### 6. Seed Demo Data (optional)

```bash
npm run db:seed
# Creates admin@example.com / Admin@1234
```

### 7. Start the Server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

The server starts on **http://localhost:7002**

---

## API Endpoints

### Health

| Method | Path      | Description     |
|--------|-----------|-----------------|
| GET    | /health   | Health check    |

### Auth  `BASE: /api/v1/auth`

| Method | Path              | Auth required | Description               |
|--------|-------------------|---------------|---------------------------|
| POST   | /register         | ✗             | Create a new account      |
| POST   | /login            | ✗             | Login, sets cookies       |
| POST   | /logout           | ✓             | Clears auth cookies       |
| POST   | /refresh          | ✗ (cookie)    | Rotate access token       |
| GET    | /me               | ✓             | Get current user profile  |

### Users  `BASE: /api/v1/users`

| Method | Path                    | Auth | Role  | Description           |
|--------|-------------------------|------|-------|-----------------------|
| GET    | /                       | ✓    | admin | List all users        |
| GET    | /:id                    | ✓    | any   | Get user by ID        |
| PATCH  | /:id                    | ✓    | any   | Update user profile   |
| DELETE | /:id                    | ✓    | admin | Delete user           |
| PATCH  | /:id/change-password    | ✓    | any   | Change password       |

---

## Cookie Strategy

| Cookie          | HttpOnly | Secure (prod) | SameSite | Path                   | Max-Age |
|-----------------|----------|---------------|----------|------------------------|---------|
| `access_token`  | ✓        | ✓             | Strict   | /                      | 7 days  |
| `refresh_token` | ✓        | ✓             | Strict   | /api/v1/auth/refresh   | 30 days |

---

## SOLID Principles Applied

| Principle | How                                                                                  |
|-----------|--------------------------------------------------------------------------------------|
| **S**RP   | Controllers handle HTTP only; Services handle business logic; Repositories handle DB |
| **O**CP   | New routes added in `routes/index.js` without touching `app.js`                      |
| **L**SP   | `UserRepository` extends `BaseRepository` and can substitute it anywhere             |
| **I**SP   | Each middleware is a focused, single-purpose function                                |
| **D**IP   | Services depend on Repository abstractions, not concrete Sequelize calls             |

---

## Environment Variables

See [`.env.example`](.env.example) for the full list of required variables.

---

## Scripts

| Command              | Description                              |
|----------------------|------------------------------------------|
| `npm run dev`        | Start dev server with nodemon            |
| `npm start`          | Start production server                  |
| `npm run db:migrate` | Run all pending migrations               |
| `npm run db:seed`    | Seed the database                        |
| `npm run db:reset`   | Rollback all, re-migrate, and re-seed    |
