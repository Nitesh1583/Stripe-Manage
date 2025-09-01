import { Stripe } from "stripe";
import db from "../db.server";

export async function fetchStripeInvoices(userInfo) {
  try {
    const stripe = new Stripe(userInfo.stripeSecretKey, { apiVersion: "2023-10-16" });

    // Find shop’s subscription user
    const existingShop = await db.SubscriptionUser.findFirst({
      where: {
        shop_url: userInfo.shop,
        sub_cancel_date: null,
      },
    });

    if (!existingShop || !existingShop.stripe_customer_id) {
      return {
        invoices: [],
        message: "No active Stripe customer found!",
        isError: false,
      };
    }

    // Fetch invoices for this customer
    const invoices = await stripe.invoices.list({
      customer: existingShop.stripe_customer_id,
      limit: 10,
    });

    // Map data
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
    const { data } = await stripe.invoices.list();

    const filteredData = data.filter((inv) =>
      inv.id.toLowerCase().includes(searchValue.toLowerCase())
    );

    return { stripeInvoices: filteredData, isError: false };
  } catch (error) {
    console.error("Error searching invoices:", error);
    return { stripeInvoices: [], message: "Search failed", error, isError: true };
  }
}
