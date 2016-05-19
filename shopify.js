var request = require('request'),
    crypto = require('crypto'),
    winston = require('winston');

function Shopify(hmac) {
  this.SHOPIFY_HMAC = hmac;
}

// https://help.shopify.com/api/sdks/hosted-payment-sdk/develop-gateway#gateway-signing-mechanism
Shopify.prototype._sign = function (values) {
  var message = Object.keys(values).filter(function (name) {
    return (/^x_/.test(name) && name !== 'x_signature');
  }).sort().map(function (name) {
    return name + values[name];
  }).join('');

  var sha256 = crypto.createHmac('sha256', this.SHOPIFY_HMAC);
  return sha256.update(message).digest('hex');
};

// send success response to Shopify async
Shopify.prototype.completePurchase = function (purchase, id, callback) {
  var values = {
    x_account_id: purchase.x_account_id,
    x_reference: purchase.x_reference,
    x_currency: purchase.x_currency,
    x_test: purchase.x_test,
    x_amount: purchase.x_amount,
    x_gateway_reference: id,
    x_timestamp: new Date().toISOString(),
    x_result: 'completed'
  };
  values.x_signature = this._sign(values);

  winston.debug('notify Shopify purchase finished: ', purchase.x_url_callback, values);

  var reference = purchase.x_reference;
  request.post(purchase.x_url_callback, { form: values }, function (err, res, body) {
    if (!err && res.statusCode === 200) {
      winston.info('Shopify reference ' + reference + ' confirmed');
    } else {
      winston.error('Shopify reference ' + reference + ' async confirm failed');
      winston.error(body);
    }
    if (callback) {
      callback.call(null, err, res, body);
    }
  });
};

Shopify.prototype.cancelPurchase = function () {
  throw new Error('not implement yet');
};

var debug = process.env.NODE_DEBUG;

Shopify.prototype.validateSignature = function (purchase) {
  // shopify-simulator doesn't have signature appended.
  if (debug) {
    return true;
  }

  var x_signature = purchase.x_signature;
  var signature = this._sign(purchase);
  return x_signature === signature;
};

module.exports = Shopify;
