
import { json } from "@remix-run/node";
import { saveShopifyChargeId } from "../models/user.server";

export async function action({ request }) {
  const formData = await request.formData();
  const shop = formData.get("shop");
  const chargeId = formData.get("chargeId");

  if (!shop || !chargeId) {
    return json({ message: "Missing shop or chargeId", isError: true }, { status: 400 });
  }

  const result = await saveShopifyChargeId(shop.toString(), chargeId.toString());
  return json(result);
}