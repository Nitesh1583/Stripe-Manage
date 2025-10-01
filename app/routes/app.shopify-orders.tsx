import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import db from "../db.server";
import { syncShopFromSession } from "../models/user.server";
import { json, redirect } from "@remix-run/node";
import { useFetcher, useLoaderData  } from "@remix-run/react";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {

    const auth = await authenticate.admin(request); 

    // Sync shop info
    const shopSyncResult = await syncShopFromSession(auth.session.shop); 
    console.log("ShopSyncData:", shopSyncResult); 

     // Fetch user from DB
    const userInfo = await db.user.findFirst({ 
      where: { shop: auth.session.shop }, 
    }); 

    console.error("auth:", auth); 
    console.error("userInfo:", userInfo);

     if (!userInfo) return redirect("/app");

     return json({
      shopSyncResult,
      userInfo,
    });

  }catch (error) {
    console.error("Loader failed:", error);
    return json(
      { status: 500 }
    );
  }
}

export default function ShopifyOrdersPage() {
  const fetcher = useFetcher<typeof action>();
  const {shopSyncResult, userInfo } = useLoaderData<typeof loader>();
  console.log("Shopify Orders page:", userInfo);
  useEffect(() => {
    console.log("Shopify Orders page Shop Sync Result:", shopSyncResult);
  }, [shopSyncResult]);
}

// export async function loader({ request }) {
//   // const { admin } = await authenticate.admin(request);
//   const testConsole = "Test";

// //   const response = await admin.graphql(`
// //   {
// //     orders(first: 10, sortKey: CREATED_AT, reverse: true) {
// //       edges {
// //         node {
// //           id
// //           name
// //           createdAt
// //           displayFinancialStatus
// //           displayFulfillmentStatus
// //           currentTotalPriceSet {
// //             shopMoney {
// //               amount
// //               currencyCode
// //             }
// //           }
// //           customer {
// //             firstName
// //             lastName
// //             email
// //           }
// //         }
// //       }
// //     }
// //     draftOrders(first: 10, sortKey: UPDATED_AT, reverse: true) {
// //       edges {
// //         node {
// //           id
// //           name
// //           createdAt
// //           status
// //           totalPriceSet {
// //             shopMoney {
// //               amount
// //               currencyCode
// //             }
// //           }
// //           customer {
// //             firstName
// //             lastName
// //             email
// //           }
// //         }
// //       }
// //     }
// //   }
// // `);


// //   const data = await response.json();
// //   return json(data);

//   return testConsole;
// }

// export default function ShopifyOrdersPage() {
//   const data = useLoaderData();

//   console.log("test");
//   console.log(data);
//   // const orders = data?.data?.orders?.edges || [];
//   // const drafts = data?.data?.draftOrders?.edges || [];

//   // return (
//   //   <div style={{ padding: "20px" }}>
//   //     <h1>Shopify Orders</h1>

//   //     <h2>Regular Orders</h2>
//   //     {orders.length === 0 ? (
//   //       <p>No orders found.</p>
//   //     ) : (
//   //       <ul>
//   //         {orders.map(({ node }) => (
//   //           <li key={node.id}>
//   //             {node.name} – {node.displayFinancialStatus} – {node.displayFulfillmentStatus}
//   //           </li>
//   //         ))}
//   //       </ul>
//   //     )}

//   //     <h2>Draft Orders</h2>
//   //     {drafts.length === 0 ? (
//   //       <p>No draft orders found.</p>
//   //     ) : (
//   //       <ul>
//   //         {drafts.map(({ node }) => (
//   //           <li key={node.id}>
//   //             {node.name} – {node.status}
//   //           </li>
//   //         ))}
//   //       </ul>
//   //     )}
//   //   </div>
//   // );
// }
