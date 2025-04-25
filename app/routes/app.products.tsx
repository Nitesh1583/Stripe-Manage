import { Outlet, redirect, useLoaderData, useNavigate } from "@remix-run/react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { useState } from "react";
import db from "../db.server";
import { fetchStripeProducts } from "../models/product.server";
import { authenticate } from "../shopify.server";

export async function loader({ request }) {
  const auth = await authenticate.admin(request);
  const userInfo = await db.user.findFirst({
   // where: { shop: auth.session.shop },
     where: { shop: "kodrite.myshopify.com" },
  });
  if (!userInfo) return redirect("/app");
  const productResponse = await fetchStripeProducts(userInfo);
  return productResponse;
}

export default function ProductPage() {
  const shopify = useAppBridge();
  const navigate = useNavigate();
  const { products, premiumUser } = useLoaderData();
  const [model, setModel] = useState(false);

  const resourceName = {
    singular: "products",
    plural: "products",
  };
  // const { selectedResources, allResourcesSelected, handleSelectionChange } =
  // useIndexResourceState(products);

  return (
        <Outlet />
  );
}
