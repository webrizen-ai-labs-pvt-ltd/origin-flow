# Origin Flow

**The Single Source of Truth for Modern Chartered Accountancy & Law Firms**

![Preview](./packages/assets/og-image.png)

Origin Flow is a decentralized, high-performance B2B SaaS platform engineered for Chartered Accountants, corporate legal firms, and their business clients. It transforms chaotic document handling, compliance filing, client communication, and payment tracking into a streamlined, Jira-inspired ticketing and firm operations platform.

A product by **Webrizen AI Labs Pvt Ltd.**

---

## 🏗 Architecture & Workspace Matrix

Origin Flow operates on a Turborepo monorepo architecture separating public marketing traffic, platform administration, firm operational workflows, and client portals into isolated applications sharing a centralized design system (`@origin-flow/ui`).

```
origin-flow/
├── frontend/
│   ├── marketing/          → @origin-flow/marketing   (Port 3000 | Public Landing & Inquiries)
│   ├── admin/              → @origin-flow/admin       (Port 3001 | Platform Admin & Tier Management)
│   ├── clients/            → @origin-flow/clients     (Port 3002 | Client Portal & Filing Timelines)
│   └── management/         → @origin-flow/management  (Port 3003 | Firm Operations & Manager RBAC)
├── backend/
│   └── api/                → @origin-flow/api         (Port 4000 | Express 5, Prisma, PhonePe PG, Auth)
├── packages/
│   ├── ui/                 → @origin-flow/ui          (Shared Untitled UI React Components & Tokens)
│   ├── config/             → @origin-flow/config      (Shared TypeScript & ESLint configurations)
│   └── assets/             → Static Brand Assets & Embedded Email Logos
├── package.json
├── pnpm-workspace.yaml
└── turbo.json
```

| Application / Service | Package Name | Port / URL | Target Role | Primary Responsibility |
|---|---|---|---|---|
| **Marketing Site** | `@origin-flow/marketing` | `http://localhost:3000` | Public / Prospects | Public landing page, solution showcase, and intake forms. |
| **Admin Portal** | `@origin-flow/admin` | `http://localhost:3001` | `ADMIN` | Platform administration, user directories, global plan creation, and plan tagging. |
| **Client Portal** | `@origin-flow/clients` | `http://localhost:3002` | `CLIENT` | Secure client document uploads, compliance checklists, and invoice payments. |
| **Management Portal** | `@origin-flow/management` | `http://localhost:3003` | `COMPANY` & `MANAGER` | CA firm management, staff delegation, client accounts, statutory profiles, and PhonePe subscription billing. |
| **Backend API** | `@origin-flow/api` | `http://localhost:4000` | All | Express 5, Prisma ORM (Supabase PostgreSQL), PhonePe PG engine, WebAuthn Passkeys, Nodemailer SMTP. |

---

## 🚀 Progress & Work Accomplished

### 1. 💳 PhonePe Payment Gateway & Subscription Billing Engine
- [x] **Prisma Subscription Schema**: Added `Plan`, `Subscription`, and `PaymentTransaction` models with enums (`BillingCycle`, `SubscriptionStatus`, `PaymentStatus`).
- [x] **PhonePe PG Service (`phonepe.service.ts`)**:
  - Implemented SHA256 checksum generation (`X-VERIFY`) using salt keys and indices.
  - Integration with PhonePe `/pg/v1/pay` for standard redirect checkout (UPI, Cards, NetBanking).
  - Implemented S2S Webhook callback handler with cryptographic signature verification.
  - Implemented `/pg/v1/status` direct query polling for real-time status verification.
- [x] **Automatic Return Verification & Fulfillment**:
  - Frontend detects `?txn=...` upon PhonePe gateway return and shows a live verification screen.
  - Auto-fulfills subscription, updates quotas, activates the plan, and locks the active plan card.
- [x] **Branded Nodemailer Receipts**:
  - Hostinger SMTP integration (`hello@webrizen.com`).
  - Sends HTML payment receipts with embedded inline CID logos (`cid:originflow-logo`), transaction IDs, valid-until dates, and tax invoices.

### 2. 🏢 Management Portal (`@origin-flow/management`)
- [x] **Full Portal on Port 3003**: Cloned and tailored from the core design system for operational firms.
- [x] **Role-Based Access Control (RBAC)**:
  - `COMPANY` (Firm Owner): Full access to Dashboard, Team Management, Clients, Plans & Billing (`/dashboard/billing`), and Firm Compliance Settings.
  - `MANAGER` (Staff Lead): Access to Dashboard, Assigned Clients, and Team; **Plans & Billing is hidden from sidebar and blocked via route guards**.
- [x] **Firm Compliance & Statutory Profile**: Form to manage PAN, GSTIN, UDIN (ICAI), FRN, DIN, TAN, and registered office address.
- [x] **Team Delegation & Client Directories**: Manage staff managers and client accounts with automated onboarding email dispatches.
- [x] **Biometric Passkey Security**: FIDO2 / WebAuthn passwordless authentication (Touch ID, Windows Hello, Face ID).

### 3. 🛡️ Admin Portal (`@origin-flow/admin`)
- [x] **Plans & Billing Management (`/dashboard/plans`)**: CRUD interface for creating, editing, activating, and archiving subscription tiers.
- [x] **Manual Plan Assignment**: Modal allowing admins to manually assign any plan to registered company accounts.
- [x] **Company Plan Tagging (`/dashboard/users`)**: Displays active plan tier badges (`[Starter Tier]`, `[Growth Professional]`, `[Free Tier]`) on company rows.
- [x] **Token Interceptor Fix**: Robust Bearer token injection from Zustand auth store.

### 4. 🔑 Authentication & Single Sign-In UX
- [x] **Single-Card Sign-In**: Clean 2-column sign-in card without requiring users to manually pick a role.
- [x] **Automatic Role Recognition**: Reads and stores `user.role` into persistent auth storage upon Google OAuth or Passkey login.
- [x] **Role Boundary Protections**:
  - Admin Portal strictly enforces `ADMIN` role.
  - Management Portal enforces `COMPANY`, `MANAGER`, or `ADMIN` roles and blocks `CLIENT` accounts with clear redirect guidance.

---

## 🛠 Installation & Local Setup

### Prerequisites
- **Node.js**: `v20+`
- **pnpm**: `v9.15+` (`npm install -g pnpm`)
- **PostgreSQL / Supabase**: Running database instance

### 1. Install Dependencies
```bash
git clone <your-repo-url> origin-flow
cd origin-flow
pnpm install
```

### 2. Environment Variables
Create `.env` inside `backend/api/`:
```env
PORT=4000
DATABASE_URL="postgresql://postgres.xxx:pass@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.xxx:pass@aws-0-ap-south-1.pooler.supabase.com:5432/postgres"

# Mailer (Hostinger SMTP)
MAIL_HOST="smtp.hostinger.com"
MAIL_PORT="465"
MAIL_USER="hello@webrizen.com"
MAIL_PASS="your-smtp-password"

# WebAuthn & CORS
WEBAUTHN_ORIGINS="http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:3003,http://localhost:5173"
JWT_SECRET="your-secure-jwt-secret"
RP_NAME="Origin Flow"
RP_ID="localhost"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# PhonePe PG (Sandbox Defaults)
PHONEPE_ENV="SANDBOX"
PHONEPE_BASE_URL="https://api-preprod.phonepe.com/apis/pg-sandbox"
PHONEPE_MERCHANT_ID="PGTESTPAYUAT86"
PHONEPE_SALT_KEY="96434309-7796-489d-8924-ab56988a6076"
PHONEPE_SALT_INDEX="1"
PHONEPE_CALLBACK_URL="http://localhost:4000/api/subscriptions/phonepe/webhook"
```

### 3. Seed Default Plans
```bash
pnpm --filter @origin-flow/api exec npx prisma db push
pnpm --filter @origin-flow/api exec npx tsx prisma/seed.ts
```

### 4. Run Development Servers
```bash
pnpm dev
```
This runs all frontends and the backend in parallel via Turborepo:
- **Marketing**: `http://localhost:3000`
- **Admin**: `http://localhost:3001`
- **Clients**: `http://localhost:3002`
- **Management**: `http://localhost:3003`
- **API Server**: `http://localhost:4000`

---

## 🧪 Available Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start all dev servers in parallel (Vite HMR + tsx watch) |
| `pnpm build` | Production build across all workspace packages (topological order) |
| `pnpm lint` | Run ESLint across all workspaces |
| `pnpm clean` | Clean build artifacts (`dist/`, `node_modules/`) |
| `pnpm --filter <pkg> <cmd>` | Execute a script for a specific package (e.g. `pnpm --filter @origin-flow/management build`) |

---

## 🚀 Production Deployment Reference

For instructions on acquiring production keys (PhonePe PG live merchant keys, Google Cloud Console, Hostinger SMTP, Supabase poolers) and deploying via Docker, PM2, Vercel, or Render:

👉 **Read the comprehensive deployment guide in [`backend/api/README.md`](./backend/api/README.md)**

---

## 📜 License

Proprietary — © 2026 Webrizen AI Labs Pvt Ltd. All rights reserved.
