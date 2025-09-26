// app/routes/app.shopify-orders.tsx

import { json, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import db from "../db.server";

export async function loader({ request }) {
  // Step 1: Authenticate
  const auth = await authenticate.admin(request);

  // Step 2: Ensure user exists in DB
  const userInfo = await db.user.findFirst({
    where: { shop: auth.session.shop },
  });
  if (!userInfo) return redirect("/app");

  // Step 3: Call Shopify GraphQL API for orders
  const response = await auth.admin.graphql(`
    {
      orders(first: 10, sortKey: CREATED_AT, reverse: true) {
        edges {
          node {
            id
            name
            createdAt
            totalPriceSet {
              shopMoney {
                amount
                currencyCode
              }
            }
            customer {
              displayName
              email
            }
            fulfillmentStatus
          }
        }
      }
    }
  `);

  const data = await response.json();

  const orders = data?.data?.orders?.edges?.map((edge: any) => edge.node) ?? [];

  return json({ userInfo, orders });
}


export default function ShopifyOrdersPage() {
  const { userInfo, orders } = useLoaderData<typeof loader>();

  return (
    <div style={{ padding: "1rem" }}>
      <h1 className="text-xl font-bold mb-4">Shopify Orders</h1>
      <p className="mb-4">Shop: {userInfo?.shop}</p>

      {orders.length === 0 ? (
        <p>No orders found.</p>
      ) : (
        <ul className="space-y-2">
          {orders.map((order) => (
            <li key={order.id} className="p-3 border rounded">
              <strong>{order.name}</strong> — {order.totalPriceSet.shopMoney.amount}{" "}
              {order.totalPriceSet.shopMoney.currencyCode}  
              <br />
              Customer: {order.customer?.displayName || "Guest"} (
              {order.customer?.email || "No email"})
              <br />
              Status: {order.fulfillmentStatus || "Unfulfilled"}
              <br />
              Created: {new Date(order.createdAt).toLocaleString()}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
