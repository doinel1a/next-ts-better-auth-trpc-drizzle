[issues]: https://github.com/doinel1a/next-ts-better-auth-trpc-drizzle/issues
[pulls]: https://github.com/doinel1a/next-ts-better-auth-trpc-drizzle/pulls
[license]: https://github.com/doinel1a/next-ts-better-auth-trpc-drizzle/blob/main/LICENSE
[demo]: https://next-ts-better-auth-trpc-drizzle.d1a.app/
[node]: https://nodejs.org/en
[bun]: https://bun.com/docs/installation
[pnpm]: https://pnpm.io/installation
[yarn]: https://yarnpkg.com/getting-started/install
[docker]: https://docs.docker.com/get-docker/
[corepack]: https://nodejs.org/api/corepack.html
[typescript]: https://www.typescriptlang.org/
[nextjs]: https://nextjs.org/
[react]: https://react.dev/
[better-auth]: https://better-auth.com/
[trpc]: https://trpc.io/
[drizzle]: https://orm.drizzle.team/
[tailwindcss]: https://tailwindcss.com/
[shadcn]: https://ui.shadcn.com/
[zod]: https://zod.dev/
[tanstack-query]: https://tanstack.com/query
[react-hook-form]: https://react-hook-form.com/
[playwright]: https://playwright.dev/
[eslint]: https://eslint.org/
[prettier]: https://prettier.io/
[husky]: https://typicode.github.io/husky/
[commitlint]: https://commitlint.js.org/

# Next.js · Better Auth · tRPC · Drizzle - Template

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)][license]
[![Next.js](https://img.shields.io/badge/Next.js-16.x-black)][nextjs]
[![Better Auth](https://img.shields.io/badge/Better_Auth-1.6.x-7c3aed)][better-auth]
[![TypeScript](https://img.shields.io/badge/TypeScript-6.x-3178c6)][typescript]
[![tRPC](https://img.shields.io/badge/tRPC-11.x-398ccb)][trpc]
[![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-0.45.x-c5f74f)][drizzle]
[![Playwright](https://img.shields.io/badge/Playwright-1.60.x-45ba4b)][playwright]

Building a full-stack Next.js app from scratch means wiring together authentication, database migrations, type-safe API routes, form validation, and UI components - before writing a single line of business logic. This template eliminates that overhead.

It combines **[Next.js 16 App Router][nextjs]**, **[Better Auth][better-auth]**, **[tRPC v11][trpc]**, and **[Drizzle ORM][drizzle]** into a single, opinionated starter where every layer is type-safe and production-ready from day one.

- **Type-safe end-to-end** - database schema, tRPC procedures, and React components stay in sync automatically
- **Auth out of the box** - email/password and OAuth-ready via Better Auth, no boilerplate needed
- **Full-stack API layer** - tRPC v11 with TanStack Query for seamless client-server communication
- **Beautiful UI included** - shadcn/ui + Radix UI + TailwindCSS 4 components pre-configured
- **E2E test infrastructure included** - Playwright tests ready to run
- **Production-ready** - env validation, Docker Compose, migrations, and seeders all included

---

[Demo][demo] &nbsp;|&nbsp; [Report a bug][issues] &nbsp;|&nbsp; [Request a feature][issues] &nbsp;|&nbsp; [Open a pull request][pulls]

---

## Table of contents

- [Getting started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment variables](#environment-variables)
  - [Start the database](#start-the-database)
  - [Database setup](#database-setup)
  - [Switching package manager](#switching-package-manager)
- [Project structure](#project-structure)
  - [Database clients](#database-clients)
- [Available scripts](#available-scripts)
- [Tech stack](#tech-stack)

---

## Getting started

### Prerequisites

- **[Node.js][node]** ≥ 24 - or **[Bun][bun]** ≥ 1.x as an alternative runtime
- **[pnpm][pnpm]** ≥ 11 - or npm, yarn, or bun (see [switching package manager](#switching-package-manager))
- **[Docker][docker]** - for the included PostgreSQL + pgAdmin setup

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/doinel1a/next-ts-better-auth-trpc-drizzle YOUR-PROJECT-NAME
cd YOUR-PROJECT-NAME
```

|             | **npm**       | **bun**       | **pnpm**       | **yarn**       |
| ----------- | ------------- | ------------- | -------------- | -------------- |
| **install** | `npm install` | `bun install` | `pnpm install` | `yarn install` |

### Environment variables

Copy `.env.example` to `.env` and fill in the required values:

```bash
cp .env.example .env
```

| Variable                  | Description                  | Side   | Required                    |
| ------------------------- | ---------------------------- | ------ | --------------------------- |
| `DATABASE_URL`            | PostgreSQL connection string | Server | Yes                         |
| `BETTER_AUTH_URL`         | Base URL for Better Auth     | Server | Yes                         |
| `BETTER_AUTH_SECRET`      | Secret key (min 32 chars)    | Server | Yes                         |
| `NEXT_PUBLIC_SIGN_UP_URL` | Sign-up redirect URL         | Client | Yes                         |
| `NEXT_PUBLIC_SIGN_IN_URL` | Sign-in redirect URL         | Client | Yes                         |
| `NODE_ENV`                | Runtime environment          | Server | No (default: `development`) |

> [!TIP]
> Generate a secure `BETTER_AUTH_SECRET` with: `openssl rand -base64 32`

> [!NOTE]
> Set `SKIP_ENV_VALIDATION=true` to bypass env validation (useful for Docker builds).

### Start the database

The project ships a `docker-compose.yml` with PostgreSQL 17 and pgAdmin. Start them with:

```bash
docker compose up -d
```

| Service    | Default URL             |
| ---------- | ----------------------- |
| PostgreSQL | `localhost:5432`        |
| pgAdmin    | `http://localhost:8080` |

> [!NOTE]
> If you prefer to use an existing PostgreSQL instance, skip this step and set `DATABASE_URL` accordingly.

### Database setup

Push the schema to your database or run migrations:

```bash
# Push schema directly (development)
pnpm db:push

# Or run migrations (production)
pnpm db:migrate

# Optional: seed the database with sample data
pnpm db:seed
```

> [!TIP]
> Use `pnpm db:studio` to open Drizzle Studio and inspect your database visually.

> [!WARNING]
> `pnpm db-danger:reset` wipes the entire database and re-seeds it. All existing data will be permanently lost.

### Start the development server

|         | **npm**       | **bun**   | **pnpm**   | **yarn**   |
| ------- | ------------- | --------- | ---------- | ---------- |
| **dev** | `npm run dev` | `bun dev` | `pnpm dev` | `yarn dev` |

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Switching package manager

<details>
<summary>Steps to switch from pnpm to npm, yarn, or bun</summary>

**1.** Delete the pnpm lock file:

```bash
rm pnpm-lock.yaml
```

**2.** (Optional) Declare the new package manager in `package.json` so tooling and CI pick it up automatically:

```json
"packageManager": "npm@10.x.x"
```

Replace `npm@10.x.x` with `yarn@4.x.x` or `bun@1.x.x` as appropriate. See [Corepack docs][corepack] for details.

**3.** Install dependencies with the new package manager:

```bash
# npm
npm install

# yarn
yarn install

# bun
bun install
```

</details>

> [!NOTE]
> All scripts in `package.json` use package-manager-agnostic syntax and work without changes after switching.

---

## Project structure

```
.
├── __tests__/
│   ├── unit/                # Vitest unit tests (node)
│   ├── components/          # Vitest component tests (jsdom + Testing Library)
│   ├── integration/         # Vitest integration tests (in-memory PGlite)
│   ├── e2e/                 # Playwright E2E tests
│   └── setup/               # Shared Vitest setup files
├── drizzle/
│   ├── migrations/          # SQL migration history
│   ├── schemas/             # Drizzle table definitions (auth + students)
│   ├── seeders/             # Database seeders and reset script
│   ├── config.ts            # Drizzle Kit configuration
│   └── index.ts             # Standalone database client (for scripts)
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/        # Better Auth API route handler
│   │   │   └── trpc/        # tRPC API route handler
│   │   ├── auth/            # Auth pages (sign-in, sign-up)
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/          # Shared UI components (navbar, footer, providers, ui)
│   ├── lib/
│   │   ├── constants/
│   │   ├── schemas/
│   │   ├── types/
│   │   └── utils/
│   ├── server/
│   │   ├── api/             # tRPC root router and procedures
│   │   ├── auth/            # Server-side auth helpers
│   │   ├── trpc/            # tRPC server client and query client
│   │   └── db.ts            # Pooled database client used by the app
│   ├── styles/              # Global styles
│   ├── config.ts            # App configuration
│   ├── env.ts               # Env validation (Zod + T3 env-nextjs)
│   └── proxy.ts             # Auth proxy
└── public/                  # Static assets
```

### Database clients

The project exposes two Drizzle clients. Pick the one that matches where your code runs:

| Client             | Used by                                     | Connection                                                  |
| ------------------ | ------------------------------------------- | ----------------------------------------------------------- |
| `src/server/db.ts` | The running app (tRPC context, Better Auth) | One shared `pg` pool, cached on `globalThis` to survive HMR |
| `drizzle/index.ts` | Standalone scripts (migrations, one-offs)   | Its own `pg` pool, created when the module is imported      |

```ts
// Inside the Next.js app
import { db } from '@/server/db';
```

```ts
// Inside a standalone script (run with tsx)
import db from '~/drizzle';
```

> [!IMPORTANT]
> Never import `drizzle/index.ts` from application code. It would open a second pool next to the one in `src/server/db.ts`, and in development a new one on every hot reload.

> [!NOTE]
> `src/server/db.ts` is also loaded by the Better Auth CLI (`ba:generate`), which cannot resolve modules that import `server-only`. Keep that import out of its dependency chain (this is why it logs with `console.error` instead of `serverLogger`).

---

## Available scripts

| Script                | Description                                           |
| --------------------- | ----------------------------------------------------- |
| `dev`                 | Start the Next.js dev server                          |
| `build`               | Build for production                                  |
| `preview`             | Start the production server (`next start`)            |
| `typecheck`           | Run TypeScript compiler without emitting files        |
| `lint`                | Run ESLint                                            |
| `lint:fix`            | Run ESLint and auto-fix issues                        |
| `lint:profiling`      | Run ESLint with timing profiling                      |
| `format`              | Format all source files with Prettier                 |
| `test`                | Run unit, component and integration tests (Vitest)    |
| `test:watch`          | Run Vitest in watch mode                              |
| `test:unit`           | Run only the unit tests                               |
| `test:components`     | Run only the component tests                          |
| `test:integration`    | Run only the integration tests                        |
| `test:coverage`       | Run Vitest with a coverage report                     |
| `test:e2e`            | Run Playwright E2E tests                              |
| `test:e2e:ui`         | Run Playwright with interactive UI mode               |
| `ba:generate`         | Run Better Auth CLI to regenerate auth artifacts      |
| `db:studio`           | Open Drizzle Studio for visual database inspection    |
| `db:push`             | Push the Drizzle schema to the database (development) |
| `db:create-migration` | Generate a new migration from schema changes          |
| `db:migrate`          | Run SQL migrations (production)                       |
| `db:seed`             | Seed the database with sample data                    |
| `db-danger:reset`     | Wipe and re-seed the database (destructive)           |

---

## Tech stack

| Tool                                                    | Purpose                                                |
| ------------------------------------------------------- | ------------------------------------------------------ |
| **[Next.js 16][nextjs]**                                | Full-stack React framework with App Router             |
| **[React 19][react]**                                   | UI library with React Compiler enabled                 |
| **[Better Auth][better-auth]**                          | Type-safe authentication with email/password and OAuth |
| **[tRPC v11][trpc]**                                    | End-to-end type-safe API layer                         |
| **[TanStack Query][tanstack-query]**                    | Server state management and data fetching              |
| **[Drizzle ORM][drizzle]**                              | Type-safe SQL ORM with schema-driven migrations        |
| **[shadcn/ui][shadcn]**                                 | Accessible, composable UI component library            |
| **[TailwindCSS 4][tailwindcss]**                        | Utility-first CSS framework                            |
| **[React Hook Form][react-hook-form]** + **[Zod][zod]** | Form state management and schema validation            |
| **[Playwright][playwright]**                            | End-to-end browser testing                             |
| **[ESLint 10][eslint]** + **[Prettier][prettier]**      | Linting and formatting                                 |
| **[Husky][husky]** + **[Commitlint][commitlint]**       | Git hooks and conventional commit enforcement          |
