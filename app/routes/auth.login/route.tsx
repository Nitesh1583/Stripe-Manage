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

import { login } from "../../models/shopify.server";
import { useEffect, useState } from "react";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

/**
 * Extracts error message from login() result
 */
function loginErrorMessage(result: any) {
  if (!result) return {};
  if (result.error) return { shop: result.error };
  return {};
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const result = await login(request);

  if (result.session) {
    // Redirect if we already have a session (from cookie OR DB fallback)
    return redirect("/app");
  }

  return {
    errors: loginErrorMessage(result),
    polarisTranslations,
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const result = await login(request);

  return {
    redirectUrl: result.redirectUrl || null,
    errors: loginErrorMessage(result),
  };
};

export default function Auth() {
  //  Correct usage — no destructuring mistake
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  const [shop, setShop] = useState("");

  //  Safely get errors (avoid undefined)
  const errors = actionData?.errors || loaderData?.errors || {};

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
