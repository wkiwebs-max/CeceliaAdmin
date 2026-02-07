# Cecilia Admin — Node.js scaffold

This repository is a minimal Node.js scaffold with an Express server (for local dev), a native executable runner, and Vercel-ready static + API routes.

Quick start

1. Install dependencies.
2. Start the server.

```bash
npm install
npm start
```

Open http://localhost:3000 to view the page served from the public folder.

Run a native executable:

```bash
npm run run-native -- ./my-native-app.exe
```

Vercel deployment

- Static files in public/ are served automatically.
- Serverless API routes live in api/ (example: /api/health).

You can deploy this repo to Vercel without changes.
