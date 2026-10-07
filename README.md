# Single-Vendor E-Commerce Application

A production-grade, single-vendor e-commerce platform built with **Laravel 12 (PHP 8.4)** and **Next.js 16 (React 19 / Turbopack)** featuring automated inventory management, **SSLCommerz** payment processing, asynchronous **CarryBee** courier logistics dispatch, and a business-centric administrative dashboard.

---

## System Requirements & Tech Stack

### Prerequisites
- **PHP**: `^8.2` (PHP 8.4 recommended) with `pdo_pgsql`, `redis`, `bcmath`, `curl`, `gd` extensions
- **Composer**: `^2.5`
- **Node.js**: `^20.0` or `^22.0` (LTS) & `npm`
- **Database**: PostgreSQL `14+` or `16+` (e.g., Neon Postgres or local PostgreSQL)
- **Cache/Queue**: Redis (or Redis Cloud / local Redis server)

---

## Environment Setup

### 1. Clone the Repository
```bash
git clone https://github.com/Sharif2023/single-vendor.git
cd single-vendor
```

### 2. Backend Setup (Laravel)
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
```

Configure your `.env` file in `backend/`:
```env
APP_NAME="Single Vendor E-Commerce"
APP_ENV=local
APP_KEY=base64:...
APP_DEBUG=true
APP_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000

DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=single_vendor
DB_USERNAME=postgres
DB_PASSWORD=secret

QUEUE_CONNECTION=redis
CACHE_STORE=redis
REDIS_CLIENT=phpredis
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379

# Payment Gateway (SSLCommerz)
SSLCOMMERZ_STORE_ID=your_store_id
SSLCOMMERZ_STORE_PASSWORD=your_store_password
SSLCOMMERZ_IS_SANDBOX=true

# Logistics (CarryBee)
CARRYBEE_CLIENT_ID=your_client_id
CARRYBEE_CLIENT_SECRET=your_client_secret
CARRYBEE_IS_SANDBOX=true
```

Run database migrations and realistic seed data:
```bash
php artisan migrate:fresh --seed
php artisan storage:link
```

### 3. Frontend Setup (Next.js)
```bash
cd ../frontend
npm install
cp .env.example .env.local
```

Configure `frontend/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

---

## Running the Application Locally

Run each in a separate terminal:

### Terminal 1: Backend Server
```bash
cd backend
php artisan serve --port=8000
```

### Terminal 2: Queue Worker (Asynchronous Delivery & Notifications)
```bash
cd backend
php artisan queue:work --tries=3 --timeout=90
```

### Terminal 3: Scheduler (Automated Delivery Polling & Cache Invalidation)
```bash
cd backend
php artisan schedule:work
```

### Terminal 4: Frontend Development Server
```bash
cd frontend
npm run dev
```

The application is now accessible at:
- **Storefront**: [http://localhost:3000](http://localhost:3000)
- **Admin Panel**: [http://localhost:3000/admin](http://localhost:3000/admin)
  - **Email**: `admin@store.com`
  - **Password**: `password`

---

## Database Seeding & Data Consistency

To reset and seed the database with consistent business data:
```bash
cd backend
php artisan migrate:fresh --seed
```

### Generated Data:
- **1 Admin Account**: `admin@store.com` / `password`
- **30+ Products**: High stock, low stock, and out-of-stock variations across categories with product gallery images.
- **100 Realistic Orders**: Spanning the past 3 weeks with mathematically consistent inventory tracking, item subtotals, SSLCommerz payment states, and CarryBee delivery dispatches.

---

## Automated Tests

Run the complete backend test suite:
```bash
cd backend
php artisan test
```

### Test Coverage Includes:
- **Authentication & Authorization**: Admin login, logout, role gating, token validation.
- **Product Management & Catalog**: CRUD, unique SKU enforcement, negative stock rejection, search, pagination.
- **Checkout & Inventory Transactions**: Atomic stock locking (`SELECT FOR UPDATE`), item pricing isolation, subtotal verification.
- **Payment Lifecycle**: SSLCommerz IPN callback validation, hash verification, idempotency on duplicate IPN.
- **Delivery Integration**: Asynchronous CarryBee dispatch, consignment tracking, error recovery and retries.

---

## Architecture & Design Notes
For comprehensive architectural decisions, database schemas, and trade-off analysis, see [NOTES.md](./NOTES.md).
