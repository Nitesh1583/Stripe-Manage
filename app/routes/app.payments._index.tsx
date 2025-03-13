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
import PaymentRow from "../component/table/PaymentRow";
import { fetchSearchStripePaymentData, fetchStripePaymentData } from "../models/payment.server";
import "../styles/style.css";

export async function loader({ request }) {
  const auth = await authenticate.admin(request);
  const userInfo = await db.user.findFirst({
    where: { shop: auth.session.shop },
  });

  if (!userInfo) return redirect("/app");

  let paymentData = await fetchStripePaymentData(userInfo);
  let searchVal = '';
  const handleSearch = async (event) =>{
    searchVal = event.target.value;

    if(searchVal != ''){
      paymentData = await fetchSearchStripePaymentData(searchVal);
    }
  }
  return json(paymentData);
}

export default function PaymentsPage() {
  const { payments, premiumUser, UserInfo } = useLoaderData();
  const [ activeIndex, setActiveIndex ]=useState(null);
  const [ searchedVal, setSearchedVal ] = useState("");
  const [ currentPage, setCurrentPage ] = useState(1);
  const [ itemsPerPage  ] = useState(5);

  // Date calculations
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
  }

  const filteredPayments = payments.filter((row) =>
    !searchedVal.length ||
    row.id.toString().toLowerCase().includes(searchedVal.toString().toLowerCase())
  );

  const paginatedPayments = filteredPayments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePagination  = (newPage) => {
    setCurrentPage(newPage);
  }

  return (
    <Page title="Payments">
      {premiumUser === 1 || daysDifference <= 7 ? (
        <>
          <label htmlFor="search">
            <input
              id="search"
              type="text"
              placeholder="Search Product"
              value={searchedVal}
              onChange={handleSearch}
            />
          </label>
          <Card>
            <IndexTable
              resourceName={{ singular: `payment`, plural: "payments" }}
              itemCount={payments.length}
              headings={[
                { title: "Id" },
                { title: "Amount" },
                { title: "Status" },
                { title: "Products" },
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
        </>
      ) : (
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
