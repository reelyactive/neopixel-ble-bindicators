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
    let stripCommandStrings = new Map();
    let masterCommandsString = '';

    if(!Array.isArray(bindications)) {
      return callback(HTTP_STATUS_BAD_REQUEST);
    }

    if(bindications.length === 0) {
      let strips = self.config.getStrips();
      strips.forEach((strip) => {
        masterCommandsString += createClearCommand(strip) +
                                createShowCommand(strip);
      });
    }

    bindications.forEach((bindicator) => {
      if(isValidBindicator(bindicator)) {
        let leds = self.config.lookupLeds(bindicator);
        if(leds.length > 0) {
          leds.forEach((led) => {
            if(!stripCommandStrings.has(led.strip)) {
              stripCommandStrings.set(led.strip, createClearCommand(led.strip));
            }
            let updatedCommandString = stripCommandStrings.get(led.strip) +
                                       createLedCommand(led.strip, led.offset,
                                                        bindicator);
            stripCommandStrings.set(led.strip, updatedCommandString);
          });
        }
      }
    });

    stripCommandStrings.forEach((stripCommandString, strip) => {
      masterCommandsString += stripCommandString + createShowCommand(strip);
    });

    self.ble.write(Buffer.from(masterCommandsString, 'hex'), (err) => {
      if(err) {
        return callback(HTTP_STATUS_INTERNAL_SERVER_ERROR);
      }
      return callback(HTTP_STATUS_OK, {});
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
 * Create an LED control command.
 * @param {Number} strip The strip id
 * @param {Number} offset The offset
 */
function createLedCommand(strip, offset, bindicator) {
  let stripString = strip.toString(16).padStart(2, '0');
  let offsetString = offset.toString(16).padStart(4, '0')
  let rgb = parseColour(bindicator);

  return stripString + offsetString + rgb + TERMINATOR_CHARACTER;
}


/**
 * Create the command to show a single strip.
 * @param {Number} strip The strip id
 */
function createShowCommand(strip) {
  let stripString = strip.toString(16).padStart(2, '0');
  return (SHOW_COMMAND_BYTE + stripString).padEnd(12, '0') +
         TERMINATOR_CHARACTER;
}


/**
 * Create the command to clear a single strip.
 * @param {Number} strip The strip id
 */
function createClearCommand(strip) {
  let stripString = strip.toString(16).padStart(2, '0');
  return (CLEAR_COMMAND_BYTE + stripString).padEnd(12, '0') +
         TERMINATOR_CHARACTER;
}


module.exports = BindicatorsManager;
