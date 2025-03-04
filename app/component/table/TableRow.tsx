import { ActionList, Button, IndexTable, Popover } from "@shopify/polaris";
import { DeleteIcon, EditIcon, MenuHorizontalIcon } from "@shopify/polaris-icons";
export default function TableRow({ customer,isActive,setActiveIndex }) {
  const { created, id, name, email } = customer;
  const createddate = new Date(created * 1000).toLocaleString();
  // console.log(customer);
  return (
    <IndexTable.Row
      id={id}
      key={id}
      position={id}
    >
      <IndexTable.Cell>{name}</IndexTable.Cell>
      <IndexTable.Cell>{email}</IndexTable.Cell>
      <IndexTable.Cell>{"--"}</IndexTable.Cell>
      <IndexTable.Cell>{createddate}</IndexTable.Cell>
      <IndexTable.Cell>
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
      </IndexTable.Cell>
    </IndexTable.Row>
  );
}
