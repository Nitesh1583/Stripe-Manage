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
import prisma from "../../db.server"; // prisma client (path relative to this route)

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

/** Small helper to shape error for form field display */
function loginErrorMessage(result: any) {
  if (!result) return {};
  if (result.error) return { shop: result.error };
  return {};
}

/**
 * Loader:
 * - Try login(request) (cookie / oauth callback)
 * - If a session is available (either from cookie or DB fallback in login()), extract `shop`
 * - Upsert into User table (only `shop` required by your request)
 * - Redirect to /app/settings
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const result = await login(request);

  // If session returned, try to extract shop name
  const sessionObj = result?.session;
  let shopName: string | null = null;

  if (sessionObj && typeof sessionObj === "object") {
    // sessionObj may be either:
    // - Prisma session row (stored in DB) with `shop` column
    // - or shopify library session object with `shop` property
    shopName = (sessionObj as any).shop ?? null;
  }

  // Fallback: if login() didn't return session or shop, check session table directly
  if (!shopName) {
    const dbSession = await prisma.session.findFirst();
    if (dbSession?.shop) {
      shopName = dbSession.shop;
      console.log("Fallback: got shopName from prisma.session:", shopName);
    }
  }

  if (shopName) {
    // Upsert user by shop (create minimal user record if not present)
    try {
      await prisma.user.upsert({
        where: { shop: shopName },
        update: {}, // we don't change existing user fields here
        create: {
          shop: shopName,
          // you can set other default fields if you want, e.g. premiumUser: 0
        },
      });

      console.log("✅ Ensured User row exists for shop:", shopName);
    } catch (err) {
      console.error("❌ Error upserting user:", err);
      // even if upsert fails, we'll redirect so user is not stuck on auth page
    }

    // redirect to app
    return redirect("/app/settings");
  }

  // No shop found — show login form with error info
  return { errors: loginErrorMessage(result), polarisTranslations };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const result = await login(request);
  return {
    redirectUrl: result.redirectUrl || null,
    errors: loginErrorMessage(result),
  };
};

export default function Auth() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [shop, setShop] = useState("");

  // safe fallback so undefined won't crash
  const errors = (actionData && (actionData as any).errors) || loaderData?.errors || {};

  useEffect(() => {
    if (actionData?.redirectUrl) {
      window.location.assign(actionData.redirectUrl);
    }
  }, [actionData]);

  return (
    <PolarisAppProvider i18n={loaderData?.polarisTranslations}>
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
