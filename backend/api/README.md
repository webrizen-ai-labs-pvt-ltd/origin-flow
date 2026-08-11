# Origin Flow — Backend API Production & Deployment Guide

This guide details everything required to deploy the **Origin Flow Backend API (`@origin-flow/api`)** to production, including where to create accounts, how to generate API credentials, required environment variables, database migrations, and server orchestration.

---

## 📋 Table of Contents
1. [Overview & Architecture](#overview--architecture)
2. [Localhost & Staging Setup (Vercel + Render)](#localhost--staging-setup-vercel--render)
   - [Local Development (Out-of-the-Box)](#local-development-out-of-the-box)
   - [Testing PhonePe Webhooks Locally via Ngrok](#testing-phonepe-webhooks-locally-via-ngrok)
   - [Staging Deployment: Frontends on Vercel + Backend on Render](#staging-deployment-frontends-on-vercel--backend-on-render)
3. [Third-Party Accounts & Key Acquisition (Production)](#third-party-accounts--key-acquisition-production)
   - [1. PhonePe Payment Gateway (Production)](#1-phonepe-payment-gateway-production)
   - [2. Google Cloud Console (OAuth 2.0)](#2-google-cloud-console-oauth-20)
   - [3. Supabase / PostgreSQL Database](#3-supabase--postgresql-database)
   - [4. Hostinger / SMTP Email Service](#4-hostinger--smtp-email-service)
   - [5. WebAuthn / Passkey Production Configuration](#5-webauthn--passkey-production-configuration)
   - [6. JWT Secret Generation](#6-jwt-secret-generation)
3. [Production Environment Variables Reference](#production-environment-variables-reference)
4. [Deployment Steps](#deployment-steps)
   - [Option A: Deploying on VPS (Ubuntu/Debian with PM2 & Nginx)](#option-a-deploying-on-vps-ubuntudebian-with-pm2--nginx)
   - [Option B: Deploying on PaaS (Render / Railway / Fly.io / AWS App Runner)](#option-b-deploying-on-paas-render--railway--flyio--aws-app-runner)
   - [Option C: Docker Containerization](#option-c-docker-containerization)
5. [Database Migrations & Seeding in Production](#database-migrations--seeding-in-production)
6. [Post-Deployment Verification Checklist](#post-deployment-verification-checklist)

---

## Overview & Architecture

* **Runtime:** Node.js v20+ / v22 LTS
* **Framework:** Express 5 with TypeScript
* **Database & ORM:** PostgreSQL (Supabase/AWS RDS) via Prisma ORM v6
* **Authentication:** Dual-mode (Google OAuth 2.0 + WebAuthn/FIDO2 Passkeys) with HttpOnly JWT session cookies
* **Payment Gateway:** PhonePe Payment Gateway (PG v1 / Standard Checkout + S2S Webhooks)
* **Communications:** Nodemailer over Hostinger SMTP (TLS/SSL on Port 465) with embedded inline branded CID logos

---

## Localhost & Staging Setup (Vercel + Render)

You do **not** need production accounts to test the entire stack today. The repository is pre-configured with sandbox and developer settings:

### Local Development (Out-of-the-Box)

When running locally with `pnpm dev`:

1. **Database:** Connected to Supabase PostgreSQL (`DATABASE_URL` in `backend/api/.env`).
2. **PhonePe Payment Gateway (UAT Sandbox):**
   - **Merchant ID:** `PGTESTPAYUAT86`
   - **Salt Key:** `96434309-7796-489d-8924-ab56988a6076` (Salt Index: `1`)
   - **Base URL:** `https://api-preprod.phonepe.com/apis/pg-sandbox`
   - **Sandbox Test Simulator:** When you initiate a checkout in local dev, PhonePe opens their official UAT payment simulator where you can test Successful/Failed UPI payments or mock test cards without spending real money.
3. **Transactional Emails:** Connected to Hostinger SMTP (`hello@webrizen.com`). Live emails (welcome messages, payment receipts, plan assignment alerts) will be sent directly to your real test email inboxes.
4. **Google SSO:** Pre-configured for `http://localhost:3000`, `3001`, `3002`, `5173`.
5. **Passkeys / Biometrics:** Uses `RP_ID="localhost"`, which allows Touch ID, Windows Hello, and Android/iOS passkeys on localhost.

---

### Testing PhonePe Webhooks Locally via Ngrok

PhonePe's servers send asynchronous Server-to-Server (S2S) callbacks. Since `http://localhost:4000` is private to your computer, PhonePe cannot reach it directly over the public internet unless you expose it:

1. **Start Ngrok (or Cloudflare Tunnel):**
   ```bash
   ngrok http 4000
   ```
2. **Copy the HTTPS tunnel URL** (e.g. `https://a1b2-c3d4.ngrok-free.app`).
3. **Update `backend/api/.env`:**
   ```env
   PHONEPE_CALLBACK_URL="https://a1b2-c3d4.ngrok-free.app/api/subscriptions/phonepe/webhook"
   ```
4. *Note:* Even without ngrok, our built-in fallback status check endpoint (`/api/subscriptions/verify/:merchantTransactionId`) automatically queries PhonePe when the user returns to the frontend!

---

### Staging Deployment: Frontends on Vercel + Backend on Render

Deploying preview/staging environments on **Vercel** (for frontend apps) and **Render** (for the backend API):

#### 1. Deploy Backend API to Render ([render.com](https://render.com))
- **Service Type:** Web Service
- **Environment:** Node
- **Build Command:**
  ```bash
  pnpm install --frozen-lockfile && pnpm --filter @origin-flow/api exec prisma generate && pnpm --filter @origin-flow/api build
  ```
- **Start Command:**
  ```bash
  node backend/api/dist/server.js
  ```
- **Environment Variables in Render:**
  - `NODE_ENV="production"`
  - `PORT="4000"` (or Render's `$PORT`)
  - `DATABASE_URL="postgresql://postgres...."`
  - `DIRECT_URL="postgresql://postgres...."`
  - `JWT_SECRET="<YOUR_SECRET>"`
  - `PHONEPE_BASE_URL="https://api-preprod.phonepe.com/apis/pg-sandbox"` (Keep Sandbox for staging)
  - `PHONEPE_MERCHANT_ID="PGTESTPAYUAT86"`
  - `PHONEPE_SALT_KEY="96434309-7796-489d-8924-ab56988a6076"`
  - `PHONEPE_SALT_INDEX="1"`
  - `PHONEPE_CALLBACK_URL="https://your-api.onrender.com/api/subscriptions/phonepe/webhook"` *(Works directly because Render provides a public HTTPS domain!)*
  - `FRONTEND_RETURN_URL="https://origin-flow-admin.vercel.app/dashboard/plans"`
  - `CORS_ORIGINS="https://origin-flow-admin.vercel.app,https://origin-flow-marketing.vercel.app"`
  - `MAIL_HOST="smtp.hostinger.com"`, `MAIL_PORT="465"`, `MAIL_USER="hello@webrizen.com"`, `MAIL_PASS="..."`

#### 2. Deploy Frontends to Vercel ([vercel.com](https://vercel.com))
- **Root Directory:** `frontend/admin` (or `frontend/marketing` / `frontend/clients`)
- **Framework Preset:** Vite
- **Build Command:** `pnpm build`
- **Output Directory:** `dist`
- **Environment Variables in Vercel:**
  ```env
  VITE_API_URL="https://your-api.onrender.com/api"
  ```
- **Google Cloud Console Update:**
  Add your Vercel preview URLs (e.g. `https://origin-flow-admin.vercel.app`) to **Authorized JavaScript Origins** in Google Cloud Console Credentials.

---

## Third-Party Accounts & Key Acquisition (Production)

### 1. PhonePe Payment Gateway (Production)

To accept real INR payments via UPI, Cards, NetBanking, and AutoPay:

| Field | Description |
|---|---|
| **Portal URL** | [https://business.phonepe.com](https://business.phonepe.com) / [https://developer.phonepe.com](https://developer.phonepe.com) |
| **Account Type** | PhonePe Merchant / Business Account |
| **Requirements** | Company PAN, GST Certificate, Bank Account Details (Cancelled Cheque), Director/Proprietor KYC |

#### Step-by-Step Onboarding:
1. **Register Business Account:**
   - Sign up at [https://business.phonepe.com](https://business.phonepe.com).
   - Complete KYC by uploading Business Registration, PAN, GSTIN, and Bank Account details.
2. **Access Developer / Integration Portal:**
   - Once KYC is approved (typically 1–3 business days), navigate to the **Developer Dashboard**.
   - Request **Standard Checkout (PG Web)** integration.
3. **Obtain Production Credentials:**
   - **Production Merchant ID (`PHONEPE_MERCHANT_ID`)**: e.g., `WEBRIZENONLINE`
   - **Production Salt Key (`PHONEPE_SALT_KEY`)**: 32-character hexadecimal or UUID string.
   - **Salt Index (`PHONEPE_SALT_INDEX`)**: Typically `1` (check your dashboard).
   - **Production Base URL (`PHONEPE_BASE_URL`)**: `https://api.phonepe.com/apis/hermes`
4. **Configure Webhook & Callback URLs:**
   - Under **Webhook Settings** in PhonePe Dashboard, set the S2S Webhook URL:
     ```
     https://api.yourdomain.com/api/subscriptions/phonepe/webhook
     ```
   - Whitelist your production server's static outbound IP address if requested by PhonePe support.

---

### 2. Google Cloud Console (OAuth 2.0)

For "Continue with Google" single sign-on across Admin, Company, and Client portals:

| Field | Description |
|---|---|
| **Portal URL** | [https://console.cloud.google.com](https://console.cloud.google.com) |
| **Resource** | APIs & Services $\rightarrow$ Credentials |

#### Step-by-Step Configuration:
1. **Create/Select a Project:**
   - Open Google Cloud Console and select or create a project (e.g., `Origin-Flow-Production`).
2. **Configure OAuth Consent Screen:**
   - Go to **APIs & Services** $\rightarrow$ **OAuth consent screen**.
   - Select **User Type: External** and click **Create**.
   - Fill in:
     - **App Name:** `Origin Flow`
     - **User Support Email:** `hello@webrizen.com`
     - **App Domain / Homepage:** `https://yourdomain.com`
     - **Privacy Policy:** `https://yourdomain.com/privacy`
     - **Terms of Service:** `https://yourdomain.com/terms`
     - **Authorized Domains:** Add your apex domain e.g. `yourdomain.com` and `webrizen.com`.
   - Publish the App from "Testing" to **"In Production"**.
3. **Generate OAuth Client ID:**
   - Go to **Credentials** $\rightarrow$ **Create Credentials** $\rightarrow$ **OAuth client ID**.
   - **Application Type:** Web application
   - **Name:** `Origin Flow Production Web Client`
   - **Authorized JavaScript Origins:**
     - `https://yourdomain.com`
     - `https://operate.yourdomain.com`
     - `https://client.yourdomain.com`
   - **Authorized Redirect URIs:**
     - `https://operate.yourdomain.com/sign-in`
     - `https://client.yourdomain.com/sign-in`
4. **Copy Credentials:**
   - `GOOGLE_CLIENT_ID` (e.g. `xxxxxxxxxxxx-xxxxxxxx.apps.googleusercontent.com`)
   - `GOOGLE_CLIENT_SECRET` (e.g. `GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxx`)

---

### 3. Supabase / PostgreSQL Database

For relational database storage, user profiles, passkeys, plans, and transaction audit trails:

| Field | Description |
|---|---|
| **Portal URL** | [https://supabase.com/dashboard](https://supabase.com/dashboard) |
| **Alternative** | AWS RDS PostgreSQL, Neon Tech, DigitalOcean Managed DB |

#### Step-by-Step Setup:
1. **Create Production Project:**
   - Log into Supabase, create a new project with a strong database password.
   - Choose the region closest to your primary user base (e.g., `ap-south-1` Mumbai or `ap-northeast-1`).
2. **Retrieve Connection Strings:**
   - Navigate to **Project Settings** $\rightarrow$ **Database** $\rightarrow$ **Connection String**.
   - **Connection Pooler (for API traffic):** Select **Session Mode** or **Transaction Mode (Port 6543)**:
     ```env
     DATABASE_URL="postgresql://postgres.<project-ref>:<db-password>@aws-0-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true"
     ```
   - **Direct Connection (for Prisma migrations):** Select **Direct Connection (Port 5432)**:
     ```env
     DIRECT_URL="postgresql://postgres.<project-ref>:<db-password>@aws-0-<region>.pooler.supabase.com:5432/postgres"
     ```

---

### 4. Hostinger / SMTP Email Service

For transactional welcome emails, password-less logins, payment success receipts, and assignment alerts:

| Field | Description |
|---|---|
| **Portal URL** | [https://hpanel.hostinger.com](https://hpanel.hostinger.com) |
| **Protocol** | SMTP with SSL/TLS on Port 465 |

#### Step-by-Step Setup:
1. **Create Business Email:**
   - Log into Hostinger hPanel $\rightarrow$ **Emails** $\rightarrow$ select your domain (`webrizen.com`).
   - Create or access account: `hello@webrizen.com`.
2. **Retrieve SMTP Credentials:**
   - **SMTP Host:** `smtp.hostinger.com`
   - **SMTP Port:** `465` (SSL) or `587` (TLS)
   - **SMTP Username:** `hello@webrizen.com`
   - **SMTP Password:** Your mailbox password or generated App Password.
3. **Verify SPF / DKIM / DMARC Records:**
   - In Hostinger DNS Zone Editor, ensure standard SPF (`v=spf1 include:_spf.mail.hostinger.com ~all`) and DKIM TXT records are active so transactional emails do not land in spam.

---

### 5. WebAuthn / Passkey Production Configuration

WebAuthn requires the Relying Party ID (`RP_ID`) to strictly match the effective top-level domain (eTLD+1) of your production web apps, and origins must use HTTPS:

| Variable | Development | Production Value |
|---|---|---|
| `RP_NAME` | `Origin Flow` | `Origin Flow` |
| `RP_ID` | `localhost` | `yourdomain.com` *(e.g. `webrizen.com`)* |
| `WEBAUTHN_ORIGINS` | `http://localhost:3000,http://localhost:3001` | `https://yourdomain.com,https://operate.yourdomain.com,https://client.yourdomain.com` |

> [!IMPORTANT]
> When `RP_ID` is set to `yourdomain.com`, browsers allow passkeys created on `https://yourdomain.com`, `https://operate.yourdomain.com`, and `https://client.yourdomain.com` to share the same security scope seamlessly.

---

### 6. JWT Secret Generation

For signing secure JSON Web Tokens stored in HttpOnly cookies:

Generate a high-entropy 256-bit secret via your terminal:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```
Or with OpenSSL:
```bash
openssl rand -base64 48
```

Assign this string to `JWT_SECRET` in your production environment.

---

## Production Environment Variables Reference

Create your production `.env` file on your server or input these into your deployment platform's secret manager:

```env
# ==============================================================================
# SERVER & ENVIRONMENT
# ==============================================================================
NODE_ENV="production"
PORT=4000
CORS_ORIGINS="https://yourdomain.com,https://operate.yourdomain.com,https://client.yourdomain.com"

# ==============================================================================
# DATABASE (SUPABASE / POSTGRESQL)
# ==============================================================================
DATABASE_URL="postgresql://postgres.<project-ref>:<db-password>@aws-0-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.<project-ref>:<db-password>@aws-0-<region>.pooler.supabase.com:5432/postgres"

# ==============================================================================
# AUTHENTICATION & SESSIONS
# ==============================================================================
JWT_SECRET="<YOUR_STRONG_64_CHAR_BASE64_SECRET>"
GOOGLE_CLIENT_ID="<YOUR_PRODUCTION_GOOGLE_CLIENT_ID>.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="<YOUR_PRODUCTION_GOOGLE_CLIENT_SECRET>"

# WebAuthn / Passkeys (Use your apex domain)
RP_NAME="Origin Flow"
RP_ID="yourdomain.com"
WEBAUTHN_ORIGINS="https://yourdomain.com,https://operate.yourdomain.com,https://client.yourdomain.com"

# ==============================================================================
# TRANSACTIONAL EMAIL (HOSTINGER SMTP)
# ==============================================================================
MAIL_HOST="smtp.hostinger.com"
MAIL_PORT="465"
MAIL_USER="hello@webrizen.com"
MAIL_PASS="<YOUR_SMTP_PASSWORD>"

# ==============================================================================
# PHONEPE PAYMENT GATEWAY (PRODUCTION)
# ==============================================================================
PHONEPE_ENV="PRODUCTION"
PHONEPE_BASE_URL="https://api.phonepe.com/apis/hermes"
PHONEPE_MERCHANT_ID="<YOUR_PRODUCTION_MERCHANT_ID>"
PHONEPE_SALT_KEY="<YOUR_PRODUCTION_SALT_KEY>"
PHONEPE_SALT_INDEX="1"
PHONEPE_CALLBACK_URL="https://api.yourdomain.com/api/subscriptions/phonepe/webhook"
FRONTEND_RETURN_URL="https://operate.yourdomain.com/dashboard/plans"
```

---

## Deployment Steps

### Option A: Deploying on VPS (Ubuntu/Debian with PM2 & Nginx)

#### 1. System Setup & Dependencies
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git nginx ufw

# Install Node.js v22 LTS & pnpm
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pnpm pm2
```

#### 2. Clone Repository & Build Backend
```bash
cd /var/www
git clone <your-repo-url> origin-flow
cd origin-flow

# Install all workspace dependencies
pnpm install --frozen-lockfile

# Generate Prisma Client & Run DB push/migrations
cd backend/api
pnpm prisma generate
pnpm prisma db push

# Build TypeScript to production JavaScript
pnpm build
```

#### 3. Start with PM2 Process Manager
```bash
cd /var/www/origin-flow/backend/api

# Start production instance
pm2 start dist/server.js --name "origin-flow-api" -i max

# Save PM2 state to auto-start on server reboot
pm2 save
pm2 startup
```

#### 4. Configure Nginx Reverse Proxy with SSL
Create `/etc/nginx/sites-available/api.yourdomain.com`:

```nginx
server {
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site and install free Let's Encrypt SSL:
```bash
sudo ln -s /etc/nginx/sites-available/api.yourdomain.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Issue SSL Certificate
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com
```

---

### Option B: Deploying on PaaS (Render / Railway / Fly.io / AWS App Runner)

1. **Root Directory:** `backend/api` (or monorepo root)
2. **Build Command:**
   ```bash
   pnpm --filter @origin-flow/api exec prisma generate && pnpm --filter @origin-flow/api build
   ```
3. **Start Command:**
   ```bash
   node backend/api/dist/server.js
   ```
4. **Environment Variables:** Paste all variables from the [Environment Variables Reference](#production-environment-variables-reference) into your provider's Environment settings.

---

### Option C: Docker Containerization

Create `backend/api/Dockerfile`:

```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json ./
COPY backend/api/package.json ./backend/api/
COPY packages/config/package.json ./packages/config/
COPY packages/assets/ ./packages/assets/

RUN pnpm install --frozen-lockfile

COPY backend/api ./backend/api
COPY packages/config ./packages/config

WORKDIR /app/backend/api
RUN pnpm prisma generate
RUN pnpm build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN npm install -g pnpm

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/backend/api/node_modules ./backend/api/node_modules
COPY --from=builder /app/backend/api/dist ./backend/api/dist
COPY --from=builder /app/backend/api/prisma ./backend/api/prisma
COPY --from=builder /app/backend/api/package.json ./backend/api/package.json
COPY --from=builder /app/packages/assets ./packages/assets

WORKDIR /app/backend/api
EXPOSE 4000
CMD ["node", "dist/server.js"]
```

Build and run:
```bash
docker build -t origin-flow-api -f backend/api/Dockerfile .
docker run -d -p 4000:4000 --env-file backend/api/.env origin-flow-api
```

---

## Database Migrations & Seeding in Production

Before directing live user traffic to the backend, run the database sync and initial subscription plans seed:

```bash
cd backend/api

# Push the schema changes to the production DB
pnpm prisma db push

# Seed the default Starter, Growth, and Enterprise subscription tiers
pnpm prisma db seed
```

---

## Post-Deployment Verification Checklist

- [ ] **Health Endpoint:** `GET https://api.yourdomain.com/api/health` returns `{"status":"ok"}`.
- [ ] **Google Login:** Test signing in with Google from `https://operate.yourdomain.com`.
- [ ] **Passkeys / Biometrics:** Test registering a Touch ID / Windows Hello passkey.
- [ ] **Email Delivery:** Register a test user and verify the welcome email arrives with the branded logo.
- [ ] **Plans API:** `GET https://api.yourdomain.com/api/plans` returns the 3 seeded pricing plans.
- [ ] **PhonePe Payment:** Perform a real payment on the live gateway (or UAT sandbox test) and confirm:
  - Redirection to PhonePe checkout works.
  - S2S Webhook arrives at `/api/subscriptions/phonepe/webhook`.
  - Transaction changes to `SUCCESS`.
  - Payment receipt email is delivered to the company mailbox.
