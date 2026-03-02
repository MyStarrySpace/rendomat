import Stripe from 'stripe';
import { userDb, creditTransactionDb } from './database.mjs';

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

export const CREDIT_PACKAGES = [
  { id: 'pack-5', credits: 5, price: 499, label: '5 Credits' },
  { id: 'pack-20', credits: 20, price: 1499, label: '20 Credits' },
  { id: 'pack-50', credits: 50, price: 2999, label: '50 Credits' },
];

export async function createCheckoutSession(userId, packageId) {
  if (!stripe) throw new Error('Stripe not configured');

  const pkg = CREDIT_PACKAGES.find(p => p.id === packageId);
  if (!pkg) throw new Error('Invalid package');

  const user = userDb.getById(userId);
  if (!user) throw new Error('User not found');

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: {
          name: `${pkg.label} — Rendomat Cloud Rendering`,
          description: `${pkg.credits} cloud render credits`,
        },
        unit_amount: pkg.price,
      },
      quantity: 1,
    }],
    metadata: {
      user_id: userId,
      package_id: pkg.id,
      credits: String(pkg.credits),
    },
    success_url: `${process.env.NEXTAUTH_URL || 'http://localhost:3456'}/billing?success=true`,
    cancel_url: `${process.env.NEXTAUTH_URL || 'http://localhost:3456'}/billing?canceled=true`,
  });

  return session;
}

export function handleWebhookEvent(event) {
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.metadata?.user_id;
    const credits = parseInt(session.metadata?.credits || '0', 10);

    if (!userId || !credits) {
      console.error('[stripe] Missing metadata in checkout session:', session.id);
      return;
    }

    // Prevent duplicate fulfillment
    const existing = creditTransactionDb.getByStripeSession(session.id);
    if (existing) {
      console.log('[stripe] Already fulfilled session:', session.id);
      return;
    }

    userDb.adjustCredits(userId, credits, 'purchase', {
      stripe_session_id: session.id,
    });

    console.log(`[stripe] Added ${credits} credits to user ${userId} (session: ${session.id})`);
  }
}

export function constructWebhookEvent(body, signature) {
  if (!stripe) throw new Error('Stripe not configured');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) throw new Error('Stripe webhook secret not configured');

  return stripe.webhooks.constructEvent(body, signature, webhookSecret);
}
