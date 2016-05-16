const crypto = require('crypto'),
      request = require('request'),
      v = require('validator.js');

const validator = v.validator(),
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
    console.info(`switch to endpoint ${endpoint}`);
  }

  this.BTCC_PAYMENT_ENDPOINT = endpoint;
  this.BTCC_ACCESS_KEY = accesskey;
  this.BTCC_SECRET_KEY = secretkey;
}


const ORDERED_SIGNATURE_FIELDS = ['tonce','accesskey','requestmethod','id','method','params'];

BTCC.prototype._request = function(params, callback) {
  const id = tonce = (new Date().getTime() * 1000).toString();

  const accesskey = this.BTCC_ACCESS_KEY,
        secretkey = this.BTCC_SECRET_KEY,
        endpoint = this.BTCC_PAYMENT_ENDPOINT;

  const opts = {
    id: id,
    tonce : tonce,
    accesskey: accesskey,
    requestmethod: 'post',
    method: 'createPurchaseOrder',
    params: params  // Array
  };

  const sha1 = crypto.createHmac('sha1', secretkey);
  const payload = ORDERED_SIGNATURE_FIELDS.map(n => `${n}=${pick(opts, n)}`).join('&');
  const signature = sha1.update(payload).digest('hex');

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
}

const VALID_PURCHASE_ORDER_OPTIONS = ['price', 'currency', 'notificationURL','returnURL', 'externalKey', 'itemDesc', 'phoneNumber', 'settlementType'];

// TODO: add number / https validation
const CREATE_PURCHASE_ORDER_CONSTRAINT = {
  price: [ is.required() ],
  currency: [ is.required(), is.isString(), is.choice(['CNY', 'USD', 'SGD', 'MYR', 'BTC'])],
  notificationURL: [ is.required(), is.isString() ]
};

/*
 * https://www.btcc.com/apidocs/justpay-payment-gateway-json-rpc-api
 *
 * 名称             类型   必选？ 描述
 * price           number  是   客户购买的商品价格.
 * currency        string  是   客户购买商品时使用的货币种类，可以是[CNY],[USD],[SGD],[MYR],[BTC].
 * notificationURL string  是   将订单状态返回给商家服务器的链接. 最大长度为255字符，必须以https开头.
 * returnURL       string  否   用户完成支付以后返回的页面链接. 最大长度为255字符. 注意：用户完成支付以后，生成的支付订单ID会以以下参数形式附在重定向链接后：?purchaseorder_id=.
 * externalKey     string  否   商家用来识别此购物订单的外部密钥. 可以是字母，数字以及下划线的组合，最大长度为255字符. 必须是唯一的.
 * itemDesc        string  否   向客户展示的其将要购买的商品描述信息.最大长度为64k字节.
 * phoneNumber     string  否   用户的手机号码. 客户在购买过程中需要使用手机来接收确认短信.
 * settlementType  number  否   商家收款方式，支持两种模式. 默认值为0，款项将以比特币的形式直接转到商家的毕加索钱包里; 值为1时，款项会以法币形式依照合同规定，扣除手续费后，定时转给商家. 当以法币形式支付时，最小的比特币支付限额为0.0001个.
*/
BTCC.prototype.createPurchaseOrder = function(args, callback) {
  const result = validator.validate(args, CREATE_PURCHASE_ORDER_CONSTRAINT);
  if (result === true) {
    const params = VALID_PURCHASE_ORDER_OPTIONS.map(n => pick(args, n));
    this._request(params, callback);
  } else {
    console.log(JSON.stringify(result));
    throw result;
  }
}

module.exports = BTCC;
