/**
 * Copyright reelyActive 2023
 * We believe in an open Internet of Things
 */


const HTTP_STATUS_OK = 200;
const HTTP_STATUS_BAD_REQUEST = 400;
const HTTP_STATUS_INTERNAL_SERVER_ERROR = 500;
const TERMINATOR_CHARACTER = '0a';
const CLEAR_COMMAND_BYTE = 'ff';
const SHOW_COMMAND_BYTE = 'aa';
const DEFAULT_RGB = '0770a2';


/**
 * BindicatorsManager Class
 * Manages the LED strips.
 */
class BindicatorsManager {

  /**
   * BindicatorsManager constructor
   * @param {Object} options The options as a JSON object.
   * @param {ConfigManager} config The config manager.
   * @param {BleManager} ble The Bluetooth Low Energy manager.
   * @constructor
   */
  constructor(options, config, ble) {
    let self = this;
    options = options || {};
    self.config = config;
    self.ble = ble;
  }

  /**
   * Update the bindicator settings.
   * @param {Object} bindications The bindicator settings
   * @param {callback} callback Function to call on completion
   */
  update(bindications, callback) {
    let self = this;
    let stripCommands = new Map();

    if(!Array.isArray(bindications)) {
      return callback(HTTP_STATUS_BAD_REQUEST);
    }

    let strips = self.config.getStrips();
    strips.forEach((strip) => {
      stripCommands.set(strip, [ 0x00, strip ]); // TODO
    });

    bindications.forEach((bindicator) => {
      if(isValidBindicator(bindicator)) {
        let leds = self.config.lookupLeds(bindicator);
        if(leds.length > 0) {
          let strip = leds[0].strip;
          let stripCommand = createStripCommand(strip, leds, bindicator);
          stripCommands.set(strip, stripCommand);
        }
      }
    });

    stripCommands.forEach((stripCommand, strip) => {
      self.ble.write(Buffer.from(stripCommand), (err) => {
        if(err) {
          return callback(HTTP_STATUS_INTERNAL_SERVER_ERROR);
        }
        return callback(HTTP_STATUS_OK, {}); // TODO: return after all commands
      });
    });
  }

}


/**
 * Verify if the given bindicator object is valid.
 * @param {Object} bindicator The bindicator to verify
 */
function isValidBindicator(bindicator) {
  return bindicator.hasOwnProperty('cart') &&
         (typeof bindicator.cart === 'string') &&
         bindicator.hasOwnProperty('shelf') &&
         Number.isInteger(bindicator.shelf) && (bindicator.shelf > 0) &&
         bindicator.hasOwnProperty('bin') &&
         Number.isInteger(bindicator.bin) && (bindicator.bin > 0) &&
         bindicator.hasOwnProperty('rgb');
}


/**
 * Parse the RGB value of the bindicator.
 * @param {Object} bindicator The bindicator to parse
 */
function parseColour(bindicator) {
  let rgb = DEFAULT_RGB;

  if(Array.isArray(bindicator.rgb) && (bindicator.rgb.length === 3)) {
    rgb = bindicator.rgb[0].toString(16).padStart(2, '0') +
          bindicator.rgb[1].toString(16).padStart(2, '0') +
          bindicator.rgb[2].toString(16).padStart(2, '0');
  }
  else if((typeof bindicator.rgb === 'string') &&
          (bindicator.rgb.length === 6)) {
    rgb = bindicator.rgb.toLowerCase();
  }

  return rgb;
}


/**
 * Create a strip control command.
 * @param {Number} strip The strip id
 * @param {Array} leds The LEDs to illuminate
 * @param {Object} bindicator The bindicator properties
 */
function createStripCommand(strip, leds, bindicator) {
  let stripCommand = [ 0x01 ];
  let firstLedOffset = leds[0].offset;
  let lastLedOffset = leds[leds.length - 1].offset;
  let intensity = { r: 0x12, g: 0x34, b: 0x56 }; // TODO: from bindicator.rgb

  return [ 0x01, 0x00, 0x00, firstLedOffset, 0x00, lastLedOffset, intensity.r,
           intensity.g, intensity.b, 0x01, 0x00, 0x00 ];
}


module.exports = BindicatorsManager;
