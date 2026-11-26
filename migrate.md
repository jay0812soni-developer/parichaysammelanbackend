# TiDB Cloud (PostgreSQL compatible) setup

Your Starter instance uses **PostgreSQL compatibility** (not MySQL). The API uses the `pg` driver.

1. Wait until status is **Active** (Connect button enabled).
2. Open **Connect** → copy host, port (usually `5432`), user, password.
3. Put them in `api/.env` (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`).
4. In TiDB SQL editor, run [`schema.sql`](schema.sql).
5. From `api/`:

```bash
npm run seed-admin
npm run migrate
```
