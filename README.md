# 🏥 AURA // Hospital Management System (Monorepo)

An enterprise-grade monorepo containing a high-performance **NestJS + MongoDB + Prisma** backend and a sleek **Monochromatic React + Vite** frontend with Role-Based Access Control (Admin, Doctor, Patient, Pharmacist).

---

## 🗂️ Monorepo Structure

```
├── package.json               # Root monorepo workspace configuration
├── mongod.conf                # Local MongoDB replica set configuration
├── backend/                   # NestJS Backend API
│   ├── .env                   # MongoDB URL, JWT secret, server port
│   ├── prisma/
│   │   ├── schema.prisma      # Prisma MongoDB schema (ObjectIds & composite types)
│   │   └── seed.ts            # Seeds 4 roles, departments, medicines
│   └── src/
│       ├── common/            # RBAC guards, @Roles(), @Public(), interceptors
│       ├── modules/           # Auth, Users, Doctors, Patients, Appointments, Prescriptions, Pharmacy, Billing
│       ├── app.module.ts
│       └── main.ts
└── frontend/                  # Monochromatic React + Vite Application
    ├── src/
    │   ├── api/client.ts      # Typed API client connected to backend
    │   ├── App.tsx            # Interactive role switcher, clinical tabs, modals
    │   ├── App.css            # Monochromatic dark theme styles & cards
    │   └── index.css          # Monochromatic design system tokens
    └── vite.config.ts         # Proxy /api -> http://localhost:4000
```

---

## 🚀 One-Command Quickstart

### 1. Ensure Local MongoDB Daemon is Running
```bash
npm run mongo:start
```
*(Verify replica set is healthy: `npm run mongo:status`)*

### 2. Run Both Backend & Frontend Concurrently
From the root directory, run:
```bash
npm run dev
# or
bun dev
```
This concurrently launches:
- **NestJS API Backend**: `http://localhost:4000/api/v1`
- **Interactive Swagger Docs**: `http://localhost:4000/api/docs`
- **Monochromatic Frontend UI**: `http://localhost:3000`

---

## 👥 Instant Role Switcher (Pre-Seeded Accounts)

Password for all pre-seeded accounts: **`Hospital123!`**

| Persona | Role | Email | Capabilities in UI |
| :--- | :--- | :--- | :--- |
| **Chief Administrator** | `ADMIN` | `admin@hospital.com` | Full RBAC user directory, invoice creation, account activation |
| **Dr. Sarah Smith** | `DOCTOR` | `doctor.smith@hospital.com` | Issue digital prescriptions, schedule consultations, confirm appointments |
| **Alex Turner** | `PHARMACIST` | `pharmacist.alex@hospital.com` | Dispense prescriptions, manage batch inventory, restock medicines |
| **Jane Doe** | `PATIENT` | `patient.jane@example.com` | Book consultations, view medical records, view invoice balances |

---

## 🛠️ Monorepo Workspace Scripts

Run from the root directory:

| Command | Action |
| :--- | :--- |
| `npm run dev` | Run backend & frontend simultaneously with live reload |
| `npm run dev:backend` | Run only the NestJS backend (`localhost:4000`) |
| `npm run dev:frontend` | Run only the Vite frontend (`localhost:3000`) |
| `npm run build` | Compile and bundle both workspaces |
| `npm run prisma:push` | Sync Prisma schema models to MongoDB collections |
| `npm run prisma:seed` | Re-seed default users and hospital data |
| `npm run mongo:start` | Start local `mongod` daemon with `rs0` replica set |
| `npm run mongo:stop` | Safely shutdown `mongod` daemon |
