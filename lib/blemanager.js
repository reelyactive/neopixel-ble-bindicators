/**
 * Copyright reelyActive 2023
 * We believe in an open Internet of Things
 */


const noble = require('@abandonware/noble')


const BINDICATORS_SERVICE_UUID = "4797a4e404844572978cceb4f6489081";
const LEDS_CHARACTERISTIC_UUID = "1ed5";
const TARGET_SERVICE_UUIDS = [ BINDICATORS_SERVICE_UUID ];
const TARGET_CHARACTERISTIC_UUIDS = [ LEDS_CHARACTERISTIC_UUID ];


/**
 * BleManager Class
 * Manages the Bluetooth Low Energy interface for LED control.
 */
class BleManager {

  /**
   * SerialManager constructor
   * @param {Object} options The options as a JSON object.
   * @constructor
   */
  constructor(options) {
    options = options || {};
    let self = this;
    let deviceAddress = 'c1:29:2a:84:46:cd'; // TODO: take from options

    this.isConnected = false;

    noble.on('stateChange', (state) => {
      if(state === 'poweredOn') { initiateDiscovery(); }
    });
    noble.on('discover', (peripheral) => {
      if(peripheral.address === deviceAddress) {
        connect(peripheral, self);
      }
    });
    noble.on('warning', (message) => {
      console.log('Bluetooth warning:', message);
    });
  }

  /**
   * Write data to the connected device.
   * @param {Buffer} data The data to write
   * @param {callback} callback Function to call on completion
   */
  write(data, callback) {
    let self = this;

    if(self.isConnected && self.characteristic) {
      self.characteristic.write(data);
      return callback();
    }

    return callback(new Error('Bluetooth device not connected'));
  }

}


/**
 * Initiate discovery of all Bluetooth Low Energy devices in range.
 */
function initiateDiscovery() {
  noble.on('scanStart', () => { console.log('Bluetooth scan started'); });
  noble.on('scanStop', () => { console.log('Bluetooth scan stopped'); });
  noble.startScanning([], true, (err) => {
    if(err) { console.log('Bluetooth scan error:', err); }
  });
}


/**
 * Connect with the given peripheral device so that data can be written to its
 * LED characteristic.
 * @param {Peripheral} peripheral The peripheral device
 * @param {BleManager} instance The BleManager instance
 */
function connect(peripheral, instance) {
  noble.stopScanning(() => {
    // Initiate connection
    console.log('Bluetooth establishing connection with', peripheral.address);
    peripheral.connect((err) => {
      // Discover services and characteristics
      if(!err) {
        console.log('Bluetooth connected with', peripheral.address);
        peripheral.discoverSomeServicesAndCharacteristics(
                             TARGET_SERVICE_UUIDS, TARGET_CHARACTERISTIC_UUIDS,
                             (err, services, characteristics) => {
          if(!err) {
            let isCharacteristicFound = (characteristics.length > 0);
            // Characteristic is available for writing
            if(isCharacteristicFound) {
              instance.isConnected = true;
              instance.characteristic = characteristics[0];
            }
            else { console.log('Bluetooth device missing LED characteristic'); }
          }
          else { console.log('Bluetooth peripheral discovery error:', err); }
        });
      }
      else { console.log('Bluetooth peripheral connection error:', err); }
    });
  });
}


module.exports = BleManager;
