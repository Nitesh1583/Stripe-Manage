import { json, redirect, useLoaderData } from "@remix-run/react";
import {
  Card,
  IndexTable,
  Page,
  Pagination,
  CalloutCard,
  Text 
} from "@shopify/polaris";
import {
  LockIcon,
  PlusIcon
} from "@shopify/polaris-icons";
import { useState } from "react";
import db from "../db.server";
import { authenticate } from "../shopify.server";

import CreateStripeCustomerModel from "../component/model/CreateStripeCustomerModel";
import TableRow from "../component/table/TableRow";
import { fetchSearchStripeCustomer, fetchStripeCustomers } from "../models/customer.server";

import "../styles/style.css";

export async function loader({ request }) {
  const auth = await authenticate.admin(request);
  const userInfo = await db.user.findFirst({
    where: { shop: auth.session.shop },
  });

  console.log(auth.session.shop);
  
  if (!userInfo) return redirect("/app");

  let stripeCustomer = await fetchStripeCustomers(userInfo);
  let searchValue = '';
  const handleSearch = async (event) => {
    searchValue = event.target.value;

    if(searchValue != '') {
       stripeCustomer = await fetchSearchStripeCustomer(searchValue);
    }
  }
  return json(stripeCustomer);
}

//component rendering starts here
export default function CustomerPage() {
  const { customers, premiumUser, UserInfo} = useLoaderData();
  const [model, setModel] = useState(false);
  const [activeIndex, setActiveIndex] = useState(null);
  const [searchedVal, setSearchedVal] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  const subscriptionCreatedDate = UserInfo.createdAt; //DateTime format : 2025-03-07T11:27:57.468Z

  const currentDate = new Date(); //DateTime format : Thu Mar 13 2025 13:16:10 GMT+0530 (India Standard Time)
  
  const subDate = new Date(subscriptionCreatedDate).toISOString().split("T")[0]; 
  const currentDateFormatted = currentDate.toISOString().split("T")[0]; 

  // Convert to Date objects (ensuring time is ignored)
  const date1 = new Date(subDate);
  const date2 = new Date(currentDateFormatted);

  // Calculate the difference in days
  const timeDifference = date2 - date1;
  const daysDifference = timeDifference / (1000 * 60 * 60 * 24);

  const handleSearch = (event) => {
    setSearchedVal(event.target.value);
  };

  const filteredCustomers = customers.filter((row) =>
    !searchedVal.length ||
     row.email.toString().toLowerCase().includes(searchedVal.toString().toLowerCase()) ||
     row.name.toString().toLowerCase().includes(searchedVal.toString().toLowerCase())
   );

  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  const handlePagination  = (newPage) => {
    setCurrentPage(newPage);
  }

  return (
    <Page
      title="Customers"
      backAction={{ content: "Home", url: "/app" }}
      primaryAction={{
        content: "Add customer",
        onAction: () => setModel(!model),
        // onAction: () => premiumUser?setModel(!model):navigate('/app/pricing'),
        icon: premiumUser ? PlusIcon : LockIcon,
      }}
      secondaryActions={[
        { content: "Export", onAction: () => alert("Duplicate action") },
        { content: "import", onAction: () => alert("Duplicate action") },
      ]}
    >
    {premiumUser === 1 || daysDifference <= 7 ? (
      <>
      <label htmlFor="search">
        <input id="search" type="text" placeholder="Search name or email" value={searchedVal} onChange={handleSearch} />
      </label>

      <CreateStripeCustomerModel model={model} setModel={setModel} />

      <Card>
        <IndexTable
          resourceName={{
            singular: "customers",
            plural: "customers",
          }}
          itemCount={customers.length}
          headings={[
            { title: "Name" },
            { title: "Email" },
            { title: "Default payment method" },
            { title: "Created" },
            // { title: "Action" },
          ]}
          selectable={false}
        >
          {paginatedCustomers.map((customer) => {
            return (
              <TableRow
                isActive={activeIndex === customer?.id}
                setActiveIndex={setActiveIndex}
                key={customer?.id}
                customer={customer}
              />
            );
          })}
        </IndexTable>
        <Pagination
        hasPrevious={currentPage > 1}
        hasNext={currentPage < Math.ceil(filteredCustomers.length / itemsPerPage)}
        onNext={() => handlePagination(currentPage + 1)}
        onPrevious={() => handlePagination(currentPage - 1)}
        currentPage = {currentPage}
        />
      </Card>
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


//for remix action
export async function action({ request }) {
  const { method } = await request;
  switch (method) {
    case "POST":
      return json({ message: "POST" });

    default:
      return json({ message: "Not Allowed" });
  }
}