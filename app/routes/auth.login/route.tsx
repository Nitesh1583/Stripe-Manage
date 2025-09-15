import { redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
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

import { login, sessionStorage } from "../../models/shopify.server";
import { loginErrorMessage } from "./error.server";
import { useEffect, useState } from "react";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  // 1. Check if there is already a valid session in storage
  const existingSession = await sessionStorage.loadSession(request);

  if (existingSession) {
    // Session exists, redirect user to /app/settings
    return redirect("/app/settings");
  }

  // 2. Otherwise, prepare for login
  const result = await login(request);

  // If login() already created a session during OAuth callback, redirect directly
  if (result?.session) {
    return redirect("/app/settings");
  }

  // Show login form if session is not found
  const errors = loginErrorMessage(result);
  return { errors, polarisTranslations };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  // POST: attempt login
  const redirectUrl = await login(request);
  return { redirectUrl };
};

export default function Auth() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [shop, setShop] = useState("");
  const { errors } = actionData || loaderData;

  // Client-side redirect if login() returned redirect URL
  useEffect(() => {
    if (actionData?.redirectUrl) {
      window.location.assign(actionData.redirectUrl);
    }
  }, [actionData]);

  return (
    <PolarisAppProvider i18n={loaderData.polarisTranslations}>
      <Page>
        <Card>
          <Form method="post">
            <FormLayout>
              <Text variant="headingMd" as="h2">
                Log in
              </Text>
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
