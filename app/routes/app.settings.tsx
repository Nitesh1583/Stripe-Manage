import {
  Form,
  json,redirect,
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
  const { redirectToPricing } = await updateUserStripeSetting(request);

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
    redirectToPricing
  });
}

export async function action({ request }) {
  const { method } = request;
  const formData = await request.formData();
  const auth = await authenticate.admin(request);
  const shop = auth.session.shop;

  switch (method) {
    case "POST":
      const updateInfoSetting = await updateUserAccountSetting(formData, shop);
      return json(updateInfoSetting);
    case "PATCH":
      const updateStripeSetting = await updateUserStripeSetting(formData, shop);
      return json(updateStripeSetting);
    default:
      return json({ message: "Method not allowed", isError: true });
  }
}

export default function SettingsPage() {
  const actionData = useActionData();
  const { state } = useNavigation();
  const { userInfo, planStatus, activeSubs, redirectToPricing } = useLoaderData<typeof loader>();
  const [email, setEmail] = useState(userInfo?userInfo?.email:"");
  const [stripeApiKeys, setStripeApiKeys] = useState(userInfo);

  console.log("SettingsPage plan Status:", planStatus);
  console.log("SettingsPage active Subs", activeSubs);
  const app = useAppBridge(); 

  useEffect(() => {
    if (actionData?.message) {
      app.toast.show(actionData.message, { isError: actionData.isError });
    }

    if (actionData?.redirectToPricing && userInfo?.shop) {
      const shopName = userInfo.shop.split(".")[0];

      // Use App Bridge Redirect correctly
      const redirect = Redirect.create(app);
      redirect.dispatch(
        Redirect.Action.REMOTE, // Or ADMIN_PATH if you want relative path
        `https://admin.shopify.com/store/${shopName}/charges/stripe-manage/pricing_plans`
      );
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
