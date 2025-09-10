import { json, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  Card,
  IndexTable,
  Page,
  Layout,
  Pagination,
} from "@shopify/polaris";
import { useState, useMemo } from "react";

import db from "../db.server";
import { authenticate } from "../shopify.server";
import { getStripeSubscriptions } from "../models/subscriptionuser.server";

import "../styles/style.css";

// Loader to fetch subscription data
export async function loader({ request }) {
  const auth = await authenticate.admin(request);

  const userInfo = await db.user.findFirst({
    where: { shop: auth.session.shop },
  });

  if (!userInfo) return redirect("/app");

  const subscriptionData = await getStripeSubscriptions(userInfo);

  return json({ subscriptionData });
}

export default function Subscription() {
  const { subscriptionData } = useLoaderData<typeof loader>();

  const [searchValue, setSearchValue] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);

  // Filter data by search input
  const filteredData = useMemo(() => {
    const search = searchValue.toLowerCase();
    return subscriptionData.filter((item) => {
      return (
        // item.customerId.toLowerCase().includes(search) ||
        item.subscriptionId.toLowerCase().includes(search) ||
        item.status.toLowerCase().includes(search)
      );
    });
  }, [searchValue, subscriptionData]);

  // Pagination logic
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePagination = (newPage: number) => {
    setCurrentPage(newPage);
  };

  return (
    <Page title="Subscriptions" backAction={{ content: "Home", url: "/app" }}>
      <Layout>
        <Layout.Section>
          {/* Search bar styled same as customers page */}
          <label htmlFor="search">
            <input
              id="search"
              type="text"
              placeholder="Search subscription or customer"
              value={searchValue}
              onChange={(e) => {
                setSearchValue(e.target.value);
                setCurrentPage(1); // reset to first page when searching
              }}
            />
          </label>

          {/* Subscription Table */}
          <Card>
            <IndexTable
              resourceName={{
                singular: "subscription",
                plural: "subscriptions",
              }}
              itemCount={filteredData.length}
              headings={[
                { title: "Subscription ID" },
                { title: "Customer ID" },
                { title: "Amount" },
                { title: "Status" },
                { title: "Interval" },
                { title: "Created" },
              ]}
              selectable={false}
            >
              {paginatedData.map((sub, index) => (
                <IndexTable.Row
                  id={sub.subscriptionId}
                  key={sub.subscriptionId}
                  position={index}
                >
                  <IndexTable.Cell>{sub.subscriptionId}</IndexTable.Cell>
                  <IndexTable.Cell>{sub.customerId}</IndexTable.Cell>
                  <IndexTable.Cell>
                    {sub.amount} {sub.currency}
                  </IndexTable.Cell>
                  <IndexTable.Cell>{sub.status}</IndexTable.Cell>
                  <IndexTable.Cell>{sub.recurringInterval}</IndexTable.Cell>
                  <IndexTable.Cell>{sub.created}</IndexTable.Cell>
                </IndexTable.Row>
              ))}
            </IndexTable>

            {/* Pagination */}
            <Pagination
              hasPrevious={currentPage > 1}
              hasNext={currentPage < Math.ceil(filteredData.length / itemsPerPage)}
              onPrevious={() => handlePagination(currentPage - 1)}
              onNext={() => handlePagination(currentPage + 1)}
            />
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
