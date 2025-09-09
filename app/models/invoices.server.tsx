import { Stripe } from "stripe";

// Fetch All Invoices 
export async function fetchStripeInvoices(userInfo) {
  try {
    const stripe = new Stripe(userInfo.stripeSecretKey, { apiVersion: "2023-10-16" });

    // Fetch all invoices (no customer filter)
    const invoices = await stripe.invoices.list({ limit: 99 });

    const invoiceData = invoices.data.map((inv) => ({
      id: inv.id,
      customerName: inv.customer_name,
      amount: (inv.amount_due / 100).toFixed(2),
      currency: inv.currency?.toUpperCase() || "USD",
      status: inv.status,
      created: new Date(inv.created * 1000).toLocaleDateString(),
    }));

    return { invoices: invoiceData, isError: false };
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return {
      invoices: [],
      message: "Unable to fetch invoices",
      error,
      isError: true,
    };
  }
}

// fetch Invoices by search filter
export async function fetchSearchStripeInvoices(searchValue, userInfo) {
  try {
    const stripe = new Stripe(userInfo.stripeSecretKey, { apiVersion: "2023-10-16" });

    // Get all invoices and filter by searchValue
    const { data } = await stripe.invoices.list({ limit: 99 });

    const filteredData = data.filter((inv) =>
      inv.customerName.toLowerCase().includes(searchValue.toLowerCase())
    );

    return { stripeInvoices: filteredData, isError: false };
  } catch (error) {
    console.error("Error searching invoices:", error);
    return { stripeInvoices: [], message: "Search failed", error, isError: true };
  }
}


// fetch recent invoices on dashboard page
export async function fetchStripeRecentInvoices(userInfo) {
  try {
    const stripe = new Stripe(userInfo.stripeSecretKey, { apiVersion: "2023-10-16" });

    // Fetch all invoices (no customer filter)
    const recentInvoices = await stripe.invoices.list({ limit: 5 });

    const invoiceData = recentInvoices.data.map((inv) => ({
      id: inv.id,
      customerName: inv.customer_name,
      customerEmail: inv.customer_email,
      amount: (inv.amount_due / 100).toFixed(2),
      currency: inv.currency?.toUpperCase() || "USD",
      status: inv.status,
      created: new Date(inv.created * 1000).toLocaleDateString(),
    }));

    return { recentInvoices: invoiceData, isError: false };
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return {
      recentInvoices: [],
      message: "Unable to fetch invoices",
      error,
      isError: true,
    };
  }
}