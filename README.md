# MeritLense UI

Frontend application for MeritLense — a candidate evaluation and scoring platform. Built with Next.js 16, React 19, and TypeScript.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4
- **UI Components:** Radix UI, shadcn/ui
- **State Management:** Zustand
- **Forms:** React Hook Form + Zod validation
- **Charts:** Recharts, Chart.js
- **HTTP Client:** Axios
- **Internationalization:** next-intl (English & Arabic)
- **Payments:** Stripe
- **Animations:** Framer Motion

## Project Structure

```
src/
├── app/
│   ├── api/                    # API client layer
│   │   ├── admin/              # Admin endpoints (users, rbac, billing, audit, employers, system)
│   │   ├── auth/               # Authentication client
│   │   ├── candidates/         # Candidate management
│   │   ├── dashboard/          # Dashboard endpoints (b2b, b2c, admin)
│   │   ├── evaluations/        # Evaluation management
│   │   ├── payments/           # Payment & Stripe integration
│   │   ├── profile/            # User profile
│   │   ├── scores/             # Score management
│   │   └── team/               # Team management
│   ├── context/                # React contexts (Subscription)
│   ├── hooks/                  # Custom hooks (useAuth, useProfile)
│   └── [locale]/               # Locale-based routing (en, ar)
│       ├── _components/        # Landing page components
│       ├── auth/               # Auth pages (register, login, verify, reset)
│       └── dashboard/          # Dashboard pages
│           ├── admin/          # Admin dashboard
│           ├── business/       # B2B dashboard
│           └── indivisual/     # B2C dashboard
├── components/ui/              # Reusable UI components (shadcn)
└── lib/                        # Utilities
```

## Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- Backend API running on `http://localhost:8000`

## Getting Started

1. **Install dependencies:**

   ```bash
   pnpm install
   ```

2. **Set up environment variables:**

   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` with your configuration (see [Environment Variables](#environment-variables)).

3. **Start the development server:**

   ```bash
   pnpm dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `http://localhost:8000/api` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key for payments | — |

See `.env.example` for a complete list.

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm build:export` | Build as static export |
| `pnpm start` | Start production server |
