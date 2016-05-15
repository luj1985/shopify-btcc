const express = require('express'),
      router = express.Router();

router.post('/', function(req, res, next) {
  const body = req.body;
  console.log(body);
  res.send(JSON.stringify(body, null, ' '));
});

module.exports = router;
