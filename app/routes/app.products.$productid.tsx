import { json, useLoaderData, useNavigate } from "@remix-run/react";
import { useState } from "react";
import {
  Box,
  Card,
  Page,
  Icon,
  InlineGrid,
  BlockStack,
  SkeletonDisplayText,
  Bleed,
  Divider,
  SkeletonBodyText,
  Text,
  Thumbnail,
  SkeletonThumbnail,
  Button,
  IndexTable,
  Badge,
  TextField,
  Popover,
  ActionList,
} from "@shopify/polaris";


import {
  DuplicateIcon,
  ArchiveIcon,
  DeleteIcon,
  ClipboardIcon,
  PlusIcon,
  EditIcon,
  MenuHorizontalIcon,
} from "@shopify/polaris-icons";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { fetchStripeSingleProductById } from "../models/product.server";
export const loader = async ({ request, params }) => {
  const auth = await authenticate.admin(request);
  const userInfo = await db.user.findFirst({
    where: { shop: auth.session.shop },
  });
  if (!userInfo) return redirect("/app");
  const { product, price, currencyData } = await fetchStripeSingleProductById(
    userInfo,
    params.productid,
  );
  return json({ params, product, price, currencyData });
};

export default function SingleProductPage() {
  const { params, product, price, currencyData } = useLoaderData();
  const [popoverActive, setPopoverActive] = useState(false);
  const navigate=useNavigate();
  const updated = new Date(product?.updated * 1000).toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const created = new Date(product?.created * 1000).toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const resourceName = {
    singular: "pricing",
    plural: "pricing",
  };

  return (
    <Page
      backAction={{ content: "Products", url: "/app/products" }}
      title="Product Details"
      secondaryActions={[
        {
          content: "Archive",
          icon: ArchiveIcon,
          accessibilityLabel: "Secondary action label",
          onAction: () => alert("Archive action"),
        },
        {
          content: "Delete",
          icon: DeleteIcon,
          destructive: true,
          accessibilityLabel: "Secondary action label",
          onAction: () => alert("Delete action"),
        },
      ]}
    >
      <Card roundedAbove="sm">
        <BlockStack gap="400">
          <InlineGrid columns={2} gap="0">
            {product?.images && (product?.images).length < 0 ? (
              <SkeletonThumbnail size="large" />
            ) : (
              <Thumbnail
                source={product?.images[0]}
                size="large"
                alt={product?.name}
              />
            )}
            <Box>
              <Text variant="headingLg" as="h2">
              <span className="shopify-upr">{product?.name}</span>
              </Text>
              <Text>
                Price:{" "}
                {`${currencyData[0].symbolNative} ${price?.unit_amount / 100} ${currencyData[0].code}`}
              </Text>
            </Box>
          </InlineGrid>
          <Divider />
          <InlineGrid columns={2}>
            <Box>
              <Text variant="headingSm" as="h4">
                Updated
              </Text>
              <Text variant="headingSm" as="span">
                {updated}
              </Text>
            </Box>
            <Box>
              <Text variant="headingSm" as="h4">
                MRP
              </Text>
              <Text variant="headingSm" as="span">
                {`${currencyData[0].symbolNative} 0.00`}
              </Text>
            </Box>
          </InlineGrid>
          <Divider/>
          <Box border="divider" borderRadius="base" minHeight="2rem" />
          <InlineGrid columns={['twoThirds', 'oneThird']} gap={"400"}>
            <Text label="twoThirds"  as="h2" variant="headingLg">
              Details
            </Text>
            <Button label="twoThirds"  fullWidth={false} size="slim" icon={EditIcon}>Edit</Button>
          </InlineGrid>
          <InlineGrid columns={2} gap={"400"}>
            <Box>
              <Text>Name : {product?.name}</Text>
              <Text>Description : {product?.description}</Text>
              <Text>Created : {created}</Text>
              <Text>Statement descriptor : {product?.description}</Text>
              <Text>Marketing feature list : {product?.description}</Text>
            </Box>
            <Box>
              <Text as="h4" variant="headingMd">Images</Text>
              {product?.images && (product?.images).length < 0 ? (
                <SkeletonThumbnail size="large" />
              ) : (
                product?.images &&
                product?.images.map((url, i) => {
                  return (
                    <Thumbnail
                      key={i}
                      source={url}
                      size="large"
                      alt={product?.name}
                    />
                  );
                })
              )}
            </Box>
          </InlineGrid>
            <Divider/>

            <InlineGrid columns={['twoThirds', 'oneThird']} gap={"400"}>
            <Text label="twoThirds"  as="h2" variant="headingLg">
            Pricing
            </Text>
            <Button label="twoThirds"  fullWidth={false} size="slim" icon={EditIcon}>Edit</Button>

          </InlineGrid>
          <IndexTable
            headings={[
              { title: "Price" },
              { title: "API ID" },
              { title: "" },
              { title: "Created" },
              { title: "Action" },
              { title: "" },
            ]}
            itemCount={1}
            resourceName={resourceName}
            selectable={false}
          >
            <IndexTable.Row key={price?.id}>
              <IndexTable.Cell>
                <Text variant="bodyMd" fontWeight="bold" as="span">
                  {`${currencyData[0].symbolNative} ${price?.unit_amount / 100} ${currencyData[0].code}`}
                  <Badge tone={product?.default_price ? "info" : "attention"}>
                    {product?.default_price ? "Default" : "Not default"}
                  </Badge>
                </Text>
              </IndexTable.Cell>
              <IndexTable.Cell>
                <TextField fullWidth disabled value={product?.default_price} />
              </IndexTable.Cell>
              <IndexTable.Cell>
                <Button icon={ClipboardIcon} />
              </IndexTable.Cell>

              <IndexTable.Cell>{created}</IndexTable.Cell>
              <IndexTable.Cell>

                <Button onClick={()=>navigate(`/app/payment-links/create?price=${product?.default_price}`)} icon={PlusIcon}>Create Payment Link</Button>
              </IndexTable.Cell>
              <IndexTable.Cell>
                <Popover
                  active={popoverActive}
                  activator={
                    <Button
                      icon={MenuHorizontalIcon}
                      onClick={() => setPopoverActive(!popoverActive)}
                    />
                  }
                  autofocusTarget="first-node"
                  onClose={() => setPopoverActive(!popoverActive)}
                >
                  <ActionList
                    actionRole="menuitem"
                    items={[
                      {
                        content: "Edit price",
                        icon: DeleteIcon,
                      },
                      {
                        content: "Archive price",
                        icon:ArchiveIcon
                      },
                      {
                        content: "Create payment link",
                        icon:PlusIcon
                      },
                    ]}
                  />
                </Popover>
              </IndexTable.Cell>
            </IndexTable.Row>
          </IndexTable>
          <Divider/>
          <Box border="divider" borderRadius="base" minHeight="4rem" />
        </BlockStack>
      </Card>
    </Page>
  );
}

export const action = async ({ params, request }) => {
  const { method } = request;
  switch (method) {
    case "POST":
      return json({ method: "POST" });
    case "DELETE":
      return json({ method: "DELETE" });
    default:
      return json({ method: "not Allowed" });
  }
};

function customGrid() {
  return;
}
