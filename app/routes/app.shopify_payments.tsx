import { useState } from "react";
import { authenticate } from "../shopify.server";
import type { LoaderFunctionArgs } from "@remix-run/node";
import db from "../db.server";
import { json, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { getShopifyOrders } from "../models/shopifyorders.server";
import { getStripePaymentByShopifyOrder } from "../models/shopify_stripe_payments.server";

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

  // Fetch user from DB
  const userInfo = await db.user.findFirst({
    where: { shop: auth.session.shop },
  });
  if (!userInfo) return redirect("/app");

  // Fetch Shopify orders
  const { shopifyOrdersData } = await getShopifyOrders(request);
  const orders = shopifyOrdersData?.data?.orders?.edges || [];

  // Fetch Stripe payments for each order
  const paymentsByOrder: Record<string, any[]> = {};

  for (const { node } of orders) {
    // Strip prefix to match Stripe metadata
    const orderId = node.id.replace("gid://shopify/Order/", "");
    const payments = await getStripePaymentByShopifyOrder(orderId, userInfo);
    paymentsByOrder[orderId] = payments;
  }

  return json({ orders, paymentsByOrder });
};

export default function ShopifyPaymentsPage() {
  const { orders, paymentsByOrder } = useLoaderData<typeof loader>();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);

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