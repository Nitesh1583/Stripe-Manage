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
import { fetchStripeInvoices } from "../models/invoices.server";

import "../styles/style.css";

export async function loader({ request }) {
  const auth = await authenticate.admin(request);

  const userInfo = await db.user.findFirst({
    where: { shop: auth.session.shop },
  });

  if (!userInfo) return redirect("/app");

  const { invoices } = await fetchStripeInvoices(userInfo);

  return json({ invoices });
}

export default function Invoices() {
  const { invoices } = useLoaderData<typeof loader>();

  const [searchedVal, setSearchedVal] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  console.log(invoices);

  // Filter invoices
  const filteredInvoices = useMemo(() => {
    if (!searchedVal) return invoices;
    return invoices.filter(
      (inv) =>
        inv.customerName.toLowerCase().includes(searchedVal.toLowerCase()) ||
        inv.status.toLowerCase().includes(searchedVal.toLowerCase())
    );
  }, [searchedVal, invoices]);

  // Pagination logic
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
  const paginatedInvoices = filteredInvoices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePagination = (newPage: number) => {
    setCurrentPage(newPage);
  };

  return (
    <Page title="Invoices">
      <Layout>
        <Layout.Section>
          {/* Search Bar - styled like customer.tsx */}
          <label htmlFor="search">
            <input
              id="search"
              type="text"
              placeholder="Search by Customer Name or Status"
              value={searchedVal}
              onChange={(e) => {
                setSearchedVal(e.target.value);
                setCurrentPage(1);
              }}
            />
          </label>

          <Card>
            <IndexTable
              resourceName={{ singular: "invoice", plural: "invoices" }}
              itemCount={filteredInvoices.length}
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
              {paginatedInvoices.map((inv) => (
                <IndexTable.Row id={inv.id} key={inv.id} position={inv.id}>
                  <IndexTable.Cell>{inv.id}</IndexTable.Cell>
                  <IndexTable.Cell>{inv.customerName}</IndexTable.Cell>
                  <IndexTable.Cell>{inv.amount}</IndexTable.Cell>
                  <IndexTable.Cell>{inv.currency}</IndexTable.Cell>
                  <IndexTable.Cell>{inv.status}</IndexTable.Cell>
                  <IndexTable.Cell>{inv.created}</IndexTable.Cell>
                </IndexTable.Row>
              ))}
            </IndexTable>

            {/* Shopify Polaris Pagination (same as customer.tsx) */}
            <Pagination
              hasPrevious={currentPage > 1}
              hasNext={currentPage < totalPages}
              onPrevious={() => handlePagination(currentPage - 1)}
              onNext={() => handlePagination(currentPage + 1)}
            />
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
