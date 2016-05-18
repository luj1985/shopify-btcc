# Start gateway

You need to setup environment variables

```
BTCC_ACCESS_KEY="<BTCC ACCESS KEY>"
BTCC_SECRET_KEY="<BTCC SECRET KEY>"

# The server address which this gateway deployed. It will be used as web hook.
HOSTED_ENDPOINT="https://shopify-btcc.herokuapp.com"

# Shared Secret Key
SHOPIFY_HMAC="iU44RWxeik"

# When debug enabled, there is one more page availabe to test BTCC JustPay
# You can access this page via https://shopify-btcc.herokuapp.com/debug
NODE_DEBUG=true
```


# Gateway execution steps

- Shopify POST message to endpoint https://shopify-btcc.herokuapp.com/payment
- Save post message in session, and convert POST body into BTCC "createPurchaseOrder"
- Redirect to page which returned from "createPurchaseOrder"
- After BTCC JustPay finished, redirect back to http://shopify-btcc.herokuapp.com/payment/success/xxxxxxxxx
- Use "xxxxxxxxx" as key to restore the original Shopify request from HTTP Session.
- Create Shopify response base on Shopify Request.
