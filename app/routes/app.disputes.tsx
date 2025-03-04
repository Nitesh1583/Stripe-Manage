import {
  Box,
  Page,
  Text,
  BlockStack,
  InlineGrid,
  useIndexResourceState,
  Card,
  IndexTable,
  Badge,
  Thumbnail,
  InlineStack,
} from "@shopify/polaris";
import { useLoaderData, redirect } from "@remix-run/react";
import { json } from "@remix-run/react";
import db from "../db.server";
import { authenticate } from "../shopify.server";
import { fetchDisputesData } from "../models/dispute.server";

export async function loader({request}) {
  const auth = await authenticate.admin(request);
  const userInfo = await db.user.findFirst({
    where: { shop: auth.session.shop },
  });
  if (!userInfo) return redirect("/app");
const disputeData=await fetchDisputesData(userInfo);
  return json(disputeData);
}

export default function DisputePage() {
  const { disputes,premiumUser } = useLoaderData();
  const resourceName = {
    singular: "disputes",
    plural: "disputes",
  };
  const { selectedResources, allResourcesSelected, handleSelectionChange } =
    useIndexResourceState(disputes);

  const rowMarkup = disputes.map((dispute, index) => {
    const {
      created,
      payment_method_types,
      charges,
      payment_method,
      payment_method_details,
      status,
      id,
      currency,
      customer,
      amount,
    } = dispute;

    // const updateddate = new Date(payment?.updated * 1000).toLocaleString();

    const createddate = new Date(created * 1000).toLocaleString();
    const paymentMethod = payment_method_types[0];
    const cardDetails = charges?.data[0]?.payment_method_details?.card;
    const cardBrand = cardDetails ? cardDetails.brand : "";
    const lastFourDigits = cardDetails ? cardDetails.last4 : "";

    return (
      <IndexTable.Row
        id={id}
        key={id}
        selected={selectedResources.includes(id)}
        position={index}
      >
        <IndexTable.Cell>
          {`${amount} ${currency}`}
          <Badge tone={status === "succeeded" ? "success" : "critical"}>
            {status}
          </Badge>
        </IndexTable.Cell>
        <IndexTable.Cell>
          {paymentMethod === "card" ? (
            <InlineStack wrap={false}>
              <Thumbnail
                source={`https://stripe.com/img/v3/brand-assets/${cardBrand.toLowerCase()}.svg`}
                size="small"
                alt={cardBrand}
              />
              `XXXX - ${lastFourDigits}`
            </InlineStack>
          ) : (
            "--"
          )}
        </IndexTable.Cell>
        <IndexTable.Cell>{id ? id : "--"}</IndexTable.Cell>
        <IndexTable.Cell>{customer ? customer : "--"}</IndexTable.Cell>
        <IndexTable.Cell>{createddate}</IndexTable.Cell>
        <IndexTable.Cell></IndexTable.Cell>
      </IndexTable.Row>
    );
  });
  return (
    <Page>
      <ui-title-bar title="Dispute" />

      <Card>
        <IndexTable
          resourceName={resourceName}
          itemCount={disputes.length}
          selectedItemsCount={
            allResourcesSelected ? "All" : selectedResources.length
          }
          onSelectionChange={handleSelectionChange}
          headings={[
            { title: "Amount" },
            { title: "Payment method" },
            { title: "Description" },
            { title: "Customer" },
            { title: "Date" },
            { title: "Action" },
          ]}
        >
          {rowMarkup}
        </IndexTable>
      </Card>
    </Page>
  );
}
