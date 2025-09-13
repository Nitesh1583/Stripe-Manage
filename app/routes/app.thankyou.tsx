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
import { getShopifyPlanStatus   } from "../models/payouts.server";
import { Redirect } from "@shopify/app-bridge/actions";

export default function ThankYouPage() {
  const [searchParams] = useSearchParams();
  const [chargeId, setChargeId] = useState<string | null>(null);
  const app = useAppBridge();

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

  const goToDashboard = () => {
    const redirect = Redirect.create(app);
    redirect.dispatch(Redirect.Action.APP, "/app");
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