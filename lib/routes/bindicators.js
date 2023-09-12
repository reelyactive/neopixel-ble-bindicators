/**
 * Copyright reelyActive 2023
 * We believe in an open Internet of Things
 */


const express = require('express');
const responseHandler = require('./responsehandler');


let router = express.Router();

router.route('/')
  .put((req, res) => { updateBindicators(req, res); });


/**
 * Update the bindicator settings.
 * @param {Object} req The HTTP request.
 * @param {Object} res The HTTP result.
 */
function updateBindicators(req, res) {
  let bindications = req.body;
  let bindicators = req.neopixelserialbindicators.bindicators;

  bindicators.update(bindications, (status, data) => {
    let response = responseHandler.prepareResponse(req, status, data);
    res.status(status).json(response);
  });
}


module.exports = router;