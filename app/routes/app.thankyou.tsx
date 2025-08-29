import { useEffect, useState } from "react";
import { useSearchParams } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  Text,
  Button,
  BlockStack,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { LoaderArgs, redirect } from "@remix-run/node";
import { authenticate, MONTHLY_PLAN } from "../shopify.server";


export const loader = async ({ request }: LoaderArgs) => {
  const { billing } = await authenticate.admin(request);
  const billingCheck = await billing.require({
    plans: [MONTHLY_PLAN],
    isTest: true, // Set to false for production
    onFailure: () => redirect("/select-plan"),
  });

  const subscription = billingCheck.appSubscriptions[0];
  console.log(`Shop is on ${subscription.name} (id ${subscription.id})`);
  // Access other subscription details like currentPeriodEnd, status, etc.
  return null;
};

export default function ThankYouPage() {
  const [searchParams] = useSearchParams();
  const [chargeId, setChargeId] = useState<string | null>(null);

  useEffect(() => {
    const id = searchParams.get("charge_id");
    if (id) {
      setChargeId(id);

      // Just call backend API with chargeId
      fetch("/app/save-chargeid", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ chargeId: id }),
      })
        .then((res) => res.json())
        .then((data) => {
          console.log("Charge ID saved:", data);
        })
        .catch((err) => console.error("Error saving chargeId:", err));
    }
  }, [searchParams]);

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

              <Button
                onClick={() => (window.location.href = "/")}
                variant="primary"
              >
                Go to Dashboard
              </Button>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
