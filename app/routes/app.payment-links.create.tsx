import {
  Form,
  json,
  useActionData,
  useLoaderData,
  useNavigation,
  useSearchParams,
  useSubmit
} from "@remix-run/react";
import {
  Box,
  Button,
  Card,
  FormLayout,
  Page,
  ResourceItem,
  ResourceList,
  Select,
  SkeletonThumbnail,
  Text,
  TextField,
  Thumbnail
} from "@shopify/polaris";
import { CheckIcon } from "@shopify/polaris-icons";
import { useEffect, useState } from "react";
import db from "../db.server";
import { authenticate } from "../shopify.server";

import { useAppBridge } from "@shopify/app-bridge-react";
import { createStripePaymentLink } from "../models/paymentlinks.server";
import { fetchStripeProducts, fetchStripeSingleProductByPriceid } from "../models/product.server";

export async function loader({ request, params }) {
  const auth = await authenticate.admin(request);
  const userInfo = await db.user.findFirst({
    // where: { shop: auth.session.shop },
    where: { shop: "kodrite.myshopify.com" },
  });
  if (!userInfo) return redirect("/app");
  const url = new URL(request.url);
  const priceid = url.searchParams.get("price");
  let response;
  if (priceid) {
    response = await fetchStripeSingleProductByPriceid(userInfo, priceid);
  } else {
    response = await fetchStripeProducts(userInfo);
  }
  return json(response);
}

export default function CreatePaymetLinkPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const shopify = useAppBridge();
  const query = searchParams.get("price");
  const actionData = useActionData();
  const submit = useSubmit();
  const { product, price, currencyData } = useLoaderData();
  const navigation =useNavigation();
  const [formState, setFormState] = useState({
    quantity: 1,
    priceid: query ? query : "",
    address: false,
    phonenumber: false,
    limit_payment: false,
    limit_payment_number: 1,
  });

  useEffect(() => {
    shopify.toast.show(actionData?.message, { isError: actionData?.isError });
    setFormState({
      quantity: 1,
      priceid: query ? query : "",
      address: false,
      phonenumber: false,
      limit_payment: false,
      limit_payment_number: 1,
    });
  }, [actionData]);

  console.log(navigation.formAction)
  return (
    <Page
      title="Create Payment Link"
      backAction={{ content: "Home", url: "/app" }}
    >
      <Box>
        <Card>
          <Form method="POST">
            <FormLayout>
              <Text as="h4" variant="headingMd">
                Product
              </Text>
              {!query ? (
                <Select
                  options={[
                    { value: "", label: "Select a product" },
                    product.map((item) => {
                      return {
                        value: `${item.default_price}`,
                        label: `${item.name}`,
                      };
                    }),
                  ].flat()}
                  name="priceid"
                  value={formState?.priceid}
                  onChange={(value) =>
                    setFormState({ ...formState, ["priceid"]: value })
                  }
                />
              ) : (
                <>
                  <ResourceList
                    resourceName={{ singular: "customer", plural: "customers" }}
                    items={[
                      {
                        price: `${currencyData[0]?.symbolNative} ${price?.unit_amount} ${currencyData[0]?.symbol}`,
                        name: product?.name,
                        image: product?.images[0],
                        id: product?.id,
                      },
                    ]}
                    selectable={false}
                    renderItem={(item) => {
                      const { id, name, image, price } = item;
                      return (
                        <ResourceItem
                          verticalAlignment="center"

                          id={id}
                          media={
                            image ? (
                              <Thumbnail
                                size="large"
                                alt={name}
                                source={image}
                              />
                            ) : (
                              <SkeletonThumbnail size="large"
                              alt={name} />
                            )
                          }
                          accessibilityLabel={`View details for ${name}`}
                          name={name}
                        >
                          <Text variant="bodyMd" fontWeight="bold" as="h3">
                            {name}
                          </Text>
                          <div>{`Price: ${price}`}</div>
                        </ResourceItem>
                      );
                    }}
                  />
                  <span className="con-display">
                    <TextField
                      type="text"
                      name="priceid"
                      labelHidden
                      value={formState?.priceid}
                      onChange={(value) =>
                        setFormState({ ...formState, ["priceid"]: value })
                      }
                    />
                  </span>
                </>
              )}
               <TextField
                type="number"
                name="quantity"
                label="Quantity"
                value={formState?.quantity}
                onChange={(value) =>
                  setFormState({ ...formState, ["quantity"]: value })
                }
              />
              {/* <Text as="h4" variant="headingMd">
                Option
              </Text>
              <Checkbox
                name="address"
                checked={formState?.address}
                onChange={(checked) =>
                  setFormState({ ...formState, ["address"]: checked })
                }
                label="Collect customers' addresses"
              />
              <Checkbox
                name="phonenumber"
                checked={formState?.phonenumber}
                onChange={(checked) =>
                  setFormState({ ...formState, ["phonenumber"]: checked })
                }
                label="Require customers to provide a phone number"
              />
              <Checkbox
                name="limit_payment"
                checked={formState?.limit_payment}
                onChange={(checked) =>
                  setFormState({ ...formState, ["limit_payment"]: checked })
                }
                label="Limit the number of payments"
              />
              {formState.limit_payment ? (
                <TextField
                  type="number"
                  name="limit_payment_number"
                  label="Number of payment limit"
                  value={formState?.limit_payment_number}
                  onChange={(value) =>
                    setFormState({
                      ...formState,
                      ["limit_payment_number"]: value,
                    })
                  }
                />
              ) : null} */}
              <Button variant="primary" submit icon={CheckIcon}>
                Create Link
              </Button>
            </FormLayout>
          </Form>
        </Card>
      </Box>
    </Page>
  );
}

export async function action({ request }) {
  const { method } = request;
  let formData = await request.formData();
  formData = Object.fromEntries(formData);
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  const userInfo = await db.setting.findFirst({ where: { shop: shop } });
  switch (method) {
    case "POST":
      const res = await createStripePaymentLink(userInfo, formData);
      // create a new payment link
      return json(res);
    default:
      return json({ message: "method not Allowed", isError: true });
  }
}
