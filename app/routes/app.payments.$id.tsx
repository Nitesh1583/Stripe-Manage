import { json, useLoaderData } from "@remix-run/react";
import { Page } from "@shopify/polaris";
export async function loader({ request, params }) {
  return json({ params });
}

export default function PaymentDetails() {
  const { params } = useLoaderData();
  return (
  <Page title="Payment Details" backAction={{content:'Payment',url:'/app/payments'}} >
    {params.id}
    </Page>
    );
}


export async function action({ request, params }) {
  return json({ params });
}
