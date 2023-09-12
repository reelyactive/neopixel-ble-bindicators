/**
 * Copyright reelyActive 2023
 * We believe in an open Internet of Things
 */

let greenLedOn = false;

function handleStripData(evt) {
  let pin = D12;

  require("neopixel").write(pin, []);
}

function toggleGreenLed() {
  D5.write(greenLedOn = !greenLedOn);
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
NRF.on('connect', function(addr) { D4.write(true); });
NRF.on('disconnect', function(addr) { D4.write(false); });

// Green LED indicates operation
setInterval(toggleGreenLed, 1000);