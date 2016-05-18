# Start gateway

You need to setup environment variables

```{bash}
export BTCC_ACCESS_KEY="<BTCC ACCESS KEY>"
export BTCC_SECRET_KEY="<BTCC SECRET KEY>"

# The server address which this gateway deployed. It will be used as web hook.
export HOSTED_ENDPOINT="https://shopify-btcc.herokuapp.com"

# Shared Secret Key
export SHOPIFY_HMAC="iU44RWxeik"

# When debug enabled, there is one more page availabe to test BTCC JustPay
# You can access this page via https://shopify-btcc.herokuapp.com/debug
# NODE_DEBUG=true

npm start
```


# Gateway execution steps

- Shopify POST message to Payment Gateway https://shopify-btcc.herokuapp.com/payment
- Save Shopify POST message in HTTP session, send payment request to BTCC "createPurchaseOrder"
- Redirect to JustPay URL which defined in BTCC "createPurchaseOrder" response
- Page will be redirected to http://shopify-btcc.herokuapp.com/payment/success/:reference after JustPay finished
- Use "reference" to get original Shopify request from HTTP session
- Create Shopify response base on session saved Shopify Request
