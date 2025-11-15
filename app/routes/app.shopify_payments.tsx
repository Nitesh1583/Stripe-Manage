import { useState } from "react";
import { authenticate } from "../shopify.server";
import type { LoaderFunctionArgs } from "@remix-run/node";
import db from "../db.server";
import { json, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { getShopifyOrders } from "../models/shopifyorders.server";
import { getStripePaymentByShopifyOrder, getStripePaymentsWithShopifySession } from "../models/shopify_stripe_payments.server";

import {
  Card,
  IndexTable,
  Page,
  Layout,
  Pagination,
  Text
} from "@shopify/polaris";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const auth = await authenticate.admin(request);
  const session = auth.session;

  // FIX: correct REST client
  const graphql = auth.admin.graphql;
  const rest = auth.rest;   //  correct REST client

  console.log("AUTH:", Object.keys(auth));
  console.log("ADMIN:", Object.keys(auth.admin));

  // 1. Fetch User From DB
  const userInfo = await db.user.findFirst({
    where: { shop: session.shop },
  });
  if (!userInfo) return redirect("/app");

  // -----------------------------------------
  // 2. Fetch Shopify Orders using GraphQL
  // -----------------------------------------
  const ORDER_QUERY = `
    query GetOrders {
      orders(first: 20) {
        edges {
          node {
            id
            name
            paymentGatewayNames
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

  // -----------------------------------------
  // 3. Loop Orders → Fetch REST Transactions
  // -----------------------------------------
  for (const { node } of orders) {
    const orderGID = node.id;
    const orderId = orderGID.replace("gid://shopify/Order/", "");
    console.log("orderId: ", orderId);

    // REST API call
    const tx = await rest.get({
      path: `/orders/${orderId}/transactions.json`,
    });

    console.log("tx: ", tx);

    const transactionList = tx?.body?.transactions || [];
     console.log("transactionList: ", transactionList);
    const firstTx = transactionList[0] || null;
     console.log("firstTx: ", firstTx);

    // Receipt details
    const receipt = firstTx?.receipt || null;
     console.log("receipt: ", receipt);
    const receiptPaymentId = receipt?.payment_id || null;
     console.log("receiptPaymentId: ", receiptPaymentId);
    const networkTxId = receipt?.network_transaction_id || null;

    // Payment session id
    const paymentSessionId =
      node.paymentGatewayNames?.[0]?.replace("gid://shopify/PaymentSession/", "") || null;

      console.log("paymentSessionId: ", paymentSessionId);

    transactionsByOrder[orderId] = {
      orderId,
      transactions: transactionList,
      receiptPaymentId,
      networkTxId,
      paymentSessionId,
    };

    // Stripe payments related to this order
    const stripePayments = await getStripePaymentByShopifyOrder(
      orderId,
      userInfo
    );

    paymentsByOrder[orderId] = stripePayments;
  }

  // ----------------------------------------
  // 4. Return Final Response
  // ----------------------------------------
  return json({
    orders,
    paymentsByOrder,
    transactionsByOrder,
  });
};



export default function ShopifyPaymentsPage() {
  const { orders, paymentsByOrder, transactionsByOrder, stripePayments } = useLoaderData<typeof loader>();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);

 console.log("Shopify Transactions:", transactionsByOrder);
  console.log("Stripe Payment Sessions:", stripePayments);

  // Pagination
  const paginatedOrders = orders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(orders.length / itemsPerPage);

  const handlePagination = (newPage: number) => setCurrentPage(newPage);

  return (
    <Page title="Shopify Payments" backAction={{ content: "Home", url: "/app" }}>
      <Layout>
        <Layout.Section>
          {orders.length === 0 ? (
            <Text>No Shopify orders found.</Text>
          ) : (
            <Card>
              <IndexTable
                resourceName={{ singular: "order", plural: "orders" }}
                itemCount={orders.length}
                headings={[
                  { title: "Order ID" },
                  { title: "Amount" },
                  { title: "Customer" },
                  { title: "Stripe Payments" },
                ]}
                selectable={false}
              >
                {paginatedOrders.map(({ node }, index) => {
                  const orderId = node.id.replace("gid://shopify/Order/", "");
                  const payments = paymentsByOrder[orderId] || [];

                  return (
                    <IndexTable.Row
                      id={node.id}
                      key={node.id}
                      position={index}
                    >
                      <IndexTable.Cell>{node.name}</IndexTable.Cell>
                      <IndexTable.Cell>
                        {node.currentTotalPriceSet?.shopMoney?.amount}{" "}
                        {node.currentTotalPriceSet?.shopMoney?.currencyCode}
                      </IndexTable.Cell>
                      <IndexTable.Cell>
                        {node.customer
                          ? `${node.customer.firstName || ""} ${node.customer.lastName || ""} (${node.customer.email})`
                          : "Guest"}
                      </IndexTable.Cell>
                      <IndexTable.Cell>
                        {payments.length === 0 ? (
                          <Text>No Stripe payment</Text>
                        ) : (
                          payments.map((pi, idx) => (
                            <div key={idx} style={{ marginBottom: "4px" }}>
                              <Text>
                                {pi.description || "No description"} -{" "}
                                {pi.amount / 100} {pi.currency.toUpperCase()} -{" "}
                                {pi.status.toUpperCase()}
                              </Text>
                              <Text small>
                                Metadata: order_name={pi.metadata.order_name}, customer_email={pi.metadata.customer_email}
                              </Text>
                            </div>
                          ))
                        )}
                      </IndexTable.Cell>
                    </IndexTable.Row>
                  );
                })}
              </IndexTable>

              <Pagination
                hasPrevious={currentPage > 1}
                hasNext={currentPage < totalPages}
                onPrevious={() => handlePagination(currentPage - 1)}
                onNext={() => handlePagination(currentPage + 1)}
              />
            </Card>
          )}
        </Layout.Section>
      </Layout>
    </Page>
  );
}