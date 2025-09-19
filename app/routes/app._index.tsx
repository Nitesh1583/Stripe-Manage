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
  List,Tooltip,
  Link,
  IndexTable, InlineStack,Badge, Grid
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { json, redirect } from "@remix-run/node";

import db from "../db.server";
import { createUser, updateUser } from "../models/user.server";
import { fetchStripeRecentCustomers } from "../models/customer.server";
import { fetchStripeRecentPaymentData } from "../models/payment.server";
import { fetchStripeRecentInvoices } from "../models/invoices.server";
import { fetchStripeRecentPayouts, fetchStripeBalanceTransactions, fetchStripeBalance, 
getShopifyPlanStatus, getNextPayout} from "../models/payouts.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {

    const auth = await authenticate.admin(request);
    const shop = auth.session.shop;

    let userInfo = await db.user.findFirst({ where: { shop } });

     if (!userInfo) {
      // create if not exists
      userInfo = await createUser(shop);
      console.log("User created:", userInfo);
    } else {
      // update if exists
      userInfo = await updateUser(shop);
      console.log("User updated:", userInfo);
    }

    if (!userInfo) return redirect("/app");



    const { transactions } = await fetchStripeBalanceTransactions(userInfo);
    const balance = await fetchStripeBalance(userInfo);
    const { nextPayout } = await getNextPayout(userInfo);
    
    // Fetch plan status + subscriptions
    const { planStatus, activeSubs } = await getShopifyPlanStatus(request);
    const normalizedPlanStatus = planStatus === "PAID" || planStatus === "FREE" ? planStatus : "NONE";

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
      shopSyncResult,
      transactions,
      balanceAvailable: balance.available,
      balancePending: balance.pending,
      planStatus: normalizedPlanStatus,
      activeSubs,
      recentStripeCustomers,
      recentPaymentsData,
      recentInvoices,
      recentPayouts,
      userInfo,
      nextPayout
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


export default function Index() {
  const fetcher = useFetcher<typeof action>();
  const {shopSyncResult , transactions, balanceAvailable, balancePending, planStatus, activeSubs, recentStripeCustomers, 
  recentPaymentsData, recentInvoices, recentPayouts, userInfo, nextPayout } = useLoaderData<typeof loader>();

  useEffect(() => {
  console.log("Shop Sync Result:", shopSyncResult);
}, [shopSyncResult]);

  // Extract premiumUser value
  const premiumUser = userInfo?.premiumUser ?? 0; // fallback to 0 if null

  // Client debug logs
  console.log("CLIENT DEBUG: Plan Status =>", planStatus);
  console.log("CLIENT DEBUG: Active Subscriptions =>", activeSubs);
  console.log("Recent Customers => ", recentStripeCustomers);
  console.log("Recent Payment List => ", recentPaymentsData);
  console.log("Recent Invoices List => ", recentInvoices);
  console.log("Recent Payouts List => ", recentPayouts);
  console.log("Next Payout  => ", nextPayout);

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

  // Handle Pricing Button Click
  const handlePricing = () => {
    if (userInfo?.shop) {
      window.open(
        `https://admin.shopify.com/store/${userInfo.shop.split(".")[0]}/charges/stripe-manage/pricing_plans`,
        "_top"
      );
    }
  };

  return (
    <Page>
      <BlockStack gap="500">
        {/* Plan Status Badge */}
        <InlineStack align="center">
          <Badge
            tone={
              premiumUser === 2
                ? "success"
                : premiumUser === 1
                ? "attention"
                : "critical"
            }
          >
            {premiumUser === 2
              ? "Paid Plan Active"
              : premiumUser === 1
              ? "Free Plan Active"
              : "No Plan Active"}
          </Badge>
        </InlineStack>


        <Box
          padding="400"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <BlockStack gap="400" align="center">
            {/* Show Text only when premiumUser is 0 (No Plan active) */}
            {premiumUser === 0 && (
              <>
                <p style={{ textAlign: "center" }}>
                  No plan is currently active on your account. Please choose a plan
                  to unlock all features.
                </p>
                <InlineStack align="center" gap="200">
                  <Button onClick={handlePricing} variant="primary">
                    Choose Plan
                  </Button>
                </InlineStack>
              </>
            )}

            {/* Show Text only when premiumUser is 1 (Free Plan active) */}
            {premiumUser === 1 && (
              <>
                <p style={{ textAlign: "center" }}>
                  You are currently on the Free Plan. Upgrade to unlock premium features.
                </p>
                <InlineStack align="center" gap="200">
                  <Button onClick={handlePricing} variant="primary">
                    Upgrade Now
                  </Button>
                </InlineStack>
              </>
            )}
          </BlockStack>
        </Box>

        
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
                    <Text tone="subdued">
                      as of{" "}
                      {new Date().toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}{" "}
                      {new Date().toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </Text>
                    
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
                      {/*  Only wrap in Tooltip if NOT paid */}
                      {premiumUser !== 2 ? (
                        <Tooltip content="Upgrade to a paid plan to see your available balance" preferredPosition="above">
                          <span
                            style={{
                              filter: "blur(6px)", // Blur when not paid
                              userSelect: "none",
                              transition: "filter 0.3s ease-in-out",
                              cursor: "pointer",
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
                        </Tooltip>
                      ) : (
                        //  If paid, show normal value without tooltip or blur
                        <span>
                          {balanceAvailable.length > 0
                            ? balanceAvailable
                                .map(
                                  (b) =>
                                    `${(b.amount / 100).toFixed(2)} ${b.currency.toUpperCase()}`
                                )
                                .join(", ")
                            : "0.00"}
                        </span>
                      )}
                    </Text>

                    <Text tone="subdued">
                      Pending:{" "}
                      {/*  Only wrap in Tooltip if NOT paid */}
                      {premiumUser !== 2 ? (
                        <Tooltip content="Upgrade to a paid plan to see your pending" preferredPosition="above">
                          <span
                            style={{
                              filter: "blur(6px)", //  Blur when not paid
                              userSelect: "none",
                              transition: "filter 0.3s ease-in-out",
                              cursor: "pointer",
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
                        </Tooltip>
                      ) : (
                        // If paid, show normal value without tooltip or blur
                        <span>
                          {balancePending.length > 0
                            ? balancePending
                                .map(
                                  (b) =>
                                    `${(b.amount / 100).toFixed(2)} ${b.currency.toUpperCase()}`
                                )
                                .join(", ")
                            : "0.00"}
                        </span>
                      )}
                    </Text>

                  </BlockStack>

                  {/* Right side - Payout Section */}
                  <BlockStack gap="100" align="end">
                    <Text variant="headingSm">Payouts</Text>

                    {premiumUser !== 2 ? (
                      <Tooltip
                        content="Upgrade to a paid plan to see your next payout date or amount"
                        preferredPosition="above"
                      >
                        <div
                          style={{
                            filter: "blur(6px)",
                            userSelect: "none",
                            transition: "filter 0.3s ease-in-out",
                            cursor: "pointer",
                          }}
                        >
                          <Text tone="subdued">
                            Expected{" "}
                            {nextPayout
                              ? `${new Date(nextPayout.arrival_date * 1000).toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                })} • ${(nextPayout.amount / 100).toFixed(2)} ${nextPayout.currency.toUpperCase()}`
                              : "N/A"}
                          </Text>
                        </div>
                      </Tooltip>
                    ) : (
                      <Text tone="subdued">
                        Expected{" "}
                        {nextPayout
                          ? `${new Date(nextPayout.arrival_date * 1000).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })} • ${(nextPayout.amount / 100).toFixed(2)} ${nextPayout.currency.toUpperCase()}`
                          : "N/A"}
                      </Text>
                    )}
                  </BlockStack>

                </InlineStack>


              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>

        {/* Recent fetch */}
        <Layout>
          <Layout.Section>
            <Card padding="400">
              <Grid
                columns={{ xs: 1, sm: 3, md: 3, lg: 3, xl: 3 }}
                areas={{
                  xs: ["customers", "payments", "invoices"],
                  sm: [
                    "customers customers payments payments",
                    "invoices invoices",
                  ],
                  md: ["customers payments invoices"],
                  lg: ["customers payments invoices"],
                  xl: ["customers payments invoices"],
                }}
                gap="400" //  Add spacing between columns
              >
                <Grid.Cell area="customers">
                  <Text as="h2" variant="headingMd">
                    Recent Customers
                  </Text>
                  <CustomerPlaceholder height="100%" recentStripeCustomers={recentStripeCustomers} />
                </Grid.Cell>

                <Grid.Cell area="payments">
                  <Text as="h2" variant="headingMd">
                    Recent Payments
                  </Text>
                  <PaymentPlaceholder height="100%" recentPaymentsData={recentPaymentsData} />
                </Grid.Cell>

                <Grid.Cell area="invoices">
                  <Text as="h2" variant="headingMd">
                    Recent Invoices
                  </Text>
                  <InvoicesPlaceholder height="100%" recentInvoices={recentInvoices} premiumUser={premiumUser} />
                </Grid.Cell>
              </Grid>
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

const CustomerPlaceholder = ({height = 'auto', width = 'auto', recentStripeCustomers = null}) => {
  return (
    <div
      style={{
        background: '#ffffff',
        height: height,
        width: width,
      }}>
      <Card title=" Recent Customers">
      <IndexTable
        resourceName={{ singular: "customer", plural: "customers" }}
        itemCount={recentStripeCustomers?.length || 0}
        headings={[
          { title: "Name / Email" },
          // { title: "Email" },
          { title: "Card" },
          // { title: "Date" },
        ]}
        selectable={false}
      >
        {recentStripeCustomers?.length > 0 ? (
          recentStripeCustomers.map((customer, index) => (
            <IndexTable.Row id={customer.id} key={customer.id} position={index}>
              {/* Name + Email in same cell */}
                <IndexTable.Cell>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontWeight: "600" }}>
                      {customer.name || "N/A"}
                    </span>
                    <span style={{ fontSize: "13px", color: "#666" }}>
                      {customer.email || "No email"}
                    </span>
                  </div>
                </IndexTable.Cell>
              <IndexTable.Cell>
                {customer.brand
                  ? `${customer.brand.toUpperCase()} / ${customer.last4}`
                  : "No Card"}
              </IndexTable.Cell>
              {/*<IndexTable.Cell>{formatDate(customer.created)}</IndexTable.Cell>*/}
            </IndexTable.Row>
          ))
        ) : (
          <IndexTable.Row id="empty" key="empty" position={0}>
            <IndexTable.Cell colSpan={4}>
              <Text alignment="center" tone="subdued">
                No recent customers
              </Text>
            </IndexTable.Cell>
          </IndexTable.Row>
        )}
      </IndexTable>
    </Card>
    </div>
  );
};

const PaymentPlaceholder = ({height = 'auto', width = 'auto', recentPaymentsData = null}) => {
  return (
    <div
      style={{
        background: '#ffffff',
        height: height,
        width: width,
      }}>
      <Card title=" Recent Payments">
        <IndexTable
          resourceName={{ singular: "payment", plural: "payments" }}
          itemCount={recentPaymentsData?.recentPaymentsData?.length || 0}
          headings={[
            { title: "Name / Email" },
            { title: "Order ID" },
            { title: "Amount" },
            { title: "Status" }
          ]}
          selectable={false}
        >
          {recentPaymentsData?.recentPaymentsData?.length > 0 ? (
            recentPaymentsData.recentPaymentsData.map((payment, index) => (
              <IndexTable.Row id={payment.id} key={payment.id} position={index}>
                {/* Name + Email in same cell */}
                <IndexTable.Cell>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontWeight: "600" }}>
                      {payment.customerName || "N/A"}
                    </span>
                    <span style={{ fontSize: "13px", color: "#666" }}>
                      {payment.customerEmail || "No email"}
                    </span>
                  </div>
                </IndexTable.Cell>
                <IndexTable.Cell>{payment.orderID}</IndexTable.Cell>
                <IndexTable.Cell>
                  {payment.symbolNative} {(payment.amount / 100).toFixed(2)}{" "}
                  {payment.currencycode}
                </IndexTable.Cell>
                <IndexTable.Cell>
                  <Text tone={payment.status === "succeeded" ? "success" : "critical"}>
                    {payment.status}
                  </Text>
                </IndexTable.Cell>
                {/*<IndexTable.Cell>{formatDate(payment.created)}</IndexTable.Cell>*/}
              </IndexTable.Row>
            ))
          ) : (
            <IndexTable.Row id="empty" key="empty" position={0}>
              <IndexTable.Cell colSpan={4}>
                <Text alignment="center" tone="subdued">
                  No recent payments
                </Text>
              </IndexTable.Cell>
            </IndexTable.Row>
          )}
        </IndexTable>
      </Card>
    </div>
  );
};

const InvoicesPlaceholder = ({
  height = "auto",
  width = "auto",
  recentInvoices = null,
  premiumUser
}) => {
  const numericPremiumUser = Number(premiumUser); 

  return (
    <div
      style={{
        background: "#ffffff",
        height: height,
        width: width,
      }}
    >
      <Card title=" Recent Invoices">
        <IndexTable
          resourceName={{ singular: "invoice", plural: "invoices" }}
          itemCount={recentInvoices?.length || 0}
          headings={[
            { title: "Customer Name / Email" },
            { title: "Invoice ID" },
            { title: "Amount" },
            { title: "Status" },
          ]}
          selectable={false}
        >
          {recentInvoices?.length > 0 ? (
            recentInvoices.map((invoice, index) => (
              <IndexTable.Row id={invoice.id} key={invoice.id} position={index}>
                {/*  Customer Info Cell */}
                <IndexTable.Cell>
                  {numericPremiumUser !== 2 ? (
                    <Tooltip
                      preferredPosition="above"
                      content="Upgrade to a paid plan to see customer details"
                    >
                      <div
                        style={{
                          filter: "blur(6px)",
                          userSelect: "none",
                          cursor: "pointer",
                          transition: "filter 0.3s ease-in-out",
                        }}
                      >
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <span style={{ fontWeight: "600" }}>
                            {invoice.customerName || "N/A"}
                          </span>
                          <span style={{ fontSize: "13px", color: "#666" }}>
                            {invoice.customerEmail || "No email"}
                          </span>
                        </div>
                      </div>
                    </Tooltip>
                  ) : (
                    //  If paid, show normal data
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ fontWeight: "600" }}>
                        {invoice.customerName || "N/A"}
                      </span>
                      <span style={{ fontSize: "13px", color: "#666" }}>
                        {invoice.customerEmail || "No email"}
                      </span>
                    </div>
                  )}
                </IndexTable.Cell>

                {/* Invoice ID Cell */}
                <IndexTable.Cell>
                  {numericPremiumUser !== 2 ? (
                    <Tooltip
                      preferredPosition="above"
                      content="Upgrade to a paid plan to see invoice ID"
                    >
                      <span
                        style={{
                          filter: "blur(6px)",
                          userSelect: "none",
                          cursor: "pointer",
                        }}
                      >
                        {invoice.id}
                      </span>
                    </Tooltip>
                  ) : (
                    invoice.id
                  )}
                </IndexTable.Cell>

                {/* Amount Cell */}
                <IndexTable.Cell>
                  {numericPremiumUser !== 2 ? (
                    <Tooltip
                      preferredPosition="above"
                      content="Upgrade to a paid plan to see amount"
                    >
                      <span
                        style={{
                          filter: "blur(6px)",
                          userSelect: "none",
                          cursor: "pointer",
                        }}
                      >
                        {invoice.currency} {parseFloat(invoice.amount).toFixed(2)}
                      </span>
                    </Tooltip>
                  ) : (
                    `${invoice.currency} ${parseFloat(invoice.amount).toFixed(2)}`
                  )}
                </IndexTable.Cell>

                {/*  Status Cell */}
                <IndexTable.Cell>
                  {numericPremiumUser !== 2 ? (
                    <Tooltip
                      preferredPosition="above"
                      content="Upgrade to a paid plan to see status"
                    >
                      <span
                        style={{
                          filter: "blur(6px)",
                          userSelect: "none",
                          cursor: "pointer",
                        }}
                      >
                        {invoice.status}
                      </span>
                    </Tooltip>
                  ) : (
                    <Text tone={invoice.status === "paid" ? "success" : "critical"}>
                      {invoice.status}
                    </Text>
                  )}
                </IndexTable.Cell>
              </IndexTable.Row>
            ))
          ) : (
            <IndexTable.Row id="empty" key="empty" position={0}>
              <IndexTable.Cell colSpan={4}>
                <Text alignment="center" tone="subdued">
                  No recent invoices
                </Text>
              </IndexTable.Cell>
            </IndexTable.Row>
          )}
        </IndexTable>
      </Card>
    </div>
  );
};
