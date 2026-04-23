# kestrel-path


## Features

- **TypeScript** - For type safety and improved developer experience
- **Next.js** - Full-stack React framework
- **TailwindCSS** - Utility-first CSS for rapid UI development
- **Shared UI package** - shadcn/ui primitives live in `packages/ui`
- **Drizzle** - TypeScript-first ORM
- **SQLite/Turso** - Database engine
- **Authentication** - Better-Auth
- **Turborepo** - Optimized monorepo build system

## Getting Started

First, install the dependencies:

```bash
pnpm install
```

## Database Setup

This project uses SQLite with Drizzle ORM.

1. Start the local SQLite database (optional):

```bash
pnpm db:local
```

2. Update your `.env` file in the `apps/web` directory with the appropriate connection details if needed.

3. Apply the schema to your database:

```bash
pnpm db:push
```

Then, run the development server:

```bash
pnpm dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser to see the fullstack application.

## Local Transcript Storage

For local development, you can run a MinIO S3-compatible object store instead of Vercel Blob.

1. Copy `apps/web/.env.example` into your local `apps/web/.env` or merge the storage variables into your existing file.
2. Set `STORAGE_PROVIDER=s3`.
3. Start MinIO:

```bash
pnpm storage:up
```

This starts:
- MinIO API on [http://127.0.0.1:9000](http://127.0.0.1:9000)
- MinIO Console on [http://127.0.0.1:9001](http://127.0.0.1:9001)

The compose setup automatically creates a public `transcripts` bucket so transcript uploads from the AI workspace can be viewed locally via the saved object URL.

To stop the local object store:

```bash
pnpm storage:down
```

## UI Customization

React web apps in this stack share shadcn/ui primitives through `packages/ui`.

- Change design tokens and global styles in `packages/ui/src/styles/globals.css`
- Update shared primitives in `packages/ui/src/components/*`
- Adjust shadcn aliases or style config in `packages/ui/components.json` and `apps/web/components.json`

### Add more shared components

Run this from the project root to add more primitives to the shared UI package:

```bash
npx shadcn@latest add accordion dialog popover sheet table -c packages/ui
```

Import shared components like this:

```tsx
import { Button } from "@kestrel-path/ui/components/button";
```

### Add app-specific blocks

If you want to add app-specific blocks instead of shared primitives, run the shadcn CLI from `apps/web`.

## Project Structure

```
kestrel-path/
├── apps/
│   └── web/         # Fullstack application (Next.js)
├── packages/
│   ├── ui/          # Shared shadcn/ui components and styles
│   ├── auth/        # Authentication configuration & logic
│   └── db/          # Database schema & queries
```

## Available Scripts

- `pnpm dev`: Start all applications in development mode
- `pnpm build`: Build all applications
- `pnpm dev:web`: Start only the web application
- `pnpm check-types`: Check TypeScript types across all apps
- `pnpm db:push`: Push schema changes to database
- `pnpm db:generate`: Generate database client/types
- `pnpm db:migrate`: Run database migrations
- `pnpm db:studio`: Open database studio UI
- `pnpm db:local`: Start the local SQLite database
