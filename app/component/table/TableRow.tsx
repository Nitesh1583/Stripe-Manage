import { useNavigate } from "@remix-run/react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { ActionList, Badge, Button, IndexTable, Popover } from "@shopify/polaris";
import { DeleteIcon, ClipboardIcon, DataPresentationIcon, EditIcon, MenuHorizontalIcon } from "@shopify/polaris-icons";
import { useEffect, useState } from "react";

export default function TableRow({ customer, isActive, setActiveIndex }) {
  const { created, id, name, email, invoice_settings, default_payment_method} = customer;
  console.log(customer);
  console.log(customer.invoice_settings);
  console.log(customer.invoice_settings.default_payment_method);
  // const createddate = new Date(created * 1000).toLocaleString();

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
      <IndexTable.Cell>{customer ? customer.invoice_settings.default_payment_method : "--"}</IndexTable.Cell>
      <IndexTable.Cell>{createddate}</IndexTable.Cell>
      
      {/*Next IndexCell working with Action Column using on Customer Page*/}
      {/*<IndexTable.Cell>
        <Popover
          active={isActive}
          activator={
            <Button
              variant="plain"
              icon={MenuHorizontalIcon}
              onClick={() => setActiveIndex(customer.id)}
            />
          }
          autofocusTarget="first-node"
          onClose={() => setActiveIndex("")}
        >
          <ActionList
            actionRole="menuitem"
            sections={[
              {
                title: "Customer options",
                items: [
                  {
                    content: "Edit customer",
                    icon: EditIcon,
                  },
                  {
                    destructive: true,
                    content: "Delete customer",
                    icon: DeleteIcon,
                  },
                ],
              },
            ]}
          />
        </Popover>
      </IndexTable.Cell>*/}
    </IndexTable.Row>
  );
}
