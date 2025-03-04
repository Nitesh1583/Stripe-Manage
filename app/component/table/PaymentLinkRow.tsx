import { useAppBridge } from "@shopify/app-bridge-react";
import {
  IndexTable,
  Popover,
  Button,
  ActionList,
  Badge,
  TextField,
} from "@shopify/polaris";
import {
  MenuHorizontalIcon,
  ClipboardIcon,
  DataPresentationIcon,
  StopCircleIcon,
} from "@shopify/polaris-icons";
import {
  json,
  useNavigate,
  useActionData,
  useSubmit,
  useFetcher,
  useLoaderData,
} from "@remix-run/react";
import { useEffect, useState } from "react";

export async function loader({ request }) {
  return null;
}



export default function PaymentLinkRow({
  paymentlink,
  isActive,
  setActiveIndex,
  isactivePro,
  setActiveProduct,
  setActiveProductName,
  isactiveProName,
}) {
  const [isCopied, setIsCopied] = useState(false);
  const shopify = useAppBridge();
  const navigate = useNavigate();
  const loader = useLoaderData();
  const actionData = useActionData();
  const submit = useSubmit();
  const fetcher = useFetcher();
  const { active, url, id, created, lineItems, symbolNative, symbol } =
    paymentlink;
  const createddate = new Date(created * 1000).toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  });

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
            active={isactiveProName}
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
            active={isactivePro}
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
          active={isActive}
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
                    destructive: { active },
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
}


export async function action ({ request, params }) {
  const { method } = request;
  const formData = await request.formData();
  console.log("this is method", method, params);
  switch (method) {
    case "POST":
      const id = formData.get("id");
      return json({
        message: `Payment link deactivated ${id}`,
        isError: false,
      });
    default:
      return json({ message: "Method", isError: false });
  }
};
import { useAppBridge } from "@shopify/app-bridge-react";
import {
  IndexTable,
  Popover,
  Button,
  ActionList,
  Badge,
  TextField,
} from "@shopify/polaris";
import {
  MenuHorizontalIcon,
  ClipboardIcon,
  DataPresentationIcon,
  StopCircleIcon,
} from "@shopify/polaris-icons";
import {
  json,
  useNavigate,
  useActionData,
  useSubmit,
  useFetcher,
  useLoaderData,
} from "@remix-run/react";
import { useEffect, useState } from "react";

export async function loader({ request }) {
  return null;
}



export default function PaymentLinkRow({
  paymentlink,
  isActive,
  setActiveIndex,
  isactivePro,
  setActiveProduct,
  setActiveProductName,
  isactiveProName,
}) {
  const [isCopied, setIsCopied] = useState(false);
  const shopify = useAppBridge();
  const navigate = useNavigate();
  const loader = useLoaderData();
  const actionData = useActionData();
  const submit = useSubmit();
  const fetcher = useFetcher();
  const { active, url, id, created, lineItems, symbolNative, symbol } =
    paymentlink;
  const createddate = new Date(created * 1000).toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  });

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
            active={isactiveProName}
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
            active={isactivePro}
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
          active={isActive}
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
                    destructive: { active },
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
}


export async function action ({ request, params }) {
  const { method } = request;
  const formData = await request.formData();
  console.log("this is method", method, params);
  switch (method) {
    case "POST":
      const id = formData.get("id");
      return json({
        message: `Payment link deactivated ${id}`,
        isError: false,
      });
    default:
      return json({ message: "Method", isError: false });
  }
};
