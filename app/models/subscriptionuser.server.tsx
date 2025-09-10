import db from "../db.server";
import Stripe from "stripe";

export async function get_subscription_user(shop_url) {
  try {
    const existingShop = await db.user.findFirst({
      where: { shop_url: shop_url, sub_cancel_date: null },
    });
    return existingShop;
  } catch (error) {
    return { message: "Unable to fetch details", error };
  }
}

export async function getStripeSubscriptions(userInfo) {
  try {
    const stripe = new Stripe(userInfo.stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    // Fetch all subscriptions
    const subscriptionsList = await stripe.subscriptions.list({limit : 99});

    // Extract and format required fields
    const subscriptionData = subscriptionsList.data.map((subscription) => {
      const firstItem = subscription.items?.data[0]; // Get first subscription item
      const price = firstItem?.price;
      const recurring = price?.recurring;

      return {
        subscriptionId: subscription.id, // Subscription ID
        customerId: subscription.customer, // Customer ID
        amount: price?.unit_amount ? (price.unit_amount / 100).toFixed(2) : "0.00", // Convert to readable amount
        currency: price?.currency?.toUpperCase() || subscription.currency?.toUpperCase() || "USD",
        status: subscription.status, // Active, canceled, etc.
        created: new Date(subscription.created * 1000).toLocaleDateString(), // Human readable date
        recurringInterval: recurring?.interval || "N/A", // month, year, etc.
      };
    });

    return subscriptionData; // 
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    return { message: "Unable to fetch subscriptions", error };
  }
}
