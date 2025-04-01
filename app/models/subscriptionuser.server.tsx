import db from "../db.server";

export async function get_subscription_user(shop_url){
  try{
    const existingShop = await db.user.findFirst({ where: { shop_url: shop_url, sub_cancel_date: null } );
    return existingShop;
  } catch (error) {
    return { message: "Unable to fetch details", error };
  }
}