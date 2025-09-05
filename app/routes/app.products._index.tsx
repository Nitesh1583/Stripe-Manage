import { Outlet, redirect, useLoaderData, useNavigate } from "@remix-run/react";
import { Modal, TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import {
  Card, Banner, IndexTable, Page, SkeletonThumbnail,
  Thumbnail, CalloutCard, Layout, Text, Popover, ActionList, Pagination
} from "@shopify/polaris";
import { LockIcon, PlusIcon, MenuHorizontalIcon } from "@shopify/polaris-icons";
import { useState, useMemo } from "react";
import db from "../db.server";
import { fetchStripeProducts } from "../models/product.server";
import { authenticate } from "../shopify.server";

export async function loader({ request }) {
  const auth = await authenticate.admin(request);
  const userInfo = await db.user.findFirst({ where: { shop: auth.session.shop } });

  if (!userInfo) return redirect("/app");

  const productResponse = await fetchStripeProducts(userInfo);
  return productResponse;
}

export default function DisputePage() {
  const shopify = useAppBridge();
  const navigate = useNavigate();
  const { products, premiumUser, UserInfo, subdata } = useLoaderData();
  const [model, setModel] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8; // Show 8 products per page

  console.log(products);

  // Date calculation logic (unchanged)
  const subscriptionCreatedDate = UserInfo.createdAt;
  const currentDate = new Date();
  const subDate = new Date(subscriptionCreatedDate).toISOString().split("T")[0];
  const currentDateFormatted = currentDate.toISOString().split("T")[0];
  const userTakesub = UserInfo.subCount;
  let daysDifference = 0;
  let newTrialEndDate = 0;

  if (daysDifference == 0 && userTakesub == 0) {
    daysDifference = 1;
  }

  if (userTakesub == 0) {
    const date1 = new Date(subDate);
    const date2 = new Date(currentDateFormatted);
    const timeDifference = date2 - date1;
    daysDifference = timeDifference / (1000 * 60 * 60 * 24);

    const trialEndDate = new Date(date1);
    trialEndDate.setDate(trialEndDate.getDate() + 6);
    const options = { year: "numeric", month: "long", day: "numeric" };
    newTrialEndDate = trialEndDate.toLocaleString("en-US", options);
  }

  //  Pagination logic
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return products.slice(start, start + itemsPerPage);
  }, [products, currentPage]);

  const totalPages = Math.ceil(products.length / itemsPerPage);

  const resourceName = {
    singular: "product",
    plural: "products",
  };

  return (
    <>
      <Modal
        open={model}
        onShow={() => setModel(true)}
        onHide={() => setModel(false)}
        id="my-modal"
      >
        <p>Message</p>
        <TitleBar title="Title">
          <button variant="primary">Label</button>
          <button>Label</button>
        </TitleBar>
      </Modal>

      <Page
        title="Products"
        backAction={{ content: "Home", url: "/app" }}
      >
        {(premiumUser == 0 && userTakesub == 0 && daysDifference <= 7) && (
          <Layout>
            <Layout.Section>
              <CalloutCard
                title=""
                primaryAction={{
                  content: "Upgrade Now",
                  onAction: () => {
                    const shopName = UserInfo?.shop.split(".")[0];
                    const url = `https://admin.shopify.com/store/${shopName}/charges/stripe-manage/pricing_plans`;
                    window.open(url, "_top");
                  },
                }}
              >
                <Text as="p" tone="critical">
                    Time is running out! Your free trial of Stripe Console ends on {newTrialEndDate} and we’d hate for you to lose access to all the premium features you’ve been enjoying.
                  </Text>
              </CalloutCard>
            </Layout.Section>
          </Layout>
        )}

        {(userTakesub == 1 || (userTakesub == 0 && daysDifference <= 7)) ? (
          <Layout>
            <Layout.Section>
              {/*Add for spacing*/}
            </Layout.Section> 

            <Layout.Section>
              <Card>
                <IndexTable
                  resourceName={resourceName}
                  itemCount={products.length}
                  selectable={false}
                  headings={[
                    // { title: "Image" },
                    { title: "Name" },
                    { title: "Price" },
                    { title: "Created" },
                    { title: "Updated" },
                  ]}
                >
                  {paginatedProducts.map((product) => {
                    const { id, price, currency, images, name, created, updated } = product;
                    const createddate = new Date(created * 1000).toLocaleString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                      hour: "numeric",
                      minute: "numeric",
                      hour12: true,
                    });
                    const updateddate = new Date(updated * 1000).toLocaleString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                      hour: "numeric",
                      minute: "numeric",
                      hour12: true,
                    });
                    return (
                      <IndexTable.Row id={id} key={id} position={id}>
                        {/*<IndexTable.Cell>
                          {images && images.length > 0 ? (
                            <Thumbnail source={images[0]} alt={name} size="small" />
                          ) : (
                            <SkeletonThumbnail size="small" />
                          )}
                        </IndexTable.Cell>*/}
                        <IndexTable.Cell>{name}</IndexTable.Cell>
                        <IndexTable.Cell>{price} {currency}</IndexTable.Cell>
                        <IndexTable.Cell>{createddate}</IndexTable.Cell>
                        <IndexTable.Cell>{updateddate}</IndexTable.Cell>
                      </IndexTable.Row>
                    );
                  })}
                </IndexTable>

                {/*  Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex justify-center py-4">
                    <Pagination
                      hasPrevious={currentPage > 1}
                      onPrevious={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      hasNext={currentPage < totalPages}
                      onNext={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    />
                  </div>
                )}
              </Card>
            </Layout.Section>
          </Layout>
        ) : (
          (userTakesub == 0 && daysDifference > 7) && (
            <CalloutCard
              title="No Trial/Subscription Found!"
              primaryAction={{
                content: "Buy Subscription",
                onAction: () => {
                  const shopName = UserInfo?.shop.split(".")[0];
                  const url = `https://admin.shopify.com/store/${shopName}/charges/stripe-manage/pricing_plans`;
                  window.open(url, "_top");
                },
              }}
            >
              <Text as="p">
                Your trial period has ended. Please buy a subscription to continue.
              </Text>
            </CalloutCard>
          )
        )}
      </Page>
    </>
  );
}
