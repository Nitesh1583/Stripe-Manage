import {
  Form,
  json,redirect,
  useActionData,
  useLoaderData,
  useNavigation,
} from "@remix-run/react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { Redirect } from "@shopify/app-bridge/actions";
import { redirect } from '@remix-run/node';
import {
  BlockStack,
  Button,
  Card,
  FormLayout,
  Page,
  Text,
  TextField
} from "@shopify/polaris";
import { useEffect, useState } from "react";
import db from "../db.server";
import { updateUserAccountSetting, updateUserStripeSetting } from "../models/user.server";
import { authenticate } from "../shopify.server";
import { getShopifyPlanStatus } from "../models/payouts.server";

export async function loader({ request }) {
  const auth = await authenticate.admin(request);
  const userInfo = await db.user.findFirst({
    where: { shop: auth.session.shop }
  });

  //Fetch plan status + subscriptions
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
  // if (!userInfo) return redirect("/app/settings");
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
        // If redirect() was returned, pass it through
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
  const [email, setEmail] = useState(userInfo?userInfo?.email:"");
  const [stripeApiKeys, setStripeApiKeys] = useState(userInfo);

  console.log("SettingsPage plan Status:", planStatus);
  console.log("SettingsPage active Subs", activeSubs);
  const app = useAppBridge(); 

  // Extract premiumUser value
  const premiumUser = userInfo?.premiumUser ?? 0; // fallback to 0 if null

  useEffect(() => {
  if (actionData?.message) {
    app.toast.show(actionData.message, { isError: actionData.isError });
  }

  // Log redirect URL for debugging
  if (actionData?.redirectUrl) {
    console.log("Redirect URL from server:", actionData.redirectUrl);

    window.open(
      actionData.redirectUrl,
      "_top"
    );// wait so toast shows first
  }
}, [actionData]);
  
  return (
    <Page title="Settings" backAction={{ content: "Home", url: "/app" }}>
      <BlockStack gap="400">
        <Card>
          <Form method={"POST"}>
            <FormLayout>
              <Text as="h3" variant="headingMd">
                Update account information
              </Text>
              <TextField
                type="email"
                label="Email Address"
                onChange={(value) =>
                  setEmail(value)
                }
                name="email"
                id="email"
                value={email}
                error={
                  actionData?.errors?.email ? actionData?.errors.email : null
                }
              />
              <Button submit variant="primary">
                Save info
              </Button>
            </FormLayout>
          </Form>
        </Card>
        {(userInfo != null) ?
        <Card>
          <Form method={"PATCH"}>
            <FormLayout>
              <Text as="h3" variant="headingMd">
                Update stripe apikeys
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
                    ? actionData?.errors.stripeSecretKey
                    : null
                }
              />
              <Button submit variant="primary">
                Update stripe apikeys
              </Button>
            </FormLayout>
          </Form>
        </Card>
      :''}
      </BlockStack>
    </Page>
  );
}