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

export default function ThankYouPage() {
  const [searchParams] = useSearchParams();
  const [chargeId, setChargeId] = useState<string | null>(null);

useEffect(() => {
  const id = searchParams.get("charge_id");
  if (id) {
    setChargeId(id);

    // TODO: replace this with shop from session or db
    const shopUrl = await db.user.findFirst({
      where: { shop: auth.session.shop }
    });

    fetch("/app/save-chargeid", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        shop: shopUrl,
        chargeId: id,
      }),
    })
    .then(res => res.json())
    .then(data => {
      console.log("Charge ID saved:", data);
    })
    .catch(err => console.error("Error saving chargeId:", err));
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
                onClick={() =>
                  (window.location.href = "/") // redirect back to app home
                }
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
