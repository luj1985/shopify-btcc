const request = require('request'),
      crypto = require('crypto');

function Shopify(hmac) {
  this.SHOPIFY_HMAC = hmac;
}

// https://help.shopify.com/api/sdks/hosted-payment-sdk/develop-gateway#gateway-signing-mechanism
Shopify.prototype._sign = function(values) {
  const message = Object.keys(values)
                        .filter(name => /^x_/.test(name) && name !== 'x_signature')
                        .sort()
                        .map(name => name + values[name])
                        .join('');

  const sha256 = crypto.createHmac('sha256', this.SHOPIFY_HMAC);
  return sha256.update(message).digest('hex');
}

// send success response to Shopify async
Shopify.prototype.completePurchase = function(purchase, id, callback) {
  const values = {
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

  // console.log('shopify response value');
  // console.log(values);

  const reference = purchase.x_reference;
  request.post(purchase.x_url_callback, { form: values }, (err, res, body) => {
    if (!err && res.statusCode === 200) {
      console.info(`Shopify reference ${reference} confirmed`);
    } else {
      console.error(`Shopify reference ${reference} async confirm failed`);
      console.error(err);
      console.error(body);
    }
    if (callback) {
      callback.call(null, err, res, body);
    }
  });
};

Shopify.prototype.cancelPurchase = function() {
  throw new Error('not implement yet');
};

const debug = process.env.NODE_DEBUG;

Shopify.prototype.validateSignature = function(purchase) {
  if (debug) { return true; }

  const x_signature = purchase.x_signature;
  const signature = this._sign(purchase);
  return x_signature === signature;
};

module.exports = Shopify;
