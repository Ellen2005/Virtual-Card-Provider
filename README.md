# 💳 Virtual Card Application (VCARD)

A full-stack **Virtual Card & Wallet Management Platform** that allows users to create and manage virtual cards, fund wallets, make simulated payments, and track transactions — with a complete admin dashboard for monitoring users and system activity.

---

## 📌 Features

### 👤 User Features

- Secure authentication (JWT, email verification)
- Wallet funding & real-time balance tracking
- Virtual card creation and management
- Freeze / unfreeze virtual cards
- Simulated online & offline payments
- Transaction history and activity logs
- Notifications system
- Support ticket system
- Profile management

### 👑 Admin Features

- Admin authentication & role-based access
- User management
- Transaction monitoring
- Support ticket resolution
- System analytics & dashboard insights

---

## 🛠 Tech Stack

### Backend

- **Node.js** + **Express.js**
- **MySQL** (connection pooling)
- **JWT Authentication**
- **bcryptjs** for password hashing
- **Passport.js** (Google OAuth)
- **Helmet**, **CORS**, **Rate Limiting**
- **Joi** for validation
- **Nodemailer** for email notifications

### Environment variables added or updated

- `PAYMENT_FAILURE_RATE` – a number between 0 and 1 used in development to randomly fail card payments (default `0.3`). Set to `0` in production or adjust as needed.
- `SMTP_SERVICE` – optional; use this to specify a nodemailer service name (e.g. `gmail`). Adding it can help avoid "Connection closed unexpectedly" errors with `smtp.gmail.com`.

📌 **SMTP setup tips**: if you're using Gmail, you must either create an application-specific password or enable less secure app access. The error `Connection closed unexpectedly` usually means the credentials were rejected or the provider blocked the connection. Consult the logs printed at startup from `src/utils/helpers.js` for a full config dump and diagnostic message.

### Frontend

- **React 19**
- **Redux Toolkit**
- **Material UI (MUI)**
- **React Router DOM**
- **Formik + Yup**
- **Axios**
- **Chart.js**

---

## 📁 Project Structure

```
virtual-card-project/
├── vcard-backend/
│   ├── src/
│   │   ├── app.js
│   │   ├── server.js
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── utils/
│   │   └── models/
│   └── package.json
│
├── vcard-frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── store/
│   │   └── utils/
│   └── package.json
│
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js v14+
- MySQL 5.7+
- npm or yarn

---

## 🔧 Backend Setup

```bash
cd vcard-backend
npm install
```

### Create `.env`

```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=vcard_db

JWT_SECRET=your_jwt_secret
JWT_EXPIRE=7d

FRONTEND_URL=http://localhost:3000

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

### Start Backend

```bash
npm run dev
```

Backend runs at: `http://localhost:5000`

---

## 🎨 Frontend Setup

```bash
cd vcard-frontend
npm install
```

### Create `.env`

```env
REACT_APP_API_URL=http://localhost:5000/api/v1
```

### Start Frontend

```bash
npm start
```

Frontend runs at: `http://localhost:3000`

---

## 🗄 Database Schema (Core Tables)

- `users`
- `cards`
- `transactions`
- `support_tickets`
- `notifications`
- `audit_logs`

Wallet balance is stored on the `users` table as `wallet_balance`.

---

## 🔐 Authentication Flow

1. User registers
2. Email verification sent
3. User logs in
4. JWT token issued
5. Token required for protected routes

---

## 💰 Wallet & Payment Flow

1. User funds wallet
2. Wallet balance updated
3. User makes payment using a virtual card
4. Payment is **simulated by default** (70% success / 30% failure).  
   *You can control or disable the failure rate with the `PAYMENT_FAILURE_RATE` environment variable—set to `0` for always‑succeed or a value between `0` and `1` to adjust the probability.*
5. Transaction recorded
6. Balance updated
7. Notification sent

---

## 📡 API Endpoints

### Auth

```
POST   /auth/register
POST   /auth/login
GET    /auth/me
POST   /auth/forgot-password
POST   /auth/reset-password
```

### Wallet

```
GET    /wallet/balance
POST   /wallet/fund
```

### Cards

```
POST   /cards
GET    /cards
PATCH  /cards/:id/freeze
DELETE /cards/:id
```

### Transactions

```
GET    /transactions
POST   /payments/pay
```

### Admin

```
GET    /admin/stats
GET    /admin/users
GET    /admin/transactions
GET    /admin/support-tickets
PATCH  /admin/support-tickets/:id/status
```

---

## 🛡 Security Measures

- JWT-based authentication
- bcrypt password hashing
- Rate limiting
- Input validation (Joi)
- CORS restrictions
- Audit logging
- Fraud detection (auto-freeze cards)

---

## 🧠 Architecture Highlights

### Backend

- Controller-based architecture
- Middleware for auth & roles
- MySQL transactions for financial operations
- Centralized error handling

### Frontend

- Redux as single source of truth
- Service-based API abstraction
- Protected routes (Auth/Admin)
- Component-based UI structure

---

## 🧪 Development Scripts

### Backend

```bash
npm run dev
npm start
```

### Frontend

```bash
npm start
npm run build
```

---

## 💳 Real Payment Gateway Integration (NOT YET IMPLEMENTED)

This section outlines how to integrate real payment processing into the application. Currently, all payments are **simulated (70% success / 30% failure)**.

### Planned Payment Integration Approach

#### 1. **Stripe Integration**

**Backend Setup:**

```bash
npm install stripe
```

**Implementation Steps:**

- Create Stripe account and obtain API keys
- Add `STRIPE_SECRET_KEY` and `STRIPE_PUBLISHABLE_KEY` to `.env`
- Create payment service for Stripe API calls
- Generate Stripe `paymentIntentId` for frontend
- Verify webhook signatures for payment confirmations

**Endpoint Example:**

```javascript
POST /api/v1/payments/create-payment-intent
{
  "amount": 5000,        // in cents
  "currency": "usd",
  "cardId": "card_123"
}
```

**Response:**

```json
{
  "clientSecret": "pi_xxx_secret_xxx",
  "paymentIntentId": "pi_xxx"
}
```

#### 2. **Paystack Integration (for African markets)**

**Backend Setup:**

```bash
npm install axios
```

**Implementation Steps:**

- Create Paystack account and obtain secret key
- Add `PAYSTACK_SECRET_KEY` to `.env`
- Create payment service for Paystack API calls
- Handle payment verification via Paystack webhooks
- Store transaction reference for reconciliation

**Endpoint Example:**

```javascript
POST /api/v1/payments/paystack
{
  "amount": 500000,      // in kobo
  "email": "user@example.com",
  "cardId": "card_456"
}
```

#### 3. **Flutterwave Integration (multi-currency)**

**Backend Setup:**

```bash
npm install flutterwave-node-v3
```

**Key Features:**

- Multi-currency support
- Multiple payment methods (card, mobile money, bank transfer)
- Built-in fraud detection
- Webhook support for real-time updates

#### 4. **Database Schema Updates for Real Payments**

New/Modified Tables:
```sql
-- Payment Methods Table
CREATE TABLE payment_methods (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  provider VARCHAR(50),           -- 'stripe', 'paystack', 'flutterwave'
  external_id VARCHAR(255),        -- Payment provider's ID
  card_last_four VARCHAR(4),
  card_brand VARCHAR(20),
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP
);

-- Payment Transactions (Enhanced)
CREATE TABLE transactions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  card_id INT NOT NULL,
  amount DECIMAL(10, 2),
  currency VARCHAR(3),
  status ENUM('pending', 'processing', 'completed', 'failed', 'refunded'),
  provider_id VARCHAR(255),        -- Stripe PI ID, Paystack ref, etc.
  provider_response JSON,
  merchant_id INT,
  merchant_name VARCHAR(255),
  description VARCHAR(255),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Reconciliation Log
CREATE TABLE payment_reconciliation (
  id INT PRIMARY KEY AUTO_INCREMENT,
  transaction_id INT,
  external_id VARCHAR(255),
  status_verified BOOLEAN,
  verified_at TIMESTAMP
);
```

#### 5. **Backend Architecture Changes**

**New Payment Service Layer:**

```
src/
├── services/
│   ├── paymentProviders/
│   │   ├── stripeProvider.js
│   │   ├── paystackProvider.js
│   │   ├── flutterWaveProvider.js
│   │   └── baseProvider.js      -- Abstract base class
│   ├── paymentProcessor.js       -- Main orchestrator
│   └── webhookHandler.js         -- Handle provider callbacks
│
├── controllers/
│   ├── paymentController.js      -- Updated to use real payments
│   └── webhookController.js      -- Handle payment confirmations
│
└── routes/
    ├── paymentRoutes.js
    └── webhookRoutes.js
```

**Payment Processing Flow:**

```
1. User initiates payment
2. Frontend calls: POST /api/v1/payments/create-intent
3. Backend creates payment intent with provider
4. Frontend receives clientSecret
5. Frontend uses provider's SDK to collect card details
6. Frontend confirms payment with clientSecret
7. Provider sends confirmation webhook
8. Backend verifies and updates transaction status
9. Wallet balance updated (after verification)
```

#### 6. **Frontend Changes**

**New Dependencies:**

```bash
npm install @stripe/react-stripe-js @stripe/stripe-js
# or
npm install flutterwave-react-v3
# or
npm install @paystack/inline-js
```

**Component Structure:**

```
src/components/
├── Payment/
│   ├── StripePaymentForm.jsx
│   ├── PaystackPaymentForm.jsx
│   ├── FlutterWavePaymentForm.jsx
│   └── PaymentProcessor.jsx      -- Provider selection & routing
```

#### 7. **Security Considerations**

- **PCI Compliance**: Never handle raw card data on backend
- **SSL/TLS**: All payment endpoints must use HTTPS
- **Webhook Verification**: Verify webhook signatures from providers
- **Rate Limiting**: Implement stricter limits on payment endpoints
- **Fraud Detection**: Implement velocity checks and anomaly detection
- **Tokenization**: Store provider tokens, not card numbers
- **Encryption**: Encrypt sensitive payment data at rest

#### 8. **Webhook Implementation Example (Stripe)**

```javascript
// POST /api/v1/webhooks/stripe
async function handleStripeWebhook(req, res) {
  const sig = req.headers['stripe-signature'];

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      STRIPE_WEBHOOK_SECRET
    );

    if (event.type === 'payment_intent.succeeded') {
      const { id, amount, metadata } = event.data.object;
      await updateTransactionStatus(metadata.transactionId, 'completed');
      await updateWalletBalance(metadata.userId, amount);
    }

    res.json({ received: true });
  } catch (error) {
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
}
```

#### 9. **Testing Payment Integrations**

**Stripe Test Mode:**
- Use test card: `4242 4242 4242 4242`
- Any future expiry date
- Any CVC

**Paystack Test:**
- Test card: `4111 1111 1111 1111`
- Any future expiry
- Any CVC

**Flutterwave Sandbox:**
- Test card: `5531 8866 5005 9467`
- Expiry: `09/32`
- CVV: `812`

#### 10. **Configuration Example**

```env
# .env
PAYMENT_PROVIDER=stripe  # or 'paystack', 'flutterwave'

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Paystack (Alternative)
PAYSTACK_SECRET_KEY=sk_live_...
PAYSTACK_PUBLIC_KEY=pk_live_...

# Flutterwave (Alternative)
FLUTTERWAVE_SECRET_KEY=FLWSECK_TEST-...
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST-...

# Payment Settings
PAYMENT_TIMEOUT=30000
RETRY_ATTEMPTS=3
```

### Next Steps to Implement Real Payments

1. Choose primary payment provider (recommend Stripe for global, Paystack for Africa)
2. Create provider-specific service classes
3. Update transaction model to store provider data
4. Implement webhook handlers
5. Update frontend with payment form components
6. Implement error handling and retry logic
7. Add reconciliation job for failed/pending transactions
8. Conduct security audit for PCI compliance
9. Perform end-to-end testing with test cards
10. Set up production credentials and monitoring

---

## 🐛 Troubleshooting

- Check MySQL service is running
- Ensure `.env` values are correct
- Verify JWT token in request headers
- Confirm CORS frontend URL matches backend config

---

## 🔮 Future Enhancements

- ✅ Real payment gateway integration (Stripe, Paystack, Flutterwave) - **[See Real Payment Integration Guide Above]**
- Mobile app (React Native)
- Multi-currency wallets
- Two-factor authentication
- KYC verification
- Subscription & recurring payments
- Swagger API documentation
- Advanced analytics dashboard
- Transaction disputes & chargebacks
- Loyalty/rewards program

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Open a pull request

---

## 📄 License

Proprietary software. All rights reserved.

---

## 📬 Support

- In-app support tickets
- GitHub Issues for bug reports

---

**Version:** 1.0.0  
**Last Updated:** March 2026


