
import { json } from "@remix-run/node";
import { saveShopifyChargeId } from "../models/user.server";

export async function action({ request }) {
  const body = await request.json();
  const { shop, chargeId } = body;

  if (!shop || !chargeId) {
    return json({ message: "Missing shop or chargeId", isError: true }, { status: 400 });
  }

  const result = await saveShopifyChargeId(shop, chargeId);
  return json(result);
}
