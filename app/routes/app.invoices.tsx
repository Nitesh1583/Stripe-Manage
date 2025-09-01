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

  return json({ invoices });

}

export default function Invoices() {
	const { invoices } = useLoaderData();

	return(
		<Page title="Invoices">
			<Layout>
				<Layout.Section> 
					<label htmlFor="search">
            			<input id="search" type="text" value="" placeholder="Search by Invoice ID " />
          			</label>

          			<Card>
          				
          			</Card>
				</Layout.Section>
			</Layout>
		</Page>

	);
}