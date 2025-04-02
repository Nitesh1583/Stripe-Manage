import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/react";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import React from 'react';
import ReactDOM from 'react-dom';
import express from 'express';
import crypto from 'crypto';

export const action = async ({ request }: ActionFunctionArgs) => {

    const secret = 'c466f0c0fffc1d26a6aa3e2ef8eee59c';

    const app = express();

    app.use(express.raw({ type: '*/*' }));

    const shopifyHmac = request.headers.get('x-shopify-hmac-sha256');

    const req = await request.json();

    const calculatedHmacDigest = crypto.createHmac('sha256', secret).update(JSON.stringify(req)).digest('base64');

    const hmacValid = crypto.timingSafeEqual(Buffer.from(calculatedHmacDigest), Buffer.from(shopifyHmac));

    if (hmacValid) {
        return json("Success",{status:200})
    } else {
        return json("HMAC validation failed.",{status:401});
    }
};
