const express = require('express'),
      // sub app to get 'mountpath'
      router = express(),
      winston = require('winston'),
      BTCC = require('../btcc'),
      Shopify = require('../shopify');

const BTCC_ACCESS_KEY = process.env.BTCC_ACCESS_KEY;
const BTCC_SECRET_KEY = process.env.BTCC_SECRET_KEY;
const HOSTED_ENDPOINT = process.env.HOSTED_ENDPOINT;
const SHOPIFY_HMAC = process.env.SHOPIFY_HMAC;

if (!BTCC_ACCESS_KEY || !BTCC_SECRET_KEY) {
  throw new Error('No access/secret key found in environment variable, abort.');
}
if (!HOSTED_ENDPOINT) {
  throw new Error('No host endpoint defined');
}
if (!SHOPIFY_HMAC) {
  throw new Error('No Shopify HMAC spcificied');
}

const btcc = new BTCC(BTCC_ACCESS_KEY, BTCC_SECRET_KEY);
const shopify = new Shopify(SHOPIFY_HMAC);

// Shopify Purchase Gateway endpoint
// https://help.shopify.com/api/sdks/hosted-payment-sdk/api-reference/request-values
router.post('/', (req, res, next) => {
  const session = req.session;
  session.trans = session.trans || {};
  const mountpath = router.mountpath;

  const purchase = req.body;
  if (!shopify.validateSignature(purchase)) {
    res.status(400).send("Signature miss match !");
  } else {
    const reference = purchase.x_reference;
    // User may fire several transaction at the same time.
    session.trans[reference] = purchase;

    const externalKey = reference + '_' + Date.now();

    const btccPurchaseRequest = {
      "price": purchase.x_amount,
      "currency": purchase.x_currency,
      "notificationURL": HOSTED_ENDPOINT + mountpath + "/notification/" + reference,
      "returnURL": HOSTED_ENDPOINT + mountpath + "/success/" + reference,
      "externalKey": externalKey,
      "itemDesc": purchase.x_description,
      "phoneNumber": purchase.x_customer_phone,
      "settlementType": 0
    };

    winston.debug('Shopify request values: ', purchase);

    btcc.createPurchaseOrder(btccPurchaseRequest, (btccErr, btccRes, btccBody) => {
      if (btccRes.statusCode === 200) {
        const payment = JSON.parse(btccBody);
        const result = payment.result;
        if (!!result) {
          res.redirect(result.url);
        } else {
          // TODO: add error page rendering.
          winston.error('BTCC createPurchaseOrder API Error');
          winston.error(btccBody);
          res.status(500).send(btccBody);
        }
      } else {
        winston.error('BTCC createPurchaseOrder API Error');
        winston.error(btccBody);
        res.status(btccRes.statusCode).send(btccBody);
      }
    });
  }
});


// this endpoint will be invoked when BTCC purchase success.
router.get('/success/:reference', (req, res, next) => {
  const reference = req.params.reference;
  if (!reference) {
    winston.error("BTCC returnURL callback doesn't have reference defined", req.body);
    res.status(400).send('No reference available');
  } else {
    const trans = req.session.trans || {};
    const tran = trans[reference];
    if (tran) {
      delete trans[reference];
      const id = req.query.purchaseorder_id || new Date().getTime().toString();

      winston.debug('BTCC purcase order id: ', id);

      shopify.completePurchase(tran, id, (err, storeRes, body) => {
        if (storeRes.statusCode === 200) {
          res.redirect(tran.x_url_complete);
        } else {
          res.status(storeRes.statusCode).send(body);
        }
      });

      // XXX: or redirect back immediately
      // Use this method need a page to fire a POST on x_url_complete again.
      // shopifyAsyncConfirm(tran);
      // res.redirect(tran.x_url_complete);
    } else {
      res.status(400).send('Invalid merchant reference');
    }
  }
});

router.post('/notification/:reference', (req, res, next) => {
  const reference = req.params.reference;
  // XXX: This connection was established between Payment Gateway and BTCC JustPay
  winston.debug(`notification for: ${reference}`, req.body);
  res.status(200).send('Notification Got it');
});

router.get('/cancel/:reference', (req, res, next) => {
  res.status(500).send("Not implemented yet");
});

module.exports = router;


