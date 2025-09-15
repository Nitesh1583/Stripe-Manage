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

import db from "../../db.server";

import { authenticate } from "../../shopify.server";



/**export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

 * ✅ Extracts error message from login() result
 */
function loginErrorMessage(result: any) {
  if (!result) return {};
  if (result.error) return { shop: result.error };
  return {};
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const result = await login(request);

  const auth = await authenticate.admin(request);
  const userInfo = await db.session.findFirst({
    where: { shop: auth.session.shop },
  });

   if (!userInfo) return redirect("/app");

  // if (result.session) {
  //   // ✅ User already logged in, redirect to app
  //   return redirect("/app/settings");
  // }

  const errors = loginErrorMessage(result);
  return { userInfo, errors, polarisTranslations };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const result = await login(request);

  // If login() triggers a redirect, pass it back to the client
  return { redirectUrl: result.redirectUrl || null, errors: loginErrorMessage(result) };
};

export default function Auth() {
  const {loaderData, userInfo } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [shop, setShop] = useState("");
  const errors = actionData?.errors || loaderData.errors;

  console.log()

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
