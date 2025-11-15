import Stripe from "stripe";

export async function getStripePaymentByShopifyOrder(orderId: string, userInfo: any) {
  const stripe = new Stripe(userInfo.stripeSecretKey, { apiVersion: "2023-10-16" });

  const paymentIntents = await stripe.paymentIntents.list({ limit: 10 });

  return paymentIntents.data.filter(
    (pi) => pi.metadata?.order_id === orderId
  );
}

export async function getStripePaymentsWithShopifySession(shopifyPaymentId: string, userInfo: any) {
  const stripe = new Stripe(userInfo.stripeSecretKey, { apiVersion: "2023-10-16" });

  const paymentIntents = await stripe.paymentIntents.list({ limit: 100 });

  const matchedShopifyPayments = paymentIntents.data.filter(
    (pi) => pi.metadata?.shopify_payment_session === shopifyPaymentId
  );

  return matchedShopifyPayments;
}
