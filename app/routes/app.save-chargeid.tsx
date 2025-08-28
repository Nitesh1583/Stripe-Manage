import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server"; // adjust path
import { saveShopifyChargeId } from "../models/user.server";

export async function action({ request }) {
  try {
    const { admin, session } = await authenticate.admin(request);
    const body = await request.json();
    const { chargeId } = body;

    if (!chargeId) {
      return json({ message: "Missing chargeId", isError: true }, { status: 400 });
    }

    const shop = session.shop; // get shop from session
    const result = await saveShopifyChargeId(shop, chargeId);

    return json(result);
  } catch (error) {
    return json(
      { message: `Error saving chargeId: ${error.message}`, isError: true },
      { status: 500 }
    );
  }
}
