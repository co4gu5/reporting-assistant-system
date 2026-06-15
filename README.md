# ReportAssist

A full-stack daily reporting system built with Next.js 14, PostgreSQL, Prisma 7, JWT auth, and a custom drag-and-drop form builder.

## Features

- **Home page** — marketing landing page with feature overview
- **Sign in / Sign up** — single auth page; redirects to admin or member panel based on role
- **Admin panel**
  - View all submitted daily reports, filterable by date
  - Click any report to view full details in a modal
  - Design custom report form templates with a drag-and-drop builder (text, textarea, number, dropdown, checkbox fields)
  - Set any template as the active template for members
- **Member panel**
  - Daily report modal pops up automatically on login if no report submitted today
  - Form rendered dynamically from the active template (or the default template)
  - After submission, dashboard shows the submitted report

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Database | PostgreSQL via Prisma 7 |
| Auth | JWT in httpOnly cookies (jose) |
| Form builder | @dnd-kit/core + @dnd-kit/sortable |
| Styling | Tailwind CSS v4 |
| ORM adapter | @prisma/adapter-pg |

## Quick Start

### 1. Start PostgreSQL

Using Docker (recommended):

```bash
docker-compose up -d
```

Or configure an existing PostgreSQL instance and update `DATABASE_URL` in `.env`.

### 2. Configure Environment

Copy the example and update if needed:

```bash
# .env is already created — review and update if your DB config differs
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/report_assistant"
JWT_SECRET="change-me-to-a-strong-secret-in-production"
```

### 3. Run Database Migration

```bash
npx prisma migrate dev --name init
```

### 4. Seed the Database

This creates the default admin account and the default report template:

```bash
npm run db:seed
```

Default admin credentials:
- **Email:** `admin@example.com`
- **Password:** `admin123`

### 5. Start the Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run db:generate` | Regenerate Prisma client |
| `npm run db:migrate` | Run pending migrations |
| `npm run db:seed` | Seed database with defaults |
| `npm run db:reset` | Reset database and re-run migrations |

## Project Structure

```
src/
├── app/
│   ├── page.tsx                   # Home page
│   ├── (auth)/
│   │   ├── signin/page.tsx        # Sign in
│   │   └── signup/page.tsx        # Sign up
│   ├── (admin)/
│   │   ├── layout.tsx             # Admin sidebar layout
│   │   ├── admin/page.tsx         # Reports dashboard
│   │   └── admin/template/page.tsx # Form builder
│   ├── (member)/
│   │   ├── layout.tsx             # Member header layout
│   │   └── member/page.tsx        # Member dashboard + report modal
│   └── api/
│       ├── auth/                  # signin, signup, signout, me
│       ├── admin/                 # reports, template CRUD
│       └── member/                # report submit, today check
├── middleware.ts                  # JWT decode + role-based redirects
├── lib/
│   ├── prisma.ts                  # Prisma client singleton
│   ├── auth.ts                    # JWT sign/verify helpers
│   └── defaultTemplate.ts         # Fallback report template
└── components/
    ├── admin/
    │   ├── FormBuilder.tsx        # Full drag-and-drop form builder
    │   └── FieldPalette.tsx       # Draggable field type palette
    └── member/
        └── ReportModal.tsx        # Dynamic daily report modal
```
