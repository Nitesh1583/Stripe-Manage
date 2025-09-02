import { json, redirect, useLoaderData } from "@remix-run/react";
import {
  Card,
  IndexTable,
  Page,
  Pagination,
  CalloutCard,Layout,
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
    where: { shop: auth.session.shop }
  });
  
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
  const { customers, premiumUser, UserInfo, subdata} = useLoaderData();
  const [model, setModel] = useState(false);
  const [activeIndex, setActiveIndex] = useState(null);
  const [searchedVal, setSearchedVal] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);

  const subscriptionCreatedDate = UserInfo.createdAt; //DateTime format : 2025-03-07T11:27:57.468Z

  const currentDate = new Date(); //DateTime format : Thu Mar 13 2025 13:16:10 GMT+0530 (India Standard Time)
  
  const subDate = new Date(subscriptionCreatedDate).toISOString().split("T")[0]; 
  const currentDateFormatted = currentDate.toISOString().split("T")[0]; 

  const userTakesub = UserInfo.subCount;
  let daysDifference = 0;
  let newTrialEndDate = 0; 
  let date1 = '';
  let date2 = '';
  let trialEndDate = '';

  if (daysDifference == 0 && userTakesub == 0) {
    daysDifference = 1;
  }

  if (userTakesub == 0) {

      // Convert to Date objects (ensuring time is ignored)
      const date1 = new Date(subDate);
      const date2 = new Date(currentDateFormatted);

      // Calculate the difference in days
      const timeDifference = date2 - date1;
      daysDifference = timeDifference / (1000 * 60 * 60 * 24);


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

  const handleSearch = (event) => {
    // console.log(event);
    setSearchedVal(event.target.value.toLowerCase());
  };

  const filteredCustomers = customers.filter((row) => {
    return (
      !searchedVal ||
      row?.name.toLowerCase().includes(searchedVal.toLowerCase()) ||
     row?.email.toLowerCase().includes(searchedVal.toLowerCase()) // Search all relevant data
    );
  });

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
      // primaryAction={{
      //   content: "Add customer",
      //   onAction: () => setModel(!model),
      //   onAction: () => premiumUser?setModel(!model):navigate('/app/pricing'),
      //   icon: premiumUser ? PlusIcon : LockIcon,
      // }}
      // secondaryActions={[
      //   { content: "Export", onAction: () => alert("Duplicate action") },
      //   { content: "import", onAction: () => alert("Duplicate action") },
      // ]}
    >
      {(premiumUser == 0 && userTakesub == 0 && daysDifference <= 7) ?
        <>
          <Layout>  
            <Layout.Section>
              <CalloutCard
                  title=""
                  primaryAction={{
                    content: "Upgrade Now",
                    onAction: () => {
                      const shopName = UserInfo?.shop.split(".")[0];
                      const url = `https://admin.shopify.com/store/${shopName}/charges/stripe-manage/pricing_plans`;
                      console.log("Redirecting to pricing page:", url);
                      window.open(url, "_top");
                    },
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

      {(userTakesub == 1 || (userTakesub == 0 && daysDifference <= 7)) ? (
      <>
      <Layout>
        
        <Layout.Section>          
          {/* Add for spacing*/}
        </Layout.Section>  
         
         <Layout.Section>
          <label htmlFor="search">
            <input id="search" 
              type="text" 
              placeholder="Search name or email" 
              value={searchedVal} 
              onChange={handleSearch} />
          </label>

          {/*<CreateStripeCustomerModel model={model} setModel={setModel} />*/}

          <Card>
            <IndexTable resourceName={{ singular: "customer", plural: "customers", }} itemCount={customers.length}
              headings={[
            { title: "Name" },
            { title: "Email" },
            { title: "Card last4/Brand" },
            { title: "Created" },
            // { title: "Action" },
          ]}
          selectable={false}
        >
          {paginatedCustomers.map((customer) => {
            return (
              <TableRow
                key={customer?.id}
                customer={customer}
                setActiveIndex={setActiveIndex}
                isActive={activeIndex === customer?.id}
                
              />
            );
          })}
          {/*{filteredCustomers.map((customer) => (
            <TableRow key={customer.id} customer={customer} />
          ))}*/}
        </IndexTable>
        <Pagination
        hasPrevious={currentPage > 1}
        hasNext={currentPage < Math.ceil(filteredCustomers.length / itemsPerPage)}
        onNext={() => handlePagination(currentPage + 1)}
        onPrevious={() => handlePagination(currentPage - 1)}
        currentPage = {currentPage}
        />
      </Card>
      </Layout.Section> 
      </Layout>
      </>
      ):(
      // Show only if trial has ended and no subscription
        (userTakesub == 0 && daysDifference > 7) && (
          <CalloutCard
            title="No Trial/Subscription Found!"
            primaryAction={{
              content: "Buy Subscription",
              onAction: () => {
                    const shopName = UserInfo?.shop.split(".")[0];
                    const url = `https://admin.shopify.com/store/${shopName}/charges/stripe-manage/pricing_plans`;
                    console.log("Redirecting to pricing page:", url);
                    window.open(url, "_top");
                  },
            }}
          >
            <Text as="p">
              Your trial period has ended. If you want to continue, click on the below button to buy the subscription.
            </Text>
          </CalloutCard>
        )
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