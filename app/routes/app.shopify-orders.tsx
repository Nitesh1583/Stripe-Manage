import { json, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import db from "../db.server";
import { authenticate } from "../shopify.server";

export async function loader({ request }) {
  // authentication
  const auth = await authenticate.admin(request);

  const userInfo = await db.user.findFirst({
    where: { shop: auth.session.shop },
  });

  if (!userInfo) return redirect("/app");

  return json({ userInfo }); // ✅ wrap in object
}

export default function ShopifyOrdersPage() {
  const { userInfo } = useLoaderData<typeof loader>();

  console.log("DEBUG User Info:", userInfo);

  return (
    <div style={{ padding: "1rem" }}>
      <h1>Shopify Orders Page</h1>
      <p>Shop: {userInfo?.shop}</p>
    </div>
  );
}
