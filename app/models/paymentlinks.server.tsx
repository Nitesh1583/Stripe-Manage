import Stripe from "stripe";
import { currency } from "../utils/currency";
import db from "../db.server";

export async function fetchStripePaymentLinksData(userInfo) {
  try {
    const stripe = new Stripe(userInfo.stripeSecretKey);
    const paymentLinks = await stripe.paymentLinks.list();
    const paymentLinksWithProducts = [];
    const existingShop = await db.SubscriptionUser.findFirst({ where: { shop_url: userInfo.shop, sub_cancel_date: null }}); 

    await Promise.all(
      paymentLinks.data.map(async (link,index) => {
        const lineItems = await stripe.paymentLinks.listLineItems(link.id );
        const currencyData = currency.filter((item) => {
          return item.code.toLocaleLowerCase() === link.currency.toLocaleLowerCase();
        })
        paymentLinksWithProducts.push({
          ...link,
          index:index,
          lineItems: lineItems.data,
          symbol: currencyData[0].symbol,
          code: currencyData[0].code,
          symbolNative: currencyData[0].symbolNative,
        })

      })
    )

    return {
      paymentLinks: paymentLinksWithProducts,
      message: "Payment links fetched successfully",
      isError: false,
      UserInfo:userInfo,
      premiumUser: userInfo.premiumUser,
      data: paymentLinks,
      subdata: existingShop
    };
  } catch (error) {
    return { message: error.message, isError: true };
  }
}




export async function createStripePaymentLink(userInfo, formdata) {
  try {
    const { quantity, priceid, address, phonenumber, limit_payment, limit_payment_number } = formdata;
    console.log(priceid);
    if (!quantity || !priceid) {
      return { message: `Please fill all details`, isError: true };
    }
    const stripe = new Stripe(userInfo.stripeSecretKey);
    if (!stripe) {
      return { message: `Invalid stripe key`, isError: true };
    }
    const paymentLinks = await stripe.paymentLinks.create({
      line_items: [{
        price: priceid,
        quantity: parseInt(quantity)
      }]
    })
    return { paymentLinks: paymentLinks, message: "Payment link created successfully", isError: false, premiumUser: userInfo.premiumUser }
  } catch (error) {
    return { message: error.message, isError: true }
  }
}

// Deactivate payment link using id

export async function deactivateStripePaymenytLink(userInfo, id) {
  try {
    const stripe = new Stripe(userInfo.stripeSecretKey);
    const {active} = await stripe.paymentLinks.retrieve(id);
     await stripe.paymentLinks.update(
      id, {
      active: !active,
    }
    )
    return { message: `Payment link ${active?"deactivated":"activated"} successfully`, isError: false}
  } catch (error) {
    return { message: "Internal server error", isError: true, error: error.message }
  }
}

