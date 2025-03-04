import { useLoaderData } from "@remix-run/react";
import {
	Layout,
	Page,
	Text
} from "@shopify/polaris";
import express from 'express';
import React from "react";
import { Stripe } from "stripe";
import db from "../db.server";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
	// return null;
	const auth = await authenticate.admin(request);
  const userInfo = await db.user.findFirst({
    where: { shop: auth.session.shop },
  });
  return auth.session.shop;
}

export default function CheckoutDetailsPage(userInfo) {
	const loader=useLoaderData();
	const stripe = new Stripe(userInfo.stripeSecretKey);
	// const express = require('express');
	const app = express();


	// This is your Stripe CLI webhook secret for testing your endpoint locally.
	const endpointSecret = "whsec_gNm6odLuMCAYjaqm4IPMvhRj5v5f3yLT";

	app.post('/webhook', express.raw({type: 'application/json'}), (request, response) => {
	  const sig = request.headers['stripe-signature'];
 
	  let event;

	  try {
	    event = stripe.webhooks.constructEvent(request.body, sig, endpointSecret);
	  } catch (err) {
	    response.status(400).send(`Webhook Error: ${err.message}`);
	    return;
	  }

	  // Handle the event
	  switch (event.type) {
	    case 'checkout.session.completed':
	      const checkoutSessionCompleted = event.data.object;
	      // Then define and call a function to handle the event checkout.session.completed
	      break;
	    // ... handle other event types
	    default:
	      console.log(`Unhandled event type ${event.type}`);
	  }

	  // Return a 200 response to acknowledge receipt of the event
	  response.send();
	});

	app.listen(4242, () => console.log('Running on port 4242'));

	return (
    <Page
      	title="Checkout Details"
      	backAction={{ content: "Home", url: "/app" }}
    >
    	<Layout>
        	<Layout.Section>
		        	<Text as="p">
			          	Checkout Details Page
			        </Text>
        	</Layout.Section>
      	</Layout>
    </Page>
    );
}