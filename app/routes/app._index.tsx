import { useEffect } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { useFetcher, useLoaderData  } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  Button,
  BlockStack,
  Box,
  List,
  Link,
  InlineStack,Badge
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { json, redirect } from "@remix-run/node";

import db from "../db.server";
import { fetchStripeRecentCustomers } from "../models/customer.server";
import { fetchStripeRecentPaymentData } from "../models/payment.server";
import { fetchStripeRecentInvoices } from "../models/invoices.server";
import { fetchStripeRecentPayouts } from "../models/payouts.server";
import { fetchStripeBalanceTransactions, fetchStripeBalance, getShopifyPlanStatus   } from "../models/payouts.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const auth = await authenticate.admin(request);

    const userInfo = await db.user.findFirst({
      where: { shop: auth.session.shop },
    });

    if (!userInfo) return redirect("/app");

    const { transactions } = await fetchStripeBalanceTransactions(userInfo);
    const balance = await fetchStripeBalance(userInfo);
    
    // Fetch plan status + subscriptions
    const { planStatus, activeSubs } = await getShopifyPlanStatus(request);

    console.log("SERVER DEBUG: Plan Status =>", planStatus);
    activeSubs.forEach((sub) => {
      console.log(
        `SERVER DEBUG: Subscription Name: ${sub.name}, Status: ${sub.status}, Price: ${
          sub.lineItems?.[0]?.plan?.pricingDetails?.price?.amount ?? 0
        }`
      );
    });

    const { recentStripeCustomers } = await fetchStripeRecentCustomers(userInfo);
    const recentPaymentsData = await fetchStripeRecentPaymentData(userInfo);
    const { recentInvoices } = await fetchStripeRecentInvoices(userInfo);
    const { recentPayouts } = await fetchStripeRecentPayouts(userInfo);

    return json({
      transactions,
      balanceAvailable: balance.available,
      balancePending: balance.pending,
      planStatus,
      activeSubs,
      recentStripeCustomers,
      recentPaymentsData,
      recentInvoices,
      recentPayouts,
    });
  } catch (error) {
    console.error("Loader failed:", error);
    return json(
      {
        transactions: [],
        balanceAvailable: [],
        balancePending: [],
        planStatus: null,
        activeSubs: [],
      },
      { status: 500 }
    );
  }
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const color = ["Red", "Orange", "Yellow", "Green"][
    Math.floor(Math.random() * 4)
  ];
  const response = await admin.graphql(
    `#graphql
      mutation populateProduct($product: ProductCreateInput!) {
        productCreate(product: $product) {
          product {
            id
            title
            handle
            status
            variants(first: 10) {
              edges {
                node {
                  id
                  price
                  barcode
                  createdAt
                }
              }
            }
          }
        }
      }`,
    {
      variables: {
        product: {
          title: `${color} Snowboard`,
        },
      },
    },
  );
  const responseJson = await response.json();

  const product = responseJson.data!.productCreate!.product!;
  const variantId = product.variants.edges[0]!.node!.id!;

  const variantResponse = await admin.graphql(
    `#graphql
    mutation shopifyRemixTemplateUpdateVariant($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
      productVariantsBulkUpdate(productId: $productId, variants: $variants) {
        productVariants {
          id
          price
          barcode
          createdAt
        }
      }
    }`,
    {
      variables: {
        productId: product.id,
        variants: [{ id: variantId, price: "100.00" }],
      },
    },
  );

  const variantResponseJson = await variantResponse.json();

  return {
    product: responseJson!.data!.productCreate!.product,
    variant:
      variantResponseJson!.data!.productVariantsBulkUpdate!.productVariants,
  };
};

export default function Index() {
  const fetcher = useFetcher<typeof action>();
  const { transactions, balanceAvailable, balancePending, planStatus, activeSubs, recentStripeCustomers, 
  recentPaymentsData, recentInvoices, recentPayouts} = useLoaderData<typeof loader>();

  // Client debug logs
  console.log("CLIENT DEBUG: Plan Status =>", planStatus);
  console.log("CLIENT DEBUG: Active Subscriptions =>", activeSubs);
  console.log("Recent Customers => ", recentStripeCustomers);
  console.log("Recent Payment List => ", recentPaymentsData);
  console.log("Recent Invoices List => ", recentInvoices);
  console.log("Recent Payouts List => ", recentPayouts);

  // Helper function to format Stripe's created timestamp
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000); // Stripe gives seconds, JS needs ms
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Get today's date range
  const today = new Date();
  today.setHours(0, 0, 0, 0); // start of today
  const startOfDay = today.getTime() / 1000;
  const endOfDay = startOfDay + 86400;

  // Calculate yesterday's date range
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const startOfYesterday = yesterday.getTime() / 1000;
  const endOfYesterday = startOfYesterday + 86400;

  // Filter today's transactions
  const todayTransactions = transactions.filter(
    (tx) => tx.created >= startOfDay && tx.created < endOfDay
  );

  // Filter yesterday's transactions
  const yesterdayTransactions = transactions.filter(
    (tx) => tx.created >= startOfYesterday && tx.created < endOfYesterday
  );

  // Calculate totals
  const todayTotal = todayTransactions.reduce((sum, tx) => sum + tx.amount, 0) / 100;
  const yesterdayTotal = yesterdayTransactions.reduce((sum, tx) => sum + tx.amount, 0) / 100;

  const shopify = useAppBridge();
  
  const isLoading =
    ["loading", "submitting"].includes(fetcher.state) &&
    fetcher.formMethod === "POST";
  const productId = fetcher.data?.product?.id.replace(
    "gid://shopify/Product/",
    "",
  );

  useEffect(() => {
    if (productId) {
      shopify.toast.show("Product created");
    }
  }, [productId, shopify]);
  const generateProduct = () => fetcher.submit({}, { method: "POST" });

  useEffect(() => {
    if (planStatus === "PAID") {
      console.log("User is on a paid plan");
    } else {
      console.log("User is on free plan");
    }  
  }, [planStatus]);

  return (
    <Page>
      <BlockStack gap="500">
        {/* Plan Status Badge */}
        <InlineStack align="center">
          <Badge tone={planStatus === "PAID" ? "success" : "critical"}>
            {planStatus === "PAID" ? "Paid Plan Active" : "Free Plan"}
          </Badge>
        </InlineStack>
        
        {/*  Top Overview Section */}
        <Layout>
          <Layout.Section>
            
            <Card padding="400">
              <BlockStack gap="400">
                {/* Top Row: Gross Volume + Yesterday */}
                <InlineStack align="space-between" blockAlign="center">
                  <BlockStack gap="100">
                    <Text variant="headingMd" as="h2">
                      Today volume
                    </Text>
                     <Text variant="heading2xl" as="p">
                      ${todayTotal.toFixed(2)}
                    </Text>
                    <Text tone="subdued">as of {new Date().toLocaleTimeString()}</Text>
                  </BlockStack>

                  <BlockStack gap="100" align="end">
                    <Text variant="headingMd" as="h2">
                      Yesterday
                    </Text>
                    <Text variant="headingLg" as="p">
                      ${yesterdayTotal.toFixed(2)}
                    </Text>
                  </BlockStack>
                </InlineStack>

                {/* Bottom Row: USD Balance + Payouts */}
                <InlineStack align="space-between">
                  <BlockStack gap="100">
                    <Text variant="headingSm">USD Balance</Text>

                    <Text tone="subdued">
                      Available:{" "}
                      <span
                        style={{
                          filter: planStatus === "PAID" ? "none" : "blur(6px)",
                          userSelect: planStatus === "PAID" ? "auto" : "none",
                          transition: "filter 0.3s ease-in-out",
                        }}
                      >
                        {balanceAvailable.length > 0
                          ? balanceAvailable
                              .map(
                                (b) =>
                                  `${(b.amount / 100).toFixed(2)} ${b.currency.toUpperCase()}`
                              )
                              .join(", ")
                          : "0.00"}
                      </span>
                    </Text>

                    <Text tone="subdued">
                      Pending:{" "}
                      <span
                        style={{
                          filter: planStatus === "PAID" ? "none" : "blur(6px)",
                          userSelect: planStatus === "PAID" ? "auto" : "none",
                          transition: "filter 0.3s ease-in-out",
                        }}
                      >
                        {balancePending.length > 0
                          ? balancePending
                              .map(
                                (b) =>
                                  `${(b.amount / 100).toFixed(2)} ${b.currency.toUpperCase()}`
                              )
                              .join(", ")
                          : "0.00"}
                      </span>
                    </Text>
                  </BlockStack>

                  <BlockStack gap="100" align="end">
                    <Text variant="headingSm">Payouts</Text>
                    <Text tone="subdued">Expected Sep 2</Text>
                    <Button plain>View</Button>
                  </BlockStack>
                </InlineStack>


              </BlockStack>
            </Card>
          </Layout.Section>

          {/* Right Side Recommendation Card */}
          <Layout.Section secondary>
            <Card padding="400">
              <BlockStack gap="200">
                <Text variant="headingMd" as="h2">
                  Recommendation
                </Text>
                <Text tone="subdued">
                  Upgrade to a premium membership plan to access all the powerful
                  features of the Stripe Console.
                </Text>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>

        {/* Combined Recent Data Section */}
        <Layout>
          <Layout.Section>
            <Card title="Recent Activity">
              <InlineStack align="start" gap="400">
                {/* Column 1: Recent Customers */}
                <BlockStack gap="300" flex="1">
                  <Text variant="headingSm" as="h3">Recent Customers</Text>
                  {recentStripeCustomers && recentStripeCustomers.length > 0 ? (
                    recentStripeCustomers.map((customer) => (
                      <Box
                        key={customer.id}
                        padding="300"
                        borderColor="border-subdued"
                        borderStyle="solid"
                        borderWidth="025"
                        borderRadius="300"
                      >
                        <BlockStack gap="050">
                          <Text variant="bodyMd">{customer.name || "N/A"}</Text>
                          <Text tone="subdued" variant="bodySm">{customer.email || "No email"}</Text>
                          <Text variant="bodySm">
                            {customer.brand
                              ? `${customer.brand.toUpperCase()} • ${customer.last4}`
                              : "No Card Info"}
                          </Text>
                          <Text tone="subdued" variant="bodySm">
                            Created: {formatDate(customer.created)}
                          </Text>
                        </BlockStack>
                      </Box>
                    ))
                  ) : (
                    <Text tone="subdued">No recent customers</Text>
                  )}
                </BlockStack>

                {/* Column 2: Recent Payments */}
                <BlockStack gap="300" flex="1">
                  <Text variant="headingSm" as="h3">Recent Payments</Text>
                  {recentPaymentsData && recentPaymentsData.recentPaymentsData.length > 0 ? (
                    recentPaymentsData.recentPaymentsData.map((payment) => (
                      <Box
                        key={payment.id}
                        padding="300"
                        borderColor="border-subdued"
                        borderStyle="solid"
                        borderWidth="025"
                        borderRadius="300"
                      >
                        <BlockStack gap="050">
                          <Text variant="bodyMd">Order: {payment.orderID}</Text>
                          <Text tone="subdued" variant="bodySm">
                            Customer: {payment.customerName}
                          </Text>
                          <Text variant="bodySm">
                            {payment.symbolNative} {(payment.amount / 100).toFixed(2)} {payment.currencycode}
                          </Text>
                          <Badge tone={payment.status === "succeeded" ? "success" : "critical"}>
                            {payment.status}
                          </Badge>
                          <Text tone="subdued" variant="bodySm">
                            Created: {formatDate(payment.created)}
                          </Text>
                        </BlockStack>
                      </Box>
                    ))
                  ) : (
                    <Text tone="subdued">No recent payments</Text>
                  )}
                </BlockStack>

                {/* Column 3: Recent Invoices */}
                <BlockStack gap="300" flex="1">
                  <Text variant="headingSm" as="h3">Recent Invoices</Text>
                  {recentInvoices && recentInvoices.length > 0 ? (
                    recentInvoices.map((invoice) => (
                      <Box
                        key={invoice.id}
                        padding="300"
                        borderColor="border-subdued"
                        borderStyle="solid"
                        borderWidth="025"
                        borderRadius="300"
                      >
                        <BlockStack gap="050">
                          <Text variant="bodyMd">Invoice: {invoice.id}</Text>
                          <Text tone="subdued" variant="bodySm">
                            Customer: {invoice.customerName || "N/A"}
                          </Text>
                          <Text variant="bodySm">
                            {invoice.currency} {parseFloat(invoice.amount).toFixed(2)}
                          </Text>
                          <Badge tone={invoice.status === "paid" ? "success" : "critical"}>
                            {invoice.status}
                          </Badge>
                        </BlockStack>
                      </Box>
                    ))
                  ) : (
                    <Text tone="subdued">No recent invoices</Text>
                  )}
                </BlockStack>
              </InlineStack>
            </Card>
          </Layout.Section>
        </Layout>


        {/* Keep your marketing content */}
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="500">
                <BlockStack gap="200">
                  <Text as="h2" variant="headingLg">
                    The Ultimate Stripe Console Management Dashboard for Shopify 🎉
                  </Text>
                  <Text variant="bodyMd" as="p">
                    Tired of juggling multiple platforms to manage your payments? Say hello to Stripe Console App, the all-in-one payment management dashboard designed exclusively for Shopify. Unlike traditional payment processors, Stripe Console is not a payment gateway—it’s a powerful management console that brings Stripe-like functionality directly into your Shopify environment. Now you can manage payments, customers, products, disputes, and more, all from one centralized, user-friendly dashboard.
                  </Text>
                </BlockStack>
                <BlockStack gap="200">
                  <Text variant="bodyMd" as="p">
                    With Stripe Console, you get the same robust features as Stripe’s management console, but with the added advantage of seamless integration into Shopify. No more switching between platforms or dealing with complex setups—everything you need is right at your fingertips, within Shopify.
                  </Text>
                </BlockStack>
                <BlockStack gap="200">
                  <Text as="h2" variant="headingMd">
                    Key Features of Stripe Console App:
                  </Text>
                </BlockStack>
                <BlockStack gap="100">
                    <Text as="h4" variant="headingSm">
                      1. Centralized Payment Management:
                    </Text>
                    <BlockStack gap="50">
                      <Text as="p" variant="bodyMd">
                        * View and manage all your payments in one place with the Payments Manage List.
                      </Text>
                      <Text as="p" variant="bodyMd">
                        * Track transactions, filter by status, and export data for reporting.
                      </Text>
                    </BlockStack>
                </BlockStack>
                
                <BlockStack gap="200">
                    <Text as="h4" variant="headingSm">
                      2. Customer Management:
                    </Text>
                    <BlockStack gap="100">
                      <Text as="p" variant="bodyMd">
                        * Access a comprehensive Customers List to view customer details, payment history, and activity.
                      </Text>
                      <Text as="p" variant="bodyMd">
                        * Improve customer relationships with better insights and interaction.
                      </Text>
                    </BlockStack>
                </BlockStack>
                
                <BlockStack gap="200">
                    <Text as="h4" variant="headingSm">
                      3. Product Sales Tracking:
                    </Text>
                    <BlockStack gap="100">
                      <Text as="p" variant="bodyMd">
                        * Monitor your Products Sold List to see which items are performing best.
                      </Text>
                      <Text as="p" variant="bodyMd">
                        * Gain valuable insights into your sales trends and inventory performance.
                      </Text>
                    </BlockStack>
                </BlockStack>
                
                <BlockStack gap="200">
                    <Text as="h4" variant="headingSm">
                      4. Dispute Resolution:
                    </Text>
                    <BlockStack gap="100">
                      <Text as="p" variant="bodyMd">
                        * Manage and resolve disputes efficiently with the Disputes List.
                      </Text>
                      <Text as="p" variant="bodyMd">
                        * Stay on top of chargebacks and customer issues with real-time updates.  
                      </Text>
                    </BlockStack>
                </BlockStack>
                

                <BlockStack gap="200">
                    <Text as="h4" variant="headingSm">
                      5. Payment Links Management:
                    </Text>
                    <BlockStack gap="100">
                      <Text as="p" variant="bodyMd">
                        * Create, track, and manage Payment Links for seamless transactions.
                      </Text>
                      <Text as="p" variant="bodyMd">
                        * Simplify the payment process for your customers with easy-to-use links.
                      </Text>
                    </BlockStack>
                </BlockStack>
                

                <BlockStack gap="200">
                    <Text as="h4" variant="headingSm">
                      6. Improved Accessibility:
                    </Text>

                    <BlockStack gap="100">
                      <Text as="p" variant="bodyMd">
                        * Everything is integrated into Shopify, so you don’t need to log in to a separate platform.
                      </Text>
                      <Text as="p" variant="bodyMd">
                        * Enjoy a streamlined workflow with all your payment management tools in one place.
                      </Text>
                    </BlockStack>
                </BlockStack>
                

                <BlockStack gap="200">
                    <Text as="h4" variant="headingSm">
                      7. Enhanced User Experience:
                    </Text>
                    <BlockStack gap="100">
                      <Text as="p" variant="bodyMd">
                        * A clean, intuitive interface designed for ease of use.
                      </Text>
                      <Text as="p" variant="bodyMd">
                        * Customizable views and filters to suit your business needs.
                      </Text>
                    </BlockStack>
                </BlockStack>
                

                <BlockStack gap="200">
                    <Text as="h4" variant="headingSm">
                      8. Real-Time Analytics and Reporting:
                    </Text>
                    <BlockStack gap="100">
                      <Text as="p" variant="bodyMd">
                        * Generate detailed reports on payments, customers, and products.
                      </Text>
                      <Text as="p" variant="bodyMd">
                        * Make data-driven decisions with real-time insights.
                      </Text>
                    </BlockStack>
                </BlockStack>
                

                <BlockStack gap="200">
                    <Text as="h4" variant="headingSm">
                      9. 7-Day Free Trial:
                    </Text>

                    <BlockStack gap="100">
                      <Text as="p" variant="bodyMd">
                        * Try Stripe Console App risk-free for 7 days and experience the benefits of a centralized payment management dashboard.
                      </Text>
                      <Text as="p" variant="bodyMd">
                        *  After the trial, continue with a subscription-based plan tailored to your business needs.
                      </Text>
                    </BlockStack>
                </BlockStack>
                

                <BlockStack gap="200">
                    <Text as="h4" variant="headingSm">
                      Why Choose Stripe Console App?
                    </Text>

                    <BlockStack gap="100">
                      <Text as="p" variant="bodyMd">
                        • All-in-One Dashboard: Manage payments, customers, products, disputes, and more—all within Shopify.
                      </Text>
                      <Text as="p" variant="bodyMd">
                        • Seamless Integration: No need to switch between platforms or manage multiple logins. Everything is built into Shopify.
                      </Text>
                      <Text as="p" variant="bodyMd">
                        • Improved Accessibility: Access your payment management tools directly from your Shopify dashboard.
                      </Text>
                      <Text as="p" variant="bodyMd">
                        • Better Interaction: Enjoy a more cohesive and interactive experience with all your payment data in one place.
                      </Text>
                      <Text as="p" variant="bodyMd">
                        • Cost-Effective: A subscription-based model ensures you only pay for what you need, without hidden fees.
                      </Text>
                    </BlockStack>
                </BlockStack>
                

                <BlockStack gap="200">
                    <Text as="h4" variant="headingSm">
                      How It Works:
                    </Text>
                    <BlockStack gap="100">
                      <Text as="p" variant="bodyMd">
                        1.Install the App: Add Stripe Console App to your Shopify store in just a few clicks.
                      </Text>
                      <Text as="p" variant="bodyMd">
                        2.Start Your Free Trial: Explore all the features risk-free for 7 days.
                      </Text>
                      <Text as="p" variant="bodyMd">
                        3.Manage Payments: Use the dashboard to manage payments, customers, products, disputes, and more—all within Shopify.
                      </Text>
                      <Text as="p" variant="bodyMd">
                        4.Upgrade to a Subscription: Continue using the app with a flexible subscription plan after your trial ends.
                      </Text>
                    </BlockStack>
                </BlockStack>
                

                <BlockStack gap="200">
                    <Text as="h4" variant="headingSm">
                      Transform Your Payment Management Today
                    </Text>

                    <BlockStack gap="100">
                       <Text as="p" variant="bodyMd">
                        Stripe Console App is the ultimate solution for Shopify merchants who want to streamline their payment management without the hassle of external platforms. Whether you’re a small business or a growing enterprise, Stripe Console App gives you the tools you need to stay in control of your payments, customers, and sales—all from the comfort of your Shopify dashboard.
                      </Text>
                     </BlockStack>
                </BlockStack>
                 
                 <BlockStack gap="200">
                    <Text as="h4" variant="headingSm">
                      Ready to simplify your payment management? Install Stripe Console App today and start your 7-day free trial. Experience the future of payment management, built exclusively for Shopify.
                    </Text>
                </BlockStack>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}