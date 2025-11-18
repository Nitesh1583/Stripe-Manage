import { useState } from "react";
import { authenticate } from "../shopify.server";
import type { LoaderFunctionArgs } from "@remix-run/node";
import db from "../db.server";
import { json, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import {
  getStripePaymentByShopifyOrder,
  getStripePaymentsWithShopifySession
} from "../models/shopify_stripe_payments.server";

import {
  Card,
  IndexTable,
  Page,
  Layout,
  Pagination,
  Text
} from "@shopify/polaris";

//  LOADER =======================>

export const loader = async ({ request }: LoaderFunctionArgs) => {

  // 1️ AUTHENTICATION
  const auth = await authenticate.admin(request);
  const session = auth.session;

  const shopDomain = session.shop; // Needed to open orders in Shopify admin
  const graphql = auth.admin.graphql;

  const userInfo = await db.user.findFirst({
    where: { shop: shopDomain },
  });
  if (!userInfo) return redirect("/app");

  // 2️ GET LAST 20 ORDERS
  const ORDER_QUERY = `
    query GetOrders {
      orders(first: 20) {
        edges {
          node {
            id
            name
            paymentGatewayNames
            createdAt
            customer {
              firstName
              lastName
              email
            }
          }
        }
      }
    }
  `;

  const ordersResponse = await graphql(ORDER_QUERY);
  const ordersJson = await ordersResponse.json();
  const orders = ordersJson?.data?.orders?.edges || [];

  const paymentsByOrder: Record<string, any[]> = {};
  const transactionsByOrder: Record<string, any> = {};

  // 3️ PROCESS EACH ORDER
  for (const { node } of orders) {

    const orderGID = node.id;
    const orderId = orderGID.replace("gid://shopify/Order/", "");

    // --- FETCH ORDER TRANSACTIONS ---
    const TX_QUERY = `
      query GetOrderTransactions($id: ID!) {
        order(id: $id) {
          transactions {
            id
            kind
            status
            gateway
            paymentId
            createdAt
          }
        }
      }
    `;

    const txResponse = await graphql(TX_QUERY, { variables: { id: orderGID } });
    const txJson = await txResponse.json();
    const transactionList = txJson?.data?.order?.transactions || [];

    // Save all transactions
    transactionsByOrder[orderId] = transactionList;

    // --- EXTRACT paymentId ---
    const paymentId = transactionList[0]?.paymentId || null;

    // --- BUILD PAYMENT SESSION GID ---
    const paymentSessionGID = paymentId
      ? `gid://shopify/PaymentSession/${paymentId}`
      : null;

    // --- STRIPE SEARCH USING metadata.order_id ---
    const stripeOrderPayments = await getStripePaymentByShopifyOrder(orderId, userInfo);

    // --- STRIPE SEARCH USING metadata.session id ---
    let stripeSessionPayments = [];
    if (paymentSessionGID) {
      stripeSessionPayments = await getStripePaymentsWithShopifySession(
        paymentSessionGID,
        shopDomain,
        userInfo
      );
    }

    // Merge stripe payments
    paymentsByOrder[orderId] = [
      ...stripeOrderPayments,
      ...stripeSessionPayments
    ];
  }

  // REMOVE ORDERS WITH NO STRIPE PAYMENTS
  const filteredOrders = orders.filter(({ node }) => {
    const orderId = node.id.replace("gid://shopify/Order/", "");
    const payments = paymentsByOrder[orderId] || [];
    return payments.length > 0;
  });

  return json({
    orders: filteredOrders,
    paymentsByOrder,
    transactionsByOrder,
    shopDomain, // Needed for View Order button
  });
};


// =======================
//  COMPONENT
// =======================

export default function ShopifyPaymentsPage() {
  const { orders, paymentsByOrder, transactionsByOrder, shopDomain } =
    useLoaderData<typeof loader>();

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const paginatedOrders = orders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(orders.length / itemsPerPage);

  // REFUND HANDLER (UI only)
  const handleRefund = async (paymentIntentId: string) => {
    if (!confirm("Are you sure you want to refund this payment?")) return;

    const res = await fetch("/app/refund-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentIntentId }),
    });

    const data = await res.json();
    alert(data.message);
  };

  return (
    <Page title="Shopify Payments" backAction={{ content: "Home", url: "/app" }}>
      <Layout>
        <Layout.Section>
          <Card>
            <IndexTable
              resourceName={{ singular: "order", plural: "orders" }}
              itemCount={orders.length}
              headings={[
                { title: "Order" },
                { title: "Customer" },
                { title: "Email" },
                { title: "Stripe Payment" },
                { title: "Amount" },
                { title: "Date" },
                { title: "Actions" },
              ]}
              selectable={false}
            >
              {paginatedOrders.map(({ node }, index) => {
                const orderId = node.id.replace("gid://shopify/Order/", "");
                const payments = paymentsByOrder[orderId] || [];

                // Customer info
                const customerName = `${node.customer?.firstName || ""} ${
                  node.customer?.lastName || ""
                }`;
                const customerEmail = node.customer?.email || "N/A";

                return (
                  <IndexTable.Row id={node.id} key={node.id} position={index}>
                    
                    {/* Order ID */}
                    <IndexTable.Cell>{node.name}</IndexTable.Cell>

                    {/* Customer Name */}
                    <IndexTable.Cell>{customerName}</IndexTable.Cell>

                    {/* Customer Email */}
                    <IndexTable.Cell>{customerEmail}</IndexTable.Cell>

                    {/* Stripe PaymentIntent ID */}
                    <IndexTable.Cell>
                      {payments.map((pi, idx) => (
                        <div key={idx}>{pi.id}</div>
                      ))}
                    </IndexTable.Cell>

                    {/* Amount */}
                    <IndexTable.Cell>
                      {payments.map((pi, idx) => (
                        <div key={idx}>
                          {(pi.amount / 100).toFixed(2)}{" "}
                          {pi.currency.toUpperCase()}
                        </div>
                      ))}
                    </IndexTable.Cell>

                    {/* Date */}
                    <IndexTable.Cell>
                      {new Date(node.createdAt).toLocaleString()}
                    </IndexTable.Cell>

                    {/* Actions */}
                    <IndexTable.Cell>
                      <div style={{ display: "flex", gap: "10px" }}>
                        {/* View Shopify Order */}
                        <a
                          href={`https://${shopDomain}/admin/orders/${orderId}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            padding: "6px 12px",
                            borderRadius: "6px",
                            background: "#006fbb",
                            color: "white",
                            textDecoration: "none",
                            fontSize: "13px",
                          }}
                        >
                          View
                        </a>

                        {/* Refund Button */}
                        {/*{payments.length > 0 && (
                          <button
                            style={{
                              padding: "6px 12px",
                              borderRadius: "6px",
                              background: "#e53935",
                              color: "white",
                              border: "none",
                              cursor: "pointer",
                              fontSize: "13px",
                            }}
                            onClick={() => handleRefund(payments[0].id)}
                          >
                            Refund
                          </button>
                        )}*/}
                      </div>
                    </IndexTable.Cell>
                  </IndexTable.Row>
                );
              })}
            </IndexTable>

            <Pagination
              hasPrevious={currentPage > 1}
              hasNext={currentPage < totalPages}
              onPrevious={() => setCurrentPage(currentPage - 1)}
              onNext={() => setCurrentPage(currentPage + 1)}
            />
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

