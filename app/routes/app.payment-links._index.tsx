import {
  Page,
  useIndexResourceState,
  Card,
  IndexTable,
  TextField,
  Popover,
  Button,
  ActionList,
  Badge,
  CalloutCard,
  Text,Layout,
} from "@shopify/polaris";
import { useAppBridge } from "@shopify/app-bridge-react";
import {useState,useEffect} from "react";
import {
  useLoaderData,
  redirect,
  json,
  useNavigate,
  useSubmit,
  useActionData
} from "@remix-run/react";
import db from "../db.server";
import { authenticate } from "../shopify.server";
import {
  PlusIcon,
  LockIcon,
  ExportIcon,
  ClipboardIcon,
  MenuHorizontalIcon,
  DataPresentationIcon,
  StopCircleIcon,
} from "@shopify/polaris-icons";
// import PaymentLinkRow from "../component/table/PaymentLinkRow";
import { deactivateStripePaymenytLink, fetchStripePaymentLinksData } from "../models/paymentlinks.server";

export async function loader({ request }) {
  const auth = await authenticate.admin(request);
  const userInfo = await db.user.findFirst({
    where: { shop: auth.session.shop },
  });
  if (!userInfo) return redirect("/app");
  const paymentLinks = await fetchStripePaymentLinksData(userInfo);

  return json(paymentLinks);
}

export default function PaymentLinkPage() {
  const { paymentLinks, premiumUser,UserInfo, isError,message,data, subdata } = useLoaderData();
  const [isCopied, setIsCopied] = useState(false);
  const [isActiveIndex, setActiveIndex] = useState(null);
  const [activeProduct, setActiveProduct] = useState(null);
  const [activeProductName, setActiveProductName] = useState(null);
  const shopify = useAppBridge();
  const navigate = useNavigate();
  const loader = useLoaderData();
  const actionData = useActionData();
  const submit = useSubmit();
  const copyToClipboard = (data) => {
    navigator.clipboard.writeText(data);
    setIsCopied(true);
  };

  useEffect(() => {
    if (isCopied) {
      shopify.toast.show("Payment ID copied");
      setIsCopied(!isCopied);
    }
  }, [isCopied]);

  useEffect(() => {
    shopify.toast.show(actionData?.message, {
      isError: actionData?.isError,
    });
  }, [actionData]);

  const handleActivate = async (id) => {
    const formData=new FormData();
    formData.append('paylinkid',id);
    submit(formData,{method:'POST'})
  };

  useEffect(() => {
    if (isCopied) {
      shopify.toast.show("Payment ID copied");
      setIsCopied(!isCopied);
    }
  }, [isCopied]);

  useEffect(() => {
    if (isError) {
      shopify.toast.show(message);
    }
  }, [isError]);

  // Date calculations
  const subscriptionCreatedDate = UserInfo.createdAt; //DateTime format : 2025-03-07T11:27:57.468Z

  const currentDate = new Date(); //DateTime format : Thu Mar 13 2025 13:16:10 GMT+0530 (India Standard Time)
  
  const subDate = new Date(subscriptionCreatedDate).toISOString().split("T")[0]; 
  const currentDateFormatted = currentDate.toISOString().split("T")[0]; 

  const userTakesub = UserInfo.subCount;
  let daysDifference = 0;
  let newTrialEndDate = 0; 

  if (daysDifference == 0 && userTakesub == 0) {
    daysDifference = 1;
  }

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

    newTrialEndDate = trialEndDate.toLocaleString("en-US", options);
  }

  

  return (
    <Page
      title="Payment Links"
      backAction={{ content: "Home", url: "/app" }}
      // primaryAction={{
      //   content: "New",
      //   onAction: () =>premiumUser?navigate("/app/payment-links/create"):navigate("/app/pricing") ,
      //   icon: premiumUser?PlusIcon:LockIcon,
      // }}
      // secondaryActions={[
      //   {
      //     content: "Export",
      //     onAction: () => alert("Duplicate action"),
      //     // icon:premiumUser?ExportIcon:LockIcon
      //     icon: ExportIcon,
      //   },
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
          resourceName={{
            singular: "payment links",
            plural: "payment links",
          }}
          itemCount={paymentLinks.length}
          headings={[
            { title: "Link URL" },
            { title: "" },
            { title: "Status" },
            { title: "Name" },
            { title: "Price" },
            { title: "Action" },
          ]}
          selectable={false}
          pagination={true}
        >
          {paymentLinks &&
            paymentLinks.map((paymentlink, index) => {
              const { active, url, id, created, lineItems, symbolNative, symbol } = paymentlink;
              return (
                <IndexTable.Row
                id={id}
                key={id}
                position={id}
                onNavigation={`/app/payment-link/${id}`}
              >
                <IndexTable.Cell>
                  <TextField disabled value={url} />
                </IndexTable.Cell>
                <IndexTable.Cell>
                  {active ? (
                    <Button onClick={() => copyToClipboard(url)} icon={ClipboardIcon} />
                  ) : (
                    ""
                  )}
                </IndexTable.Cell>
                <IndexTable.Cell>
                  <Badge tone={active ? "success" : "critical"}>
                    {active ? "Activate" : "Deactivate"}
                  </Badge>
                </IndexTable.Cell>

                <IndexTable.Cell>
                  {lineItems.length > 1 ? (
                    <Popover
                      active={activeProductName===`proname${paymentlink.id}`}
                      activator={
                        <Button onClick={() => setActiveProductName(`proname${id}`)}>
                          Products
                        </Button>
                      }
                      autofocusTarget="first-node"
                      onClose={() => setActiveProductName(null)}
                    >
                      <ActionList
                        actionRole="menuitem"
                        sections={[
                          {
                            items: [
                              lineItems.map((item) => {
                                return {
                                  Name: item.description,
                                };
                              }),
                            ],
                          },
                        ]}
                      />
                    </Popover>
                  ) : (
                    <span className="shopify-upr">{lineItems[0].description}</span>
                  )}
                </IndexTable.Cell>

                <IndexTable.Cell>
                  {lineItems.length > 1 ? (
                    <Popover
                      active={activeProduct===`pro${paymentlink.id}`}
                      activator={
                        <Button onClick={() => setActiveProduct(`pro${id}`)}>
                          Products
                        </Button>
                      }
                      autofocusTarget="first-node"
                      onClose={() => setActiveProduct(null)}
                    >
                      <ActionList
                        actionRole="menuitem"
                        sections={[
                          {
                            items: [
                              lineItems.map((item) => {
                                return {
                                  Price: item.amount_total / 100,
                                };
                              }),
                            ],
                          },
                        ]}
                      />
                    </Popover>
                  ) : (
                    symbolNative + " " + lineItems[0].amount_total / 100 + " " + symbol
                  )}
                </IndexTable.Cell>
                <IndexTable.Cell>
                  <Popover
                    active={isActiveIndex === paymentlink.id}
                    activator={
                      <Button
                        variant="plain"
                        icon={MenuHorizontalIcon}
                        onClick={() => setActiveIndex(id)}
                      />
                    }
                    autofocusTarget="first-node"
                    onClose={() => setActiveIndex(null)}
                  >
                    <ActionList
                      actionRole="menuitem"
                      sections={[
                        {
                          title: "Payments options",
                          items: [
                            {
                              content: "View payment link details",
                              icon: DataPresentationIcon,
                              // onAction: () => navigate(`/app/payment-link/${id}`),
                            },
                            {
                              destructive: active?true:false ,
                              content: active ? "Deactivate" : "Activate",
                              icon: StopCircleIcon,
                              onAction: () => handleActivate(id),
                            },
                          ],
                        },
                      ]}
                    />
                  </Popover>
                </IndexTable.Cell>
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
  );
}


export async function action({request}){
  const {method}=request;
  let formData=await request.formData();
  const auth=await authenticate.admin(request);
  const userInfo=await db.user.findFirst({
    where:{
      shop:auth.session.shop
    }
  })
formData=Object.fromEntries(formData);

  switch (method) {
    case 'POST':
      const id=formData.paylinkid;
      const res=await deactivateStripePaymenyLink(userInfo,id);
      return json(res)
    default:
      return json({method:'method not allowed',isError:true})
  }
}
