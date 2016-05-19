var express = require('express'),
    router = express.Router();

router.get('/', function(req, res, next) {
  res.render('index', { title: 'BTCC Shopify Payment Gateway' });
});

module.exports = router;
