import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const { shop, topic, session, webhookId, payload } = await authenticate.webhook(request);

    console.log(`Webhook received: ${topic} for shop: ${shop}`);

    if (topic === "APP_UNINSTALLED") {
      // 🔹 Delete sessions if they exist
      if (session) {
        const deleted = await db.session.deleteMany({ where: { shop } });
        console.log(`Deleted ${deleted.count} sessions for ${shop}`);
      }

      // 🔹 Update subscription status
      await db.user.updateMany({
        where: { shop },
        data: { subscription_status: "cancelled" },
      });

      console.log(`App uninstalled for ${shop} → subscription_status set to cancelled`);
    }

    return new Response("Webhook processed", { status: 200 });
  } catch (error) {
    console.error("Error handling APP_UNINSTALLED webhook:", error);
    return new Response("Error", { status: 500 });
  }
};
