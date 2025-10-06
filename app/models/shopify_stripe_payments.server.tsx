import Stripe from "stripe";

export async function getStripePaymentByShopifyOrder(orderId: string, userInfo: any) {
  const stripe = new Stripe(userInfo.stripeSecretKey, { apiVersion: "2023-10-16" });

  // List all PaymentIntents (or Charges)
  const paymentIntents = await stripe.paymentIntents.list({
    limit: 100,
  });

  // Filter PaymentIntents by Shopify order ID in metadata
  const matchedPayments = paymentIntents.data.filter(
    (pi) => pi.metadata.order_id === orderId
  );

  // console.log("Metadata logs:", paymentIntents.data.filter(
  //   (pi) => pi.metadata
  // ))
  console.log("Stripe payments for order", orderId, matchedPayments);
  return matchedPayments;
}
