import { Stripe } from "stripe";
import { currency } from "../utils/currency";
import db from "../db.server";

// Fetch Stripe Payment data
export async function fetchStripePaymentData(userInfo) {
  try {
    const stripe = new Stripe(userInfo.stripeSecretKey);

    //Fetch All PaymentIntents
    const { data } = await stripe.paymentIntents.list();

    let  paymentData = [];
    let customerDetail = '';
    const existingShop = await db.SubscriptionUser.findFirst({ 
      where: { shop_url: userInfo.shop, sub_cancel_date: null }
    }); 

    for (let i = 0; i < data.length; i++) {
      const element = data[i];

      if(element.customer == undefined) {
        customerDetail = "No customer";
      } else {
        customerDetail = await stripe.customers.retrieve(element.customer);
      }

      const currencyData = currency.find(item => item.code.toLowerCase() === element.currency.toLowerCase());
      if (currencyData || customerDetail) {
        paymentData.push({
          ...element,
          orderID: element.metadata?.order_id || "N/A",
          currencycode: currencyData.code,
          symbolNative: currencyData.symbolNative,
          customerdetail: customerDetail
        });
      }
    }
    return { 
      payments: paymentData, 
      UserInfo:userInfo, 
      premiumUser: userInfo.premiumUser, 
      subdata: existingShop,  isError: false };
  } catch (error) {
    return { message: "Something went wrong. Try again later.", isError: true };
  }
}

// Fetch Stripe Payment by search filter
export async function fetchSearchStripePaymentData(searchedVal, userInfo) {
  try {
    const stripe = new Stripe(userInfo.stripeSecretKey);
    const { data } = await stripe.paymentIntents.list();

    // Filter data based on search value
    const filteredData = data.filter((item) => {
      const orderId = item.metadata?.order_id || "";
      const customerName = item.customer?.name || "";

      return orderId.includes(searchedVal) || customerName.toLowerCase().includes(searchedVal.toLowerCase());
    });

    let paymentData = [];
    for (let element of filteredData) {
      let customerDetail = "No customer";
      if (element.customer) {
        const customer = await stripe.customers.retrieve(element.customer);
        customerDetail = customer.name || "No Name";
      }

      const currencyData = currency.find(
        (item) => item.code.toLowerCase() === element.currency.toLowerCase()
      );

      paymentData.push({
        id: element.id,
        orderID: element.metadata?.order_id || "N/A",
        amount: element.amount,
        currencycode: currencyData?.code || element.currency,
        symbolNative: currencyData?.symbolNative || "$",
        customerName: customerDetail,
        created: element.created,
        status: element.status,
      });
    }

    return { payments: paymentData,  isError: false };
  } catch (error) {
    return { message: "Something went wrong. Try again later.", isError: true };
  }
}


// Fetch Stripe Payments Data by Limit
export async function fetchStripeRecentPaymentData(userInfo) {
  try {
    const stripe = new Stripe(userInfo.stripeSecretKey);

    //Fetch All PaymentIntents
    const { data } = await stripe.paymentIntents.list({ limit: 5 });

    let  paymentData = [];
    let customerDetail = '';
    const existingShop = await db.SubscriptionUser.findFirst({ 
      where: { shop_url: userInfo.shop, sub_cancel_date: null }
    }); 

    for (let i = 0; i < data.length; i++) {
      const element = data[i];

      if(element.customer == undefined) {
        customerDetail = "No customer";
      } else {
        customerDetail = await stripe.customers.retrieve(element.customer);
      }

      const currencyData = currency.find(item => item.code.toLowerCase() === element.currency.toLowerCase());
      if (currencyData || customerDetail) {
        paymentData.push({
          ...element,
          orderID: element.metadata?.order_id || "N/A",
          currencycode: currencyData.code,
          symbolNative: currencyData.symbolNative,
          customerdetail: customerDetail
        });
      }
    }
    return { 
      recentPaymentsData: paymentData, 
      UserInfo:userInfo, 
      premiumUser: userInfo.premiumUser, 
      subdata: existingShop,  isError: false };
  } catch (error) {
    return { message: "Something went wrong. Try again later.", isError: true };
  }
}