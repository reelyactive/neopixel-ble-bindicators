/**
 * Copyright reelyActive 2023
 * We believe in an open Internet of Things
 */

const COMMAND_CLEAR_STRIP = 0x00;
const COMMAND_WRITE_STRIP = 0x01;
const EXPECTED_STRIP_LENGTH = 512;

const STRIP_PINS = [ D12, D13, D14, D15 ];

let greenLedOn = false;

function handleClearStrip(message) {
  if((message.byteLength !== 2) || (message[1] > STRIP_PINS.length)) {
    return blipErrorLed();
  }

  let pin = STRIP_PINS[message[1]];
  let rgbArray = new Uint8ClampedArray(EXPECTED_STRIP_LENGTH * 3).fill(0);
  require("neopixel").write(pin, rgbArray);
}

function handleWriteStrip(message) {
  if((message.byteLength !== 12) || (message[1] > STRIP_PINS.length)) {
    return blipErrorLed();
  }

  let pin = STRIP_PINS[message[1]];
  let startLedIndex = (message[2] * 256) + message[3];
  let endLedIndex = (message[4] * 256) + message[5];

  if(endLedIndex < startLedIndex) {
    return blipErrorLed();
  }

  let rgbArray = new Uint8ClampedArray(EXPECTED_STRIP_LENGTH * 3).fill(0);

  for(let ledIndex = startLedIndex; ledIndex <= endLedIndex; ledIndex++) {
    rgbArray[ledIndex * 3] = message[7];       // Green
    rgbArray[(ledIndex * 3) + 1] = message[6]; // Red
    rgbArray[(ledIndex * 3) + 2] = message[8]; // Blue
  }
  require("neopixel").write(pin, rgbArray);
}

function handleStripData(evt) {
  let message = new Uint8ClampedArray(evt.data);

  if(message.byteLength < 1) {
    return blipErrorLed();
  }

  switch(message[0]) {
    case COMMAND_CLEAR_STRIP:
      return handleClearStrip(message);
    case COMMAND_WRITE_STRIP:
      return handleWriteStrip(message);
    default:
      return blipErrorLed();
  }
}

function toggleGreenLed() {
  D5.write(greenLedOn = !greenLedOn);
}

function blipErrorLed() {
  D3.set();
  setTimeout(function() { D3.reset(); }, 500);
}

NRF.setServices({
  "4797a4e4-0484-4572-978c-ceb4f6489081" : {
    0x1ed5 : {
      writable : true,
      maxLen: 12,
      onWrite : handleStripData
    }
  }
});

// Blue LED indicates connection status
NRF.on('connect', function(addr) { D4.set(); });
NRF.on('disconnect', function(addr) { D4.reset(); });

// Green LED indicates operation
setInterval(toggleGreenLed, 1000);