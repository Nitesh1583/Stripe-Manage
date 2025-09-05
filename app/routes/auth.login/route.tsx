import { json, redirect } from "@remix-run/node";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  try {
    const { admin } = await authenticate.admin(request);
    return json({ ok: true }); // session is good
  } catch (error) {
    console.error("No valid Shopify session, redirecting to OAuth...");
    const url = new URL(request.url);
    const shop = url.searchParams.get("shop");

    // If shop param is missing, send to manual login page
    if (!shop) {
      return redirect("/auth/login");
    }

    // Otherwise, redirect to Shopify OAuth install endpoint
    return redirect(`/auth?shop=${shop}`);
  }
};
