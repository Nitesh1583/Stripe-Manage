import { useActionData, useLoaderData, useFetcher } from "@remix-run/react";
import { redirectDocument, json } from "@remix-run/node";
import { useEffect } from 'react';
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
    const userInfo = await db.user.findFirst({ //fetch from db tablename-> User
      where: { shop: auth.session.shop },
    });

    if (!userInfo) return redirect("/app");
    let subUserData = await fetchStripeSubscriptionData(userInfo); //fetch SubscriptionUser data from db
    return json({ subUserData });

  } catch (error) {
    return json({ subUserData: null, error: "Failed to load subscription information." });
  }
}

// Pricing page view function
export default function PricingPage() {
  const {subUserData, error, subInfo } = useLoaderData();
  const actionData = useActionData();
  const fetcher = useFetcher();
  
  const premiumUserData = subUserData.userinfo.premiumUser;


  // fetch Checkout Session URL and redirect (using plan() function on button click)
  useEffect(() => {
      if(fetcher.data?.success) {
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
        <Layout.Section>
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
        </Layout.Section>
        <Layout.Section>
          <Grid>
            {subUserData.subInfo != null ? (
              // After subscription show this grid
              <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6, xl: 6 }}>
                <CalloutCard
                  title="Subscription Active"
                  primaryAction={{
                    content: "Cancel Subscription",
                    onAction: () => {
                      let shopname = subUserData.shop;
                      let StripeSecretKey = subUserData.userinfo.stripeSecretKey;
                      if(subUserData.subInfo.subscription_status === 'active') {
                        const subscriptionId = subUserData.subInfo.subscription_id;
                        const rowId = subUserData.subInfo.id;

                        fetcher.submit({ actionType: "cancelSubscription", subRowId: rowId, userSubId: subscriptionId, shop: shopname, stripeSecretKey: StripeSecretKey}, { method: "POST" });

                      }
                    },
                  }}
                >
                  <Text as="p">Your Subscription Plan Amount is : $9.99</Text>
                </CalloutCard>
              </Grid.Cell>
            ) : (
              // Before subscription show this grid
              <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6, xl: 6 }}>
                <CalloutCard
                  title="Pricing plan"
                  primaryAction={{
                    content: "Buy $9.99",
                    onAction: () => {
                        let shop = subUserData.shop;
                        let shopname = subUserData.shop;
                        shopname = shopname.split('.');
                        shopname = shopname[0];
                        let StripeSecretKey = subUserData.userinfo.stripeSecretKey;

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
                    Lorem ipsum dolor sit amet, consectetur adipisicing elit.
                  </Text>
                  <List type="bullet" gap="loose">
                    <List.Item>Lorem ipsum</List.Item>
                    <List.Item>Dolor sit amet</List.Item>
                    <List.Item>Consectetur adipiscing</List.Item>
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
        line_items: [
          {
            price: "price_1PrutPIgRSAwxCstAcWVhcys",
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
