const express = require('express'),
      router = express.Router();

router.post('/', function(req, res, next) {
  res.send('display payment page here');
});

module.exports = router;
