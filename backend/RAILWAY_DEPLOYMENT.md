# Railway Deployment

This repository deploys the backend from the root `Dockerfile` on Node 22.

## Prerequisites

- A Railway account and project
- Firebase service-account JSON
- A Groq API key for AI features
- The frontend's production origin

## Deploy

### Railway Dashboard

1. Create a project and choose **Deploy from GitHub repo**.
2. Select this repository and keep the repository root as the service root.
3. Confirm Railway detects `railway.json` and the root `Dockerfile`.
4. Add the variables below in the service's **Variables** tab.
5. Deploy and wait for `/health` to pass.

### Railway CLI

```bash
npm i -g @railway/cli
railway login
railway init
railway up
```

Set variables with `railway variables --set KEY=value`, then redeploy.

## Required Variables

| Variable | Value |
| --- | --- |
| `NODE_ENV` | `production` |
| `FIREBASE_SERVICE_ACCOUNT` | Complete service-account JSON |
| `GROQ_API_KEY` | Groq API key |
| `CORS_ORIGINS` | Comma-separated frontend origins, for example `https://app.example.com` |
| `TRUST_PROXY_HOPS` | `1` for Railway's single proxy layer |

Railway supplies `PORT`. The application defaults to `8080` only when `PORT` is
absent.

## Optional Variables

| Variable | Default |
| --- | --- |
| `GROQ_MODEL` | `llama-3.1-8b-instant` |
| `AI_QUOTA_ENABLED` | `true` |
| `AI_DAILY_REQUEST_LIMIT` | `20` |
| `AI_DAILY_TOKEN_LIMIT` | `200000` |
| `AI_DAILY_COST_LIMIT_USD` | `1.00` |
| `GROQ_INPUT_COST_PER_1M_USD` | `0.05` |
| `GROQ_OUTPUT_COST_PER_1M_USD` | `0.08` |

Quotas reset at `00:00 UTC`. Keep the Groq price variables aligned with the
current provider pricing so cost limits remain accurate.

Do not set `SKIP_AUTH=true` on Railway. The application ignores it in
production.

## Firebase Credential

The environment variable must contain the complete JSON object, including the
literal `\n` escape sequences inside `private_key`.

```bash
node -e "const fs=require('fs');const value=fs.readFileSync(process.argv[1],'utf8');process.stdout.write(JSON.stringify(JSON.parse(value)))" path/to/service-account.json
```

Copy the single-line output as the value of `FIREBASE_SERVICE_ACCOUNT`. Never
commit the service-account file.

## CORS

`CORS_ORIGINS` accepts a comma-separated allowlist. Production rejects browser
requests from unconfigured origins. Native mobile requests normally do not send
an `Origin` header and continue to use Firebase bearer-token authentication.

`CORS_ORIGIN` is supported only as a legacy fallback. Prefer `CORS_ORIGINS`.

## Verify

```bash
curl https://your-service.up.railway.app/health
```

A healthy response contains `"status":"ok"`. Then verify:

1. An unauthenticated `/api/users/profile` request returns `401`.
2. A request with a valid Firebase ID token returns the expected profile.
3. An allowed frontend origin passes the browser CORS preflight.
4. An unconfigured origin is rejected.
5. AI requests succeed and usage appears in Firestore quota records.

## Troubleshooting

- **Build failure:** run `docker build -t neurosync-backend .` from the
  repository root.
- **Credential failure:** validate that `FIREBASE_SERVICE_ACCOUNT` is one valid
  JSON value and that its private key retains newline escapes.
- **CORS failure:** include the exact scheme and host in `CORS_ORIGINS`, with no
  wildcard in production.
- **Rate-limit or proxy errors:** keep `TRUST_PROXY_HOPS=1` for the Railway
  edge proxy.
- **AI unavailable:** confirm `GROQ_API_KEY` and inspect the service logs for a
  provider or quota error.

## Security

- Never commit Firebase credentials or API keys.
- Use a dedicated Groq key with an appropriate spending limit.
- Keep the CORS allowlist and AI quotas enabled.
- Monitor Railway logs and Firestore quota records.
- Rotate any credential immediately if it is exposed.

## References

- [Railway documentation](https://docs.railway.com/)
- [Firebase Admin documentation](https://firebase.google.com/docs/admin/setup)
- [Groq documentation](https://console.groq.com/docs/)
