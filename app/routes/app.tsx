import React from "react";
import { json } from "@remix-run/node";
import { Link,  Outlet, useLoaderData, useRouteError } from "@remix-run/react";

import { NavMenu } from "@shopify/app-bridge-react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import enlan from "@shopify/polaris/locales/en.json";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import db from "../db.server";
import { Button } from "@shopify/polaris";

import { authenticate } from "../shopify.server";
import { saveShopifyChargeId } from "../models/user.server";
import { getShopifyPlanStatus   } from "../models/payouts.server";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

export const loader = async ({ request }) => {
  const auth = await authenticate.admin(request);

  const userInfo = await db.user.findFirst({
    where: { shop: auth.session.shop },
  });

  let planStatus = "FREE"; // default

  try {
    const statusResponse = await getShopifyPlanStatus(auth.session.shop, auth.session.accessToken);
    console.log("DEBUG: Raw Shopify Plan Response =>", statusResponse);

    // ✅ Normalize response
    if (typeof statusResponse === "string") {
      planStatus = statusResponse.toUpperCase(); // ensures PAID/free/Free => PAID/FREE
    } else if (statusResponse?.status) {
      planStatus = statusResponse.status.toUpperCase();
    }
  } catch (error) {
    console.error("Error fetching Shopify Plan Status:", error);
  }

  console.log("DEBUG: Final planStatus sent to client =>", planStatus);

  return json({
    apiKey: process.env.SHOPIFY_API_KEY || "",
    userInfo,
    planStatus,
    polarisTranslations: enlan,
  });
};


export default function App() {
  const { apiKey, userInfo, result, planStatus, polarisTranslations } = useLoaderData();
console.log("CLIENT DEBUG: Plan Status =>", planStatus);

  const handlePricing = (event) => {
    event.preventDefault();
    console.log(window.location.href=`https://admin.shopify.com/store/${userInfo?.shop.split(".")[0]}/charges/stripe-manage/pricing_plans`);
    window.open(`https://admin.shopify.com/store/${userInfo?.shop.split(".")[0]}/charges/stripe-manage/pricing_plans`, '_top')
  }

  return (
    <AppProvider i18n={polarisTranslations} isEmbeddedApp apiKey={apiKey}>
      {(!userInfo || userInfo.stripeSecretKey === "" || userInfo.stripeSecretKey === null) ? (
        <NavMenu>
          <Link to="/app" rel="home">Dashboard</Link>
          <Link to="/app/settings">Settings</Link>
        </NavMenu>
      ) : (
        <NavMenu>
          <Link to="/app" rel="home">Dashboard</Link>
          <Link to="/app/products">Products</Link>
          <Link to="/app/customers">Customers</Link>
          <Link to="/app/payments">Payments</Link>

          {/* ✅ Show Payouts & Invoices only for PAID plan */}
          {planStatus === "PAID" && (
            <>
              <Link to="/app/payouts">Payouts</Link>
              <Link to="/app/invoices">Invoices</Link>
            </>
          )}

          <Link to="/app/Pricing" onClick={handlePricing}>Pricing</Link>
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