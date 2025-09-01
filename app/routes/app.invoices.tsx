import { json, redirect, useLoaderData } from "@remix-run/react";
import { Card,IndexTable,Page,Pagination,CalloutCard,Text,Layout } from "@shopify/polaris";
import {LockIcon,PlusIcon } from "@shopify/polaris-icons";
import {useEffect, useState } from "react";

import db from "../db.server";
import { authenticate } from "../shopify.server";
import { fetchStripeInvoices } from "../models/invoices.server";

//Loader Function
export async function loader({ request }) {
  
  const auth = await authenticate.admin(request);

  // fetch User Info from db (user table)
  const userInfo = await db.user.findFirst({
    where: { shop: auth.session.shop }
  });

  // redirect to app(homepage)
  if (!userInfo) return redirect("/app");

  // fetch Invoices Data
  const { invoices } = await fetchStripeInvoices(userInfo);

  let searchValue = '';
  const handleSearch = async (event) => {
    searchValue = event.target.value;

    if(searchValue != '') {
      invoices = await fetchSearchStripeInvoices(searchValue);
    }
  }

  return json({ invoices });

}

export default function Invoices() {
	const { invoices, stripeInvoices } = useLoaderData();

	console.log(invoices);
	console.log("reached");

	console.log(stripeInvoices);

	return(
		<Page title="Invoices">
			<Layout>
				<Layout.Section> 
					<label htmlFor="search">
            			<input id="search" type="text" value="" placeholder="Search by Invoice ID " />
          			</label>

          			<Card>
          				<IndexTable
          					resourceName={{ singular: `stripeInvoices`, plural: "stripeInvoices" }}
              			itemCount={filteredPayments.length}
              			headings={[
			                { title: "Id" },
			                { title: "Amount" },
			                { title: "Status" },
			                { title: "Customer" },
			                { title: "Date" },
			                { title: "Action" },
			              ]}
              			selectable={false}
            			>
              		{paginatedPayments.map((stripeInvoices) => (
                		<PaymentRow
                  		key={stripeInvoices.id}
                  		payment={stripeInvoices}
                  		setActiveIndex={setActiveIndex}
                  		isActive={activeIndex === stripeInvoices.id}
                		/>
              		))}
          				</IndexTable>
          			</Card>
				</Layout.Section>
			</Layout>
		</Page>

	);
}