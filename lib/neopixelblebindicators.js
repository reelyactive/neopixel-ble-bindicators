/**
 * Copyright reelyActive 2023
 * We believe in an open Internet of Things
 */


const express = require('express');
const BindicatorsManager = require('./bindicatorsmanager');
const ConfigManager = require('./configmanager');
const BleManager = require('./blemanager');


/**
 * NeopixelBleBindicators Class
 * REST API to control NeoPixel strips via a serial link to a microcontroller.
 */
class NeopixelBleBindicators {

  /**
   * NeopixelBleBindicators constructor
   * @param {Object} options The configuration options.
   * @constructor
   */
  constructor(options) {
    let self = this;
    options = options || {};

    if(options.app) {
      configureExpress(options.app, self);
    }

    this.config = new ConfigManager(options);
    this.ble = new BleManager(options, self.config);
    this.bindicators = new BindicatorsManager(options, self.config, self.ble);
  }

}


/**
 * Configure the routes of the API.
 * @param {Express} app The Express app.
 * @param {NeopixelSerialBindicators} instance The bindicators instance.
 */
function configureExpress(app, instance) {
  app.use(function(req, res, next) {
    req.neopixelserialbindicators = instance;
    next();
  });
  app.use('/bindicators', require('./routes/bindicators'));
}


module.exports = NeopixelBleBindicators;