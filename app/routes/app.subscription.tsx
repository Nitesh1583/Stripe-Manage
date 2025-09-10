import { json, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  Card,
  IndexTable,
  Page,
  Layout,
  Text,
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

  const subscriptionData = await getStripeSubscriptions(userInfo); // get all subscriptions

  return json({ subscriptionData });
}

export default function Subscription() {
  const { subscriptionData } = useLoaderData<typeof loader>();

  // Local search state
  const [searchValue, setSearchValue] = useState("");

  // Filtered data based on search
  const filteredData = useMemo(() => {
    return subscriptionData.filter((item) => {
      const search = searchValue.toLowerCase();
      return (
        item.customerId.toLowerCase().includes(search) ||
        item.subscriptionId.toLowerCase().includes(search)
      );
    });
  }, [searchValue, subscriptionData]);

  return (
    <Page title="Subscriptions">
      <Layout>
        <Layout.Section>
          {/* Search Box */}
          <input
            type="text"
            placeholder="Search subscription or customer"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            style={{
              width: "100%",
              marginBottom: "1rem",
              padding: "8px",
              borderRadius: "6px",
              border: "1px solid #ccc",
            }}
          />
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
              {filteredData.map((sub, index) => (
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
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
