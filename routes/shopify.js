const express = require('express'),
      request = require('request'),
      crypto = require('crypto'),
      BTCC = require('../btcc'),
      router = express.Router();

const BTCC_ACCESS_KEY = process.env.BTCC_ACCESS_KEY;
const BTCC_SECRET_KEY = process.env.BTCC_SECRET_KEY;
const HOSTED_ENDPOINT = process.env.HOSTED_ENDPOINT;
const SHOPIFY_HMAC = process.env.SHOPIFY_HMAC;
const debug = process.env.NODE_DEBUG;

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

if (debug) {
  console.info('Debug enabled in shopify.js');
  console.info('Go to "http(s)://<localhost>:<3000>/shopify/debug" to do test');
  const helper = require('./debug');
  router.get('/debug', (req, res, next) => {
    res.render('shopify-sim', {
      title: 'Shopify Simulator',
      fields: helper.createCheckout()
    });
  });
}

router.post('/', (req, res, next) => {
  const purchase = req.body;

  const currency    = purchase.x_currency,
        amount      = purchase.x_amount,
        reference   = purchase.x_reference,
        description = purchase.x_description,
        telephone   = purchase.x_customer_phone,
        test        = purchase.x_test;

  const session = req.session;
  session.trans = session.trans || {};


  // XXX: Waiting for BTCC to invoke '/btcc/success/:reference'
  // Otherwise wait for timeout.

  // User may fire several transaction at the same time.
  session.trans[reference] = purchase;

  const btccReq = {
    "price": amount,
    "currency": currency,
    "notificationURL": HOSTED_ENDPOINT + "/btcc/notification/" + reference,
    "returnURL": HOSTED_ENDPOINT + "/btcc/success/" + reference,
    "externalKey": reference,
    "itemDesc": description,
    "phoneNumber": telephone,
    "settlementType": 0
  };

  btcc.createPurchaseOrder(btccReq, (btccErr, btccRes, btccBody) => {
    if (btccRes.statusCode === 200) {
      const payment = JSON.parse(btccBody);
      const result = payment.result;
      if (!!result) {
        res.redirect(result.url);
      } else {
        // TODO: add error page rendering.
        console.error(btccBody);
        res.status(500).send(btccBody);
      }
    } else {
      console.error(btccBody);
      res.status(500).send(btccBody);
    }
  });
});


// send success response to Shopify async
function shopifyAsyncConfirm(purchase, callback) {
  const callbackUrl = purchase.x_url_callback;
  const values = {
    x_account_id: purchase.x_account_id,
    x_reference: purchase.x_reference,
    x_currency: purchase.x_currency,
    x_test: purchase.x_test,
    x_amount: purchase.x_amount,
    x_gateway_reference: 'https://www.btcc.com',
    x_timestamp: new Date().toISOString(),
    x_result: 'completed'
  };

  const message = Object.keys(values)
                        .sort()
                        .map(name => name + values[name])
                        .join('');

  const sha256 = crypto.createHmac('sha256', SHOPIFY_HMAC);
  values.x_signature = sha256.update(message).digest('hex');

  const reference = purchase.x_reference;

  request.post(callbackUrl, { form: values }, (err, res, body) => {
    if (!err && res.statusCode === 200) {
      console.info(`Shopify reference ${reference} confirmed`);
    } else {
      console.error(`Shopify reference ${reference} async confirm failed`);
      console.error(err);
      console.error(body);
    }
    if (callback) {
      callback.apply(null, arguments);
    }
  });
}

// XXX: use query string to pass reference ?
router.get('/btcc/success/:reference', (req, res, next) => {
  const reference = req.params.reference;
  if (!reference) {
    console.error("BTCC returnURL calback doesn't have reference defined");
    res.status(400).send('No merchant reference available');
  } else {
    const trans = req.session.trans || {};
    const tran = trans[reference];
    if (tran) {
      trans[reference] = null;
      shopifyAsyncConfirm(tran);
      res.redirect(tran.x_url_complete);
    } else {
      res.status(400).send('Invalid merchant reference');
    }
  }
});

router.get('/btcc/notification/:reference', (req, res, next) => {
  res.status(500).send("Not implemented yet");
});

router.get('/btcc/failure/:reference', (req, res, next) => {
  res.status(500).send("Not implemented yet");
});

router.get('/finished', (req, res, next) => {
  res.send('Deal !');
});

module.exports = router;
