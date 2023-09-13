/**
 * Copyright reelyActive 2023
 * We believe in an open Internet of Things
 */


const HTTP_STATUS_OK = 200;
const HTTP_STATUS_BAD_REQUEST = 400;
const HTTP_STATUS_INTERNAL_SERVER_ERROR = 500;
const COMMAND_CLEAR_STRIP = 0x00;
const COMMAND_WRITE_STRIP = 0x01;


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
      stripCommands.set(strip, [ COMMAND_CLEAR_STRIP, strip ]);
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

    writeStripCommands(stripCommands.values(), self, (err) => {
      if(err) {
        return callback(HTTP_STATUS_INTERNAL_SERVER_ERROR);
      }
      return callback(HTTP_STATUS_OK, {});
    });
  }

}


/**
 * Write the strip commands iteratively and callback success once complete, or
 * error as soon as one occurs.
 * @param {Iterator} iterator The strip command iterator
 * @param {BindicatorManager} instance The BindicatorManager instance
 * @param {function} callback The function to call on completion
 */
function writeStripCommands(iterator, instance, callback) {
  let iteration = iterator.next();

  if(iteration.done) { return callback(); }

  instance.ble.write(Buffer.from(iteration.value), (err) => {
    if(err) {
      return callback(err);
    }
    writeStripCommands(iterator, instance, callback); // Self-iteration
  });
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
  let intensity = { r: 0, g: 0, b: 0 };

  if(Array.isArray(bindicator.rgb) && (bindicator.rgb.length === 3)) {
    intensity.r = bindicator.rgb[0];
    intensity.g = bindicator.rgb[1];
    intensity.b = bindicator.rgb[2];
  }
  else if((typeof bindicator.rgb === 'string') &&
          (bindicator.rgb.length === 6)) {
    intensity.r = parseInt(bindicator.rgb.substring(0,2), 16);
    intensity.g = parseInt(bindicator.rgb.substring(2,4), 16);
    intensity.b = parseInt(bindicator.rgb.substring(4,6), 16);
  }

  return intensity;
}


/**
 * Create a strip control command.
 * @param {Number} strip The strip id
 * @param {Array} leds The LEDs to illuminate
 * @param {Object} bindicator The bindicator properties
 */
function createStripCommand(strip, leds, bindicator) {
  let stripCommand = [ 0x01 ];
  let firstLedOffsetMSB = (leds[0].offset >> 8) & 0xff;
  let firstLedOffsetLSB = leds[0].offset & 0xff;
  let lastLedOffsetMSB = (leds[leds.length - 1].offset >> 8) & 0xff;
  let lastLedOffsetLSB = leds[leds.length - 1].offset & 0xff;
  let intensity = parseColour(bindicator);
  let stripLengthMSB = 0x00; // TODO:
  let stripLengthLSB = 0xff; //   read from config

  return [ COMMAND_WRITE_STRIP, strip, firstLedOffsetMSB, firstLedOffsetLSB,
           lastLedOffsetMSB, lastLedOffsetLSB, intensity.r,
           intensity.g, intensity.b, stripLengthMSB, stripLengthLSB, 0x00 ];
}


module.exports = BindicatorsManager;
