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
  InlineStack,CalloutCard,
  Text,Layout,
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
  const { disputes, premiumUser, UserInfo, subdata} = useLoaderData();
  const resourceName = {
    singular: "disputes",
    plural: "disputes",
  };

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
    const daysDifference = timeDifference / (1000 * 60 * 60 * 24);

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

    // const newTrialEndDate = trialEndDate.toLocaleString("en-US", options).replace(" at", " at");
    newTrialEndDate = trialEndDate.toLocaleString("en-US", options);
  }

  if (daysDifference == 0 && userTakesub == 0) {
    daysDifference = 1;
  }

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
    <Page title="Dispute">
      {/*<ui-title-bar title="Dispute" />*/}

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
  );
}
