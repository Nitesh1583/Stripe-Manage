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
    <Page title="All Stripe Payouts">
      <Layout>
      </Layout>
    </Page>
  );
}