#!/usr/bin/env node
const BTCC = require('../btcc');

const accesskey = process.env.BTCC_ACCESS_KEY;
const secretkey = process.env.BTCC_SECRET_KEY;

if (!accesskey || !secretkey) {
  throw new Error('No access/secret key found in environment variable, abort.');
}

var btcc = new BTCC(accesskey, secretkey);

var externalKey = new Date().getTime().toString();
btcc.createPurchaseOrder({
  "price": 0.0001,
  "currency": "BTC",
  "notificationURL": "https://localhost:3000/",
  "returnURL": "https://localhost:3000/",
  "externalKey": externalKey,
  "itemDesc": "Requst for demo",
  "phoneNumber": "12345678901",
  "settlementType": 0
}, (err, res, body) => {
  var statusCode = res.statusCode;
  if (statusCode === 200) {
    var data = JSON.parse(body);
    console.log(JSON.stringify(data, null, ' '));
  }
});

