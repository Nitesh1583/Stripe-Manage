import { useEffect, useState } from "react";
import { useSearchParams, useLoaderData } from "@remix-run/react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import {
  Page,
  Layout,
  Card,
  Text,
  Button,
  BlockStack,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { TitleBar } from "@shopify/app-bridge-react";
import db from "../db.server";
import { json } from "@remix-run/node";

// Loader to get userInfo 
export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const auth = await authenticate.admin(request);

    const userInfo = await db.user.findFirst({
      where: { shop: auth.session.shop },
    });

    if (!userInfo) {
      throw new Response("User not found", { status: 404 });
    }

    return json({ userInfo });
  } catch (error) {
    console.error("ThankYouPage Loader failed:", error);
    throw new Response("Error loading ThankYouPage", { status: 500 });
  }
};

export default function ThankYouPage() {
  const { userInfo } = useLoaderData<typeof loader>(); // ✅ Access userInfo from loader
  const [searchParams] = useSearchParams();
  const [chargeId, setChargeId] = useState<string | null>(null);

  useEffect(() => {
    const id = searchParams.get("charge_id");
    if (id) {
      setChargeId(id);

      fetch("/app/save-chargeid", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ chargeId: id }),
      })
        .then((res) => res.json())
        .then((data) => console.log("Charge ID saved:", data))
        .catch((err) => console.error("Error saving chargeId:", err));
    }
  }, [searchParams]);

  //  Uses userInfo to build correct Shopify URL
  const goToDashboard = () => {
    if (userInfo?.shop) {
      const shopName = userInfo.shop.split(".")[0];
      window.open(
        `https://admin.shopify.com/store/${shopName}/apps/stripe-manage/app`,
        "_top"
      );
    } else {
      console.error("Shop info not found. Cannot redirect.");
    }
  };

  return (
    <Page>
      <TitleBar title="Thank You" />
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text variant="headingXl" as="h2">
                Thank You for Subscribing!
              </Text>
              <Text variant="bodyLg" as="p">
                Your subscription has been successfully activated.
              </Text>

              {chargeId && (
                <Text variant="bodyMd" as="p" tone="success">
                  Your Charge ID: <strong>{chargeId}</strong>
                </Text>
              )}

              <Button onClick={goToDashboard} variant="primary">
                Go to Dashboard
              </Button>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
