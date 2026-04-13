# FocusTrack

FocusTrack is a full-stack productivity SaaS platform with:

- JWT authentication
- Task tracking with drag-and-drop ordering
- Rich text notes with pinning and tags
- Pomodoro timer with persisted session history
- Analytics dashboard with weekly chart, category pie, and activity heatmap
- Light and dark theme system with semantic design tokens
- PWA support (manifest + service worker)

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS v4
- Prisma + PostgreSQL
- React Query + Zustand
- TipTap editor
- dnd-kit
- Recharts
- Zod + bcryptjs + jose (JWT)

## Project Structure

- `src/app/(auth)` auth pages
- `src/app/(app)` protected SaaS pages
- `src/app/api` API route handlers
- `src/components` UI, layout, charts, notes, providers
- `src/lib` auth, prisma, validators, helpers
- `src/store` Zustand store
- `prisma/schema.prisma` database schema

## Environment Variables

Update `.env`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DB?schema=public"
JWT_SECRET="replace-with-a-strong-secret"
NEXT_PUBLIC_APP_NAME="FocusTrack"
```

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Generate Prisma client:

```bash
npm run prisma:generate
```

3. Run migrations:

```bash
npm run prisma:migrate
```

4. Start development server:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Quality Checks

```bash
npm run lint
npm run build
```

## API Overview

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/tasks`, `POST /api/tasks`, `PUT /api/tasks/:id`, `DELETE /api/tasks/:id`
- `GET /api/notes`, `POST /api/notes`, `PUT /api/notes/:id`, `DELETE /api/notes/:id`
- `GET /api/pomodoro/sessions`, `POST /api/pomodoro/sessions`
- `GET /api/analytics/stats`

## Deploy to Vercel

1. Push this repository to GitHub.
2. Import project in Vercel.
3. Add environment variables from `.env`.
4. Provision PostgreSQL and set `DATABASE_URL`.
5. Deploy.

For first deployment, run migrations against your production database.
