
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
                🎉 Thank You for Subscribing!
              </Text>
              <Text variant="bodyLg" as="p">
                Your subscription has been successfully activated.
              </Text>

              {chargeId && (
                <Text variant="bodyMd" as="p" tone="success">
                  ✅ Your Charge ID: <strong>{chargeId}</strong>
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
