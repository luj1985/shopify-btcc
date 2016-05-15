#!/usr/bin/env node
const BTCC = require('../btcc');

const accesskey = process.env.BTCC_ACCESS_KEY;
const secretkey = process.env.BTCC_SECRET_KEY;

if (!accesskey || !secretkey) {
  throw new Error('No access/secret key found in environment variable, abort.');
}

var btcc = new BTCC(accesskey, secretkey);

btcc.createPurchaseOrder({
  "price": 0.0001,
  "currency": "BTC",
  "notificationURL": "https://localhost:3000/",
  "returnURL": "https://localhost:3000/",
  "externalKey": "test",
  "itemDesc": "Requst for demo",
  "phoneNumber": "12345678901",
  "settlementType": 0
}, (err, res, body) => {
  console.log(body);
});

