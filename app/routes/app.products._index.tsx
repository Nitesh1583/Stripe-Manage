import { Outlet, redirect, useLoaderData, useNavigate } from "@remix-run/react";
import { Modal, TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import {
  Card,
  IndexTable,
  Page,
  SkeletonThumbnail,
  Thumbnail
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
  const { products, premiumUser } = useLoaderData();
  const [model, setModel] = useState(false);

  const resourceName = {
    singular: "products",
    plural: "products",
  };
  // const { selectedResources, allResourcesSelected, handleSelectionChange } =
  // useIndexResourceState(products);

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
      </Page>
      <Outlet/>
    </>
  );
}
