const express = require('express'),
      router = express.Router(),
      winston = require('winston');

const HOSTED_ENDPOINT = process.env.HOSTED_ENDPOINT

function createCheckout() {
  return [{
    "name": "x_account_id",
    "text": "Account ID",
    "value": "Z9s7Yt0Txsqbbx"
  }, {
    "name": "x_currency",
    "text": "Currency",
    "value": "CNY"
  }, {
    "name": "x_amount",
    "text": "Amount",
    "value": 0.01
  }, {
    "name": "x_reference",
    "text": "Reference",
    // "value": "19783"
    "value": new Date().getTime().toString()
  }, {
    "name": "x_shop_country",
    "text": "Shop Country",
    "value": "CN"
  }, {
    "name": "x_description",
    "text": "Description",
    "value": "Shopify-JustPay Gateway debug"
  }, {
    "name": "x_invoice",
    "text": "Invoice",
    "value": "#123"
  }, {
    "name": "x_test",
    "text": "Test",
    "value": true
  }, {
    "name": "x_customer_email",
    "text": "Customer Email",
    "value": "test@btcc.com"
  }, {
    "name": "x_customer_phone",
    "text": "Customer Phone",
    "value": "1234567891"
  }, {
    "name": "x_url_callback",
    "text": "URL Callback",
    "value": `${HOSTED_ENDPOINT}/debug/callback`
  }, {
    "name": "x_url_cancel",
    "text": "URL Cancel",
    "value": `${HOSTED_ENDPOINT}/debug/cancel`
  }, {
    "name": "x_url_complete",
    "text": "URL Complete",
    "value": `${HOSTED_ENDPOINT}/debug/finished`
  }];
}


console.info('Debug enabled !!');
console.info(`Open "${HOSTED_ENDPOINT}/debug" to do JustPay test`);

router.get('/', (req, res, next) => {
  res.render('shopify-sim', {
    title: 'Shopify Simulator',
    fields: createCheckout()
  });
});

router.post('/callback', (req, res, next) => {
  winston.info('shopify smiulator callback: ', req.body);
  res.send('Checkout confirmed !!!');
});

router.get('/cancel', (req, res, next) => {
  winston.info('shopify smiulator cancel: ', req.query);
  res.send('Checkout cancelled !!!');
});

router.get('/finished', (req, res, next) => {
  winston.info('shopify smiulator finished: ', req.query);
  res.send('Deal !!!');
});



module.exports = router;
