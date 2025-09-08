import { json, redirect, useLoaderData } from "@remix-run/react";
import { Card,IndexTable,Page,Pagination,CalloutCard,Text,Layout } from "@shopify/polaris";
import {LockIcon,PlusIcon } from "@shopify/polaris-icons";
import {useEffect, useState } from "react";

import db from "../db.server";
import { authenticate } from "../shopify.server";
import PaymentRow from "../component/table/PaymentRow";
import { fetchSearchStripePaymentData, fetchStripePaymentData } from "../models/payment.server";
import "../styles/style.css";

export async function loader({ request }) {
  const auth = await authenticate.admin(request);
  const userInfo = await db.user.findFirst({
    where: { shop: auth.session.shop }
  });

  if (!userInfo) return redirect("/app");

  // Get search query from the request
  const url = new URL(request.url);
  const searchVal = url.searchParams.get('search') || '';  // Get search parameter from the URL

  // Fetch data based on the search query
  let paymentData = searchVal ? await fetchSearchStripePaymentData(searchVal, userInfo) : await fetchStripePaymentData(userInfo);

  return json(paymentData);
}


export default function PaymentsPage() {
  const { payments, premiumUser, UserInfo, subdata } = useLoaderData();
  const [ activeIndex, setActiveIndex ]=useState(null);
  const [ searchedVal, setSearchedVal ] = useState("");
  const [ currentPage, setCurrentPage ] = useState(1);
  const [ itemsPerPage  ] = useState(8);
  console.log(UserInfo);

  const [filteredPayments, setFilteredPayments] = useState(payments || []);

  // Date calculations
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


  // Function to handle search input change
  const handleSearch = (event) => {
    setSearchedVal(event.target.value);
  }

  // Filter payments based on searchValue (Order ID or Customer Name)
  useEffect(() => {
    const filteredData = payments.filter((payment) => {
      const orderId = payment.order_id || "";
      const customerName = payment.customerdetail?.name || "";
      return (
        orderId.includes(searchedVal) ||
        customerName.toLowerCase().includes(searchedVal.toLowerCase())
      );
    });

    setFilteredPayments(filteredData);
  }, [searchedVal, payments]);

  const paginatedPayments = filteredPayments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePagination  = (newPage) => {
    setCurrentPage(newPage);
  }

  return (
    <Page title="Payments"
        backAction={{ content: "Home", url: "/app" }}
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
           {/*Add for spacing*/}
         </Layout.Section>  
         
         <Layout.Section>


          <label htmlFor="search">
            <input id="search" type="text" value={searchedVal} onChange={handleSearch} placeholder="Search by Order ID or Customer Name" />
          </label>
          <Card>
            <IndexTable
              resourceName={{ singular: `payment`, plural: "payments" }}
              itemCount={filteredPayments.length}
              headings={[
                { title: "Id" },
                { title: "Amount" },
                { title: "Status" },
                { title: "Customer" },
                { title: "Date" },
                { title: "Action" },
              ]}
              selectable={false}
            >
              {paginatedPayments.map((payment) => (
                <PaymentRow
                  key={payment.id}
                  payment={payment}
                  setActiveIndex={setActiveIndex}
                  isActive={activeIndex === payment.id}
                />
              ))}
            </IndexTable>
            <Pagination
              hasPrevious={currentPage > 1}
              hasNext={currentPage < Math.ceil(filteredPayments.length / itemsPerPage)}
              onNext={() => handlePagination(currentPage + 1)}
              onPrevious={() => handlePagination(currentPage - 1)}
              currentPage={currentPage}
            />
          </Card>
          </Layout.Section> 
        </Layout>
        </>
      ) : (
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
