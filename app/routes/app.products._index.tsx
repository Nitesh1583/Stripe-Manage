import { Outlet, redirect, useLoaderData, useNavigate } from "@remix-run/react";
import { Modal, TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import {
  Card,
  IndexTable,
  Page,
  SkeletonThumbnail,
  Thumbnail,
  CalloutCard,
  Text 
} from "@shopify/polaris";
import { LockIcon, PlusIcon } from "@shopify/polaris-icons";
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
  const { products, premiumUser,UserInfo} = useLoaderData();
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

  // Convert to Date objects (ensuring time is ignored)
  const date1 = new Date(subDate);
  const date2 = new Date(currentDateFormatted);

  // Calculate the difference in days
  const timeDifference = date2 - date1;
  const daysDifference = timeDifference / (1000 * 60 * 60 * 24);

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
        primaryAction={{
          content: "Add product",
          onAction: () => (premiumUser ? setModel(!model) : redirect("/app")),
          icon: premiumUser ? PlusIcon : LockIcon,
        }}
        secondaryActions={[
          { content: "Export", onAction: () => alert("Duplicate action") },
        ]}
      >
      {premiumUser === 1 || daysDifference <= 7 ? (
        <>
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
              { title: "Action" },
            ]}
          >
            {products &&
              products.map((product, index) => {
                const { id, price, images, name, created, updated } = product;
                const createddate = new Date(created * 1000).toLocaleString();
                const updateddate = new Date(updated * 1000).toLocaleString();
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
                    <IndexTable.Cell>{price}</IndexTable.Cell>
                    <IndexTable.Cell>{createddate}</IndexTable.Cell>
                    <IndexTable.Cell>{updateddate}</IndexTable.Cell>
                    <IndexTable.Cell>{"--"}</IndexTable.Cell>
                  </IndexTable.Row>
                );
              })}
          </IndexTable>
        </Card>
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
