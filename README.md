# Zorvyn Finance Data Processing and Access Control Backend

> Live App (Vercel): https://finance-backend-zeta.vercel.app  
> Swagger Docs: https://finance-backend-zeta.vercel.app/api/docs  
> Health Endpoint: https://finance-backend-zeta.vercel.app/api/health
> demo video screenreconding: https://drive.google.com/file/d/1dO-xjIN2JKBr5VeD4x2nJdU63Y8l4qlK/view?usp=sharing

## Project Overview
This project is a role-based finance backend (with a lightweight frontend console) built for the Zorvyn assignment. It delivers secure authentication, strict RBAC, financial record management with soft delete and pagination, and dashboard analytics endpoints, all documented in Swagger.

## Problem Statement Coverage
| Requirement | Status | Implementation |
|---|---|---|
| User and Role Management | Done | `viewer`, `analyst`, `admin`; user role/status management for admin |
| Financial Records CRUD + Filtering | Done | Admin create/update/delete; Analyst/Admin read/filter |
| Dashboard Summary/Analytics APIs | Done | Summary, category breakdown, trends, recent |
| RBAC | Done | Route-level guards + role-aware frontend visibility |
| Input Validation and Error Handling | Done | Zod schemas + global error middleware |
| Data Persistence | Done | SQLite via `better-sqlite3` |
| API Documentation | Done | Swagger UI served at `/api/docs` |
| Basic Testing | Done | Jest + Supertest integration tests |

## Access Model (Current RBAC)
| Capability | Viewer | Analyst | Admin |
|---|---|---|---|
| View own profile | Yes | Yes | Yes |
| View dashboard summary/recent | Yes | Yes | Yes |
| View analytics insights (`by-category`, `trends`) | No | Yes | Yes |
| View financial records | No | Yes | Yes |
| Filter/search records | No | Yes | Yes |
| Create records | No | No | Yes |
| Update records | No | No | Yes |
| Soft-delete records | No | No | Yes |
| Manage users (list/role/status) | No | No | Yes |

## Tech Stack
| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express.js |
| Database | SQLite (`better-sqlite3`) |
| Authentication | JWT (`jsonwebtoken`) |
| Validation | Zod |
| Documentation | Swagger (`swagger-jsdoc`, `swagger-ui-express`) |
| Testing | Jest + Supertest |
| Frontend (lightweight) | HTML/CSS/Vanilla JS (served by Express) |
| Deployment | Vercel (live), Render blueprint included |

## API Overview
### Auth
| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |

### Users
| Method | Endpoint | Access |
|---|---|---|
| GET | `/api/users` | Admin |
| GET | `/api/users/:id` | Admin or self |
| PATCH | `/api/users/:id/role` | Admin |
| PATCH | `/api/users/:id/status` | Admin |

### Records
| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/records` | Admin |
| GET | `/api/records` | Analyst/Admin |
| GET | `/api/records/:id` | Analyst/Admin |
| PATCH | `/api/records/:id` | Admin |
| DELETE | `/api/records/:id` | Admin (soft delete) |

### Dashboard
| Method | Endpoint | Access |
|---|---|---|
| GET | `/api/dashboard/summary` | All roles |
| GET | `/api/dashboard/recent?limit=5` | All roles |
| GET | `/api/dashboard/by-category` | Analyst/Admin |
| GET | `/api/dashboard/trends?period=monthly` | Analyst/Admin |

### Record Query Parameters
`GET /api/records` supports:
- `type=income|expense`
- `category=<text>`
- `from=YYYY-MM-DD`
- `to=YYYY-MM-DD`
- `page=<number>`
- `limit=<number>`

## Response Format
### Success
```json
{
  "success": true,
  "data": {},
  "message": "Request successful"
}
```

### Error
```json
{
  "success": false,
  "error": "Validation failed",
  "code": 400,
  "errorCode": "VALIDATION_ERROR"
}
```

## Security and Reliability Notes
- JWT bearer authentication is required for protected routes.
- Inactive users cannot log in.
- Admin safety checks are implemented:
  - self-deactivation is blocked,
  - deactivating the last active admin is blocked.
- Soft delete is used for records (`is_deleted = 1`), and deleted records are excluded from reads and analytics.

## Local Setup
1. Install dependencies:
```bash
npm install
```
2. Create environment file:
```bash
cp .env.example .env
```
3. Initialize schema and seed demo data:
```bash
npm run migrate
npm run seed
```
4. Start app:
```bash
npm run dev
```
5. Open locally:
- Frontend: `http://localhost:4000/`
- Swagger: `http://localhost:4000/api/docs`
- Health: `http://localhost:4000/api/health`

## Environment Variables
| Variable | Required | Default | Description |
|---|---|---|---|
| `NODE_ENV` | No | `development` | Runtime environment |
| `PORT` | No | `4000` | Server port |
| `DB_PATH` | No | `data/finance.db` (local), `/tmp/finance.db` (Vercel default) | SQLite file path |
| `JWT_SECRET` | Yes | - | JWT signing secret |
| `JWT_EXPIRES_IN` | No | `8h` | Token validity |
| `BCRYPT_SALT_ROUNDS` | No | `10` | Password hash cost |

## Demo Credentials
| Role | Email | Password |
|---|---|---|
| Admin | `admin@zorvyn.com` | `Admin@123` |
| Analyst | `analyst@zorvyn.com` | `Analyst@123` |
| Viewer | `viewer@zorvyn.com` | `Viewer@123` |

## Scripts
| Command | Purpose |
|---|---|
| `npm run dev` | Start in development with nodemon |
| `npm start` | Start server |
| `npm run migrate` | Run DB initialization SQL |
| `npm run seed` | Seed demo users and records |
| `npm test` | Run test suite |

## Testing
Current automated tests cover:
- register/login success,
- invalid login rejection,
- viewer blocked from record creation,
- admin record creation,
- viewer blocked from analytics endpoint.

## Deployment Notes
### Vercel (Current Live)
- Uses `api/index.js` as serverless entry and `vercel.json` routing.
- `JWT_SECRET` is configured in Vercel environment.
- SQLite defaults to `/tmp/finance.db` on Vercel (ephemeral storage).

### Render (Included)
- `render.yaml` is included for Render deployment.
- Render is preferred when persistent SQLite disk storage is required.

## Architecture Snapshot
```text
finance-backend/
├── api/                    # Vercel serverless entry
├── public/                 # Frontend console
├── src/
│   ├── config/             # DB, swagger, constants, bootstrap
│   ├── middleware/         # auth, role guard, validation, errors
│   ├── modules/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── records/
│   │   └── dashboard/
│   ├── utils/              # response, pagination, async handler, errors
│   ├── app.js
│   └── server.js
├── tests/
├── render.yaml
├── vercel.json
└── README.md
```

## Design Decisions and Tradeoffs
1. **SQLite over PostgreSQL:** chosen for zero-infra setup and easy evaluator run experience.
2. **Express over NestJS:** chosen for explicit control over middleware and route behavior.
3. **Zod over express-validator:** chosen for clean schema-first validation.
4. **Future upgrades:** refresh tokens, rate limiting, cursor pagination, Docker-first local/dev workflow, broader role-by-endpoint integration test matrix.
