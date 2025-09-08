import { Stripe } from "stripe";
import Stripe from "stripe";

import { shopifyApi } from "@shopify/shopify-api";
import { authenticate } from "../shopify.server";


// Fetch Stripe Payouts
export async function fetchStripePayouts(userInfo) {
  try {
    const stripe = new Stripe(userInfo.stripeSecretKey, { apiVersion: "2023-10-16" });

    // Fetch all payouts
    const payouts = await stripe.payouts.list({ limit: 99 });

    const payoutsData = payouts.data.map((payouts) => ({
      id: payouts.id,
      amount: (payouts.amount / 100).toFixed(2),
      currency: payouts.currency?.toUpperCase() || "USD",
      status: payouts.status,
      created: new Date(payouts.created * 1000).toLocaleDateString(),
    }));

    return { payouts: payoutsData, isError: false };
  } catch (error) {
    console.error("Error fetching payouts:", error);
    return {
      payouts: [],
      message: "Unable to fetch payouts",
      error,
      isError: true,
    };
  }
}

// Fetch stripe Payouts by Search Filter
export async function fetchSearchStripePayouts(searchValue, userInfo) {
  try {
    const stripe = new Stripe(userInfo.stripeSecretKey, { apiVersion: "2023-10-16" });

    // Get all Payouts and filter by searchValue
    const { data } = await stripe.payouts.list({ limit: 99 });

    const filteredData = data.filter((payouts) =>
      payouts.id.toLowerCase().includes(searchValue.toLowerCase())
    );

    return { stripePayouts: filteredData, isError: false };

  } catch (error) {
    console.error("Error searching payouts:", error);
    return { stripePayouts: [], message: "Search failed", error, isError: true };
  }
}

// Fetch Stripe Balance transactions
export async function fetchStripeBalanceTransactions(userInfo, { startingAfter = null, limit = 100 } = {})
{
  try {
    if (!userInfo?.stripeSecretKey) {
      console.error("No Stripe key provided");
      return { transactions: [], todayTotal: 0, hasMore: false };
    }

    const stripe = new Stripe(userInfo.stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    // Create timestamps for start/end of today
    const now = new Date();

    const startOfDay = Math.floor(new Date(now.setHours(0, 0, 0, 0)).getTime() / 1000);
    const endOfDay = Math.ceil(new Date(now.setHours(23, 59, 59, 999)).getTime() / 1000);

    const response = await stripe.balanceTransactions.list({
      limit,
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    });

    return {
      transactions: response.data,
      hasMore: response.has_more,
    };
  } catch (error) {
    console.error("Balance transactions not found!", error);
    return { transactions: [], 
      // todayTotal: 0, 
      hasMore: false };
  }
}

// Fetch Current Stripe Balance
export async function fetchStripeBalance(userInfo) {
  try {
    if (!userInfo?.stripeSecretKey) {
      console.error("No Stripe key provided");
      return { available: [], pending: [] };
    }

    const stripe = new Stripe(userInfo.stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    const response = await stripe.balance.retrieve();

    return {
      available: response.available, 
      pending: response.pending, 
    };
  } catch (error) {
    console.error("Stripe balance not found!", error);
    return { available: [], pending: [] };
  }
}

export async function getShopifyPlanStatus(request: Request) {
  try {
    const { admin } = await authenticate.admin(request);

    // ✅ Use Shopify Admin GraphQL client
    const response = await admin.graphql(`
      {
        appInstallation {
          activeSubscriptions {
            id
            name
            status
            test
            trialDays
            lineItems {
              plan {
                pricingDetails {
                  ... on AppRecurringPricing {
                    price {
                      amount
                      currencyCode
                    }
                  }
                }
              }
            }
          }
        }
      }
    `);

    const data = await response.json();

    console.log("DEBUG: Raw Shopify Subscription Response:");
    console.dir(data, { depth: null });

    const activeSubs = data?.data?.appInstallation?.activeSubscriptions ?? [];

    let planStatus = "FREE";

    if (activeSubs.length > 0) {
      // ✅ Check subscription status + price
      const hasPaid = activeSubs.some((sub) => {
        const price = sub?.lineItems?.[0]?.plan?.pricingDetails?.price?.amount || 0;
        return ["ACTIVE", "ACCEPTED", "PENDING"].includes(sub.status) && price > 0;
      });

      planStatus = hasPaid ? "PAID" : "FREE";
    }

    console.log(`DEBUG: Computed Plan Status => ${planStatus}`);
    return { planStatus, activeSubs };
  } catch (error) {
    console.error("Error fetching Shopify Plan Status:", error);
    return { planStatus: "FREE", activeSubs: [] };
  }
}

// Fetch Recent Stripe Payouts for dashboard
export async function fetchStripeRecentPayouts(userInfo) {
  try {
    const stripe = new Stripe(userInfo.stripeSecretKey, { apiVersion: "2023-10-16" });

    // Fetch all payouts
    const recentPayouts = await stripe.payouts.list({ limit: 5 });

    const payoutsData = recentPayouts.data.map((payouts) => ({
      id: payouts.id,
      amount: (payouts.amount / 100).toFixed(2),
      currency: payouts.currency?.toUpperCase() || "USD",
      status: payouts.status,
      created: new Date(payouts.created * 1000).toLocaleDateString(),
    }));

    return { recentPayouts: payoutsData, isError: false };
  } catch (error) {
    console.error("Error fetching payouts:", error);
    return {
      payouts: [],
      message: "Unable to fetch payouts",
      error,
      isError: true,
    };
  }
}