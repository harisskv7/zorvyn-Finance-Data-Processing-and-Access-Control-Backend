# API Demo Request Sheet (curl)

Base URL: `http://127.0.0.1:4000`

## 0) Health
```bash
curl -X GET http://127.0.0.1:4000/api/health
```

## 1) Auth
### Register
```bash
curl -X POST http://127.0.0.1:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Demo User","email":"demo.user@zorvyn.com","password":"Password123"}'
```

### Login (Admin)
```bash
curl -X POST http://127.0.0.1:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@zorvyn.com","password":"Admin@123"}'
```

### Login (Analyst)
```bash
curl -X POST http://127.0.0.1:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"analyst@zorvyn.com","password":"Analyst@123"}'
```

### Login (Viewer)
```bash
curl -X POST http://127.0.0.1:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"viewer@zorvyn.com","password":"Viewer@123"}'
```

## 2) Users (Admin token required)
Replace `<ADMIN_TOKEN>`.

### List Users
```bash
curl -X GET "http://127.0.0.1:4000/api/users?page=1&limit=10" \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

### Get User by ID
```bash
curl -X GET http://127.0.0.1:4000/api/users/1 \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

### Update Role
```bash
curl -X PATCH http://127.0.0.1:4000/api/users/3/role \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"role":"analyst"}'
```

### Update Status
```bash
curl -X PATCH http://127.0.0.1:4000/api/users/3/status \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"status":"active"}'
```

## 3) Records
### Create Record (Admin)
```bash
curl -X POST http://127.0.0.1:4000/api/records \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"amount":2500,"type":"income","category":"bonus","date":"2025-04-01","notes":"Quarterly bonus"}'
```

### Get Records (all roles)
```bash
curl -X GET "http://127.0.0.1:4000/api/records?page=1&limit=10" \
  -H "Authorization: Bearer <VIEWER_TOKEN>"
```

### Filter Records (Analyst/Admin)
```bash
curl -X GET "http://127.0.0.1:4000/api/records?type=income&category=salary&from=2025-01-01&to=2025-12-31&page=1&limit=10" \
  -H "Authorization: Bearer <ANALYST_TOKEN>"
```

### Get Record by ID
```bash
curl -X GET http://127.0.0.1:4000/api/records/1 \
  -H "Authorization: Bearer <VIEWER_TOKEN>"
```

### Update Record (Admin)
```bash
curl -X PATCH http://127.0.0.1:4000/api/records/1 \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"notes":"Updated note from API demo"}'
```

### Soft Delete Record (Admin)
```bash
curl -X DELETE http://127.0.0.1:4000/api/records/1 \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

## 4) Dashboard
### Summary (All roles)
```bash
curl -X GET http://127.0.0.1:4000/api/dashboard/summary \
  -H "Authorization: Bearer <VIEWER_TOKEN>"
```

### By Category (Analyst/Admin)
```bash
curl -X GET http://127.0.0.1:4000/api/dashboard/by-category \
  -H "Authorization: Bearer <ANALYST_TOKEN>"
```

### Trends (Analyst/Admin)
```bash
curl -X GET "http://127.0.0.1:4000/api/dashboard/trends?period=monthly" \
  -H "Authorization: Bearer <ANALYST_TOKEN>"
```

### Recent Transactions (All roles)
```bash
curl -X GET "http://127.0.0.1:4000/api/dashboard/recent?limit=5" \
  -H "Authorization: Bearer <VIEWER_TOKEN>"
```
