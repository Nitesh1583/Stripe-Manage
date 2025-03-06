import { useNavigate } from "@remix-run/react";
import { useAppBridge } from "@shopify/app-bridge-react";
import {
  ActionList,
  Badge,
  Button,
  IndexTable,
  Popover,
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
  const {
    created,
    payment_method_types,
    charges,
    payment_method,
    payment_method_details,
    status,
    id,
    product,
    customer,
    amount,
    metadata,
    currencycode,
    symbolNative,
    customerdetail,
  } = payment;
  // console.log(payment);
  const createddate = new Date(created * 1000).toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  });
  const navigate = useNavigate();
  const paymentMethod = payment_method_types[0];
  const cardDetails = charges?.data[0]?.payment_method_details?.card;
  const cardBrand = cardDetails ? cardDetails.brand : "";
  const lastFourDigits = cardDetails ? cardDetails.last4 : "";
  const orderID = metadata ? metadata.order_id : "";

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
      id={id}
      key={id}
      position={id}
      onNavigation={`/app/payment/${id}`}
    >
      <IndexTable.Cell>{`${orderID}`}</IndexTable.Cell>
      <IndexTable.Cell>{`${symbolNative} ${amount} ${currencycode}`}</IndexTable.Cell>
      <IndexTable.Cell>
        <Badge
          tone={
            status === "succeeded"
              ? "success"
              : status === "canceled"
                ? "critical"
                : ""
          }
          progress={
            status === "succeeded"
              ? "complete"
              : status === "canceled"
                ? "incomplete"
                : "partiallyComplete"
          }
        >
          {status === "succeeded"
            ? "Successed"
            : status === "canceled"
              ? "Canceled"
              : "Pending"}
        </Badge>
      </IndexTable.Cell>
      <IndexTable.Cell></IndexTable.Cell>

      <IndexTable.Cell>{customerdetail ? customerdetail.name : "--"}</IndexTable.Cell>
      {/* Payment method Index cell */}
      {/* <IndexTable.Cell>{id ? id : "--"}</IndexTable.Cell>  */}

      {/* Description Index cell */}
      {/* <IndexTable.Cell>VISA</IndexTable.Cell> */}

      {/* Customer Index cell */}
      {/* <IndexTable.Cell>{customer ? customer : "--"}</IndexTable.Cell> */}
      <IndexTable.Cell>{createddate}</IndexTable.Cell>
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
          onClose={() => setActiveIndex("")}
        >
          <ActionList
            actionRole="menuitem"
            sections={[
              {
                title: "Payments options",
                items: [
                  {
                    content: "Copy payment ID",
                    icon: ClipboardIcon,
                    onAction: () => copyToClipboard(id),
                  },
                  {
                    content: "View payment details",
                    icon: DataPresentationIcon,
                    onAction: () => navigate(`/app/payments/${id}`),
                  },
                  {
                    content: "Refunds",
                    icon:ReturnIcon,
                  }
                ],
              },
            ]}
          />
        </Popover>
      </IndexTable.Cell>
    </IndexTable.Row>
  );
}