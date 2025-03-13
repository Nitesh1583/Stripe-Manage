import {
  Form,
  json,
  useActionData,
  useLoaderData,
  useNavigation,
} from "@remix-run/react";
import { useAppBridge } from "@shopify/app-bridge-react";
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

export async function loader({ request }) {
  const auth = await authenticate.admin(request);
  const userInfo = await db.user.findFirst({
    where: { shop: auth.session.shop },
  });
  return json({ userInfo });
}

export async function action({ request }) {
  const { method } = request;
  const formData = await request.formData();
  const auth = await authenticate.admin(request);
  const shop = auth.session.shop;
  console.log(shop);

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
  const { userInfo } = useLoaderData();
  const [email, setEmail] = useState(userInfo?userInfo?.email:"");
  const [stripeApiKeys, setStripeApiKeys] = useState(userInfo);
  const shopify = useAppBridge();

  useEffect(() => {
    shopify.toast.show(actionData?.message, { isError: actionData?.isError });
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
        <Card>
          <Form method={"PATCH"}>
            <FormLayout>
              <Text as="h3" variant="headingMd">
                Update stripe apikeys
              </Text>
              <TextField
                type="text"
                label="Stripe publishable key"
                onChange={(value) =>
                  setStripeApiKeys({
                    ...stripeApiKeys,
                    ["stripePublishKey"]: value,
                  })
                }
                name="stripePublishKey"
                id="stripePublishKey"
                value={stripeApiKeys?.stripePublishKey}
                error={
                  actionData?.errors?.stripePublishKey
                    ? actionData?.errors.stripePublishKey
                    : null
                }
              />
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
      </BlockStack>
    </Page>
  );
}
