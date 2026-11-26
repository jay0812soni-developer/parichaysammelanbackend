# Parichay Sammelan API 1.0.5

Node.js + Express + TiDB Cloud (PostgreSQL) + Cloudinary.

Repo: https://github.com/jay0812soni-developer/parichaysammelanbackend

## Security

- **Never commit `.env`** — secrets live in Render Environment only.
- `.env.example` has placeholders only.

## Render

1. Blueprint: `render.yaml` (or New Web Service → this repo).
2. Set env vars in Render dashboard (DB_*, CLOUDINARY_*, ADMIN_*, PUBLIC_API_URL).
3. Health: `GET /health`

## Local

```bash
cp .env.example .env
npm install
npm run dev
```
