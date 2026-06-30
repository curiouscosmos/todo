# Kanban Todo Frontend

Next.js App Router frontend for the Kanban Todo app.

See the root [`README.md`](../README.md) for full architecture, backend setup, assumptions, scalability notes, and future improvements.

## Local Commands

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

```bash
pnpm lint
pnpm exec tsc --noEmit
pnpm test
```

The app runs at `http://localhost:3000` and calls the backend from `NEXT_PUBLIC_API_BASE_URL`.
