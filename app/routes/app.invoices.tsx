import { json, redirect } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  Card,
  IndexTable,
  Page,
  Layout
} from "@shopify/polaris";
import { useState, useMemo } from "react";

import db from "../db.server";
import { authenticate } from "../shopify.server";
import { fetchStripeInvoices } from "../models/invoices.server";

// ---------------- LOADER FUNCTION ----------------
export async function loader({ request }) {
  const auth = await authenticate.admin(request);

  // Fetch User Info from DB (to get Stripe Secret Key)
  const userInfo = await db.user.findFirst({
    where: { shop: auth.session.shop },
  });

  if (!userInfo) return redirect("/app");

  // Fetch all invoices from Stripe
  const { invoices } = await fetchStripeInvoices(userInfo);

  return json({ invoices });
}

// ---------------- REACT COMPONENT ----------------
export default function Invoices() {
  const { invoices } = useLoaderData<typeof loader>();

  const [searchedVal, setSearchedVal] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Filter invoices (by ID or Status)
  const filteredInvoices = useMemo(() => {
    if (!searchedVal) return invoices;
    return invoices.filter(
      (inv) =>
        inv.id.toLowerCase().includes(searchedVal.toLowerCase()) ||
        inv.status.toLowerCase().includes(searchedVal.toLowerCase())
    );
  }, [searchedVal, invoices]);

  // Pagination
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedInvoices = filteredInvoices.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  return (
    <Page title="All Stripe Invoices">
      <Layout>
        <Layout.Section>
          {/* Search Bar */}
          <label htmlFor="search">
            <input
              id="search"
              type="text"
              value={searchedVal}
              onChange={(e) => setSearchedVal(e.target.value)}
              placeholder="Search by Invoice ID or Status"
              className="border rounded-xl p-2 w-full mb-4 shadow-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </label>

          <Card>
            <IndexTable
              resourceName={{ singular: "invoice", plural: "invoices" }}
              itemCount={filteredInvoices.length}
              headings={[
                { title: "Invoice ID" },
                { title: "Amount" },
                { title: "Currency" },
                { title: "Status" },
                { title: "Date" },
              ]}
              selectable={false}
            >
              {paginatedInvoices.map((inv) => (
                <IndexTable.Row id={inv.id} key={inv.id} position={inv.id}>
                  <IndexTable.Cell>{inv.id}</IndexTable.Cell>
                  <IndexTable.Cell>{inv.amount}</IndexTable.Cell>
                  <IndexTable.Cell>{inv.currency}</IndexTable.Cell>
                  <IndexTable.Cell>{inv.status}</IndexTable.Cell>
                  <IndexTable.Cell>{inv.created}</IndexTable.Cell>
                </IndexTable.Row>
              ))}
            </IndexTable>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
