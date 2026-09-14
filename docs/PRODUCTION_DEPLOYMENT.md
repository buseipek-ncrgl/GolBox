# Şehitkamil+ production deployment

Pilot target: closed municipal deployment. Schema source of truth is **EF Core migrations**. Do not run runtime `EnsureCreated` / raw `ALTER` helpers.

## Required environment

Set these in the API process. Never commit real values.

| Key | Required in Production | Notes |
| --- | --- | --- |
| `ConnectionStrings__Default` or `ConnectionStrings__DefaultConnection` | Yes | SQL Server. SQLite is rejected. |
| `Jwt__Key` | Yes | ≥ 32 characters. Not a development placeholder. |
| `Jwt__Issuer` / `Jwt__Audience` | Yes | Must match token consumers. |
| `Security__DynamicQr__HmacKey` | Yes | ≥ 32 characters. Not a development placeholder. |
| `Security__DynamicQr__AllowLegacyGuid` | No | Default `false`. Keep false in production. |
| `Security__Cors__AllowedOrigins__0` … | Yes | Explicit citizen + admin origins. No `*`. |
| `BootstrapAdmin__Email` | First boot only | Created only if no Admin user exists. |
| `BootstrapAdmin__Password` | First boot only | Min 12 characters. Change after first login. |
| `Storage__UploadsPath` | Yes | Persistent volume path. Do not use ephemeral container disk. |
| `Storage__PublicBaseUrl` | Recommended | Public URL prefix for `/uploads/{file}`. |
| Citizen `NEXT_PUBLIC_API_URL` | Yes | API origin. |
| Citizen `NEXT_PUBLIC_HUB_URL` | Yes | SignalR origin if different. |
| Citizen `NEXT_PUBLIC_MAP_TILE_URL` | Yes | Tile template. OSM default is for development. |
| Citizen `NEXT_PUBLIC_MAP_ATTRIBUTION` | Yes | Required attribution text. |
| Admin `VITE_API_URL` | Yes | API origin. |
| Admin `VITE_MAP_TILE_URL` | Yes | Tile template. |
| Admin `VITE_MAP_ATTRIBUTION` | Yes | Required attribution text. |

Missing JWT, HMAC, CORS, or SQL Server connection **fail-fast** at startup.

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

## Bootstrap admin

Production seed does **not** create `admin@golbox.gov.tr` / `Admin123!` or demo citizens.

If no Admin user exists, set:

```
BootstrapAdmin__Email=...
BootstrapAdmin__Password=...
```

Restart once, then rotate the password in Admin → Vatandaşlar (or SQL) and remove the env vars.

## Storage

`wwwroot/uploads` is the development default and is ephemeral in most container hosts.

Production:

1. Mount a persistent volume.
2. Set `Storage__UploadsPath` to that mount.
3. Set `Storage__PublicBaseUrl` to the public origin that serves `/uploads`.

Object storage is out of scope for this phase.

## Health

- `GET /health/live` — process up
- `GET /health` and `GET /health/ready` — database reachable and no pending migrations

Responses contain `{ "status": "ok" }` or `{ "status": "unhealthy" }` only.

## Observability

Requests accept and return `X-Correlation-Id`. Logs include correlation id, request id, and actor id when authenticated. Do not log JWT, QR tokens, or HMAC material.

## CORS / JWT / HMAC

Production rejects placeholder keys and empty/wildcard CORS. Citizen and admin origins must be listed explicitly.

## Map tiles

Do not hard-depend on `tile.openstreetmap.org` in production. Configure a permitted provider or a self-hosted tile endpoint, and keep attribution visible.

## Backup

Before every release:

1. Full SQL Server backup (full + log as policy requires).
2. Record the current `__EFMigrationsHistory` max migration id.
3. Snapshot the upload volume.

## Rollback

Migrations in this train are additive (tables, columns, indexes). There is **no destructive Down** intended for production.

If a release fails:

1. Keep the database at the applied migration. Do not run `Down`.
2. Redeploy the previous API/frontend images.
3. Additive columns/tables left behind are backward compatible for the previous app.
4. Restore from backup only if data was corrupted.

If you must restore:

1. Stop the API.
2. Restore SQL backup taken before the release.
3. Restore the upload volume to the same point.
4. Start the previous application version.

## Product surface

Citizen bottom nav stays **Ana | Harita | QR | Profil**. Product name is **Şehitkamil+**. **GölBox** is only the field-drop feature.
