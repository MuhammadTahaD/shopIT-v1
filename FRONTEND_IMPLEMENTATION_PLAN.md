# ShopIT Frontend Implementation Plan

## Repository findings

This repository is an existing JavaScript/Express/Mongoose backend with no frontend. The Express app is `backend/app.js`; routes use the `/api/v1` prefix. The backend loads `backend/config/config.env`, and `PORT` is supplied by that file at runtime. The current CORS origin is fixed to `http://localhost:3000`; the Vite development server will use port 5173, so CORS must be made configurable (with the existing origin retained as a fallback). The repository does not include the runtime config file or a safe example of its variable names.

Authentication is JWT in an HTTP-only `token` cookie (`sameSite: lax`, `secure` in production); Axios must send credentials. Responses from login/register include `{ success, token, user }`, although the cookie is the session mechanism. Protected APIs accept no bearer-token path. Errors return `{ message }` in production and additionally `error` and `stack` in development.

## Existing API reference

All paths below are prefixed by `/api/v1`. Unless stated otherwise, errors use the backend error middleware (common status codes 400, 401, 403, 404, 500 with a `message`).

| Method | Path | Inputs and response | Access |
| --- | --- | --- | --- |
| GET | `/products` | Optional `keyword`, `page`, and Mongo-style field filters (such as `category`, `price[gte]`, `price[lte]`, `ratings[gte]`). Returns `{ success, resPerPage: 4, filteredProductsCount, products }`. | Public |
| GET | `/products/:id` | Mongo product ID; returns `{ success, product }`. | Public |
| POST | `/admin/products` | Product fields including `name`, `price`, `description`, `images:[{public_id,url}]`, `category`, `seller`, `stock`; returns `{ success, product }`. | Admin cookie |
| PUT | `/admin/products/:id` | Product fields to update; returns `{ success, product }`. | Admin cookie |
| DELETE | `/admin/products/:id` | Product ID; returns `{ success, message }`. | Admin cookie |
| PUT | `/reviews` | `{ productId, rating, comment }`; creates or updates current user's review. | Authenticated cookie |
| GET | `/reviews?id=:productId` | Returns `{ reviews }`. | Authenticated cookie |
| DELETE | `/admin/reviews?id=:reviewId&productId=:productId` | Deletes a review; returns `{ success, message }`. | Authenticated cookie (route currently lacks admin role guard) |
| POST | `/register` | `{ name, email, password }`; returns `{ success, token, user }` and sets cookie. | Public |
| POST | `/login` | `{ email, password }`; returns `{ success, token, user }` and sets cookie. | Public |
| GET | `/logout` | Clears cookie; returns `{ message }`. | Public |
| POST | `/password/forgot` | `{ email }`; sends reset email and returns `{ success, message, resetUrl }` (reset URL is exposed by backend). | Public |
| PUT | `/password/reset/:token` | `{ password, confirmPassword }`; sets cookie and returns `{ success, token, user }`. | Public |
| GET | `/me` | Returns `{ user }`. | Authenticated cookie |
| PUT | `/me/update` | `{ name, email }`; returns `{ user }`. | Authenticated cookie |
| PUT | `/password/update` | `{ oldPassword, password }`; returns `{ success }`. | Authenticated cookie |
| GET | `/admin/users` | Returns `{ success, users }`. | Admin cookie |
| GET | `/admin/users/:id` | Returns `{ success, user }`. | Admin cookie |
| PUT | `/admin/users/:id` | Controller currently changes the authenticated user rather than `:id`; role cannot be changed. | Admin cookie; broken contract |
| DELETE | `/admin/users/:id` | Deletes target; returns `{ success, user }`. | Admin cookie |
| POST | `/orders/new` | Expects `orderItems`, `shippingInfo:{address,city,phoneNo,zipCode,country}`, `itemPrice`, `taxAmount`, `shippingAmount`, `totalAmount`, `paymentMethod` (`COD` or `Card`), optional `paymentInfo`; returns `{ success, order }`. | Authenticated cookie |
| GET | `/me/orders` | Returns `{ success, orders }`. | Authenticated cookie |
| GET | `/orders/:id` | Returns `{ success, order }`; backend currently does not verify order ownership. | Authenticated cookie |
| GET | `/admin/orders` | Returns `{ success, orders }`. | Admin cookie |
| PUT | `/admin/orders/:id` | `{ status }`, with supported statuses `Processing`, `Shipping`, `Delivered`; returns `{ success, message }`. | Admin cookie |
| DELETE | `/admin/orders/:id` | Deletes target; returns `{ success, order }`. | Admin cookie |

## Capabilities and gaps

- Implemented: product list/detail and keyword/filter query support; cookie login/register/logout and profile/password/reset flows; admin product CRUD; review create/read/delete; customer order creation/history and admin order list/status/delete; admin user list/detail/delete.
- Partial or inconsistent: product pagination is fixed at four and only `keyword`/`page` are removed from filters; no sort/category endpoint or pagination metadata beyond count; product schema has `rating`, while the UI/seed data use `ratings`; order item schema uses `Quantity` (capital Q) and strings for quantity/price; creation trusts client totals and does not check stock; delivery update decrements stock; order detail does not enforce ownership; admin user update targets the wrong user and cannot update role; review deletion is not role-guarded. Admin product input is URL-based; no upload service exists.
- Missing: cart APIs, payment processor, validated server-side checkout/pricing, newsletter subscription, analytics/aggregate endpoints, backend categories endpoint, order ownership enforcement, safe configurable CORS, admin user role management, and admin metrics. The frontend will persist a cart locally, use COD as the only non-misleading checkout option, compute modest dashboard counts only from returned admin lists, and avoid claiming payment completion or popularity rankings.

## Frontend architecture and implementation sequence

Create a Vite React JavaScript app in `frontend/` with React Router, Tailwind CSS, Axios, and a small context-based auth/cart state. Centralize `/api/v1` and cookie credentials in an Axios client and separate API service modules. Build a responsive storefront shell, home/shop/product pages, login/register/reset flows, cart/checkout, account pages, and admin pages gated in the UI while relying on backend authorization for security. Keep unsupported capabilities visibly unavailable and document integration limitations. Configure CORS to accept `FRONTEND_URL` or a Vite development origin while preserving localhost:3000 compatibility. After implementation, run the production build and report what could not be integration-tested without MongoDB and SMTP configuration.
