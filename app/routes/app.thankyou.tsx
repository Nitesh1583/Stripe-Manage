import { useEffect, useState } from "react";
import { useSearchParams } from "@remix-run/react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
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
import { getShopifyPlanStatus } from "../models/payouts.server";

export default function ThankYouPage() {
  const [searchParams] = useSearchParams();
  const [chargeId, setChargeId] = useState<string | null>(null);
  const [shopName, setShopName] = useState<string | null>(null);

  useEffect(() => {
    // Fetch shop name from backend (optional if you already have it in loader)
    fetch("/app/get-shop-info")
      .then((res) => res.json())
      .then((data) => {
        if (data?.shop) {
          setShopName(data.shop.split(".")[0]);
        }
      })
      .catch((err) => console.error("Error fetching shop info:", err));

    // Save chargeId
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

  const goToDashboard = () => {
    if (shopName) {
      window.open(
        `https://admin.shopify.com/store/${shopName}/apps/stripe-manage/app`,
        "_top"
      );
    } else {
      console.error("Shop name not available — cannot redirect.");
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
