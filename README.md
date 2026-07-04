
# Origin Flow

**The Single Source of Truth for Modern Chartered Accountancy**

![Preview](./packages/assets/og-image.png)

Origin Flow is a decentralized, high-performance B2B SaaS platform engineered for Chartered Accountants. It transforms chaotic document handling, client communication, and payment tracking into a streamlined, Jira-inspired ticketing system. Built for speed and absolute clarity, Origin Flow bridges the gap between public client acquisition and secure, operational heavy-lifting.

A Webrizen product.

## 🏗 Architecture

Origin Flow operates on a decentralized monorepo architecture to isolate marketing traffic from secure operational workflows:

- **`domain.com` (Marketing):** Public-facing directory and client onboarding.
- **`operate.domain.com` (Admin/Manager):** Restricted operational dashboard for workflow delegation.
- **`client.domain.com` (Client Portal):** Secure dashboard for document uploads and status tracking.
- **Backend API:** Node.js/Express gateway handling webhooks, cross-subdomain auth, and business logic.
- **Infrastructure:** Supabase (PostgreSQL, Storage, Realtime) and Turborepo.

## ✨ Core Features

- **Centralized Ticket Timeline:** A GitHub PR-style vertical feed for every service request. Chats, file uploads, and payment statuses are chronologically locked into a single source of truth.
- **Dynamic Service Routing:** Admins can define custom services (e.g., GST Registration) with specific required document fields for clients to fulfill.
- **Kanban-Style Delegation:** Managers can track, assign, and update ticket statuses (Open, Awaiting Action, Under Review, Pending Payment) in real-time.
- **BYOK Payments & Pay Later:** Integrated PhonePe gateway for direct settlements, plus a custom "Pay Later" flow that generates PDF contracts and fires them to clients via WhatsApp Cloud API.
- **Cross-Subdomain Auth:** Seamless session management across all application frontiers using secure, HttpOnly cookies.

## 🗺 Roadmap

- [ ] Implement Supabase Realtime subscriptions for live chat and timeline updates.
- [ ] Build the dynamic form generator for custom service requirements.
- [ ] Integrate WhatsApp Cloud API for automated PDF agreement dispatch.
- [ ] Implement granular RBAC (Role-Based Access Control) for internal manager permissions.

---

## 🛠 Installation & Setup Guide

### Prerequisites

Ensure the following tools are installed on your system before proceeding:

| Tool       | Version  | Purpose                       |
| ---------- | -------- | ----------------------------- |
| **Node.js** | `v20+`  | JavaScript runtime            |
| **pnpm**    | `v9.15+` | Fast, disk-efficient package manager |
| **Git**     | `v2.40+` | Version control               |

> [!NOTE]
> This project uses `pnpm` exclusively. The `packageManager` field in the root `package.json` is pinned to `pnpm@9.15.4`. Do **not** use `npm` or `yarn`.

**Install pnpm** (if not already installed):

```bash
npm install -g pnpm
```

---

### Repository Structure

```
origin-flow/
├── frontend/
│   ├── marketing/          → @origin-flow/marketing   (React + Vite + Tailwind v4)
│   ├── admin/              → @origin-flow/admin       (React + Vite + Tailwind v4)
│   └── clients/            → @origin-flow/clients     (React + Vite + Tailwind v4)
├── backend/
│   └── api/                → @origin-flow/api         (Express 5 + TypeScript)
├── packages/
│   ├── ui/                 → @origin-flow/ui          (Shared React components)
│   └── config/             → @origin-flow/config      (Shared TS & ESLint configs)
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```

---

### Step 1 — Clone & Install

```bash
git clone <your-repo-url> origin-flow
cd origin-flow
pnpm install
```

This single command installs dependencies for **all 6 workspace packages** — three frontends, one backend, and two shared packages — using pnpm's workspace protocol.

---

### Step 2 — Environment Variables

Create a `.env` file inside `backend/api/` for backend configuration:

```bash
cp backend/api/.env.example backend/api/.env   # if an example file exists
```

Or create one manually:

```env
# backend/api/.env

PORT=4000

# Supabase (required for production)
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# WhatsApp Cloud API (future integration)
WHATSAPP_API_TOKEN=your_whatsapp_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id

# PhonePe Payment Gateway (future integration)
PHONEPE_MERCHANT_ID=your_merchant_id
PHONEPE_SALT_KEY=your_salt_key
```

> [!IMPORTANT]
> The `.env` file is git-ignored by default. Never commit secrets to version control.

---

### Step 3 — Run the Development Servers

**Start all services simultaneously** from the project root:

```bash
pnpm dev
```

This executes `turbo run dev`, which spins up every workspace package with a `dev` script in parallel:

| Service       | Package Name            | URL                          | Dev Command            |
| ------------- | ----------------------- | ---------------------------- | ---------------------- |
| Marketing     | `@origin-flow/marketing` | `http://localhost:3000`      | `vite --port 3000`     |
| Admin         | `@origin-flow/admin`     | `http://localhost:3001`      | `vite --port 3001`     |
| Client Portal | `@origin-flow/clients`   | `http://localhost:3002`      | `vite --port 3002`     |
| Backend API   | `@origin-flow/api`       | `http://localhost:4000`      | `tsx watch src/server.ts` |

> [!TIP]
> To run a **single** workspace in isolation, use pnpm's `--filter` flag:
>
> ```bash
> pnpm --filter @origin-flow/marketing dev    # Only the marketing site
> pnpm --filter @origin-flow/api dev          # Only the backend API
> ```

---

### Step 4 — Verify the Setup

Once `pnpm dev` is running, verify that everything is working:

1. **Frontend apps:** Open `http://localhost:3000`, `http://localhost:3001`, and `http://localhost:3002` in your browser. Each should render a styled page with shared UI components.

2. **Backend API:** Hit the health-check endpoint:

   ```bash
   curl http://localhost:4000/api/health
   ```

   Expected response:

   ```json
   {
     "status": "ok",
     "service": "origin-flow-api",
     "timestamp": "2026-07-04T06:00:00.000Z"
   }
   ```

---

### Available Scripts

All scripts are orchestrated via **Turborepo** from the project root:

| Command        | Description                                                   |
| -------------- | ------------------------------------------------------------- |
| `pnpm dev`     | Start all dev servers in parallel (Vite HMR + tsx watch)      |
| `pnpm build`   | Production build for all packages (topological dependency order) |
| `pnpm lint`    | Run ESLint across all workspaces                              |
| `pnpm clean`   | Remove `dist/` and `node_modules/` from every package         |

---

### Tech Stack

| Layer             | Technology                                      |
| ----------------- | ----------------------------------------------- |
| **Monorepo**      | Turborepo + pnpm Workspaces                     |
| **Frontend**      | React 19, Vite 6, Tailwind CSS v4, TypeScript 5 |
| **Backend**       | Node.js, Express 5, TypeScript 5                |
| **Hot Reload**    | Vite HMR (frontend), tsx watch (backend)        |
| **Shared UI**     | `@origin-flow/ui` — Button, Card components     |
| **Shared Config** | `@origin-flow/config` — Base tsconfig, ESLint   |
| **Database**      | Supabase (PostgreSQL + Storage + Realtime)       |
| **Payments**      | PhonePe Gateway                                 |
| **Messaging**     | WhatsApp Cloud API                              |

---

### Coding Conventions

| Rule               | Standard                                                    |
| ------------------ | ----------------------------------------------------------- |
| **File naming**    | Strictly lowercase kebab-case (`user-profile.tsx`)          |
| **Import aliases** | `@/*` maps to `./src/*` in all frontend apps                |
| **Shared imports** | `import { Button } from "@origin-flow/ui"`                  |
| **Language**       | TypeScript strict mode across the entire monorepo           |

---

### License

Proprietary — © 2026 Webrizen AI Labs Pvt Ltd. All rights reserved.
