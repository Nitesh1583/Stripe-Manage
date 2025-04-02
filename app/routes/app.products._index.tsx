import { Outlet, redirect, useLoaderData, useNavigate } from "@remix-run/react";
import { Modal, TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import {
  Card,Banner,
  IndexTable,
  Page,
  SkeletonThumbnail,
  Thumbnail,
  CalloutCard,Layout,
  Text ,Popover,ActionList,
} from "@shopify/polaris";
import { LockIcon, PlusIcon, MenuHorizontalIcon } from "@shopify/polaris-icons";
import { useState } from "react";
import db from "../db.server";
import { fetchStripeProducts } from "../models/product.server";
import { authenticate } from "../shopify.server";


export async function loader({ request }) {
  const auth = await authenticate.admin(request);
  const userInfo = await db.user.findFirst({
    where: { shop: auth.session.shop },
  });
  if (!userInfo) return redirect("/app");
  const productResponse = await fetchStripeProducts(userInfo);
  return productResponse;
}

export default function DisputePage() {
  const shopify = useAppBridge();
  const navigate = useNavigate();
  const { products, premiumUser, UserInfo, subdata} = useLoaderData();
  const [model, setModel] = useState(false); 

  const resourceName = {
    singular: "products",
    plural: "products",
  };
  // const { selectedResources, allResourcesSelected, handleSelectionChange } =
  // useIndexResourceState(products);

  // Date calculations
  const subscriptionCreatedDate = UserInfo.createdAt; //DateTime format : 2025-03-07T11:27:57.468Z

  const currentDate = new Date(); //DateTime format : Thu Mar 13 2025 13:16:10 GMT+0530 (India Standard Time)
  
  const subDate = new Date(subscriptionCreatedDate).toISOString().split("T")[0]; 
  const currentDateFormatted = currentDate.toISOString().split("T")[0]; 

  const userTakesub = UserInfo.subCount;
  let daysDifference = 0;
  let newTrialEndDate = 0; 

  if (userTakesub == 0) {

      // Convert to Date objects (ensuring time is ignored)
      const date1 = new Date(subDate);
      const date2 = new Date(currentDateFormatted);


      // Calculate the difference in days
      const timeDifference = date2 - date1;
      daysDifference = timeDifference / (1000 * 60 * 60 * 24);

      const trialEndDate = new Date(date1);
      trialEndDate.setDate(trialEndDate.getDate() + 6);

      const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
      // hour: "numeric",
      // minute: "numeric",
      // hour12: true,
    };

    newTrialEndDate = trialEndDate.toLocaleString("en-US", options);
  }

  if (daysDifference == 0 && userTakesub == 0) {
    daysDifference = 1;
  }

  


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
        // primaryAction={{
        //   content: "Add product",
        //   onAction: () => (premiumUser ? setModel(!model) : redirect("/app")),
        //   icon: premiumUser ? PlusIcon : LockIcon,
        // }}
        // secondaryActions={[
        //   { content: "Export", onAction: () => alert("Duplicate action") },
        // ]}
      >

      {(premiumUser == 0 && daysDifference <= 7  && userTakesub == 0) ?
        <>
          <Layout>  
            <Layout.Section>
              <CalloutCard
                title=""
                primaryAction={{
                  content: "Upgrade Now",
                  url: "/app/pricing",
                }}
              >
                <Text as="p" tone="critical">
                  Time is running out! Your free trial of Stripe Console ends on {newTrialEndDate} and we’d hate for you to lose access to all the premium features you’ve been enjoying.
                </Text>
              </CalloutCard>
            </Layout.Section>
          </Layout>
        </>
      :''}

      {((premiumUser == 1 && userTakesub == 1) || (daysDifference <= 7 && daysDifference != 0) ) ? (
        <>
        <Layout>
         <Layout.Section>
           {/*Add for spacing*/}
         </Layout.Section>  
         
         <Layout.Section>
          <Card>
          <IndexTable
            resourceName={resourceName}
            // itemCount={products.length}
            itemCount={products.length > 0 ? products.length : 1}
            // selectedItemsCount={
            //   allResourcesSelected ? "All" : selectedResources.length
            // }
            // onSelectionChange={handleSelectionChange}
            headings={[
              { title: "Image" },
              { title: "Name" },
              { title: "Price" },
              { title: "Created" },
              { title: "Updated" },
              // { title: "Action" },
            ]}
            selectable={false}
          >
            {products &&
              products.map((product, index, isActive) => {
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
                  <IndexTable.Row
                    id={id}
                    key={id}
                    // selected={selectedResources.includes(id)}
                    position={id}
                    // onNavigation={`product/${id}`}
                    onClick={() => navigate(`${id}`)}
                  >
                    <IndexTable.Cell>
                      {images && images.length > 0 ? (
                        <Thumbnail source={images[0]} alt={name} size="small" />
                      ) : (
                        <SkeletonThumbnail size="small" />
                      )}
                    </IndexTable.Cell>
                    <IndexTable.Cell><span className="shopify-upr">{name}</span></IndexTable.Cell>
                    <IndexTable.Cell>{price} {currency}</IndexTable.Cell>
                    <IndexTable.Cell>{createddate}</IndexTable.Cell>
                    <IndexTable.Cell>{updateddate}</IndexTable.Cell>
                  </IndexTable.Row>
                );
              })}
          </IndexTable>
        </Card>
        </Layout.Section> 
        </Layout>
        </>
        ):(
          <CalloutCard
            title="No Trial/Subscription Found!"
            primaryAction={{
              content: "Buy Subscription",
              url: "/app/pricing",
            }}
          >
            <Text as="p">You trial period has ended. If you want to continue, click on the below button to buy the subscription.</Text>
          </CalloutCard>
      )}
        
      </Page>
      <Outlet/>
    </>
  );
}
