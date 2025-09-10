import { useEffect, useState } from "react";
import { useSearchParams } from "@remix-run/react";
import { useFetcher, useLoaderData  } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  Text,
  Button,
  BlockStack,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { fetchStripeRecentPayouts, getShopifyPlanStatus } from "../models/payouts.server";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const auth = await authenticate.admin(request);

    const userInfo = await db.user.findFirst({
      where: { shop: auth.session.shop },
    });

    // Fetch plan status + subscriptions
    const { planStatus, activeSubs } = await getShopifyPlanStatus(request);

    console.log("SERVER DEBUG: Plan Status =>", planStatus);
    activeSubs.forEach((sub) => {
      console.log(
        `SERVER DEBUG: Subscription Name: ${sub.name}, Status: ${sub.status}, Price: ${
          sub.lineItems?.[0]?.plan?.pricingDetails?.price?.amount ?? 0
        }`
      );
    });

    return json({
      planStatus,
      activeSubs,
    });

  }catch (error) {
    console.error("Loader failed:", error);
    return json(
      {
        planStatus: null,
        activeSubs: [],
      },
      { status: 500 }
    );
  }
};

export default function ThankYouPage() {planStatus, activeSubs} = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const [chargeId, setChargeId] = useState<string | null>(null);

  // Client debug logs
  console.log("CLIENT DEBUG: Plan Status =>", planStatus);
  console.log("CLIENT DEBUG: Active Subscriptions =>", activeSubs);

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
