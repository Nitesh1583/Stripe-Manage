import db from "../db.server";

export async function fetchStripeSubscriptionData(userInfo) {
	try{
		// const stripe = new Stripe(userInfo.stripeSecretKey);
		const  subUserData  = await db.SubscriptionUser.findFirst({
	      where: { shop_url: userInfo.shop,
	      		subscription_status : 'active'}
	    });

		return { subInfo: subUserData, userinfo: userInfo, shop: userInfo.shop, isError: false };
	}catch{
		return { message: "Something went wrong. Try again later.", isError: true };
	}
}
