
import { useState, useEffect } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import {
  AppProvider as PolarisAppProvider,
  Button,
  Card,
  FormLayout,
  Page,
  Text,
  TextField,
} from "@shopify/polaris";
import polarisTranslations from "@shopify/polaris/locales/en.json";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";

// NOTE: default import for shopify, named imports for others
import shopify, { login, authenticate } from "../../shopify.server";
import { loginErrorMessage } from "./error.server";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const shopParam = url.searchParams.get("shop") || undefined;

  let shopifyAuth = null;
  try {
    // begin OAuth flow if shop param present — safe-guarded with try/catch
    shopifyAuth = await shopify.auth.begin({
      shop: shopParam,
      callbackPath: "/auth/callback",
      isOnline: false,
    });
  } catch (err) {
    console.warn("shopify.auth.begin failed:", err);
    shopifyAuth = null;
  }

  // return polarisTranslations so client has i18n
  return { shopifyAuth, polarisTranslations };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  // Return the redirect URL from login if any
  const redirectResult = await login(request);
  return { redirectUrl: redirectResult.redirectUrl || null, errors: loginErrorMessage(redirectResult) };
};

export default function Auth() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [shop, setShop] = useState("");
  const errors = actionData?.errors || (loaderData as any)?.errors || {};

  useEffect(() => {
    if (actionData?.redirectUrl) {
      window.location.assign(actionData.redirectUrl);
    }
  }, [actionData]);

  return (
    <PolarisAppProvider i18n={(loaderData as any)?.polarisTranslations}>
      <Page>
        <Card>
          <Form method="post">
            <FormLayout>
              <Text variant="headingMd" as="h2">Log in</Text>
              <TextField
                type="text"
                name="shop"
                label="Shop domain"
                helpText="example.myshopify.com"
                value={shop}
                onChange={setShop}
                autoComplete="on"
                error={errors?.shop}
              />
              <Button submit>Log in</Button>
            </FormLayout>
          </Form>
        </Card>
      </Page>
    </PolarisAppProvider>
  );
}
