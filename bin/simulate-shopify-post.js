#!/usr/bin/env node
const request = require('request');

request.post('http://localhost:3000/shopify', {
  form: {
    'x_account_id': 'test@debug.com',
    'x_amount': 1.17,
    'x_currency': 'BTC',
    'x_customer_billing_address1': 'XX Rd.',
    'x_customer_billing_city': 'Shanghai',
    'x_customer_billing_country': 'CN',
    'x_customer_billing_zip': '123456',
    'x_customer_email': 'test@debug.com',
    'x_customer_first_name': 'Doe',
    'x_customer_last_name': 'John',
    'x_description': 'BTCC Dev Store - #7758440647',
    'x_invoice': '#7758440647',
    'x_reference': '7758440647',
    'x_shop_country': 'CN',
    'x_shop_name': 'BTCC Dev Store',
    'x_signature': '29e4216a154c7acd15be31982ebea6428eebe5a5c7249cf1e5c4078206d1a4f7',
    'x_test': true,
    'x_url_callback': 'https://checkout.shopify.com/services/ping/notify_integration/btcc/12875673',
    'x_url_cancel': 'https://btcc-test.myshopify.com/cart',
    'x_url_complete': 'https://checkout.shopify.com/12875673/checkouts/c8ce438724ff8dd2c10de9cc596ab42d/offsite_gateway_callback'
  }
}, (err, res, body) => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log(body);
})

