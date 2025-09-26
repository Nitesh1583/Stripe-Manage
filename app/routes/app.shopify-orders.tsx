import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { authenticate } from "../shopify.server";

// 🔹 Loader to fetch orders from Shopify Admin GraphQL
export async function loader({ request }) {
  const { admin } = await authenticate.admin(request);

  const response = await admin.graphql(`
    {
      orders(first: 10, sortKey: CREATED_AT, reverse: true) {
        edges {
          node {
            id
            name
            email
            createdAt
            totalPriceSet {
              shopMoney {
                amount
                currencyCode
              }
            }
            financialStatus
            displayFulfillmentStatus   # ✅ fixed field
            customer {
              firstName
              lastName
              email
            }
          }
        }
      }
    }
  `);

  const data = await response.json();
  return json(data);
}

// 🔹 React Component to render orders
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
                <strong>Total:</strong> {node.totalPriceSet.shopMoney.amount}{" "}
                {node.totalPriceSet.shopMoney.currencyCode}
              </p>
              <p>
                <strong>Status:</strong> {node.displayFulfillmentStatus} |{" "}
                {node.financialStatus}
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
