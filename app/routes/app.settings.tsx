import {
  Form,
  json,
  redirect,
  useActionData,
  useLoaderData,
  useNavigation,
} from "@remix-run/react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { Redirect } from "@shopify/app-bridge/actions";
import {
  BlockStack,
  Button,
  Card,
  FormLayout,
  Page,
  Text,
  TextField,
  Banner,
  InlineStack,
} from "@shopify/polaris";
import { useEffect, useState } from "react";
import db from "../db.server";
import {
  updateUserAccountSetting,
  updateUserStripeSetting,
} from "../models/user.server";
import { authenticate } from "../shopify.server";
import { getShopifyPlanStatus } from "../models/payouts.server";

export async function loader({ request }) {
  const auth = await authenticate.admin(request);
  const userInfo = await db.user.findFirst({
    where: { shop: auth.session.shop },
  });

  // Fetch plan status + subscriptions
  const { planStatus, activeSubs } = await getShopifyPlanStatus(request);
  const princingUrl = await updateUserStripeSetting();

  console.log("SERVER DEBUG: Plan Status =>", planStatus);
  activeSubs.forEach((sub) => {
    console.log(
      `SERVER DEBUG: Subscription Name: ${sub.name}, Status: ${sub.status}, Price: ${
        sub.lineItems?.[0]?.plan?.pricingDetails?.price?.amount ?? 0
      }`
    );
  });

  return json({
    userInfo,
    planStatus,
    activeSubs,
  });
}

export async function action({ request }) {
  const { method } = request;
  const formData = await request.formData();
  const auth = await authenticate.admin(request);
  const shop = auth.session.shop;

  switch (method) {
    case "POST":
      return json(await updateUserAccountSetting(formData, shop));

    case "PATCH": {
      const result = await updateUserStripeSetting(formData, shop);
      if (result?.status === 302) {
        return result;
      }
      return json(result);
    }

    default:
      return json({ message: "Method not allowed", isError: true });
  }
}

export default function SettingsPage() {
  const actionData = useActionData();
  const { state } = useNavigation();
  const { userInfo, planStatus, activeSubs } = useLoaderData<typeof loader>();
  const [email, setEmail] = useState(userInfo ? userInfo.email : "");
  const [stripeApiKeys, setStripeApiKeys] = useState(userInfo);

  console.log("SettingsPage plan Status:", planStatus);
  console.log("SettingsPage active Subs", activeSubs);

  const app = useAppBridge();

  // Extract premiumUser value
  const premiumUser = userInfo?.premiumUser ?? 0;

  const stripeSecretkey = userInfo?.stripeSecretKey;
  console.log(stripeSecretkey);

  // Handle Pricing Button Click
  const handlePricing = () => {
    if (userInfo?.shop) {
      window.open(
        `https://admin.shopify.com/store/${userInfo.shop.split(".")[0]}/charges/stripe-manage/pricing_plans`,
        "_top"
      );
    }
  };

  useEffect(() => {
    if (actionData?.message) {
      app.toast.show(actionData.message, { isError: actionData.isError });
    }

    if (actionData?.redirectUrl) {
      console.log("Redirect URL from server:", actionData.redirectUrl);
      window.open(actionData.redirectUrl, "_top");
    }
  }, [actionData]);

  return (
    <Page title="Settings" backAction={{ content: "Home", url: "/app" }}>
      <BlockStack gap="400">
        {/* Show Banner only when premiumUser is 0(No Plan Active) AND stripeSecretKey is not null/empty */}
        {premiumUser === 0 && !!stripeSecretkey && (
          <Banner title="No plan is active" status="critical">
            <p>
              No plan is currently active on your account. Please choose a plan
              to unlock all features.
            </p>
            <InlineStack align="start" gap="200">
              <Button onClick={handlePricing} variant="primary">
                Choose Plan
              </Button>
            </InlineStack>
          </Banner>
        )}

        {/* Show Banner only when premiumUser is 1 (Free Plan Active*/}
        {premiumUser === 1 && (
          <Banner title="Free plan is active" status="info">
            <p>
              Free plan is currently active on your account. Please choose a upgrade plan
              to unlock all features.
            </p>
            <InlineStack align="start" gap="200">
              <Button onClick={handlePricing} variant="primary">
                Upgrade your plan now 
              </Button>
            </InlineStack>
          </Banner>
        )}

        {/* Show Banner only when premiumUser is 2 (Paid Plan Active) */}
        {premiumUser === 1 && (
          <Banner title="Free plan is active" status="info">
            <p>
              You are currently on the Paid Plan. Enjoy premium features.  
              If you cancel your plan, you will switch back to the free plan.
            </p>
            <InlineStack align="start" gap="200">
              <Button onClick={handlePricing} variant="primary">
                Cancel Plan
              </Button>
            </InlineStack>
          </Banner>
        )}

        {/* Account Info */}
        <Card>
          <Form method="POST">
            <FormLayout>
              <Text as="h3" variant="headingMd">
                Update account information
              </Text>
              <TextField
                type="email"
                label="Email Address"
                onChange={(value) => setEmail(value)}
                name="email"
                id="email"
                value={email}
                error={
                  actionData?.errors?.email ? actionData.errors.email : null
                }
              />
              <Button submit variant="primary">
                Save info
              </Button>
            </FormLayout>
          </Form>
        </Card>

        {userInfo && (
          <Card>
            <Form method="PATCH">
              <FormLayout>
                <Text as="h3" variant="headingMd">
                  Update Stripe API key
                </Text>

                <TextField
                  type="password"
                  label="Stripe secret key"
                  onChange={(value) =>
                    setStripeApiKeys({
                      ...stripeApiKeys,
                      ["stripeSecretKey"]: value,
                    })
                  }
                  name="stripeSecretKey"
                  id="stripeSecretKey"
                  value={stripeApiKeys?.stripeSecretKey}
                  error={
                    actionData?.errors?.stripeSecretKey
                      ? actionData.errors.stripeSecretKey
                      : null
                  }
                />
                <Button submit variant="primary">
                  Update Stripe API keys
                </Button>
              </FormLayout>
            </Form>
          </Card>
        )}
      </BlockStack>
    </Page>
  );
}