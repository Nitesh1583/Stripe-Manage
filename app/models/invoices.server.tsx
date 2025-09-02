import { Stripe } from "stripe";

export async function fetchStripeInvoices(userInfo) {
  try {
    const stripe = new Stripe(userInfo.stripeSecretKey, { apiVersion: "2023-10-16" });

    // Fetch all invoices (no customer filter)
    const invoices = await stripe.invoices.list({ limit: 99 });

    const invoiceData = invoices.data.map((inv) => ({
      id: inv.id,
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

export async function fetchSearchStripeInvoices(searchValue, userInfo) {
  try {
    const stripe = new Stripe(userInfo.stripeSecretKey, { apiVersion: "2023-10-16" });

    // Get all invoices and filter by searchValue
    const { data } = await stripe.invoices.list({ limit: 99 });

    const filteredData = data.filter((inv) =>
      inv.id.toLowerCase().includes(searchValue.toLowerCase())
    );

    return { stripeInvoices: filteredData, isError: false };
  } catch (error) {
    console.error("Error searching invoices:", error);
    return { stripeInvoices: [], message: "Search failed", error, isError: true };
  }
}
