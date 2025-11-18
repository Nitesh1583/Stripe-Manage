import Stripe from "stripe";

/**
 * MATCH using metadata.order_id
 */
export async function getStripePaymentByShopifyOrder(orderId: string, userInfo: any) {
  const stripe = new Stripe(userInfo.stripeSecretKey, { apiVersion: "2023-10-16" });

  const paymentIntents = await stripe.paymentIntents.list({ limit: 100 });

  return paymentIntents.data.filter((pi) => {
    return pi.metadata?.order_id === orderId;
  });
}

/**
 * MATCH using:
 *   metadata.shopify_payment_session === paymentSessionGID
 *   metadata.shopify_shop_domain === shopDomain
 */
export async function getStripePaymentsWithShopifySession(
  paymentSessionId: string,
  shopDomain: string,
  userInfo: any
) {
  const stripe = new Stripe(userInfo.stripeSecretKey, { apiVersion: "2023-10-16" });

  const paymentIntents = await stripe.paymentIntents.list({ limit: 100 });

  return paymentIntents.data.filter((pi) => {
    return (
      pi.metadata?.shopify_payment_session === paymentSessionId &&
      pi.metadata?.shopify_shop_domain === shopDomain
    );
  });
}
