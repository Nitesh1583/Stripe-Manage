import { Stripe } from "stripe";
import { currency } from "../utils/currency";
import db from "../db.server";

export async function fetchStripeInvoices(userInfo) {
	try {

		const stripe = new Stripe(userInfo.stripeSecretKey);

		// 1. Find shop’s subscription user (already in your DB)
		const existingShop = await db.SubscriptionUser.findFirst({
      		where: { 
      			shop_url: userInfo.shop, 
      			sub_cancel_date: null 
      		},
    	});

    	if (!existingShop || !existingShop.stripe_customer_id)
    	{
      		return { 
      			invoices: [], 
      			message: "No active Stripe customer found!", 
      			isError: false 
      		};
    	}

    	// fetch invoice for this customer
    	const invoices = await stripe.invoices.list({
    		customer : existingShop.stripe_customer_id,
    		limit : 10
    	});

    	// data format 
    	const invioceData = invoices.data.map(
    		inv => ({
    			id : inv.id,
    			amount: (inv.amount_due / 100).toFixed(2),
    			currency: inv.currency.toUpperCase(),
      			status: inv.status,
    			created: new Date(inv.created * 1000).toLocaleDateString(),
    		})
    	);

    	return { invoices: invoiceData, isError: false };

	}catch(error){
		//Error Message
		console.error("Error fetching invoices:", error);
    	return { 
    		message: "Unable to fetch invoices", 
    		error, isError: true 
    	};
	}
}

export async function fetchSearchStripeInvoices(searchValue, userInfo) {
  try {
    const stripe = new Stripe(userInfo.stripeSecretKey);
    const { data } = await stripe.invoices.list();

    // const filteredData = data.filter((item) => {
    // 	const customerName = item.data?.name || "";
    //   	const customerEmail = item.data?.email || "";

    //   return customerName.includes(searchedVal) || customerEmail.toLowerCase().includes(searchedVal.toLowerCase());
    // });

    return { stripeInvoices: data,  isError: false };
  }catch(error) {
    return { message: "Something went wrong. Try again later.", error,isError: true };
  }
}