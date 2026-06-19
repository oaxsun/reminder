import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const app = express();
const port = process.env.PORT || 10000;

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const frontendUrl = process.env.FRONTEND_URL || 'https://korah.oaxsun.tech';
const monthlyPriceId = process.env.KORAH_MONTHLY_PRICE_ID;
const yearlyPriceId = process.env.KORAH_YEARLY_PRICE_ID;

if (!stripeSecretKey) console.warn('Missing STRIPE_SECRET_KEY');
if (!supabaseUrl) console.warn('Missing SUPABASE_URL');
if (!supabaseServiceRoleKey) console.warn('Missing SUPABASE_SERVICE_ROLE_KEY');

const stripe = new Stripe(stripeSecretKey || 'sk_test_missing');
const supabaseAdmin = createClient(supabaseUrl || 'https://example.supabase.co', supabaseServiceRoleKey || 'missing', {
  auth: { persistSession: false }
});

const allowedOrigins = new Set([
  frontendUrl,
  'https://korah.oaxsun.tech',
  'https://oaxsun.github.io',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5500'
]);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    return callback(new Error(`Origin not allowed: ${origin}`));
  }
}));

app.post('/stripe-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!stripeWebhookSecret) return res.status(500).send('Missing webhook secret');

  const signature = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, signature, stripeWebhookSecret);
  } catch (error) {
    console.error('Webhook signature verification failed:', error.message);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await syncSubscription(event.data.object);
        break;
      default:
        break;
    }

    return res.json({ received: true });
  } catch (error) {
    console.error('Webhook handler failed:', error);
    return res.status(500).json({ error: 'Webhook handler failed' });
  }
});

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'korah-backend' });
});

app.post('/create-checkout-session', async (req, res) => {
  try {
    const user = await authenticateUser(req);
    const billing = req.body?.billing === 'annual' ? 'annual' : 'monthly';
    const priceId = billing === 'annual' ? yearlyPriceId : monthlyPriceId;

    if (!priceId) return res.status(500).json({ error: 'Missing Stripe price id' });

    const customerId = await getOrCreateStripeCustomer(user);

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${frontendUrl}/?checkout=success`,
      cancel_url: `${frontendUrl}/?checkout=cancelled`,
      allow_promotion_codes: true,
      client_reference_id: user.id,
      metadata: {
        user_id: user.id,
        email: user.email || '',
        product: 'korah',
        billing
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          email: user.email || '',
          product: 'korah',
          billing
        }
      }
    });

    return res.json({ url: session.url });
  } catch (error) {
    console.error('create-checkout-session error:', error);
    return res.status(error.statusCode || 500).json({ error: error.message || 'Could not create checkout session' });
  }
});

app.post('/create-portal-session', async (req, res) => {
  try {
    const user = await authenticateUser(req);
    const subscription = await getSubscriptionByUserId(user.id);

    if (!subscription?.stripe_customer_id) {
      return res.status(404).json({ error: 'No Stripe customer found for this user' });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${frontendUrl}/?portal=returned`
    });

    return res.json({ url: session.url });
  } catch (error) {
    console.error('create-portal-session error:', error);
    return res.status(error.statusCode || 500).json({ error: error.message || 'Could not create portal session' });
  }
});

app.get('/subscription-status', async (req, res) => {
  try {
    const user = await authenticateUser(req);
    const subscription = await getSubscriptionByUserId(user.id);
    return res.json({ subscription });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ error: error.message || 'Could not read subscription' });
  }
});

async function authenticateUser(req) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    const error = new Error('Missing Authorization token');
    error.statusCode = 401;
    throw error;
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data?.user) {
    const authError = new Error('Invalid session');
    authError.statusCode = 401;
    throw authError;
  }

  return data.user;
}

async function getSubscriptionByUserId(userId) {
  const { data, error } = await supabaseAdmin
    .from('korah_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

async function getOrCreateStripeCustomer(user) {
  const existing = await getSubscriptionByUserId(user.id);
  if (existing?.stripe_customer_id) return existing.stripe_customer_id;

  const customer = await stripe.customers.create({
    email: user.email || undefined,
    metadata: {
      user_id: user.id,
      product: 'korah'
    }
  });

  await upsertSubscriptionRow({
    user_id: user.id,
    email: user.email || null,
    stripe_customer_id: customer.id,
    is_premium: false,
    subscription_status: 'none'
  });

  return customer.id;
}

async function handleCheckoutCompleted(session) {
  if (!session.subscription) return;
  const subscription = await stripe.subscriptions.retrieve(session.subscription);
  await syncSubscription(subscription, session);
}

async function syncSubscription(subscription, checkoutSession = null) {
  const userId = subscription.metadata?.user_id || checkoutSession?.metadata?.user_id || checkoutSession?.client_reference_id;
  const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id;

  if (!userId && !customerId) return;

  let user_id = userId;
  if (!user_id && customerId) {
    const { data } = await supabaseAdmin
      .from('korah_subscriptions')
      .select('user_id')
      .eq('stripe_customer_id', customerId)
      .maybeSingle();
    user_id = data?.user_id;
  }

  if (!user_id) return;

  const priceId = subscription.items?.data?.[0]?.price?.id || null;
  const status = subscription.status || 'unknown';
  const isPremium = ['active', 'trialing'].includes(status);
  const currentPeriodEnd = subscription.current_period_end
    ? new Date(subscription.current_period_end * 1000).toISOString()
    : null;

  await upsertSubscriptionRow({
    user_id,
    email: subscription.metadata?.email || checkoutSession?.metadata?.email || null,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscription.id,
    stripe_price_id: priceId,
    is_premium: isPremium,
    subscription_status: status,
    current_period_end: currentPeriodEnd,
    cancel_at_period_end: Boolean(subscription.cancel_at_period_end)
  });
}

async function upsertSubscriptionRow(payload) {
  const { error } = await supabaseAdmin
    .from('korah_subscriptions')
    .upsert({ ...payload, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });

  if (error) throw error;
}

app.listen(port, () => {
  console.log(`Korah backend running on port ${port}`);
});
