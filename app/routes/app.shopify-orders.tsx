import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { authenticate } from "../shopify.server";

export async function loader({ request }) {
  const { admin } = await authenticate.admin(request);

  const response = await admin.graphql(`
    {
      orders(first: 10, sortKey: CREATED_AT, reverse: true) {
        edges {
          node {
            id
            name
            createdAt
            displayFulfillmentStatus
            paymentGatewayNames
          }
        }
      }
    }
  `);

  const data = await response.json();
  return json(data);
}

export default function ShopifyOrdersPage() {
  const data = useLoaderData();
  const orders = data?.data?.orders?.edges || [];

  return (
    <div style={{ padding: "20px" }}>
      <h1>Shopify Orders</h1>

      {orders.length === 0 ? (
        <p>No orders found.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {orders.map(({ node }) => (
            <li
              key={node.id}
              style={{
                border: "1px solid #ddd",
                borderRadius: "8px",
                padding: "12px",
                marginBottom: "12px",
                background: "#fafafa",
              }}
            >
              <h3>{node.name}</h3>
              <p>
                <strong>Customer:</strong>{" "}
                {node.customer
                  ? `${node.customer.firstName} ${node.customer.lastName} (${node.customer.email})`
                  : "Guest"}
              </p>
              <p>
                <strong>Total:</strong>{" "}
                {node.currentTotalPriceSet.shopMoney.amount}{" "}
                {node.currentTotalPriceSet.shopMoney.currencyCode}
              </p>
              <p>
                <strong>Fulfillment:</strong> {node.displayFulfillmentStatus}
              </p>
              <p>
                <strong>Payment Gateways:</strong>{" "}
                {node.paymentGatewayNames.join(", ")}
              </p>
              <p>
                <strong>Created At:</strong>{" "}
                {new Date(node.createdAt).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
