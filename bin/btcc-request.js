#!/usr/bin/env node
const crypto = require('crypto'),
      request = require('request');

const BTCC_ACCESS_KEY = process.env.BTCC_ACCESS_KEY;
const BTCC_SECRET_KEY = process.env.BTCC_SECRET_KEY;

if (!BTCC_ACCESS_KEY || !BTCC_SECRET_KEY) {
  throw new Error('No access/secret key found in environment variable, abort.');
}

const BTCC_PAYMENT_ENDPOINT = 'https://api.btcchina.com/api.php/payment';

const VALID_PURCHASE_ORDER_OPTIONS = ['price', 'currency', 'notificationURL','returnURL', 'externalKey', 'itemDesc', 'phoneNumber', 'settlementType'];
const ORDERED_SIGNATURE_FIELDS = ['tonce','accesskey','requestmethod','id','method','params'];

function pick(o, name) {
  return o.hasOwnProperty(name) ? o[name] : '';
}

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
function createPurchaseOrder(args, callback) {
  const params = VALID_PURCHASE_ORDER_OPTIONS.map(n => pick(args, n));

  const id = tonce = (new Date().getTime() * 1000).toString();
  const opts = {
    id: id,
    tonce : tonce,
    accesskey: BTCC_ACCESS_KEY,
    requestmethod: 'post',
    method: 'createPurchaseOrder',
    params: params  // Array
  };

  const sha1 = crypto.createHmac('sha1', BTCC_SECRET_KEY);
  const payload = ORDERED_SIGNATURE_FIELDS.map(n => `${n}=${pick(opts, n)}`).join('&');
  const signature = sha1.update(payload).digest('hex');
  request.post(BTCC_PAYMENT_ENDPOINT, {
    headers: {
      'Json-Rpc-Tonce': tonce,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(opts),
    auth: {
      user: BTCC_ACCESS_KEY,
      pass: signature,
      sendImmediately: true
    }
  }, (error, response, body) => {
    console.log(response.statusCode);
    console.log(body);
  });
}

createPurchaseOrder({
  "price": 0.0001,
  "currency": "BTC",
  "notificationURL": "http://localhost:3000/",
  "returnURL": "http://localhost:3000/",
  "externalKey": "test",
  "itemDesc": "Requst for demo",
  "phoneNumber": "12345678901",
  "settlementType": 0
});

