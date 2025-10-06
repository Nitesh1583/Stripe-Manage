import { Stripe } from "stripe";
import Stripe from "stripe";

import { shopifyApi } from "@shopify/shopify-api";
import { authenticate } from "../shopify.server";

export async function getShopifyOrders(request: Request) { 
  try {
    const { admin } = await authenticate.admin(request);

    const response = await admin.graphql(`#graphql
      query {
        orders(first: 10, sortKey: CREATED_AT, reverse: true) {
          edges {
            node {
              id
              name
              createdAt
              displayFinancialStatus
              displayFulfillmentStatus
              currentTotalPriceSet {
                shopMoney {
                  amount
                  currencyCode
                }
              }
              customer {
                firstName
                lastName
                email
              }
              fulfillments(first: 5) {
                trackingInfo {
                  number
                  url
                  company
                }
              }
              shippingLines(first: 5) {
                edges {
                  node {
                    title
                    code
                    carrierIdentifier
                    requestedFulfillmentService {
                      serviceName
                    }
                  }
                }
              }
              lineItems(first: 5) {
                edges {
                  node {
                    title
                    quantity
                    discountedTotalSet {
                      shopMoney {
                        amount
                        currencyCode
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    `);

    const data = await response.json();
    return { shopifyOrdersData: data };

  } catch (error) {
    console.error("Error fetching Shopify Orders:", error?.message || error);
    return { shopifyOrdersData: "NONE" };
  }
}
