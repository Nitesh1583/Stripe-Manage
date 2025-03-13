import {Stripe} from  'stripe';
export async function fetchDisputesData(userInfo){
try {
  const stripe = new Stripe(userInfo.stripeSecretKey);
    const disputes = await stripe.disputes.list();
    return { disputes: disputes.data, UserInfo:userInfo, premiumUser:userInfo.premiumUser,isError:false };
} catch (error) {
  return { message: "Something went wrong. try again later..", error,isError:true };
}
}
