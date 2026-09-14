# Şehitkamil+ production deployment

Pilot target: closed municipal deployment. Schema source of truth is **EF Core migrations**. Do not run runtime `EnsureCreated` / raw `ALTER` helpers.

Intended pilot version label: `v1.0.0-pilot.1`. Create that Git tag **only** after the municipal final gate is `PILOT READY = EVET`.

## Required environment

Set these on the municipal host. Never commit real values. Names below are the **only** canonical keys.

### API process (ASP.NET)

| Key | Required in Production | Notes |
| --- | --- | --- |
| `ASPNETCORE_ENVIRONMENT` | Yes | Must be `Production`. |
| `ConnectionStrings__Default` (or `ConnectionStrings__DefaultConnection`) | Yes | SQL Server. SQLite is rejected. |
| `Jwt__Key` | Yes | ≥ 32 characters. Not a development placeholder. |
| `Jwt__Issuer` / `Jwt__Audience` | Yes | Must match token consumers. |
| `Security__DynamicQr__HmacKey` | Yes | ≥ 32 characters. Not a development placeholder. |
| `Security__DynamicQr__AllowLegacyGuid` | No | Default `false`. Keep false in production. |
| `Security__Cors__AllowedOrigins__0` … | Yes | Explicit citizen + admin HTTPS origins. No `*`. |
| `BootstrapAdmin__Email` | First boot only | Created only if no Admin user exists. |
| `BootstrapAdmin__Password` | First boot only | Min 12 characters. Change after first login, then remove. |
| `Storage__UploadsPath` | Yes | Persistent volume path. Do not use ephemeral container disk. |
| `Storage__PublicBaseUrl` | Recommended | Public URL prefix for `/uploads/{file}`. |

Copy `backend/GolBox.Api/appsettings.Production.example.json` for structure only. Put secrets in the host environment or a secret store.

### Citizen (Next.js) — **build-time**

Rebuild the citizen app after changing these. Runtime env on the Node host does **not** rewrite a finished `.next` bundle.

| Key | Required | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | Yes unless same-origin proxy | Full API prefix, e.g. `https://api.example.gov.tr/api/v1`. |
| `NEXT_PUBLIC_HUB_URL` | Yes unless same-origin proxy | Full SignalR path, e.g. `https://api.example.gov.tr/hubs/orders`. Use `https`/`wss` behind TLS. |
| `NEXT_PUBLIC_NOTIFICATION_HUB_URL` | Recommended | Default production fallback is `/hubs/notifications`. |
| `NEXT_PUBLIC_MAP_TILE_URL` | Yes | Permitted municipal / licensed tile template. Not public OSM. |
| `NEXT_PUBLIC_MAP_ATTRIBUTION` | Yes | Visible attribution text. |

Same-origin reverse proxy: omit `NEXT_PUBLIC_API_BASE_URL` and `NEXT_PUBLIC_HUB_URL` so production falls back to `/api/v1` and `/hubs/orders`. Map tile keys are still required.

### Admin (Vite) — **build-time**

Rebuild after changing these.

| Key | Required | Notes |
| --- | --- | --- |
| `VITE_API_BASE_URL` | Yes unless same-origin proxy | Full API prefix, e.g. `https://api.example.gov.tr/api/v1`. |
| `VITE_MAP_TILE_URL` | Yes | Same provider policy as citizen. |
| `VITE_MAP_ATTRIBUTION` | Yes | Visible attribution text. |

### Deprecated names (not read by code)

| Do not set | Canonical replacement |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | `NEXT_PUBLIC_API_BASE_URL` |
| `VITE_API_URL` | `VITE_API_BASE_URL` |

Missing JWT, HMAC, CORS, or SQL Server connection **fail-fast** at API startup. Missing map-tile public env **fail-fast** at citizen/admin production build.

## Database migration

Prefer a **CI/CD step** before new instances start:

```bash
dotnet ef database update --project backend/GolBox.Persistence --startup-project backend/GolBox.Api
```

The API also calls `Database.Migrate()` on startup. For a single-instance pilot this is acceptable: the first process applies pending migrations, later processes no-op.

Multi-instance risk: two pods can race the first schema apply. Mitigations:

1. Run `database update` in the release job, then start N replicas.
2. Or start with replicas = 1 for the first rollout, then scale out.

Do not use `EnsureCreated` in production.

This train also adds `Users.Role` and `Cafes.ImageUrl` (previously patched at runtime) plus unique filtered indexes on `UserActivities (UserId, ActivityId)` and `UserFieldCaptures (FieldDropId, UserId)`. SQL Server skips those columns if they already exist from a legacy helper.

Lab Docker SQL Server is **not** the municipal source of truth. Pilot ready requires `__EFMigrationsHistory` = 12 on the **belediye** instance.

## Bootstrap admin

Production seed does **not** create `admin@golbox.gov.tr` / `Admin123!` or demo citizens.

If no Admin user exists, set:

```
BootstrapAdmin__Email=...
BootstrapAdmin__Password=...
```

Restart once, change the password in Admin, then **remove** the env vars from the host.

## Storage

`wwwroot/uploads` is the development default and is ephemeral in most container hosts.

Production:

1. Mount a persistent volume (or durable disk) that survives API restart **and** container/pod recreate.
2. Set `Storage__UploadsPath` to that mount.
3. Set `Storage__PublicBaseUrl` to the public origin that serves `/uploads`.
4. Back up this directory on the same schedule as the database. **DB backup alone is not enough.**

Object storage is out of scope for this phase.

## Health

- `GET /health/live` — process up
- `GET /health` and `GET /health/ready` — database reachable and no pending migrations

Responses contain `{ "status": "ok" }` or `{ "status": "unhealthy" }` only.

## Observability

Requests accept and return `X-Correlation-Id`. Logs include correlation id, request id, and actor id when authenticated. Do not log JWT, QR tokens, HMAC material, or raw emails beyond what audit actor id already covers.

## CORS / JWT / HMAC

Production rejects placeholder keys and empty/wildcard CORS. Citizen and admin **HTTPS** origins must be listed explicitly.

## Map tiles

Do not ship `tile.openstreetmap.org` in a municipal build. Set citizen and admin tile URL + attribution to the same accepted provider. Attribution must remain visible on Yerler and GölBox maps.

## HTTPS / reverse proxy

The API reads `X-Forwarded-For` and `X-Forwarded-Proto` so TLS termination at Nginx/IIS still yields HTTPS scheme and client IP (rate limit, audit). Restrict the proxy to the municipal edge.

Example Nginx (adjust names, certs, and upstream):

```nginx
map $http_upgrade $connection_upgrade {
    default upgrade;
    ''      close;
}

server {
    listen 443 ssl http2;
    server_name api.example.gov.tr;

    client_max_body_size 20m;
    proxy_read_timeout 60s;
    proxy_send_timeout 60s;

    ssl_certificate     /etc/nginx/certs/fullchain.pem;
    ssl_certificate_key /etc/nginx/certs/privkey.pem;

    location /hubs/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 70s;
    }

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Citizen/admin frontends must be HTTPS if the API is HTTPS (no mixed content). SignalR negotiate + WebSocket upgrade must be tested **through this proxy**, not only against a direct Kestrel port.

IIS: enable WebSocket protocol, ARR forwarded headers, and a 20 MB request limit to match uploads.

## Backup

Before every release:

1. Full SQL Server backup (full + log as policy requires). Record the file path and `__EFMigrationsHistory` max id.
2. Snapshot / copy `Storage__UploadsPath`.
3. Store both on media that is not the API disk.

Restore:

1. Stop the API.
2. Restore the SQL backup taken before the release (`RESTORE DATABASE … WITH REPLACE` after a dry-run restore to a side database).
3. Restore the upload volume to the same point.
4. Start the previous application version.

## Rollback

Migrations in this train are additive (tables, columns, indexes). There is **no destructive Down** intended for production.

If a release fails:

1. Keep the database at the applied migration. Do not run `Down`.
2. Redeploy the previous API/frontend images.
3. Additive columns/tables left behind are backward compatible for the previous app.
4. Restore from backup only if data was corrupted.

## GitHub CI and branch protection

Workflow `.github/workflows/ci.yml` runs on pull requests and `main`:

- backend: `dotnet restore` / `build` / `test`
- citizen: `npm ci`, `tsc --noEmit`, `next build`
- admin: `npm ci`, `tsc -b`, `vite build`

No production secrets are required. Municipal map/API URLs in CI are `example.gov.tr` placeholders so artefacts are not localhost.

Recommended `main` protection (this integration cannot apply it; a repo admin must):

1. Require a pull request before merge.
2. Require the `ci` GitHub Actions check.
3. Disable force push and deletion on `main`.

## Real data

Do not seed demo cafes, Mogan events, `golbox.com` images, or `admin@golbox.gov.tr`. Enter facilities from official municipal sources. Label internal fixtures `[PILOT TEST]` or keep them unpublished.

## Product surface

Citizen bottom nav stays **Ana | Harita | QR | Profil**. Product name is **Şehitkamil+**. **GölBox** is only the field-drop feature.
