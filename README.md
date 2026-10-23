# Baymax

CSC 603 final project. Express + PostgreSQL on AWS.

## Run locally

```bash
npm install
npm run dev
```

Get the shared `.env` put it in the project root

## Deploy

Pushing to `main` deploys automatically. Check the **Actions** tab to see if it passed.

Live site: http://18.222.76.199:3000

## Database

Add new tables to `db/schema.sql` with `CREATE TABLE IF NOT EXISTS`. They get created on the next deploy.
