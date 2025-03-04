import { json, useActionData, useLoaderData, useSubmit } from "@remix-run/react";
import {
  Banner,
  CalloutCard,
  Grid,
  Layout,
  List,
  Page,
  Text,
} from "@shopify/polaris";
import { Stripe } from "stripe";
import db from "../db.server";
import { authenticate } from "../shopify.server";

export async function loader({ request }) {
  try {
    const auth = await authenticate.admin(request);
    const subInfo = await db.get_subscription_user.findFirst();
    return json({ subInfo });
  } catch (error) {
    console.error("Loader Error:", error);
    return json({ subInfo: null, error: "Failed to load subscription information." });
  }
}

export default function PricingPage() {
  const { subInfo, error } = useLoaderData();
  const actionData = useActionData();
  const submit = useSubmit();

  async function plan() {
    try {
      const stripe = new Stripe("sk_test_51LuADsIgRSAwxCstzcJ0VohJ0AW34a6d6M1u8yBWQ296sfJdr5bkofLFbwUQKEQA6EDWH0YixxD85KSydW8bAaTj007qLBW6zW");

      const session = await stripe.checkout.sessions.create({
        success_url: "https://admin.shopify.com/store/kodrite/apps/stripe-management-console/app/pricing",
        line_items: [
          {
            price: "price_1PrutPIgRSAwxCstAcWVhcys",
            quantity: 1,
          },
        ],
        metadata: {
          shop_url: subInfo?.shop || "unknown",
        },
        mode: "subscription",
      });

      window.open(session.url, "_blank");
    } catch (error) {
        console.error("Plan Error:", error);
      alert("Failed to initiate the subscription process. Please try again later.");
    }
  }

  return (
    <Page title="Pricing" backAction={{ content: "Home", url: "/app" }}>
      <Layout>
        <Layout.Section>
          {error && (
            <Banner status="critical" title="Error">
              <Text as="p">{error}</Text>
            </Banner>
          )}
          <Banner title="Alert" onDismiss={() => {}}>
            <Text as="p">
              Upgrade to a premium membership plan to access all the powerful
              features of the Shopify Stripe app. Enhance your online store's
              payment processing capabilities today.
            </Text>
          </Banner>
        </Layout.Section>
        <Layout.Section>
          <Grid>
            {subInfo ? (
              // After subscription show this grid
              <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6, xl: 6 }}>
                <CalloutCard
                  title="Subscription Active"
                  primaryAction={{
                    content: "Cancel Subscription",
                    onAction: null,
                  }}
                >
                  <Text as="p">Your Subscription Plan Amount is : $9.99</Text>
                </CalloutCard>
              </Grid.Cell>
            ) : (
              // Before subscription show this grid
              <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6, xl: 6 }}>
                <CalloutCard
                  title="Pricing plan"
                  primaryAction={{
                    content: "Buy $9.99",
                    onAction: () => plan(),
                  }}
                >
                  <Text as="p">
                    Lorem ipsum dolor sit amet, consectetur adipisicing elit.
                  </Text>
                  <List type="bullet" gap="loose">
                    <List.Item>Lorem ipsum</List.Item>
                    <List.Item>Dolor sit amet</List.Item>
                    <List.Item>Consectetur adipiscing</List.Item>
                  </List>
                </CalloutCard>
              </Grid.Cell>
            )}
          </Grid>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

export async function action({ request }) {
  const { method } = request;
  switch (method) {
    case "POST":
      return json({ method: "POST method" });
    default:
      return json({ method: "Method not allowed" });
  }
}
