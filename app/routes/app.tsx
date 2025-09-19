import React from "react";
import { redirect , json } from "@remix-run/node";
import { Link, Outlet, useLoaderData, useRouteError } from "@remix-run/react";

import { NavMenu } from "@shopify/app-bridge-react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import enlan from "@shopify/polaris/locales/en.json";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import db from "../db.server";

import { authenticate } from "../shopify.server";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

export const loader = async ({ request }) => {
  const auth = await authenticate.admin(request);
  const userInfo = await db.user.findFirst({
    where: { shop: auth.session.shop },
  });

   // If no userInfo or no stripeSecretKey, force redirect to settings page
  if (!userInfo || !userInfo.stripeSecretKey) {
    const url = new URL(request.url);
    if (!url.pathname.includes("/app/settings")) {
      return redirect("/app/settings");
    }
  }


  return json({
    apiKey: process.env.SHOPIFY_API_KEY || "",
    userInfo,
    polarisTranslations: enlan,
  });
};

export default function App() {
  const { apiKey, userInfo, polarisTranslations } = useLoaderData();

  const handlePricing = (event) => {
    event.preventDefault();
    window.open(
      `https://admin.shopify.com/store/${userInfo?.shop.split(".")[0]}/charges/stripe-manage/pricing_plans`,
      "_top"
    );
  };

  // Extract premiumUser value
  const premiumUser = userInfo?.premiumUser ?? 0; // fallback to 0 if null

  return (
    <AppProvider i18n={polarisTranslations} isEmbeddedApp apiKey={apiKey}>
      {/* CASE 1: New User OR No Stripe Key */}
      {!userInfo || !userInfo.stripeSecretKey ? (
        <NavMenu>
          <Link to="/app" rel="home">Dashboard</Link>
          <Link to="/app/settings">Settings</Link>
        </NavMenu>
      ) : premiumUser === 0 ? (
        /* CASE 2: User updated stripe key but not upgraded (premiumUser = 0) */
        <NavMenu>
          <Link to="/app" rel="home">Dashboard</Link>
          {/*<Link to="/app" onClick={handlePricing}>Pricing</Link>*/}
          <Link to="/app/settings">Settings</Link>
        </NavMenu>
      ) : premiumUser === 2 ? (
        /* CASE 3: Full Access (premiumUser = 2) */
        <NavMenu>
          <Link to="/app" rel="home">Dashboard</Link>
          <Link to="/app/products">Products</Link>
          <Link to="/app/customers">Customers</Link>
          <Link to="/app/payments">Payments</Link>
          <Link to="/app/payouts">Payouts</Link>
          <Link to="/app/invoices">Invoices</Link>
          <Link to="/app/subscription">Subscriptions</Link>
          {/*<Link to="/app" onClick={handlePricing}>Pricing</Link>*/}
          <Link to="/app/settings">Settings</Link>
        </NavMenu>
      ) : (
        /* CASE 4: Limited Access (premiumUser = 1) */
        <NavMenu>
          <Link to="/app" rel="home">Dashboard</Link>
          <Link to="/app/products">Products</Link>
          <Link to="/app/customers">Customers</Link>
          <Link to="/app/payments">Payments</Link>
          {/*<Link to="/app" onClick={handlePricing}>Pricing</Link>*/}
          <Link to="/app/settings">Settings</Link>
        </NavMenu>
      )}
      <Outlet />
    </AppProvider>
  );
}

//Shopify needs Remix to catch some thrown responses, so that their headers are included in the response.
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
