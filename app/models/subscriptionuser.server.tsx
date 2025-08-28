import db from "../db.server";

export async function get_subscription_user(shop_url){
  try{
    const existingShop = await db.user.findFirst({ where: { shop_url: shop_url, sub_cancel_date: null } );
    return existingShop;
  } catch (error) {
    return { message: "Unable to fetch details", error };
  }
}


export async function saveShopifyChargeId(shop_url: string, chargeId: string) {
  try {
    const updatedUser = await db.user.update({
      where: { shop: shop_url },
      data: { chargeId: chargeId },
    });

    return { message: "Charge ID saved successfully", user: updatedUser, isError: false };
  } catch (error) {
    return { message: `Unable to save charge ID: ${error.message}`, isError: true };
  }
}

