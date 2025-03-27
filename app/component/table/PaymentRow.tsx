import { useNavigate } from "@remix-run/react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { ActionList, Badge, Button, IndexTable, Popover,
} from "@shopify/polaris";
import {
  ClipboardIcon,
  DataPresentationIcon,
  MenuHorizontalIcon,
  ReturnIcon
} from "@shopify/polaris-icons";
import { useEffect, useState } from "react";

export default function PaymentRow({ payment, isActive, setActiveIndex }) {
  const [isCopied, setIsCopied] = useState(false);
  const shopify = useAppBridge();
  const { created, payment_method_types, charges, payment_method, payment_method_details, status, id, product, 
          customer, amount, metadata, currencycode, symbolNative, customerdetail,
        } = payment;

  const createddate = new Date(created * 1000).toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  });
  const navigate = useNavigate();

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
  return (
    <IndexTable.Row
      id={payment.id}
      key={id}
      position={id}
      onNavigation={`/app/payment/${id}`}
    >
      <IndexTable.Cell>{`${payment.orderID}`}</IndexTable.Cell>
       <IndexTable.Cell>{`${payment.symbolNative} ${payment.amount / 100} ${payment.currencycode}`}</IndexTable.Cell>
      <IndexTable.Cell>
        <Badge tone={payment.status === "succeeded" ? "success" : "critical"}>
          {payment.status === "succeeded" ? "Success" : "Failed"}
        </Badge>
      </IndexTable.Cell>

      <IndexTable.Cell>{customerdetail ? customerdetail.name : "--"}</IndexTable.Cell>

      <IndexTable.Cell>{createddate}</IndexTable.Cell>
      <IndexTable.Cell>
        <Popover
          active={isActive}
          activator={<Button icon={MenuHorizontalIcon} onClick={() => setActiveIndex(payment.id)} />}
          onClose={() => setActiveIndex("")}
        >
          <ActionList
            sections={[
              {
                title: "Actions",
                items: [
                  { content: "Copy Payment ID", icon: ClipboardIcon, onAction: () => copyToClipboard(payment.id) },
                  { content: "View Details", icon: DataPresentationIcon, onAction: () => navigate(`/app/payments/${payment.id}`) },
                ],
              },
            ]}
          />
        </Popover>
      </IndexTable.Cell>
    </IndexTable.Row>
  );
}