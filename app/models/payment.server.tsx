import { Stripe } from "stripe";
import { currency } from "../utils/currency";

export async function fetchStripePaymentData(userInfo) {
  try {

    const stripe = new Stripe(userInfo.stripeSecretKey);
    const { data } = await stripe.paymentIntents.list();
    let  paymentData = [];
    let customerDetail = '';

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
          currencycode: currencyData.code,
          symbolNative: currencyData.symbolNative,
          customerdetail: customerDetail
        });
      }
    }
    return { payments: paymentData, UserInfo:userInfo, premiumUser: userInfo.premiumUser, isError: false };
  } catch (error) {
    return { message: "Something went wrong. Try again later.", isError: true };
  }
}

export async function fetchSearchStripePaymentData(searchVal) {
  try{
    const stripe = new Stripe(userInfo.stripeSecretKey);
    const { data } = await stripe.paymentIntents.list();

  }catch (error) {
    return { message: "Something went wrong. Try again later.", isError: true };
  }
}