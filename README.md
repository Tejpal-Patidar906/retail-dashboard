# 🛒 RetailIQ — Retail Store Analytics Dashboard

A full-stack **MERN** (MongoDB, Express, React, Node.js) analytics dashboard for retail store management with real-time updates, role-based access, and PDF/CSV exports.

![RetailIQ Dashboard](https://img.shields.io/badge/Stack-MERN-5B8AF0?style=for-the-badge)
![Dark Mode](https://img.shields.io/badge/Theme-Dark%20Mode-131829?style=for-the-badge)
![Real-time](https://img.shields.io/badge/Real--time-Socket.io-34D99E?style=for-the-badge)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔐 **JWT Auth** | Secure login with httpOnly cookie + Bearer token |
| 👥 **Roles** | Admin / Manager / Staff with page-level restrictions |
| 📊 **7 Pages** | Overview, Sales, Inventory, Customers, Staff, Reports, Login |
| 📈 **Charts** | Recharts — Area, Bar, Pie, Line charts |
| 🔴 **Real-time** | Socket.io events for sales, stock alerts, staff updates |
| 📤 **Exports** | PDF reports (PDFKit) + CSV exports (json2csv) |
| 🌱 **Seeder** | 180 days of realistic seeded data |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB running locally (`mongodb://localhost:27017`)

### 1. Clone & Install

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Environment Variables

Server `.env` (already created at `server/.env`):
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/retailiq
JWT_SECRET=retailiq_super_secret_key_2024
JWT_EXPIRE=7d
NODE_ENV=development
```

Client `.env` (already created at `client/.env`):
```
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

### 3. Seed the Database

```bash
cd server
node seed.js
```

This creates 180 days of realistic sales data, 21 products across 4 categories, 12 customers, 6 users, and 5 staff records.

### 4. Run Development Servers

**Terminal 1 — Backend:**
```bash
cd server
npm run dev
# ✅ Server on http://localhost:5000
# ✅ Socket.io ready
```

**Terminal 2 — Frontend:**
```bash
cd client
npm run dev
# ✅ App on http://localhost:5173
```

---

## 🔑 Demo Credentials

| Role    | Email                    | Password     |
|---------|--------------------------|--------------|
| Admin   | admin@retailiq.com       | admin123     |
| Manager | manager@retailiq.com     | manager123   |
| Staff   | staff1@retailiq.com      | staff123     |

> These are clickable on the login page for quick access.

---

## 📁 Project Structure

```
retail-dashboard/
├── client/                    # React + Vite Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── charts/        # RevenueChart, CategoryPieChart, FootTrafficChart
│   │   │   ├── layout/        # Sidebar, Topbar, Layout
│   │   │   └── ui/            # KPICard, Badge, Table, Button
│   │   ├── context/           # AuthContext
│   │   ├── hooks/             # useSales, useInventory, useAuth
│   │   ├── pages/             # 7 pages
│   │   └── services/          # Axios API instance
│
└── server/                    # Express + Node.js Backend
    ├── config/                # DB connection
    ├── controllers/           # Business logic
    ├── middleware/            # Auth, roleCheck, errorHandler
    ├── models/               # Mongoose schemas
    ├── routes/               # API routes
    ├── utils/                # Token generator, CSV exporter
    └── seed.js               # Database seeder
```

---

## 🔌 API Endpoints

### Auth
| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |
| GET  | `/api/auth/me` | Protected |
| POST | `/api/auth/logout` | Protected |

### Sales
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sales` | All sales (filter: date, branch) |
| GET | `/api/sales/summary` | KPIs: revenue, transactions, AOV |
| GET | `/api/sales/daily` | Daily breakdown for charts |
| GET | `/api/sales/monthly` | Monthly for bar chart |
| POST | `/api/sales` | Record new sale |
| GET | `/api/sales/top-products` | Best sellers |

### Inventory
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/inventory` | All products + KPIs |
| GET | `/api/inventory/alerts` | Low/critical stock |
| POST | `/api/inventory` | Add product (admin/manager) |
| PUT | `/api/inventory/:id` | Update stock (admin/manager) |
| DELETE | `/api/inventory/:id` | Remove product (admin only) |

### Customers, Staff, Reports — see routes/ folder

---

## 🌐 Real-time Events (Socket.io)

| Event | Trigger | Effect |
|-------|---------|--------|
| `new_sale` | Sale created | Toast notification with revenue |
| `stock_alert` | Stock falls below reorder level | Warning toast + badge counter |
| `staff_update` | Staff record updated | Info toast |

---

## 🎨 Design System

| Token | Value |
|-------|-------|
| Background | `#080B12` |
| Surface | `#0E1220` |
| Card | `#131829` |
| Accent Blue | `#5B8AF0` |
| Success Green | `#34D99E` |
| Danger Red | `#F0616B` |
| Warning Yellow | `#F5C842` |
| Purple | `#A78BFA` |
| Font | Inter, system-ui |

---

## 📦 Tech Stack

**Frontend:** React 18, Vite, React Router 6, Recharts, Axios, Socket.io Client, Zustand, React Hot Toast, Lucide React

**Backend:** Node.js, Express 4, MongoDB, Mongoose, JWT, Bcryptjs, Socket.io, PDFKit, json2csv

---

## 📜 License

MIT — Built for educational and demonstration purposes.
