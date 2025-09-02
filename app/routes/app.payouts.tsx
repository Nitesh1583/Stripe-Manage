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
import { fetchStripePayouts } from "../models/payouts.server";

import "../styles/style.css";

export async function loader({ request }) {
  const auth = await authenticate.admin(request);

  const userInfo = await db.user.findFirst({
    where: { shop: auth.session.shop },
  });

  if (!userInfo) return redirect("/app");

  const { payouts } = await fetchStripePayouts(userInfo);

  return json({ payouts });
}

export default function Invoices() {
  const { payouts } = useLoaderData<typeof loader>();

  const [searchedVal, setSearchedVal] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  console.log(payouts);

  return (
    <Page title="All Stripe Invoices">
      <Layout>
        <Layout.Section>
          {/* Search Bar - styled like customer.tsx */}
          <label htmlFor="search">
            <input
              id="search"
              type="text"
              placeholder="Search by Customer Name or Status"
              value={}
              onChange={}
            />
          </label>

          <Card>
            <IndexTable
              resourceName={{ singular: "invoice", plural: "invoices" }}
              itemCount={}
              headings={[
                { title: "Invoice ID" },
                { title: "Customer Name" },
                { title: "Amount" },
                { title: "Currency" },
                { title: "Status" },
                { title: "Date" },
              ]}
              selectable={false}
            >
                <IndexTable.Row id={} key={} position={}>
                  <IndexTable.Cell>{}</IndexTable.Cell>
                  <IndexTable.Cell>{}</IndexTable.Cell>
                  <IndexTable.Cell>{}</IndexTable.Cell>
                  <IndexTable.Cell>{}</IndexTable.Cell>
                  <IndexTable.Cell>{}</IndexTable.Cell>
                  <IndexTable.Cell>{}</IndexTable.Cell>
                </IndexTable.Row>
            </IndexTable>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}