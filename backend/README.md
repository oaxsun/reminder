# Korah Backend

Backend Node/Express para conectar Korah con Stripe Checkout, Stripe Customer Portal y Supabase.

## Render

Configura el Web Service así:

- Root Directory: `backend`
- Build Command: `npm install`
- Start Command: `node server.js`

## Variables de entorno

Copia `.env.example` en Render y completa:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `KORAH_MONTHLY_PRICE_ID`
- `KORAH_YEARLY_PRICE_ID`
- `FRONTEND_URL`

## Endpoints

- `GET /health`
- `POST /create-checkout-session`
- `POST /create-portal-session`
- `POST /stripe-webhook`
