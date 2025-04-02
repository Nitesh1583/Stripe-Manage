import { useLoaderData } from "@remix-run/react";
import { useEffect, useState } from 'react';
import { authenticate } from "../shopify.server";
import React from 'react';
import ReactDOM from 'react-dom';
import express from 'express';
import crypto from 'crypto';

export async function loader({ request }) {
    const {topic, shop, session} = await authenticate.webhook(request);
}

// const express = require('express');
// const crypto = require('crypto');
const app = express();

// Warning: Never store your secret key in plaintext in production environments. 
// This is for demonstration purposes only.
const secret = 'c466f0c0fffc1d26a6aa3e2ef8eee59c'; 

app.use(express.raw({ type: '*/*' }));

app.post('*', async (req, res) => {
  const shopifyHmac = req.headers['x-shopify-hmac-sha256'];
  const byteArray = req.body;
  const bodyString = byteArray.toString('utf8');

  const calculatedHmacDigest = await crypto.createHmac('sha256', secret).update(byteArray).digest('base64');
  const hmacValid = await crypto.timingSafeEqual(Buffer.from(calculatedHmacDigest), Buffer.from(shopifyHmac));

  if (hmacValid) {
    res.send('HMAC validation successful.');
  } else {
    res.status(401).send('HMAC validation failed.');
  }
});