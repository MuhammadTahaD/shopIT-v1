# ShopIT

ShopIT is an existing MERN e-commerce API with a new responsive React storefront in `frontend/`. The frontend uses the repository's Express/MongoDB services for products, cookie-based accounts, orders, and admin operations.

## Technology

- Backend: Node.js, Express 5, MongoDB/Mongoose, JWT in an HTTP-only cookie
- Frontend: React, Vite, JavaScript, Tailwind CSS 4, React Router, Axios, Framer Motion, Lucide, Sonner

## Project structure

```text
backend/        Express routes, controllers, models, middleware, utilities
frontend/       React/Vite storefront and admin UI
FRONTEND_IMPLEMENTATION_PLAN.md   Backend API reference and implementation decisions
FRONTEND_IMPLEMENTATION_SUMMARY.md Completion status and known limitations
```

## Requirements

- Node.js 20 or newer and npm
- MongoDB reachable using the backend's existing connection settings
- SMTP credentials for password reset emails

## Backend setup

The backend reads `backend/config/config.env` (already present in this checkout; do not commit or replace it). Required settings include `PORT`, `NODE_ENV`, `FRONTEND_URL`, `DB_LOCAL_URI` or `DB_URI`, `JWT_SECRET`, `JWT_EXPIRES_TIME`, `COOKIE_EXPIRES_TIME`, and SMTP values (`SMTP_HOST`, `SMTP_PORT`, `SMTP_EMAIL`, `SMTP_PASSWORD`, `SMTP_FROM_EMAIL`, `SMTP_FROM_NAME`). Use your own secure values outside source control.

From the repository root:

```powershell
npm install
npm run dev
```

The checked-in local config uses port `4000`. The backend API prefix is `/api/v1`. For first-time sample data, review the seeder before running `npm run seeder`; seeding modifies the connected database.

To add the curated sustainable demo products without clearing or changing existing products, first create an admin account, review `backend/seeder/sustainableCatalog.js`, then run `npm run seed:sustainable` from the repository root. The script inserts only missing catalog items. Image URLs and suggested prices are examples and should be checked against current supplier listings before launch.

For bulk imports, use a JSON array or CSV file with the fields shown in `backend/seeder/products.example.json`. Every product needs a unique `sku`; `user` is assigned from the first admin account. Validate a file with `npm run import:products -- backend/seeder/products.example.json --dry-run`. Run a real import only against a local throwaway MongoDB database. Existing SKUs are updated only when their product data changes.

## Frontend setup

```powershell
cd frontend
npm install
Copy-Item .env.example .env.local
npm run dev
```

`frontend/.env.example` points to `http://localhost:4000/api/v1`, matching the current backend port. Set `VITE_API_BASE_URL` in `.env.local` if the API runs elsewhere. The Vite development origin is `http://localhost:5173`; the backend allows that origin and the configured `FRONTEND_URL` (currently `http://localhost:3000`) for credentialed CORS.

## Commands

From the repository root: `npm run dev` starts the backend, `npm start` starts it normally, `npm run seeder` runs the existing database seeder, and `npm run seed:sustainable` adds missing sustainable demo products. From `frontend/`: `npm run dev` starts Vite, `npm run build` creates `frontend/dist`, and `npm run preview` previews that build.

## Features

- Product discovery, keyword/category filters, client-side sorting of the current backend page, product details, availability, and local persistent cart
- Cookie session login, registration, forgot/reset password, profile editing, password change, and order history
- Checkout creates a COD order through the existing order endpoint after checking current product stock
- Admin views for available product, order, and user APIs; product image URLs use the existing schema
- Responsive design, loading states, empty states, and user-friendly API errors

## Known limitations

The existing backend does not provide cart, payment processing, newsletter, category, or analytics endpoints. It paginates products at four per page and has no sorting contract; the storefront sorts only the current returned page. Order pricing and stock are not validated server-side, and order detail authorization needs a backend fix. The order schema uses `Quantity` and string item prices; the frontend sends that existing shape. Card payments are not offered. Image file uploads are not supported. See the implementation plan and summary for the full API inventory and details.
