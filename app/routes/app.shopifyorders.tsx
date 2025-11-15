import { useState } from "react";
import { authenticate } from "../shopify.server";
import type { LoaderFunctionArgs } from "@remix-run/node";
import db from "../db.server";
import { json, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { getShopifyOrders } from "../models/shopifyorders.server";

import {
  Card,
  IndexTable,
  Page,
  Pagination,
  Layout,
} from "@shopify/polaris";
import "../styles/style.css";
// Loader
export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const auth = await authenticate.admin(request);

    // Fetch user from DB
    const userInfo = await db.user.findFirst({
      where: { shop: auth.session.shop },
    });

    if (!userInfo) return redirect("/app");

    const { shopifyOrdersData } = await getShopifyOrders(request);

    return json({
      shopifyOrdersData,
      userInfo,
    });
  } catch (error) {
    console.error("reached error shopify page ");
    console.error("Loader failed:", error);
    return json({ status: 500 });
  }
};

// Component
export default function ShopifyOrdersPage() {
  const { shopifyOrdersData } = useLoaderData<typeof loader>();

  const [searchedVal, setSearchedVal] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Orders array from GraphQL response
  const orders = shopifyOrdersData?.data?.orders?.edges || [];

 const filteredShopifyOrders = orders.filter(({ node }) => {
  const firstName = node.customer?.firstName?.toLowerCase() || "";
  const lastName = node.customer?.lastName?.toLowerCase() || "";
  const search = searchedVal.toLowerCase();

  return (
    !search || // show all if search is empty
    firstName.includes(search) || // match first name
    lastName.includes(search) ||  // match last name
    node.id.toLowerCase().includes(search) || // match order id
    (node.customer?.email || "").toLowerCase().includes(search) // match email
  );
});


  // Paginate
  const paginatedOrders = filteredShopifyOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(filteredShopifyOrders.length / itemsPerPage);

  const handlePagination = (newPage: number) => {
    setCurrentPage(newPage);
  };

  return (
    <Page title="Shopify Orders" backAction={{ content: "Home", url: "/app" }}>
      <Layout>
        <Layout.Section>
          {orders.length === 0 ? (
            <p>No orders found.</p>
          ) : (
            <>
              {/* Search Bar */}
              <label htmlFor="search">
                <input
                  id="search"
                  type="text"
                  placeholder="Search by Order ID or Email"
                  value={searchedVal}
                  onChange={(e) => {
                    setSearchedVal(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </label>

              <Card>
                <IndexTable
                  resourceName={{ singular: "order", plural: "orders" }}
                  itemCount={filteredShopifyOrders.length}
                  headings={[
                    { title: "Order ID" },
                    { title: "Date" },
                    { title: "Customer" },
                    { title: "Amount" },
                    { title: "Payment Status" },
                    { title: "Fulfillment" },
                    { title: "Items" },
                    { title: "Delivery" },
                  ]}
                  selectable={false}
                >
                  {paginatedOrders.map(({ node }, index) => (
                    <IndexTable.Row
                      id={node.id}
                      key={node.id}
                      position={index}
                    >
                      <IndexTable.Cell>{node.name}</IndexTable.Cell>
                      <IndexTable.Cell>
                        {new Date(node.createdAt).toLocaleString()}
                      </IndexTable.Cell>
                      <IndexTable.Cell>
                        {node.customer
                          ? `${node.customer.firstName || ""} ${
                              node.customer.lastName || ""
                            } (${node.customer.email})`
                          : "Guest"}
                      </IndexTable.Cell>
                      <IndexTable.Cell>
                        {node.currentTotalPriceSet.shopMoney.amount}{" "}
                        {node.currentTotalPriceSet.shopMoney.currencyCode}
                      </IndexTable.Cell>
                      <IndexTable.Cell>{node.displayFinancialStatus}</IndexTable.Cell>
                      <IndexTable.Cell>{node.displayFulfillmentStatus}</IndexTable.Cell>
                      <IndexTable.Cell>
                        {node.lineItems?.edges?.map((item: any, idx: number) => (
                          <div key={idx}>
                            {item.node.title} x {item.node.quantity}
                          </div>
                        ))}
                      </IndexTable.Cell>
                      <IndexTable.Cell>
                        {node.shippingLines?.edges?.length > 0
                          ? node.shippingLines.edges.map(
                              ({ node: s }: any, i: number) => (
                                <div key={i}>
                                  {s.title} ({s.code || "N/A"})
                                </div>
                              )
                            )
                          : "No shipping"}
                      </IndexTable.Cell>
                    </IndexTable.Row>
                  ))}
                </IndexTable>

                {/* Polaris Pagination */}
                <Pagination
                  hasPrevious={currentPage > 1}
                  hasNext={currentPage < totalPages}
                  onPrevious={() => handlePagination(currentPage - 1)}
                  onNext={() => handlePagination(currentPage + 1)}
                />
              </Card>
            </>
          )}
        </Layout.Section>
      </Layout>
    </Page>
  );
}
