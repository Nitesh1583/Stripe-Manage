import { useNavigate } from "@remix-run/react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { ActionList, Badge, Button, IndexTable, Popover } from "@shopify/polaris";
import { DeleteIcon, ClipboardIcon, DataPresentationIcon, EditIcon, MenuHorizontalIcon } from "@shopify/polaris-icons";
import { useEffect, useState } from "react";
// import { fetchSearchStripeCustomer, fetchStripeCustomers, fetchStripeCustomerData } from "../../models/customer.server";

export default function TableRow({ customer, isActive, setActiveIndex }) {
  const { created, id, name, email, last4, brand, invoice_settings, default_payment_method} = customer;
  console.log(customer);
  // console.log(customer.invoice_settings);
  // console.log(customer.invoice_settings.default_payment_method);
  // const createddate = new Date(created * 1000).toLocaleString();

  // const [last4, setLast4] = useState("Loading...");
  
  // useEffect(() => {
  //   async function fetchCardLast4() {
  //     if (invoice_settings?.default_payment_method) {
  //       const data = await fetchStripeCustomerData(id, customer);
  //       setLast4(data.last4);
  //     } else {
  //       setLast4("N/A");
  //     }
  //   }
  //   fetchCardLast4();
  // }, [invoice_settings?.default_payment_method]);

  // Add new code --->
  const [isCopied, setIsCopied] = useState(false);
  const createddate = new Date(created * 1000).toLocaleString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  });

  const shopify = useAppBridge();
  const navigate = useNavigate();

  return (
    <IndexTable.Row
      id={id}
      key={id}
      position={id}
    >
      <IndexTable.Cell>{name}</IndexTable.Cell>
      <IndexTable.Cell>{email}</IndexTable.Cell>
      {/*<IndexTable.Cell>{customer ? customer.invoice_settings.default_payment_method : "--"}</IndexTable.Cell>*/}
       <IndexTable.Cell>{last4}/{[brand]}</IndexTable.Cell>
      <IndexTable.Cell>{createddate}</IndexTable.Cell>
    </IndexTable.Row>
  );
}
