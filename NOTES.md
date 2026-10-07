# Architectural Notes & Engineering Decisions

## 1. System Architecture Overview

The application follows a decoupled client-server architecture with clear domain separation:
- **Backend (Laravel 12 / PHP 8.4)**: Acts as the single source of truth for business logic, pricing, inventory integrity, payment processing, and logistics dispatch.
- **Frontend (Next.js 16 / React 19 / TanStack Query)**: Modern client layer focused on fast time-to-interactive, optimistic UI, robust form validation, and responsive mobile-first UX.
- **Storage & Caching (PostgreSQL & Redis)**: PostgreSQL handles relational guarantees and ACID transactions; Redis provides fast query caching and asynchronous queue processing.

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js 16 Frontend                      │
│        (Storefront, Responsive Cart, Admin Dashboard)        │
└──────────────┬───────────────────────────────▲──────────────┘
               │ HTTP / JSON API               │ TanStack Query
               ▼                               │
┌─────────────────────────────────────────────────────────────┐
│                     Laravel 12 Backend                      │
│  Controllers ──► Services ──► DB Transactions / Events       │
└──────────────┬───────────────────────────────┬──────────────┘
               │                               │
        Database / Cache                Queued Dispatch
               ▼                               ▼
┌──────────────────────────────┐ ┌─────────────────────────────┐
│ PostgreSQL 16 & Redis Cache  │ │  CarryBee Logistics Worker  │
│  - Lock-safe Stock Decr      │ │  - Async Delivery Creation  │
│  - Relational Integrity      │ │  - Tracking Sync Schedule   │
└──────────────────────────────┘ └─────────────────────────────┘
```

---

## 2. Database Design & Relational Constraints

### Relational Schema Design:
- **`users`**: Admin & customer accounts with role differentiation (`admin` / `customer`).
- **`products`**: Contains `sku` (unique indexed), `price`, `stock`, `status`, `deleted_at` (soft deletes).
- **`product_images`**: Multi-image product gallery supporting ordering and primary flags.
- **`orders`**: Customer contact info, address, calculated `subtotal`, `total`, and lifecycle `status` (`pending`, `confirmed`, `paid`, `processing`, `shipped`, `delivered`, `cancelled`).
- **`order_items`**: Point-in-time snapshots of `unit_price`, `quantity`, and `subtotal`, referencing `products.id`.
- **`payments`**: Payment provider (`sslcommerz`), `transaction_id`, validation status, amount, and timestamp.
- **`deliveries`**: CarryBee `consignment_id`, `carrier`, `status`, `tracking_url`, attempt count, and last status poll timestamp.
- **`settings`**: Dynamic system configuration for admin toggles (e.g., payment gateway enable/disable, store info).

---

## 3. Inventory Strategy & Data Integrity

### Critical Guarantees:
1. **Pessimistic Locking on Checkout (`SELECT ... FOR UPDATE`)**:
   During checkout, product rows are locked within a database transaction before stock verification and deduction. This eliminates race conditions where concurrent checkouts could sell items past zero stock.
2. **Never Trust Frontend Pricing**:
   Cart item prices sent by the client are strictly ignored. The backend retrieves the current product price directly from the database and calculates subtotals and totals on the server.
3. **Lifecycle Consistency**:
   - When an order is placed, stock is atomically reserved/decremented.
   - If an order is explicitly cancelled or fails validation, the allocated stock is atomically returned to the product inventory.
   - Check constraint and validation logic ensure `stock >= 0` at all times.

---

## 4. Payment Integration (SSLCommerz)

### Flow & Idempotency:
1. **Initiation**: The customer initiates checkout; the server creates a `pending` order and constructs the signed session payload for SSLCommerz.
2. **Callback Handling (Success/Failed/Cancel)**: SSLCommerz posts transaction tokens to secure backend endpoints.
3. **Verification**: The backend issues an independent server-to-server validation call to SSLCommerz (`validator/api/validationserverAPI.php`) to verify amount, currency, and transaction status before marking the order as `paid`.
4. **Idempotent Webhooks (IPN)**: The IPN listener checks whether the transaction has already been validated and marked as `paid`. Duplicate webhook payloads return HTTP 200 without executing duplicate stock or status actions.

---

## 5. Logistics & CarryBee Delivery Integration

### Asynchronous Processing:
- **Non-blocking Dispatch**: Dispatching shipments to CarryBee API is decoupled from the customer checkout/payment response via `CreateCarryBeeDeliveryJob` queued in Redis.
- **Error Handling & Retries**: Transient HTTP failures or rate limits are retried automatically with exponential backoff (`$tries = 3`, `$backoff = [10, 30, 60]`).
- **Status Synchronization**: A scheduled background command (`carrybee:sync-status`) periodically queries the CarryBee tracking API for active consignments and updates delivery/order status accordingly.

---

## 6. Caching & Performance Decisions

1. **Storefront Product Caching**:
   - Product list queries are cached in Redis with dynamic keys reflecting search, category, and page filters.
   - Cache tags / automatic cache busting on Product update, deletion, or stock change ensures stale data is never served.
2. **Eager Loading & N+1 Elimination**:
   - All product and order queries use `with(['images', 'items.product', 'payment', 'delivery'])` to ensure minimal database roundtrips.
3. **Database Indexing**:
   - Composite indexes on `(status, created_at)` for high-performance dashboard aggregations.
   - B-Tree index on `orders.customer_phone`, `orders.customer_email`, and `products.sku`.

---

## 7. Known Limitations & Production Improvements

### Current Trade-offs:
- **Sandbox Mode Default**: Defaults to SSLCommerz sandbox and CarryBee staging endpoints for safe local testing.
- **Single Currency**: Calculations are optimized in BDT (Bangladeshi Taka).

### Recommended for Production:
- **Multi-tenant / Multi-warehouse Inventory**: Extend inventory tables with warehouse locations for geo-distributed order fulfillment.
- **CDN Edge Caching**: Place Next.js and static product media behind Cloudflare / Fastly CDN for global sub-50ms caching.
- **Dead Letter Queue (DLQ) & Alerting**: Integrate Sentry and Slack notifications on persistent queue job exhaustion.
