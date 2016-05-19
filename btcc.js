var crypto = require('crypto'),
    request = require('request'),
    winston = require('winston'),
    v = require('validator.js');

var validator = v.validator(),
    is = v.Assert;

function pick(o, name) {
  return o.hasOwnProperty(name) ? o[name] : '';
}

function BTCC(accesskey, secretkey, endpoint) {
  if (!accesskey || !secretkey) {
    throw new Error('No access / secrete key available');
  }

  if (!endpoint) {
    endpoint = 'https://api.btcchina.com/api.php/payment';
  } else {
    winston.info('switch to endpoint ' + endpoint);
  }

  this.BTCC_PAYMENT_ENDPOINT = endpoint;
  this.BTCC_ACCESS_KEY = accesskey;
  this.BTCC_SECRET_KEY = secretkey;
}

var ORDERED_SIGNATURE_FIELDS = ['tonce', 'accesskey', 'requestmethod', 'id', 'method', 'params'];

BTCC.prototype._request = function (params, callback) {
  var id = tonce = (new Date().getTime() * 1000).toString();

  var accesskey = this.BTCC_ACCESS_KEY,
      secretkey = this.BTCC_SECRET_KEY,
      endpoint = this.BTCC_PAYMENT_ENDPOINT;

  var opts = {
    id: id,
    tonce: tonce,
    accesskey: accesskey,
    requestmethod: 'post',
    method: 'createPurchaseOrder',
    params: params // Array
  };

  var sha1 = crypto.createHmac('sha1', secretkey);
  var payload = ORDERED_SIGNATURE_FIELDS.map(function (n) {
    return n + '=' + pick(opts, n);
  }).join('&');
  var signature = sha1.update(payload).digest('hex');

  request.post(endpoint, {
    headers: {
      'Json-Rpc-Tonce': tonce,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(opts),
    auth: {
      user: accesskey,
      pass: signature,
      sendImmediately: true
    }
  }, callback);
};

var VALID_PURCHASE_ORDER_OPTIONS = ['price', 'currency', 'notificationURL', 'returnURL', 'externalKey', 'itemDesc', 'phoneNumber', 'settlementType'];

// TODO: add number / https validation
var CREATE_PURCHASE_ORDER_CONSTRAINT = {
  price: [is.required()],
  currency: [is.required(), is.isString(), is.choice(['CNY', 'USD', 'SGD', 'MYR', 'BTC'])],
  notificationURL: [is.required(), is.isString()]
};

// https://www.btcc.com/apidocs/justpay-payment-gateway-json-rpc-api
BTCC.prototype.createPurchaseOrder = function (args, callback) {
  var result = validator.validate(args, CREATE_PURCHASE_ORDER_CONSTRAINT);
  if (result === true) {
    var params = VALID_PURCHASE_ORDER_OPTIONS.map(function (n) {
      return pick(args, n);
    });
    this._request(params, callback);
  } else {
    winston.warn('createPurchaseOrder parameter validation failed', result);
    // Or render error page ?
    throw result;
  }
};

module.exports = BTCC;
