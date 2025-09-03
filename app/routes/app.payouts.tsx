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

  // const { payouts } = await fetchStripePayouts(userInfo);

  const { payouts } = await fetchStripeBalanceTransactions(userInfo);

  return json({ payouts });
}

export default function Invoices() {
  const { payouts } = useLoaderData<typeof loader>();

  // const [searchedVal, setSearchedVal] = useState("");
  // const [currentPage, setCurrentPage] = useState(1);
  // const itemsPerPage = 8;

  console.log(payouts);

  // const filteredPayouts = useMemo(() => {
  //   if (!searchedVal) return payouts;
  //   return payouts.filter(
  //     (payouts) =>
  //       payouts.id.toLowerCase().includes(searchedVal.toLowerCase()) ||
  //       payouts.status.toLowerCase().includes(searchedVal.toLowerCase())
  //   );
  // }, [searchedVal, payouts]);

  // // Pagination logic
  // const totalPages = Math.ceil(filteredPayouts.length / itemsPerPage);
  // const paginatedPayouts = filteredPayouts.slice(
  //   (currentPage - 1) * itemsPerPage,
  //   currentPage * itemsPerPage
  // );

  // const handlePagination = (newPage: number) => {
  //   setCurrentPage(newPage);
  // };

  // return (
  //   <Page title="All Stripe Payouts">
  //     <Layout>
  //       <Layout.Section>
  //         {/* Search Bar */}
  //         <label htmlFor="search">
  //           <input
  //             id="search"
  //             type="text"
  //             placeholder="Search by Payout ID or Status"
  //             value={searchedVal}
  //             onChange={(e) => {
  //               setSearchedVal(e.target.value);
  //               setCurrentPage(1);
  //             }}
  //           />
  //         </label>

  //         <Card>
  //           <IndexTable
  //             resourceName={{ singular: "payout", plural: "payouts" }}
  //             itemCount={filteredPayouts.length}
  //             headings={[
  //               { title: "Payout ID" },
  //               { title: "Amount" },
  //               { title: "Currency" },
  //               { title: "Status" },
  //               { title: "Date" },
  //             ]}
  //             selectable={false}
  //           >
  //             {paginatedPayouts.map((payouts) => (
  //               <IndexTable.Row id={payouts.id} key={payouts.id} position={payouts.id}>
  //                 <IndexTable.Cell>{payouts.id}</IndexTable.Cell>
  //                 <IndexTable.Cell>{payouts.amount}</IndexTable.Cell>
  //                 <IndexTable.Cell>{payouts.currency}</IndexTable.Cell>
  //                 <IndexTable.Cell>{payouts.status}</IndexTable.Cell>
  //                 <IndexTable.Cell>{payouts.created}</IndexTable.Cell>
  //               </IndexTable.Row>
  //             ))}
  //           </IndexTable>

  //           {/* Shopify Polaris Pagination */}
  //           <Pagination
  //             hasPrevious={currentPage > 1}
  //             hasNext={currentPage < totalPages}
  //             onPrevious={() => handlePagination(currentPage - 1)}
  //             onNext={() => handlePagination(currentPage + 1)}
  //           />
  //         </Card>

  //       </Layout.Section>
  //     </Layout>
  //   </Page>
  // );
}