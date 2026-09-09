# Nexus AI — MERN AI SaaS Platform

A production-grade, full-stack AI SaaS platform built with MongoDB, Express, React, and Node.js. Features a credit-based AI chat system with real-time streaming and **persistent conversation history**, persona/template libraries, **admin-gated** persona/template management, Razorpay-powered payments with **backend-enforced pricing**, **webhook reliability**, and a usage analytics dashboard — wrapped in an ultra-premium dark glassmorphism UI with **mobile navigation**.

---

## 1. System Architecture

```
                                   ┌───────────────────────────┐
                                   │        React (Vite)       │
                                   │  Dark, glassmorphism UI   │
                                   │  Context: Auth / Chat     │
                                   │  Mobile hamburger nav      │
                                   └─────────────┬─────────────┘
                                                  │ REST + SSE (fetch, abortable)
                                                  │ Bearer JWT
                                                  ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│                              Express API (Node.js)                               │
│                                                                                    │
│  cors → helmet → [raw() on /webhooks/razorpay] → json → routes → errorHandler    │
│                                                                                    │
│ ┌──────────┐ ┌─────────┐ ┌────────────┐ ┌───────────────┐ ┌───────────┐ ┌───────┐│
│ │authRoutes│ │aiRoutes │ │paymentRoutes│ │conversationRts│ │persona/tmpl│ │webhook││
│ │/api/auth │ │/api/ai  │ │/api/payments│ │/api/conversat.│ │  Routes    │ │Routes ││
│ └────┬─────┘ └────┬────┘ └──────┬─────┘ └───────┬───────┘ └─────┬─────┘ └───┬───┘│
│      │            │             │               │               │           │    │
│      ▼            ▼             ▼               ▼               ▼           ▼    │
│ authController aiController paymentController conversationController  webhookCtrl │
│ (bcrypt+JWT+   (SSE stream + (plan lookup +    (CRUD, scoped to      (sig-verified,│
│  hashed OTP)    AbortCtrl +   ownership check +  req.user._id)        idempotent) │
│                 Conversation  idempotent verify)                                  │
│                 persistence)                                                      │
└──────┬────────────┬───────────────┬────────────────┬───────────────┬─────────────┘
       │             │               │                │               │
       ▼             ▼               ▼                ▼               ▼
 ┌─────────┐   ┌──────────┐   ┌────────────┐   ┌─────────────┐  ┌───────────┐
 │  User   │   │  OpenAI  │   │  Razorpay  │   │Conversation │  │  Payment  │
 │ (role,  │   │   API    │   │    API     │   │  (messages  │  │(unique    │
 │  plan)  │   │          │   │            │   │   array)    │  │ orderId)  │
 └─────────┘   └──────────┘   └────────────┘   └─────────────┘  └───────────┘
       │                                                                │
       └────────────────────────────┬───────────────────────────────────┘
                                     ▼
                              ┌───────────────┐
                              │    MongoDB     │
                              └───────────────┘
```

**Secure payment flow:**
1. Client sends `POST /api/payments/create-order` with only `{ plan: "basic" | "pro" }`.
2. `paymentController` looks up the real amount/credits from `config/plans.js` — the amount is never read from the request body.
3. A `Payment` record is created with `status: "created"` and a **unique** `razorpayOrderId`.
4. After checkout, `POST /api/payments/verify` looks the payment up by `razorpayOrderId` **AND** `userId` — a payment can only be verified by the user who created it.
5. If the payment is already `"captured"`, the endpoint returns success without re-crediting (idempotent).
6. Otherwise, the Razorpay HMAC signature is verified, then an atomic `findOneAndUpdate` (guarded by `status: { $ne: 'captured' } }`) flips the status and only the request that wins that race credits the user via `$inc`.
7. A Razorpay **webhook** (`POST /api/webhooks/razorpay`) provides a reliability backstop using the same idempotent-capture logic, in case the client never completes the verify call.

**Chat + conversation persistence flow:**
1. Client sends `POST /api/ai/chat` with `{ prompt, personaId, conversationId? }`.
2. If no `conversationId` is given, a new `Conversation` is created; otherwise the existing one is loaded (scoped to `req.user._id`).
3. The user's message is saved immediately, then up to the last 20 prior messages are sent to OpenAI as context.
4. The response streams to the client via SSE as before; if the client disconnects, an `AbortController` cancels the upstream OpenAI request so no further tokens are generated or billed.
5. Once the stream completes, the full assistant reply is saved to the conversation, 1 credit is deducted, and a `done` event returns the `conversationId` so the frontend can keep sending follow-up messages into the same thread.

---

## 2. Setup Guide

### Prerequisites
- Node.js 18+
- MongoDB (local instance or a MongoDB Atlas cluster)
- An OpenAI API key
- A Razorpay account (test-mode keys work for local development)
- A [Resend](https://resend.com) account (for sending password-reset OTP emails)

### Backend

```bash
cd backend
cp .env.example .env
# Fill in MONGO_URI, JWT_SECRET, OPENAI_API_KEY, RAZORPAY_KEY_ID,
# RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET, RESEND_API_KEY, EMAIL_FROM
npm install
npm run seed      # populates default personas & templates
npm run dev        # starts the API on http://localhost:5000
```

**Creating an admin user:** persona/template write access requires `role: "admin"` on the `User` document. There is no signup toggle for this (by design) — after signing up normally, promote yourself directly in MongoDB:

```js
// mongosh
use ai-saas-platform
db.users.updateOne({ email: "you@example.com" }, { $set: { role: "admin" } })
```

**Registering the Razorpay webhook:** in the Razorpay Dashboard → Webhooks, add an endpoint pointing at `POST {your_api_url}/api/webhooks/razorpay`, subscribe to the `payment.captured` event, and copy the generated secret into `RAZORPAY_WEBHOOK_SECRET`.

### Frontend

```bash
cd frontend
cp .env.example .env
# Set VITE_API_BASE_URL and VITE_RAZORPAY_KEY_ID
npm install
npm run dev         # starts the app on http://localhost:5173
```

Open `http://localhost:5173`, sign up for an account (you start with 50 free credits), and start chatting. Your conversations are now saved automatically and appear in the Chat page's history sidebar (or the mobile hamburger menu's slide-over on small screens).

### Production build

```bash
cd frontend && npm run build   # outputs static assets to frontend/dist
cd backend && npm start        # run the API with NODE_ENV=production
```

Serve `frontend/dist` from any static host (Vercel, Netlify, S3 + CloudFront) and point `VITE_API_BASE_URL` at your deployed backend. Set `FRONTEND_URL` on the backend to your deployed frontend's origin so CORS allows it.

---

## 3. API Routes

| Method | Endpoint                          | Access        | Description                                                        |
|--------|-------------------------------------|---------------|------------------------------------------------------------------------|
| GET    | `/api/health`                       | Public        | Health check                                                           |
| POST   | `/api/auth/signup`                  | Public        | Register a new user, returns JWT                                       |
| POST   | `/api/auth/login`                   | Public        | Authenticate, returns JWT                                              |
| GET    | `/api/auth/me`                      | Private       | Get the logged-in user's profile                                       |
| POST   | `/api/auth/forgot-password`         | Public        | Generate a hashed, expiring OTP and email it via Resend                |
| POST   | `/api/auth/reset-password`          | Public        | Verify OTP and reset password; OTP is invalidated after use            |
| POST   | `/api/ai/chat`                      | Private       | Stream an AI chat response over SSE; persists to a Conversation        |
| GET    | `/api/personas`                     | Private       | List all AI personas                                                   |
| POST   | `/api/personas`                     | Private/Admin | Create a new persona                                                    |
| PUT    | `/api/personas/:id`                 | Private/Admin | Update a persona                                                        |
| DELETE | `/api/personas/:id`                 | Private/Admin | Delete a persona                                                        |
| GET    | `/api/templates`                    | Private       | List templates (supports `?category=` and `?search=`)                  |
| POST   | `/api/templates`                    | Private/Admin | Create a new template                                                   |
| PUT    | `/api/templates/:id`                | Private/Admin | Update a template                                                       |
| DELETE | `/api/templates/:id`                | Private/Admin | Delete a template                                                       |
| POST   | `/api/conversations`                | Private       | Create a new (empty) conversation                                       |
| GET    | `/api/conversations`                | Private       | List the user's conversations (summaries), most recent first            |
| GET    | `/api/conversations/:id`            | Private       | Get a single conversation with full message history                     |
| PUT    | `/api/conversations/:id`            | Private       | Rename a conversation / change its persona                              |
| DELETE | `/api/conversations/:id`            | Private       | Delete a conversation                                                   |
| POST   | `/api/payments/create-order`        | Private       | Create a Razorpay order for a **backend-defined** plan (`{ plan }` only)|
| POST   | `/api/payments/verify`              | Private       | Verify signature + ownership, idempotently credit the user's account   |
| GET    | `/api/payments/history`             | Private       | List the user's payment transactions                                    |
| POST   | `/api/webhooks/razorpay`            | Public*       | Razorpay webhook — signature-verified, idempotent payment capture       |
| GET    | `/api/analytics`                    | Private       | Daily token usage, total chats, and recent activity logs                |

\* The webhook route has no JWT (Razorpay calls it directly), but every request is rejected unless its HMAC signature matches `RAZORPAY_WEBHOOK_SECRET`.

All `Private` routes require an `Authorization: Bearer <token>` header. `Private/Admin` routes additionally require `role: "admin"` on the authenticated user. Errors are always returned as `{ success: false, message: "..." }`.

---

## 4. Environment Variables

### Backend (`backend/.env`)

| Variable                  | Description                                                        |
|-----------------------------|------------------------------------------------------------------------|
| `PORT`                      | Port the API listens on (default `5000`)                               |
| `NODE_ENV`                   | `development` or `production`                                          |
| `MONGO_URI`                  | MongoDB connection string                                               |
| `JWT_SECRET`                 | Long, random secret used to sign JWTs                                   |
| `JWT_EXPIRES_IN`             | Token lifetime (e.g. `7d`)                                              |
| `OPENAI_API_KEY`             | OpenAI API key used for chat completions                                |
| `RAZORPAY_KEY_ID`            | Razorpay public key ID                                                   |
| `RAZORPAY_KEY_SECRET`        | Razorpay secret key (server-side only)                                  |
| `RAZORPAY_WEBHOOK_SECRET`    | Secret used to verify incoming Razorpay webhook signatures              |
| `RESEND_API_KEY`             | API key for the Resend email service (password reset OTPs)             |
| `EMAIL_FROM`                 | The "from" address/name used for outgoing emails                        |
| `FRONTEND_URL`               | Allowed CORS origin(s), comma-separated                                 |

### Frontend (`frontend/.env`)

| Variable                  | Description                                  |
|-----------------------------|-------------------------------------------------|
| `VITE_API_BASE_URL`         | Base URL of the backend API (e.g. `http://localhost:5000/api`) |
| `VITE_RAZORPAY_KEY_ID`      | Razorpay public key ID used by the checkout SDK |

---

## 5. Tech Stack Summary

- **Frontend:** React 18, Vite, Tailwind CSS, React Router, Recharts, react-markdown, react-hot-toast, lucide-react
- **Backend:** Express, Mongoose, JWT, bcryptjs, express-validator, express-rate-limit, Helmet, Razorpay SDK, OpenAI SDK, Resend
- **Database:** MongoDB
- **Payments:** Razorpay — backend-priced orders, HMAC-SHA256 signature verification, idempotent crediting, and a webhook reliability backstop
- **AI:** OpenAI Chat Completions API, streamed to the client via Server-Sent Events, with persisted, context-aware conversation history and client-disconnect abort handling
- **Email:** Resend, for password-reset OTP delivery

---

## 6. Security Notes

- **Payment amounts are never trusted from the client.** The frontend sends only a `plan` id; the backend resolves the real price and credit count from `backend/config/plans.js`.
- **Payments are ownership-checked.** `verifyPayment` looks up the payment by `razorpayOrderId` **and** `req.user._id` — one user can never verify or claim credit for another user's payment.
- **Credits are never added twice.** Both the client-verify and webhook paths use an atomic `findOneAndUpdate` guarded by `status: { $ne: 'captured' }`, so concurrent or duplicate requests can't double-credit an account.
- **Conversations are strictly user-scoped.** Every conversation query includes `userId: req.user._id`.
- **OTPs are hashed before storage**, expire after 10 minutes, are invalidated after use (or after an email-delivery failure), and are never logged or returned in any API response.
- **Persona/Template writes require `role: "admin"`.** Reads remain open to any authenticated user.
- **Helmet** is applied globally (with CSP/COEP disabled, since this API only ever returns JSON/SSE, never HTML).
- **The Razorpay webhook route receives the raw request body** (mounted before the global JSON parser) so its HMAC signature can be verified against the exact bytes Razorpay sent.

---

## 7. Notes & Optional Next Steps

- `PLAN_CREDITS`/pricing tiers live in `backend/config/plans.js` — add more entries there to introduce new tiers.
- Consider adding integration tests (Jest + Supertest) around the auth, payment-verification, and conversation-ownership flows.
- Consider adding pagination to `GET /api/conversations` and `GET /api/payments/history` once usage grows.
- Consider adding a dedicated admin UI for managing personas/templates (the APIs already support it).
- The webhook currently only reacts to `payment.captured`; extend `webhookController.js` if you want to handle `payment.failed` or `refund.processed` events too.
