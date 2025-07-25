import { json } from "@remix-run/node";
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
     where: { shop: "kodrite.myshopify.com" },
  });

  return json({
    apiKey: process.env.SHOPIFY_API_KEY || "",
    userInfo,
    polarisTranslations: enlan,
  });
};

export default function App() {
  const { apiKey, userInfo, polarisTranslations } = useLoaderData();
  console.log(userInfo);

  return (
    <AppProvider i18n={polarisTranslations} isEmbeddedApp apiKey={apiKey}>
      {!userInfo ? (
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
          <Link to="/app/disputes">Disputes</Link>
           <Link to="/app/payment-links">Payment Links</Link> 
          <Link to="/app/pricing">Pricing</Link>
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