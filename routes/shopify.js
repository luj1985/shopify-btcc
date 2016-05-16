const express = require('express'),
      BTCC = require('../btcc'),
      debug = require('./debug'),
      router = express.Router();

const accesskey = process.env.BTCC_ACCESS_KEY;
const secretkey = process.env.BTCC_SECRET_KEY;

if (!accesskey || !secretkey) {
  throw new Error('No access/secret key found in environment variable, abort.');
}

const btcc = new BTCC(accesskey, secretkey);

router.get('/debug', (req, res, next) => {
  res.render('shopify-sim', {
    title: 'Shopify Simulator',
    fields: debug.createCheckout()
  });
});

router.post('/', (req, res, next) => {
  const body = req.body;
  const currency = body.x_currency,
        amount = body.x_amount,
        reference = body.x_reference,
        description = body.x_description,
        telephone = body.x_customer_phone,
        test = body.x_test;

  btcc.createPurchaseOrder({
    "price": amount,
    "currency": currency,
    "notificationURL": "https://localhost:3000/",
    "returnURL": "https://localhost:3000/",
    "externalKey": reference,
    "itemDesc": description,
    "phoneNumber": telephone,
    "settlementType": 0
  }, (btccErr, btccRes, btccBody) => {
    if (btccRes.statusCode === 200) {
      const payment = JSON.parse(btccBody);
      const result = payment.result;
      if (!!result) {
        res.redirect(result.url);
      } else {
        res.send(500, { error: 'invalid response from BTCC'})
      }
    } else {
      res.send(500, { error: btccBody });
    }
  });
});

module.exports = router;
