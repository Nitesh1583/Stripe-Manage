import {Stripe} from  'stripe';
import db from "../db.server";

export async function fetchDisputesData(userInfo){
try {
  const stripe = new Stripe(userInfo.stripeSecretKey);
    const disputes = await stripe.disputes.list();
    const existingShop = await db.SubscriptionUser.findFirst({ where: { shop_url: userInfo.shop, sub_cancel_date: null }}); 
    return { disputes: disputes.data, UserInfo:userInfo, premiumUser:userInfo.premiumUser, subdata: existingShop ,isError:false };
} catch (error) {
  return { message: "Something went wrong. try again later..", error,isError:true };
}
}
