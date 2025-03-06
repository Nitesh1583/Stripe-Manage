import { redirect, useLoaderData } from "@remix-run/react";
import {
  Card,
  IndexTable,
  Page, Pagination
} from "@shopify/polaris";
import { useState } from "react";
import PaymentRow from "../component/table/PaymentRow";
import db from "../db.server";
import { fetchSearchStripePaymentData, fetchStripePaymentData } from "../models/payment.server";
import { authenticate } from "../shopify.server";
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
  }
  console.log(paymentData);
  
  if(searchVal != ''){
    paymentData = await fetchSearchStripePaymentData(searchVal);
  }
  return paymentData;
}


export default function PaymentsPage() {
  const { payments, premiumUser } = useLoaderData();
  const [ activeIndex, setActiveIndex ]=useState(null);
  const [ searchedVal, setSearchedVal ] = useState("");
  const [ currentPage, setCurrentPage ] = useState(1);
  const [ itemsPerPage  ] = useState(5);

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
      <label htmlFor="search">
        <input id="search" type="text" placeholder="Search Product" value={searchedVal} onChange={handleSearch} />
      </label>
      <Card>
        <IndexTable
          resourceName={{
            singular: `payment`,
            plural: "payments",
          }}
          itemCount={payments.length}
          headings={[
            { title: "Id"},
            { title: "Amount" },
            { title: "Status" },
            { title: "Products" },
            // { title: "Payment method" },
            // { title: "Description" },
            { title: "Customer" },
            { title: "Date" },
            { title: "Action" },
          ]}
          selectable={false}
        >
        {paginatedPayments.map((payment) => {
            return (
            <PaymentRow 
            key={payment.id}
            payment={payment}
            setActiveIndex={setActiveIndex}
            isActive={activeIndex === payment.id}
            />
            );
          })}
        </IndexTable>
        <Pagination
          hasPrevious={currentPage > 1}
          hasNext={currentPage < Math.ceil(filteredPayments.length / itemsPerPage)}
          onNext={() => handlePagination(currentPage + 1)}
          onPrevious={() => handlePagination(currentPage - 1)}
          currentPage = {currentPage}
        />
      </Card>
    </Page>
  );
}
