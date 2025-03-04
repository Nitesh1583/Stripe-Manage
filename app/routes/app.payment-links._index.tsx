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
import { deactivateStripePaymenyLink, fetchStripePaymentLinksData } from "../models/paymentlinks.server";

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
  const { paymentLinks, premiumUser,isError,message,data } = useLoaderData();
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
  console.log(actionData, "thi s is dhsfgus");

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
  console.log(message)

  return (
    <Page
      title="Payment Links"
      backAction={{ content: "Home", url: "/app" }}
      primaryAction={{
        content: "New",
        onAction: () =>premiumUser?navigate("/app/payment-links/create"):navigate("/app/pricing") ,
        icon: premiumUser?PlusIcon:LockIcon,
      }}
      secondaryActions={[
        {
          content: "Export",
          onAction: () => alert("Duplicate action"),
          // icon:premiumUser?ExportIcon:LockIcon
          icon: ExportIcon,
        },
      ]}
    >
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
