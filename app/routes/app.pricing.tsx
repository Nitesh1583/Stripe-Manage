import { useActionData, useLoaderData, useFetcher } from "@remix-run/react";
import { redirectDocument, json } from "@remix-run/node";
import { useEffect, useState } from 'react';
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
import { fetchStripeSubscriptionData} from "../models/pricing.server";

// Loader function
export async function loader({ request }) {
  try {
    const auth = await authenticate.admin(request);
    const { billing } = await shopify.authenticate.admin(request);
    const hasActivePlan = await billing.check({ plans: [MONTHLY_PLAN, USAGE_PLAN] });
    const userInfo = await db.user.findFirst({ //fetch from db tablename-> User
      where: { shop: auth.session.shop },
      // where: { shop: "kd-developments.myshopify.com" },
    });

    
    // if (!userInfo) return redirect("/app");
    let subUserData = await fetchStripeSubscriptionData(userInfo); //fetch SubscriptionUser data from db
    return json({ subUserData, hasActivePlan });

  } catch (error) {
    return json({ subUserData: null, error: "Failed to load subscription information." });
  }
}

// Pricing page view function
export default function PricingPage() {
  const {subUserData, hasActivePlan, error, subInfo } = useLoaderData();
  const actionData = useActionData();
  const fetcher = useFetcher();
  const [loading, setLoading] = useState(false);

  console.log(hasActivePlan);

  if (!hasActivePlan) {

      throw await billing.request({ plan: MONTHLY_PLAN }); // Redirect to billing page if no active plan
    }

  if (hasActivePlan) {

      console.log(hasActivePlan);
  }

  
  const premiumUserData = subUserData.userinfo.premiumUser;


  // fetch Checkout Session URL and redirect (using plan() function on button click)
  useEffect(() => {
      if(fetcher.data?.success) {
        setLoading(false);
        if (fetcher.data?.redirectUrl) {
          window.open(fetcher.data.redirectUrl); //redirect to checkout session
        }

        if (fetcher.data?.message) {
          shopify.toast.show(fetcher.data?.message, { isError: false }); //show error 
          setTimeout(() => {
            window.location.reload();
          }, 3000);
        }
      }
    }, [fetcher.data]);

  return (
    <Page title="Pricing" backAction={{ content: "Home", url: "/app" }}>
      <Layout>
        {/*<Layout.Section>
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
        </Layout.Section>*/}
        <Layout.Section>
          <Grid>
            {subUserData.subInfo != null ? (
              // After subscription show this grid
              <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6, xl: 6 }}>
                <CalloutCard
                  title="Subscription Active"
                  primaryAction={{
                    content: loading ? "Cancelling..." : "Cancel Subscription",
                    onAction: () => {
                      setLoading(true);
                      let shopname = subUserData.shop;
                      // let StripeSecretKey = subUserData.userinfo.stripeSecretKey;
                      let StripeSecretKey = process.env.STRIPE_SECRET_KEY;
                      if(subUserData.subInfo.subscription_status === 'active') {
                        const subscriptionId = subUserData.subInfo.subscription_id;
                        const rowId = subUserData.subInfo.id;

                        fetcher.submit({ actionType: "cancelSubscription", subRowId: rowId, userSubId: subscriptionId, shop: shopname, stripeSecretKey: StripeSecretKey}, { method: "POST" });

                      }
                    },
                    disabled: loading,
                  }}
                >
                  <Text as="p">Your Subscription Plan Amount is : $9.99</Text>
                </CalloutCard>
              </Grid.Cell>
            ) : (
              // Before subscription show this grid
              <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6, xl: 6 }}>
                <CalloutCard
                  title="Stripe Console Pricing"
                  primaryAction={{
                    content: "Buy Now",
                    onAction: () => {
                        let shop = subUserData.shop;
                        let shopname = subUserData.shop;
                        shopname = shopname.split('.');
                        shopname = shopname[0];
                        // let StripeSecretKey = subUserData.userinfo.stripeSecretKey;
                        let StripeSecretKey = process.env.STRIPE_SECRET_KEY;

                        const formData = new FormData();
                        formData.append("actionType", "plan");
                        formData.append("shopName", shopname);
                        formData.append("shopurl", shop);
                        formData.append("stripeSecretKey", StripeSecretKey);

                        fetcher.submit({ actionType: "plan", shopName: shopname, shopurl: shop, stripeSecretKey: StripeSecretKey }, { method: "POST" });
                    },
                  }}
                >
                  <Text as="p">
                    {/*Choose the Perfect Plan for Your Business*/} 
                  </Text>
                  <List type="bullet" gap="loose">
                    <List.Item>No Need to login stripe—everything is within Shopify.</List.Item>
                    <List.Item> Customer management with detailed insights for better engagement.</List.Item>
                    <List.Item>Monitor your Products Sold List to see which items are performing best.</List.Item>
                    <List.Item>Customizable dashboard views and filters.</List.Item>
                    <List.Item>View and manage all your payments in one place with the Payments Manage List.</List.Item>
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
  const formData = await request.formData();
  if (formData.get("actionType") === 'cancelSubscription') {
    const subscriptionId = formData.get("userSubId");
    const StripeSecretKey = formData.get("stripeSecretKey");
    const shopname = formData.get("shop");
    const rowid = parseInt(formData.get("subRowId"));

    const stripe = new Stripe(StripeSecretKey);
    const cancelSubData = await stripe.subscriptions.cancel(subscriptionId);

    if (cancelSubData) {
      let canceledDate = new Date(cancelSubData.canceled_at * 1000)
        .toISOString()
        .split("T");
      let subCancelDate = `${canceledDate[0]} ${canceledDate[1].split(".")[0]}`;
      let subStatus = cancelSubData.status;

      const subscriptionUpdate = await db.SubscriptionUser.update({
            where: {id: rowid, subscription_id: subscriptionId, shop_url: shopname},
            data: {
              subscription_status: subStatus, 
              sub_cancel_date : subCancelDate,
            },
          });
      
      const userUpdate = await db.user.update({
            where: { shop: shopname},
            data: {
              premiumUser: parseInt(0),
            },
          });
       
      return json({ success: true, message: "Subscription canceled successfully!" });
    }
  }

  if (formData.get("actionType") === "plan") {
      let shopname = formData.get("shopName");
      let secretStripeKey = formData.get("stripeSecretKey");
      let shopurl = formData.get("shopurl");

      const stripe = new Stripe(secretStripeKey);

      const session = await stripe.checkout.sessions.create({
        success_url: "https://admin.shopify.com/store/"+shopname+"/apps/stripe-manage/app/pricing",
        cancel_url: "https://admin.shopify.com/store/"+shopname+"/apps/stripe-manage/app/pricing",
        line_items: [
          {
            price: "price_1R8zSVHACfpAz0Akbqwkx7rc", //live mode
            quantity: 1,
          },
        ],
        metadata: {
          shop_url: shopurl,
        },
        mode: "subscription",
      });

      return json({success: true, redirectUrl: session.url}, { status: 200 });
  }
}
