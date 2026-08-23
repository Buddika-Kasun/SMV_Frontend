# 🚀 Railway Deployment Guide - SMV Holdings Microfinance Platform

This guide explains step-by-step how to export this application and deploy it on **Railway.com** with a persistent **PostgreSQL** database.

---

## 📋 What Has Been Built

1. **Unified Full-Stack Architecture**:
   - Express.js backend in TypeScript (`server.ts`).
   - React 19 frontend compiled to static assets inside `dist/`.
   - Single port (`3000`) serving both REST API endpoints (`/api/*`) and SPA routing.
2. **PostgreSQL Database Engine (`server/db.ts`)**:
   - Automatically detects Railway's `DATABASE_URL`.
   - Auto-runs SQL migrations for `users`, `loans`, `payments`, and `sms_logs` tables.
   - Automatically seeds initial accounts (`sysadmin`, `manager1`, `staff1`) and sample loans.
   - Falls back gracefully to in-memory state if `DATABASE_URL` is omitted.
3. **Authentication & RBAC**:
   - JWT tokens with 7-day expiration.
   - Passwords hashed with `bcryptjs`.
   - Single Administrator enforcement (`sysadmin` / `admin123`).

---

## 🛠️ Step 1: Export Code from AI Studio to GitHub

1. In the top-right menu of Google AI Studio, click **Settings** (or the Share/Export button).
2. Choose **Export to GitHub** (or click **Download ZIP**).
3. If downloaded as a ZIP:
   - Extract the files to a folder on your computer.
   - Initialize a git repository and push to GitHub:
     ```bash
     git init
     git add .
     git commit -m "Initial commit for Railway deployment"
     git branch -M main
     git remote add origin https://github.com/YOUR_USERNAME/smv-microfinance.git
     git push -u origin main
     ```

---

## 🚂 Step 2: Deploy on Railway.com

1. Go to **[railway.com](https://railway.com)** and log in with your GitHub account.
2. Click **+ New Project**.
3. Choose **Provision PostgreSQL**:
   - Railway will provision a dedicated PostgreSQL database container in 2 seconds.
4. In the same project canvas, click **+ Add Service** → **GitHub Repo**.
5. Select your repository `smv-microfinance`.

---

## ⚙️ Step 3: Configure Environment Variables in Railway

1. Click on your newly created web service in Railway.
2. Navigate to the **Variables** tab.
3. Add the following variables:
   | Variable | Value | Description |
   | :--- | :--- | :--- |
   | `NODE_ENV` | `production` | Enables production mode |
   | `PORT` | `3000` | Port for web traffic |
   | `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` | Railway reference to your PostgreSQL instance |
   | `JWT_SECRET` | *(Generate a random 32+ character string)* | Secret for signing auth tokens |
   | `TEXT_LK_API_TOKEN` | `3905\|cMKJeozKbAaJ6RioaExZOTIHtrTdDFqcLGOkYIhj3fc213f1` | Text.lk SMS token |

*(Note: In Railway, selecting `${{Postgres.DATABASE_URL}}` links your database automatically).*

---

## 🌐 Step 4: Generate Your Public Domain

1. In your web service settings, go to the **Settings** tab.
2. Under **Networking**, click **Generate Domain** (e.g. `smv-microfinance.up.railway.app`).
3. *(Optional)* Click **Custom Domain** to connect your own domain name (e.g., `app.smvholdings.com`) and follow Railway's DNS CNAME instructions.

---

## 🔑 Default Login Credentials

Once deployed, you can immediately log in with:

- **System Administrator (Sole Admin)**:
  - Username: `sysadmin`
  - Password: `admin123` (or `Admin@123`)
- **Branch Manager**:
  - Username: `manager1`
  - Password: `manager123`
- **Operations Staff**:
  - Username: `staff1`
  - Password: `staff123`
