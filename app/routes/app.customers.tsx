import { json, redirect, useLoaderData } from "@remix-run/react";
import {
  Card,
  IndexTable,
  Page,
  Pagination
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

import "../style/style.css";

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
  const { customers, premiumUser } = useLoaderData();
  const [model, setModel] = useState(false);
  const [activeIndex, setActiveIndex] = useState(null);
  const [searchedVal, setSearchedVal] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

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
            { title: "Action" },
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