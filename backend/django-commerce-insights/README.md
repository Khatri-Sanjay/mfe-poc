# Django Commerce Insights

Django frontend and backend service embedded in the Angular `admin-app` by iframe.

## Purpose

This app does not own commerce data. NestJS remains the source of truth for auth, users, products, inventory, orders, reviews, coupons, and shipping.

Django owns admin intelligence features:

- Dashboard aggregation
- Low-stock analysis
- Review queue summary
- Recommendation/merchandising workspace
- Future analytics snapshots and background jobs

## Auth Model

```text
Angular shell/admin login
  -> NestJS returns JWT tokens
  -> admin-app renders iframe
  -> admin-app sends access token with postMessage
  -> Django frontend calls Django API with Authorization: Bearer <token>
  -> Django API validates token through NestJS /auth/me
  -> Django API proxies/aggregates NestJS admin endpoints
```

The JWT is never passed in the iframe URL.

## Run Locally

```bash
cd backend/django-commerce-insights
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python manage.py runserver 8000
```

Open through the Angular shell:

```text
http://localhost:4200/admin/insights
```

Standalone Django URL:

```text
http://localhost:8000/app/
```

## Endpoints

```text
GET /app/
GET /api/health/
GET /api/session/me/
GET /api/dashboard/summary/
```

All API endpoints except health expect:

```text
Authorization: Bearer <nestjs-access-token>
```
