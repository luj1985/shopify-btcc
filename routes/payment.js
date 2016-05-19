var express = require('express'),
    // use subapp to get 'mountpath'
    router = express(),
    winston = require('winston'),
    BTCC = require('../btcc'),
    Shopify = require('../shopify');

var BTCC_ACCESS_KEY = process.env.BTCC_ACCESS_KEY;
var BTCC_SECRET_KEY = process.env.BTCC_SECRET_KEY;
var BTCC_SETTLEMENT_TYPE = 0;

var HOSTED_ENDPOINT = process.env.HOSTED_ENDPOINT;
var SHOPIFY_HMAC = process.env.SHOPIFY_HMAC;

if (!BTCC_ACCESS_KEY || !BTCC_SECRET_KEY) {
  throw new Error('No access/secret key found in environment variable, abort.');
}
if (!HOSTED_ENDPOINT) {
  throw new Error('No host endpoint defined');
}
if (!SHOPIFY_HMAC) {
  throw new Error('No Shopify HMAC spcificied');
}

var btcc = new BTCC(BTCC_ACCESS_KEY, BTCC_SECRET_KEY);
var shopify = new Shopify(SHOPIFY_HMAC);

// Shopify Purchase Gateway endpoint
// https://help.shopify.com/api/sdks/hosted-payment-sdk/api-reference/request-values
router.post('/', function (req, res, next) {
  var mountpath = router.mountpath,
      purchase = req.body;

  if (!shopify.validateSignature(purchase)) {
    return res.status(400).send("Signature miss match !");
  }

  var reference = purchase.x_reference;
  var session = req.session;
  // User may fire several transaction at the same time.
  session.trans = session.trans || {};
  session.trans[reference] = purchase;

  var btccPurchaseRequest = {
    "price": purchase.x_amount,
    "currency": purchase.x_currency,
    "notificationURL": HOSTED_ENDPOINT + mountpath + "/notification/" + reference,
    "returnURL": HOSTED_ENDPOINT + mountpath + "/success/" + reference,
    "externalKey": reference + '_' + Date.now(),
    "itemDesc": purchase.x_description,
    "phoneNumber": purchase.x_customer_phone,
    "settlementType": BTCC_SETTLEMENT_TYPE
  };

  winston.debug('Shopify request values: ', purchase);

  btcc.createPurchaseOrder(btccPurchaseRequest, function (btccErr, btccRes, btccBody) {
    if (btccRes.statusCode !== 200) {
      // TODO: add error page rendering ?
      winston.error('BTCC createPurchaseOrder API Error:', btccBody);
      return res.status(btccRes.statusCode).send(btccBody);
    }
    var payment = JSON.parse(btccBody);
    var result = payment.result;
    if (!result) {
      winston.error('BTCC createPurchaseOrder API Error:', btccBody);
      return res.status(500).send(btccBody);
    }
    res.redirect(result.url);
  });
});

// this endpoint will be invoked when BTCC purchase success.
router.get('/success/:reference', function (req, res, next) {
  var reference = req.params.reference;
  if (!reference) {
    winston.error("BTCC returnURL callback doesn't have reference defined", req.body);
    return res.status(400).send('No reference available');
  }

  var trans = req.session.trans || {};
  var tran = trans[reference];
  if (!tran) {
    return res.status(400).send('Invalid merchant reference: ' + reference);
  }

  delete trans[reference];
  var id = req.query.purchaseorder_id || new Date().getTime().toString();

  winston.debug('BTCC purcase order id: ' + id);

  // XXX: Or redirect back immediately without Shopify confirm
  //      Use this method need a page to fire a POST on x_url_complete again.
  // shopifyAsyncConfirm(tran);
  // res.redirect(tran.x_url_complete);
  shopify.completePurchase(tran, id, function (err, storeRes, body) {
    if (storeRes.statusCode === 200) {
      res.redirect(tran.x_url_complete);
    } else {
      res.status(storeRes.statusCode).send(body);
    }
  });
});

router.post('/notification/:reference', function (req, res, next) {
  var reference = req.params.reference;
  // XXX: This connection was established between Payment Gateway and BTCC JustPay
  winston.debug('notification for: ' + reference + ' received', req.body);
  res.send('Notification Got it');
});

router.get('/cancel/:reference', function (req, res, next) {
  res.status(500).send("Not implemented yet");
});

module.exports = router;
