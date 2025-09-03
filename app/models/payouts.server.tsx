import { Stripe } from "stripe";
import Stripe from "stripe";

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
export async function fetchStripeBalanceTransactions(userInfo,{ startingAfter = null, limit = 10 } = {}) 
{
  try {
    if (!userInfo?.stripeSecretKey) {
      console.error("No Stripe key provided");
      return { transactions: [], hasMore: false };
    }

    const stripe = new Stripe(userInfo.stripeSecretKey, {
      apiVersion: "2023-10-16" 
    });
    
    // Create UNIX timestamps for today
    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0)).getTime() / 1000; // seconds
    const endOfDay = new Date(now.setHours(23, 59, 59, 999)).getTime() / 1000; // seconds

    const response = await stripe.balanceTransactions.list({
      limit,
      created: {
        gte: startOfDay,
        lte: endOfDay,
      },
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    });

    console.log("Stripe Balance Transactions:", response.data);

    return {
      transactions: response.data,
      hasMore: response.has_more,
    };
  } catch (error) {
    console.error("Balance transactions not found!", error);
    return { transactions: [], hasMore: false };
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
      available: response.available, // Array of available balances
      pending: response.pending, // Array of pending balances
    };
  } catch (error) {
    console.error("Stripe balance not found!", error);
    return { available: [], pending: [] };
  }
}
